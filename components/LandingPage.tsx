import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Radio, 
    Zap, 
    Globe, 
    Shield, 
    HelpCircle, 
    Mail, 
    Info, 
    ChevronDown, 
    Menu, 
    X, 
    Lock, 
    Cookie,
    Cpu,
    Activity,
    Database,
    Layout,
    Check,
    Star
} from 'lucide-react';
import { ShareButton } from './ShareButton';
import { NewsFeed } from './NewsFeed';

interface LandingPageProps {
    onLogin: () => void;
}

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className="p-8 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 transition-all group"
    >
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
            <Icon size={24} />
        </div>
        <h3 className="text-lg font-black text-white uppercase tracking-wider mb-4">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-white/5">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex justify-between items-center text-left hover:text-indigo-400 transition-colors group"
            >
                <span className="text-sm font-bold uppercase tracking-widest">{question}</span>
                <ChevronDown className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={16} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <p className="pb-6 text-slate-400 text-sm leading-relaxed">{answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const EcosystemAccordion = ({ title, icon: Icon, colorClass, children }: { title: string, icon: any, colorClass: string, children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-white/5 rounded-3xl bg-slate-900/50 overflow-hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-6 md:p-8 flex justify-between items-center text-left hover:bg-white/5 transition-colors group"
            >
                <div className="flex items-center gap-4 md:gap-6">
                    <div className={`p-3 md:p-4 rounded-2xl ${colorClass}`}><Icon size={24} className="md:w-8 md:h-8" /></div>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest">{title}</h4>
                </div>
                <ChevronDown className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={24} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 md:p-8 pt-0 border-t border-white/5 mt-2 md:mt-4">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        setIsMobileMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 overflow-x-hidden selection:bg-indigo-500/30 font-sans">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[120px] -mr-40 -mt-40"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-600/5 rounded-full blur-[100px] -ml-20 -mb-20"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
            </div>

            <div className="relative z-10">
                {/* Navigation */}
                <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
                    <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                                <Radio size={20} className="text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-black uppercase tracking-[0.3em] text-white">RF SUITE</span>
                                <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">Precision Spectral Logic</span>
                            </div>
                        </div>

                        {/* Desktop Nav */}
                        <div className="hidden lg:flex items-center gap-8">
                            {['Information', 'Capabilities', 'About', 'Learning', 'Pricing', 'FAQs', 'Contact'].map((item) => (
                                <a 
                                    key={item}
                                    href={`#${item.toLowerCase().replace(' ', '')}`} 
                                    onClick={(e) => handleSmoothScroll(e, item.toLowerCase().replace(' ', ''))}
                                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                                >
                                    {item}
                                </a>
                            ))}
                            <button 
                                onClick={() => onLogin()}
                                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                            >
                                Launch App
                            </button>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button 
                            className="lg:hidden text-slate-400 hover:text-white"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </nav>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed inset-0 z-40 bg-slate-950 pt-24 px-6 lg:hidden"
                        >
                            <div className="flex flex-col gap-8 items-center">
                                {['Information', 'Capabilities', 'About', 'Learning', 'Pricing', 'FAQs', 'Contact'].map((item) => (
                                    <a 
                                        key={item}
                                        href={`#${item.toLowerCase().replace(' ', '')}`} 
                                        onClick={(e) => handleSmoothScroll(e, item.toLowerCase().replace(' ', ''))}
                                        className="text-xl font-black uppercase tracking-widest text-slate-400 hover:text-white"
                                    >
                                        {item}
                                    </a>
                                ))}
                                <button 
                                    onClick={() => onLogin()}
                                    className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest"
                                >
                                    Launch App
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Hero Section */}
                <section className="container mx-auto px-6 pt-40 pb-32">
                    <div className="max-w-5xl mx-auto text-center">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-block px-4 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-8"
                        >
                            The Professional RF Standard
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-6xl md:text-9xl font-black text-white mb-8 tracking-tighter leading-[0.85]"
                        >
                            MASTER YOUR <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">SPECTRUM</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
                        >
                            Advanced frequency coordination for festivals, tours, and industrial venues. 
                            Built by RF engineers, for RF engineers.
                        </motion.p>
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-wrap justify-center gap-4"
                        >
                            <button onClick={() => onLogin()} className="px-10 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-sm shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all transform hover:-translate-y-1">
                                Start Coordinating
                            </button>
                            <button onClick={(e) => handleSmoothScroll(e as any, 'information')} className="px-10 py-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest text-sm transition-all">
                                View Features
                            </button>
                            <ShareButton title="RF Suite" text="Check out RF Suite, the professional RF standard." url={window.location.href} />
                        </motion.div>
                    </div>
                </section>

                {/* Information Section */}
                <section id="information" className="container mx-auto px-6 py-16 border-t border-white/5">
                    <div className="flex flex-col lg:flex-row gap-20 items-center">
                        <div className="lg:w-1/2">
                            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-8 leading-none">
                                Field-Proven <br />
                                <span className="text-indigo-500">Coordination</span>
                            </h2>
                            <p className="text-slate-400 mb-8 leading-relaxed text-lg">
                                RF Suite isn't just a calculator; it's a comprehensive spectral management ecosystem. Our engine is designed to solve the most complex interference challenges in real-time, leveraging advanced combinatorial logic that accounts for the physical realities of the stage.
                            </p>
                            <p className="text-slate-400 mb-12 leading-relaxed">
                                Whether you're managing a 200-channel festival or a critical corporate broadcast, our logic prioritizes stability. We calculate 3rd, 5th, and 7th order intermodulation products with a focus on the "noise floor of the real world," not just theoretical math.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                {[
                                    { icon: Cpu, title: "Advanced IMD Engine", desc: "Proprietary combinatorial analysis for 3rd, 5th, and 7th order products with user-definable safety margins." },
                                    { icon: Zap, title: "Dynamic Re-Sync", desc: "Instantaneous re-coordination when the environment shifts. Add guest gear without breaking your primary show." },
                                    { icon: Activity, title: "Hardware Integration", desc: "Direct Web Serial link to TinySA and other hardware for real-time noise floor monitoring and site scanning." },
                                    { icon: Globe, title: "Zonal Intelligence", desc: "Intelligent frequency reuse across multi-stage sites, calculating distance-based attenuation and path loss." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="text-indigo-500 mt-1 shrink-0"><item.icon size={20} /></div>
                                        <div>
                                            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">{item.title}</h4>
                                            <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:w-1/2 relative">
                            <div className="aspect-video rounded-3xl bg-slate-900 border border-white/10 overflow-hidden shadow-2xl group">
                                <img 
                                    src="https://picsum.photos/seed/rf-spectrum/1200/800" 
                                    alt="RF Spectrum Analysis" 
                                    className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
                                    referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                                <div className="absolute bottom-8 left-8">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Analysis Active</span>
                                    </div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-wider">High-Fidelity Visualization</h3>
                                    <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest">Real-time waterfall and 2D spectral mapping</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Why RF Suite Section */}
                <section className="container mx-auto px-6 py-16 border-t border-white/5">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-6">Why Professionals Choose Us</h2>
                        <p className="text-slate-400 leading-relaxed">In the world of high-stakes RF, "good enough" is a recipe for disaster. We provide the tools to move from guesswork to mathematical certainty.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { title: "Zero Latency", desc: "Our engine is optimized for speed, allowing for instant updates during live show environments." },
                            { title: "Cloud Sync", desc: "Access your project data from any device. Your show files are always backed up and ready." },
                            { title: "Equipment DB", desc: "Comprehensive database of professional wireless systems from Shure, Sennheiser, Wisycom, and more." },
                            { title: "Open Standards", desc: "Export to CSV, PDF, or native formats. We don't lock your data into a proprietary silo." }
                        ].map((item, i) => (
                            <div key={i} className="text-center">
                                <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4">{item.title}</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Capabilities Section */}
                <section id="capabilities" className="container mx-auto px-6 py-16 border-t border-white/5">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">The RF Ecosystem</h2>
                        <p className="text-slate-500 uppercase font-black text-[10px] tracking-[0.3em]">A comprehensive suite for every spectral challenge</p>
                    </div>

                    <div className="max-w-4xl mx-auto flex flex-col gap-4">
                        {/* Core Coordination */}
                        <EcosystemAccordion title="Core Coordination" icon={Cpu} colorClass="bg-indigo-500/10 text-indigo-400">
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                                <li>
                                    <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-2">Frequency Analyzer</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        <span className="text-slate-300 font-bold block mb-1">Real-time Spectral Intelligence</span>
                                        Import scan data from industry-standard analyzers. Perform peak detection, threshold analysis, and scene-based snapshotting to track environment changes across different times of day.
                                    </p>
                                </li>
                                <li>
                                    <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-2">Batch Generator</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        <span className="text-slate-300 font-bold block mb-1">High-Density IMD Calculation</span>
                                        Engineered for massive deployments. Calculate hundreds of intermodulation-free frequencies using advanced 3rd, 5th, and 7th order logic with user-definable safety margins.
                                    </p>
                                </li>
                                <li>
                                    <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-2">Multi-Band Logic</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        <span className="text-slate-300 font-bold block mb-1">Cross-Spectrum Compatibility</span>
                                        Simultaneously coordinate VHF, UHF, 1.2GHz, 1.4GHz, and 2.4GHz devices. The engine ensures that harmonics from one band do not desensitize receivers in another.
                                    </p>
                                </li>
                                <li>
                                    <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-2">TV Channel Lookup</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        <span className="text-slate-300 font-bold block mb-1">Global White-Space Integration</span>
                                        Automatic exclusion of active DTV broadcast channels based on your GPS location. Access a global database to ensure your coordination stays clear of high-power local interference.
                                    </p>
                                </li>
                            </ul>
                        </EcosystemAccordion>

                        {/* Site & Festival */}
                        <EcosystemAccordion title="Site Management" icon={Globe} colorClass="bg-emerald-500/10 text-emerald-400">
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                                <li>
                                    <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-2">Site Coordinator</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        <span className="text-slate-300 font-bold block mb-1">Master Conflict Resolution</span>
                                        Centralize coordination for large-scale events. Manage guest acts, house RF, and ENG crews from a single master ledger with real-time conflict notification.
                                    </p>
                                </li>
                                <li>
                                    <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-2">Spatial Mapping</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        <span className="text-slate-300 font-bold block mb-1">Geospatial Frequency Reuse</span>
                                        Map your RF footprint across physical space. Calculate safe distance-based frequency reuse for stages separated by significant distance or structural shielding.
                                    </p>
                                </li>
                                <li>
                                    <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-2">Timeline Scheduler</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        <span className="text-slate-300 font-bold block mb-1">Temporal Coordination</span>
                                        Plan frequency activations over time. Perfect for festivals where guest acts rotate throughout the day, allowing for maximum spectral efficiency without overlaps.
                                    </p>
                                </li>
                                <li>
                                    <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-2">Tour Planning</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        <span className="text-slate-300 font-bold block mb-1">Global Itinerary Management</span>
                                        Pre-calculate your entire tour. Save location-specific TV channel exclusions and local spectral regulations for every stop on your global itinerary.
                                    </p>
                                </li>
                            </ul>
                        </EcosystemAccordion>

                        {/* Venue Planning */}
                        <EcosystemAccordion title="Venue Planning" icon={Layout} colorClass="bg-amber-500/10 text-amber-400">
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                                <li>
                                    <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest mb-2">Booth Ledger</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        <span className="text-slate-300 font-bold block mb-1">Exhibition RF Inventory</span>
                                        Track every wireless device across hundreds of exhibition booths. Manage power levels, frequency assignments, and contact details for every exhibitor.
                                    </p>
                                </li>
                                <li>
                                    <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest mb-2">Floor Plan Visualization</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        <span className="text-slate-300 font-bold block mb-1">Interactive Site Overlays</span>
                                        Overlay your RF coordination onto venue floor plans. Identify high-density "hot zones" and plan antenna distribution to ensure uniform coverage.
                                    </p>
                                </li>
                                <li>
                                    <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest mb-2">Hardware Parameters</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        <span className="text-slate-300 font-bold block mb-1">Global Device Database</span>
                                        Access a comprehensive library of hardware specifications. From Shure and Sennheiser to Wisycom and Lectrosonics, all tuning ranges and filter profiles are pre-loaded.
                                    </p>
                                </li>
                            </ul>
                        </EcosystemAccordion>

                        {/* Analysis & Comms */}
                        <EcosystemAccordion title="Analysis & Comms" icon={Activity} colorClass="bg-cyan-500/10 text-cyan-400">
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                                <li>
                                    <h4 className="text-sm font-black text-cyan-400 uppercase tracking-widest mb-2">Waterfall Visualization</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        <span className="text-slate-300 font-bold block mb-1">Spectral Time-Machine</span>
                                        Monitor the spectrum over time to catch intermittent interference. Identify patterns in noise floor fluctuations and track the "on-air" time of unauthorized devices.
                                    </p>
                                </li>
                                <li>
                                    <h4 className="text-sm font-black text-cyan-400 uppercase tracking-widest mb-2">Talkback Coordination</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        <span className="text-slate-300 font-bold block mb-1">Duplex Path Engineering</span>
                                        Specialized logic for production comms. Coordinate TX/RX pairs with appropriate spacing to prevent desensitization in full-duplex talkback systems.
                                    </p>
                                </li>
                                <li>
                                    <h4 className="text-sm font-black text-cyan-400 uppercase tracking-widest mb-2">Zonal Talkback</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        <span className="text-slate-300 font-bold block mb-1">Multi-Zone Comms Logic</span>
                                        Manage complex comms across multiple distinct zones (e.g., Stage, FOH, Broadcast Truck) while maintaining spectral separation and interference-free operation.
                                    </p>
                                </li>
                                <li>
                                    <h4 className="text-sm font-black text-cyan-400 uppercase tracking-widest mb-2">WMAS Coordination</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        <span className="text-slate-300 font-bold block mb-1">Next-Gen Efficiency</span>
                                        Advanced support for Wireless Multi-channel Audio Systems. Leverage wideband spectral efficiency to pack more channels into less space with zero IMD.
                                    </p>
                                </li>
                            </ul>
                        </EcosystemAccordion>

                        {/* RF Toolkit */}
                        <EcosystemAccordion title="The RF Toolkit" icon={Database} colorClass="bg-indigo-500/10 text-indigo-400">
                            <div className="text-[10px] text-slate-400 mb-8 uppercase tracking-widest font-black pt-6">Professional Engineering Utilities & Simulators</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                <div className="flex gap-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                                    <div>
                                        <h5 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-1">Proximity Simulator (IEM Study)</h5>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            <span className="text-slate-400 italic block mb-1">"How close is too close?"</span>
                                            Analyze how high-power IEM transmitters impact nearby receivers. Simulate desensitization and find safe physical spacing to prevent receiver front-end overload.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                                    <div>
                                        <h5 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-1">Co-Channel Lab (Interference)</h5>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            <span className="text-slate-400 italic block mb-1">"Capture Ratio Analysis"</span>
                                            Educational signal collision simulator. Understand capture ratios and what happens when two signals share a frequency. Predict the "winner" in a spectral conflict.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                                    <div>
                                        <h5 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-1">IMD Physics Lab (Demo)</h5>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            <span className="text-slate-400 italic block mb-1">"Visualizing Intermodulation"</span>
                                            The math of intermodulation made visual. See exactly where 3rd and 5th order products land in the spectrum and how they interact with your primary carriers.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                                    <div>
                                        <h5 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-1">Link Budget Calc</h5>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            <span className="text-slate-400 italic block mb-1">"End-to-End Signal Integrity"</span>
                                            Calculate end-to-end signal strength. Account for TX power, cable loss, connector attenuation, antenna gain, and free space path loss (FSPL).
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                                    <div>
                                        <h5 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-1">Diversity Placement</h5>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            <span className="text-slate-400 italic block mb-1">"Multipath Mitigation"</span>
                                            Calculate optimal antenna spacing based on frequency to maximize diversity gain and minimize multipath fading in complex indoor environments.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                                    <div>
                                        <h5 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-1">Cable Loss & VSWR</h5>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            <span className="text-slate-400 italic block mb-1">"Transmission Line Health"</span>
                                            Analyze signal degradation across various coaxial types and calculate Voltage Standing Wave Ratio (VSWR) to assess antenna and cable health.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                                    <div>
                                        <h5 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-1">LOS & Fresnel Zone</h5>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            <span className="text-slate-400 italic block mb-1">"Obstacle Clearance"</span>
                                            Earth curvature and obstacle clearance calculations for long-range point-to-point RF links. Ensure your 1st Fresnel zone is 60% clear.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                                    <div>
                                        <h5 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-1">Antenna Down Tilt</h5>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            <span className="text-slate-400 italic block mb-1">"Coverage Optimization"</span>
                                            Calculate the optimal mechanical tilt for antennas to maximize coverage in specific audience or stage areas while minimizing overshoot.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                                    <div>
                                        <h5 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-1">Power Converter</h5>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            <span className="text-slate-400 italic block mb-1">"Instant Unit Translation"</span>
                                            Instant conversion between dBm, mW, Volts, and other critical RF units. Essential for fast field calculations and equipment spec comparisons.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </EcosystemAccordion>
                    </div>
                </section>

                {/* About Us Section */}
                <section id="about" className="bg-slate-900/30 py-16 border-y border-white/5">
                    <div className="container mx-auto px-6">
                        <div className="max-w-5xl mx-auto">
                            <div className="flex flex-col lg:flex-row gap-20 items-start">
                                <div className="lg:w-1/3 sticky top-32">
                                    <div className="relative">
                                        <div className="absolute -inset-4 bg-indigo-500/20 blur-2xl rounded-full"></div>
                                        <div className="relative aspect-square rounded-3xl bg-slate-800 border border-white/10 flex items-center justify-center text-6xl overflow-hidden">
                                            <img 
                                                src="https://picsum.photos/seed/engineer/400/400" 
                                                alt="Lead Engineer" 
                                                className="w-full h-full object-cover opacity-80"
                                                referrerPolicy="no-referrer"
                                            />
                                        </div>
                                        <div className="absolute -bottom-4 -right-4 bg-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                                            25 Years Exp
                                        </div>
                                    </div>
                                    
                                    <div className="mt-12 space-y-8">
                                        <div>
                                            <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">Our Mission</h4>
                                            <p className="text-sm text-white font-bold leading-relaxed">To provide professional-grade RF coordination tools that are accessible, reliable, and built on real-world field experience.</p>
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">Our Ambition</h4>
                                            <p className="text-sm text-white font-bold leading-relaxed">To become the global standard for wireless coordination across all entertainment and industrial sectors.</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="lg:w-2/3">
                                    <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-12 leading-[0.9]">
                                        The Story Behind <br />
                                        <span className="text-indigo-500">RF Suite</span>
                                    </h2>
                                    
                                    <div className="space-y-12">
                                        <div>
                                            <h3 className="text-lg font-black text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                                                <div className="w-8 h-px bg-indigo-500"></div>
                                                Knowledge & Expertise
                                            </h3>
                                            <p className="text-slate-400 leading-relaxed">
                                                RF Suite is the culmination of over two decades of on-the-ground spectrum coordination. We've managed the invisible chaos of world tours, multi-stage festivals, and high-stakes global broadcasts. This isn't software built in a vacuum; it's a tool forged in the trenches of live production, where "zero failure" is the only acceptable outcome.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                            <div>
                                                <h3 className="text-lg font-black text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                                                    <div className="w-8 h-px bg-indigo-500"></div>
                                                    Aims & Goals
                                                </h3>
                                                <p className="text-slate-400 text-sm leading-relaxed">
                                                    Our primary goal is to eliminate spectral interference in live environments. We aim to empower engineers with mathematical certainty, moving away from "best guesses" to data-driven coordination that accounts for the physical realities of every venue.
                                                </p>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                                                    <div className="w-8 h-px bg-indigo-500"></div>
                                                    Future Vision
                                                </h3>
                                                <p className="text-slate-400 text-sm leading-relaxed">
                                                    As the RF landscape becomes increasingly crowded with 5G and industrial IoT, our focus is on developing even more resilient algorithms. We are committed to continuous innovation, ensuring our users stay ahead of regulatory shifts and hardware advancements.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-8 rounded-3xl bg-indigo-600/5 border border-indigo-500/20">
                                            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">The Field Philosophy</h4>
                                            <p className="text-slate-400 text-sm leading-relaxed italic">
                                                "We believe that every frequency has a story, and every show deserves a clean spectrum. Our philosophy is simple: prepare for the worst, coordinate for the best, and never let the math fail you when the lights go up."
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Learning Section */}
                <section id="learning" className="container mx-auto px-6 py-16">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Learning Center</h2>
                        <p className="text-slate-500 uppercase font-black text-[10px] tracking-[0.3em]">Democratizing RF knowledge for everyone</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-10 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 transition-all group">
                            <div className="text-indigo-400 mb-8 group-hover:scale-110 transition-transform"><Info size={40} /></div>
                            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-4">RF Fundamentals</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                Master the "Why" behind coordination. This module covers the physics of radio waves, including wavelength, propagation, the inverse square law, and how different materials impact your signal.
                            </p>
                            <div className="pt-6 border-t border-white/5">
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Curriculum: Physics & Propagation</span>
                            </div>
                        </div>
                        <div className="p-10 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 transition-all group">
                            <div className="text-indigo-400 mb-8 group-hover:scale-110 transition-transform"><Zap size={40} /></div>
                            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-4">Pro Masterclass</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                Deep dive into advanced coordination. Learn combinatorial intermodulation analysis, spatial reuse strategies, and how to manage large-scale multi-zone sites with hundreds of active channels.
                            </p>
                            <div className="pt-6 border-t border-white/5">
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Curriculum: Advanced IMD Logic</span>
                            </div>
                        </div>
                        <div className="p-10 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 transition-all group">
                            <div className="text-indigo-400 mb-8 group-hover:scale-110 transition-transform"><HelpCircle size={40} /></div>
                            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-4">The RF Playbook</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                Real-world troubleshooting. We analyze actual show failures and successes, distilling 25 years of field experience into actionable strategies for when things go wrong on site.
                            </p>
                            <div className="pt-6 border-t border-white/5">
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Curriculum: Field Troubleshooting</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-20">
                        <NewsFeed />
                    </div>
                </section>

                <section className="container mx-auto px-6 py-16 border-t border-white/5">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Industry Standard Support</h2>
                        <p className="text-slate-500 uppercase font-black text-[10px] tracking-[0.3em]">Compatible with the world's leading wireless ecosystems</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale hover:opacity-100 transition-all duration-500">
                        {['Shure', 'Sennheiser', 'Wisycom', 'Lectrosonics', 'Audio-Technica', 'Sony'].map((brand) => (
                            <div key={brand} className="text-xl font-black text-white uppercase tracking-[0.2em]">{brand}</div>
                        ))}
                    </div>
                </section>

                {/* Pricing Section */}
                <section id="pricing" className="container mx-auto px-6 py-16 border-t border-white/5">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Subscription Plans</h2>
                        <p className="text-slate-500 uppercase font-black text-[10px] tracking-[0.3em]">Transparent pricing for professionals</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* 48 Hour Pass */}
                        <div className="p-8 rounded-3xl bg-slate-900/50 border border-white/5 flex flex-col">
                            <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">48 Hour Pass</h3>
                            <p className="text-slate-400 text-xs mb-6">Perfect for single events, weekend gigs, or quick coordination tasks.</p>
                            <div className="mb-8">
                                <span className="text-4xl font-black text-white">$6.99</span>
                                <span className="text-slate-500 text-xs uppercase tracking-widest">/48 hours</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-grow">
                                <li className="flex items-start gap-3 text-sm text-slate-300"><Check size={16} className="text-indigo-400 shrink-0 mt-0.5" /> Full Access to RF Suite</li>
                                <li className="flex items-start gap-3 text-sm text-slate-300"><Check size={16} className="text-indigo-400 shrink-0 mt-0.5" /> Core Coordination Engine</li>
                                <li className="flex items-start gap-3 text-sm text-slate-300"><Check size={16} className="text-indigo-400 shrink-0 mt-0.5" /> Hardware & Venue Library</li>
                                <li className="flex items-start gap-3 text-sm text-slate-300"><Check size={16} className="text-indigo-400 shrink-0 mt-0.5" /> Complete RF Toolkit</li>
                            </ul>
                            <button className="w-full py-4 rounded-xl bg-white/5 text-white font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all border border-white/10">Get Pass</button>
                        </div>

                        {/* 7 Day Pass */}
                        <div className="p-8 rounded-3xl bg-slate-900/50 border border-white/5 flex flex-col">
                            <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">7 Day Pass</h3>
                            <p className="text-slate-400 text-xs mb-6">Ideal for week-long festivals, short tours, or extended events.</p>
                            <div className="mb-8">
                                <span className="text-4xl font-black text-white">$16.99</span>
                                <span className="text-slate-500 text-xs uppercase tracking-widest">/7 days</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-grow">
                                <li className="flex items-start gap-3 text-sm text-slate-300"><Check size={16} className="text-indigo-400 shrink-0 mt-0.5" /> Full Access to RF Suite</li>
                                <li className="flex items-start gap-3 text-sm text-slate-300"><Check size={16} className="text-indigo-400 shrink-0 mt-0.5" /> Core Coordination Engine</li>
                                <li className="flex items-start gap-3 text-sm text-slate-300"><Check size={16} className="text-indigo-400 shrink-0 mt-0.5" /> Hardware & Venue Library</li>
                                <li className="flex items-start gap-3 text-sm text-slate-300"><Check size={16} className="text-indigo-400 shrink-0 mt-0.5" /> Complete RF Toolkit</li>
                            </ul>
                            <button className="w-full py-4 rounded-xl bg-white/5 text-white font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all border border-white/10">Get Pass</button>
                        </div>

                        {/* 1 Month Pass */}
                        <div className="p-8 rounded-3xl bg-indigo-600/10 border border-indigo-500/30 flex flex-col relative shadow-[0_0_30px_rgba(79,70,229,0.1)] transform md:-translate-y-4">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                <Star size={10} /> Best Value
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">1 Month Pass</h3>
                            <p className="text-indigo-200/60 text-xs mb-6">Best value for ongoing projects, full-time coordinators, and busy seasons.</p>
                            <div className="mb-8">
                                <span className="text-4xl font-black text-white">$36.99</span>
                                <span className="text-slate-500 text-xs uppercase tracking-widest">/month</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-grow">
                                <li className="flex items-start gap-3 text-sm text-slate-300"><Check size={16} className="text-indigo-400 shrink-0 mt-0.5" /> Full Access to RF Suite</li>
                                <li className="flex items-start gap-3 text-sm text-slate-300"><Check size={16} className="text-indigo-400 shrink-0 mt-0.5" /> Core Coordination Engine</li>
                                <li className="flex items-start gap-3 text-sm text-slate-300"><Check size={16} className="text-indigo-400 shrink-0 mt-0.5" /> Hardware & Venue Library</li>
                                <li className="flex items-start gap-3 text-sm text-slate-300"><Check size={16} className="text-indigo-400 shrink-0 mt-0.5" /> Complete RF Toolkit</li>
                            </ul>
                            <button className="w-full py-4 rounded-xl bg-indigo-500 text-white font-black uppercase tracking-widest text-xs hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/25">Get Pass</button>
                        </div>
                    </div>
                </section>

                {/* FAQs Section */}
                <section id="faqs" className="container mx-auto px-6 py-16">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-20">
                            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Common Questions</h2>
                            <p className="text-slate-500 uppercase font-black text-[10px] tracking-[0.3em]">Everything you need to know to get started</p>
                        </div>
                        <div className="space-y-2">
                            <FAQItem 
                                question="Is TinySA hardware required?" 
                                answer="No, RF Suite works perfectly as a standalone coordinator. However, connecting a TinySA allows for live site scanning and real-time noise floor analysis, which significantly improves coordination accuracy." 
                            />
                            <FAQItem 
                                question="Which browsers are supported?" 
                                answer="We support all modern browsers. However, for hardware integration (TinySA), you must use a Chromium-based browser (Chrome, Edge, Brave) to access the Web Serial API." 
                            />
                            <FAQItem 
                                question="Is my show data secure?" 
                                answer="Yes. All project data is encrypted and stored securely. We use industry-standard Firebase security protocols to ensure your coordination files are only accessible by you." 
                            />
                            <FAQItem 
                                question="Can I export my frequencies?" 
                                answer="Absolutely. You can export your coordination as a PDF frequency sheet, a CSV for import into other tools, or a native .rfproject file for backup." 
                            />
                        </div>
                    </div>
                </section>

                {/* Legal Section */}
                <section id="legal" className="container mx-auto px-6 py-16 border-t border-white/5">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Legal & Compliance</h2>
                            <p className="text-slate-500 uppercase font-black text-[10px] tracking-[0.3em]">Transparency and data integrity</p>
                        </div>
                        
                        <div className="space-y-4">
                            <FAQItem 
                                question="Privacy Policy" 
                                answer="At RF Suite, we take your data security seriously. Our privacy policy is built on the principle of data minimization: we only collect what is strictly necessary to provide our services. You retain full ownership of all spectral data and coordination projects created within the app. All data transmitted between your browser and our servers is encrypted using industry-standard TLS protocols. We do not sell, trade, or otherwise transfer your personally identifiable information or project data to outside parties. You have the right to access, correct, or delete your data at any time through your account dashboard." 
                            />
                            <FAQItem 
                                question="Cookies Policy" 
                                answer="We use cookies to enhance your experience and ensure the application functions correctly. Essential cookies are necessary for the app to function, such as maintaining your login session and security tokens. Functional cookies remember your preferences, such as your choice of 'Sunlight Mode' or your last used coordination region. We do not use cookies for advertising, cross-site tracking, or behavioral profiling. You can choose to disable cookies through your browser settings, though some parts of the app may not function properly." 
                            />
                        </div>
                    </div>
                </section>
                
                {/* Footer */}
                <footer className="container mx-auto px-6 py-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col gap-2">
                        <div className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">
                            &copy; {new Date().getFullYear()} RF SUITE PRECISION LOGIC. ALL RIGHTS RESERVED.
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Global Infrastructure Operational</span>
                        </div>
                    </div>
                    <div className="flex gap-8">
                        <span className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">V2.5.0 STABLE</span>
                        <div className="flex gap-4">
                            <Lock size={14} className="text-slate-700" />
                            <span className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">Encrypted Session</span>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
