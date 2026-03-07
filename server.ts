import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import AdmZip from "adm-zip";
import archiver from "archiver";
import Stripe from "stripe";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy initialization for Stripe and Firebase Admin
let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY environment variable is required');
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

let firebaseAdminInitialized = false;
function initFirebaseAdmin() {
  if (!firebaseAdminInitialized) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      console.warn("Firebase Admin credentials not fully provided. Webhooks will fail.");
      return;
    }

    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      firebaseAdminInitialized = true;
    } catch (err) {
      console.error("Firebase Admin initialization error:", err);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Enable CORS for all routes
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Stripe webhook needs raw body
  app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    initFirebaseAdmin();
    const stripe = getStripe();
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !endpointSecret) {
      return res.status(400).send('Missing Stripe signature or webhook secret');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (!firebaseAdminInitialized) throw new Error("Firebase Admin not initialized");
      const db = getFirestore();

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        if (userId) {
          const updateData: any = { 
            subscriptionStatus: 'active',
            lastUpdated: new Date().toISOString()
          };
          
          // Try to get the plan name from line items
          try {
            const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
              expand: ['line_items.data.price.product'],
            });
            const lineItem = expandedSession.line_items?.data[0];
            if (lineItem?.price?.product) {
              const product = lineItem.price.product as Stripe.Product;
              updateData.subscription = product.name;
            }
          } catch (e) {
            console.error("Error fetching product name in webhook:", e);
          }

          if (session.customer) updateData.stripeCustomerId = session.customer;
          if (session.subscription) updateData.stripeSubscriptionId = session.subscription;
          
          await db.collection('users').doc(userId).set(updateData, { merge: true });
        }
      } else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription;
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('stripeSubscriptionId', '==', subscription.id).get();
        if (!snapshot.empty) {
          snapshot.forEach(async (doc) => {
            await doc.ref.update({ subscriptionStatus: 'canceled' });
          });
        }
      }
      res.json({ received: true });
    } catch (err) {
      console.error("Webhook processing error:", err);
      res.status(500).send("Internal Server Error");
    }
  });

  // Regular JSON parsing for other routes
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API routes FIRST
  app.get("/api/checkout-success", async (req, res) => {
    const sessionId = req.query.session_id as string;
    if (sessionId) {
      try {
        initFirebaseAdmin();
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['line_items.data.price.product'],
        });
        const userId = session.client_reference_id;
        
        if (userId && firebaseAdminInitialized) {
          const db = getFirestore();
          const updateData: any = { 
            subscriptionStatus: 'active',
            lastUpdated: new Date().toISOString()
          };

          const lineItem = session.line_items?.data[0];
          if (lineItem?.price?.product) {
            const product = lineItem.price.product as Stripe.Product;
            updateData.subscription = product.name;
          }

          if (session.customer) updateData.stripeCustomerId = session.customer;
          if (session.subscription) updateData.stripeSubscriptionId = session.subscription;
          
          await db.collection('users').doc(userId).set(updateData, { merge: true });
        }
      } catch (err) {
        console.error("Error verifying session on success route:", err);
      }
    }

    res.redirect('/?checkout=success');
  });

  app.get("/api/checkout-cancel", (req, res) => {
    res.redirect('/?checkout=cancel');
  });

  app.get("/api/portal-return", (req, res) => {
    res.redirect('/?portal=return');
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      console.log("Creating checkout session...");
      const stripe = getStripe();
      const { priceId, userId, email, returnUrl } = req.body;
      
      console.log("Request params:", { priceId, userId, email, returnUrl });

      if (!priceId || !userId || !email || !returnUrl) {
        console.error("Missing required parameters for checkout session");
        return res.status(400).json({ error: "Missing required parameters" });
      }

      // Fetch the price to determine if it's recurring or one-time
      console.log("Retrieving price details for:", priceId);
      const price = await stripe.prices.retrieve(priceId);
      const mode = price.type === 'recurring' ? 'subscription' : 'payment';
      console.log("Price mode:", mode);
      
      const session = await stripe.checkout.sessions.create({
        mode: mode,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${returnUrl}/api/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl}/api/checkout-cancel`,
        client_reference_id: userId,
        customer_email: email,
      });

      console.log("Checkout session created:", session.id);
      res.json({ url: session.url });
    } catch (err: any) {
      console.error("Stripe session creation failed:", {
        message: err.message,
        type: err.type,
        code: err.code,
        param: err.param
      });
      res.status(500).json({ 
        error: err.message,
        details: process.env.NODE_ENV !== 'production' ? err : undefined
      });
    }
  });

  app.post("/api/create-portal-session", async (req, res) => {
    try {
      const stripe = getStripe();
      const { customerId, returnUrl } = req.body;
      
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${returnUrl}/api/portal-return`,
      });

      res.json({ url: portalSession.url });
    } catch (err: any) {
      console.error("Stripe portal error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok",
      version: "2.1-STRIPE-FIX-MARCH-07-20:22",
      config: {
        stripeSecret: !!process.env.STRIPE_SECRET_KEY,
        stripePublishable: !!process.env.VITE_STRIPE_PUBLISHABLE_KEY,
        stripeWebhook: !!process.env.STRIPE_WEBHOOK_SECRET,
        firebaseAdmin: !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY)
      }
    });
  });

  app.get("/api/backup-json", (req, res) => {
    const backup: Record<string, string> = {};
    const walk = (dir: string) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const relativePath = path.relative(process.cwd(), fullPath);
        if (
          relativePath.startsWith("node_modules") || 
          relativePath.startsWith("dist") || 
          relativePath.startsWith(".git") || 
          relativePath.startsWith("dev-dist") || 
          relativePath.endsWith(".zip") ||
          relativePath.endsWith(".png") ||
          relativePath.endsWith(".jpg") ||
          relativePath.endsWith(".ico")
        ) continue;

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) walk(fullPath);
        else backup[relativePath] = fs.readFileSync(fullPath, 'utf8');
      }
    };
    try {
      walk(process.cwd());
      res.json(backup);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get("/api/backup-code-v2", (req, res) => {
    try {
      console.log("Starting backup-code generation...");
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=RF_Suite_Source_${timestamp}.zip`);
      
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      archive.on('error', function(err) {
        console.error("Archiver error:", err);
        if (!res.headersSent) {
            res.status(500).send({ error: err.message });
        }
      });

      archive.on('warning', function(err) {
        if (err.code === 'ENOENT') {
          console.warn("Archiver warning:", err);
        } else {
          console.error("Archiver error:", err);
        }
      });

      archive.pipe(res);

      const rootDir = process.cwd();
      console.log("Root Dir:", rootDir);

      const walk = (dir: string, baseDir: string = '') => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const relativePath = path.join(baseDir, file);
          
          // Ignore patterns
          if (
            file === 'node_modules' || 
            file === 'dist' || 
            file === '.git' || 
            file === 'dev-dist' || 
            file.endsWith('.zip') ||
            file.endsWith('.sqlite') ||
            file.endsWith('.db')
          ) {
            continue;
          }

          try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              walk(fullPath, relativePath);
            } else {
              // console.log("Adding file:", relativePath); // Uncomment for debugging if needed
              archive.file(fullPath, { name: relativePath });
            }
          } catch (e) {
            console.warn(`Skipping file ${fullPath}:`, e);
          }
        }
      };

      walk(rootDir);

      archive.finalize();
    } catch (err) {
      console.error("Zip error:", err);
      if (!res.headersSent) {
        res.status(500).send("Error creating zip: " + String(err));
      }
    }
  });

  app.get("/api/debug-dist", (req, res) => {
    try {
      const distPath = path.join(process.cwd(), "dist");
      if (!fs.existsSync(distPath)) {
        return res.json({ error: "dist not found", path: distPath });
      }
      
      const files: any[] = [];
      
      function walk(dir: string, relativePath: string = "") {
        const list = fs.readdirSync(dir);
        list.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          const rel = path.join(relativePath, file);
          if (stat.isDirectory()) {
            walk(filePath, rel);
          } else {
            files.push({ path: rel, size: stat.size });
          }
        });
      }
      
      walk(distPath);
      res.json({ 
        cwd: process.cwd(),
        distPath,
        files,
        totalFiles: files.length,
        totalSize: files.reduce((acc, f) => acc + f.size, 0)
      });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get("/api/download-dist", (req, res) => {
    try {
      const distPath = path.join(process.cwd(), "dist");
      console.log("Download-dist requested. Dist path:", distPath);

      if (!fs.existsSync(distPath)) {
        console.error("Dist folder not found at:", distPath);
        return res.status(404).send("Build output (dist) not found. Please wait a moment and try again.");
      }
      
      const zip = new AdmZip();
      
      if (!fs.existsSync(distPath)) {
        console.error("Dist folder not found at:", distPath);
        return res.status(404).send("Build output (dist) not found. Please wait a moment and try again.");
      }

      // Use addLocalFolder for better reliability as suggested in generate-zip.ts
      zip.addLocalFolder(distPath);
      
      const buffer = zip.toBuffer();
      console.log("Zip created. Buffer size:", buffer.length);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `RF_Suite_DEPLOY_ME_${timestamp}.zip`;
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.end(buffer);
    } catch (err) {
      console.error("Dist zip error:", err);
      if (!res.headersSent) {
        res.status(500).send("Error creating dist zip: " + String(err));
      }
    }
  });

  app.get("/api/download-deploy-zip", (req, res) => {
    try {
      const distPath = path.join(process.cwd(), "dist");
      console.log("Generating deploy zip from:", distPath);

      if (!fs.existsSync(distPath)) {
        console.error("Dist folder not found at:", distPath);
        return res.status(404).json({ error: "Build output (dist) not found. Please wait a moment and try again." });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=RF_Suite_Deploy_${timestamp}.zip`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
      });

      archive.on('error', function(err) {
        console.error("Archiver error:", err);
        if (!res.headersSent) {
            res.status(500).send({ error: err.message });
        }
      });

      // Pipe archive data to the response
      archive.pipe(res);

      // Add all files from dist, ignoring any zip files to prevent recursion
      archive.glob('**/*', { 
        cwd: distPath,
        ignore: ['*.zip', '**/*.zip'] 
      });

      archive.finalize();

    } catch (err) {
      console.error("Zip generation error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error creating zip: " + String(err) });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    // When running from dist/server.js, the static files are in the same directory (dist)
    // Use process.cwd() + 'dist' if running from root, or __dirname if running from dist
    const staticPath = path.join(process.cwd(), 'dist');
    app.use(express.static(staticPath));
    app.use((req, res, next) => {
      if (req.method === 'GET') {
        res.sendFile(path.join(staticPath, "index.html"));
      } else {
        next();
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
