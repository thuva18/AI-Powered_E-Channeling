import { Link } from 'react-router-dom';
import { ShieldCheck, HeartPulse, Brain, CalendarCheck, Search, ChevronRight, Stethoscope } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-500/30">
            {/* ── Navigation ── */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <HeartPulse size={20} className="text-white" />
                        </div>
                        <span className="font-extrabold text-xl tracking-tight text-slate-800">
                            Medicare
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
                            Log In
                        </Link>
                        <Link to="/patient/register" className="px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-all active:scale-95">
                            Book Now
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero Section ── */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Background effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-gradient-to-b from-blue-100/50 to-transparent blur-3xl -z-10 rounded-full opacity-70" />
                <div className="absolute right-0 top-20 w-72 h-72 bg-indigo-200/40 blur-[100px] -z-10 rounded-full" />
                <div className="absolute left-0 bottom-0 w-96 h-96 bg-blue-100/50 blur-[120px] -z-10 rounded-full" />

                <div className="max-w-7xl mx-auto px-6 text-center animate-fade-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest mb-8 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        AI-Powered Healthcare
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
                        Smart Channeling for <br className="hidden sm:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-500">
                            Better Health.
                        </span>
                    </h1>

                    <p className="text-lg lg:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Describe your symptoms and our AI instantly connects you with the right specialist. Book appointments in seconds, entirely online.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/patient/register" className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                            <Search size={18} /> Find a Doctor
                        </Link>
                        <Link to="/login" className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-bold text-slate-700 bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group">
                            I am a Doctor <ChevronRight size={18} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </Link>
                    </div>
                </div>

                {/* Dashboard mockup preview */}
                <div className="max-w-5xl mx-auto mt-20 px-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
                    <div className="rounded-3xl p-3 bg-white/40 backdrop-blur-xl border border-white/60 shadow-2xl shadow-slate-200/50">
                        <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-inner aspect-[16/9] md:aspect-[21/9] flex items-center justify-center relative">
                            {/* Abstract mockup UI */}
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                            <div className="absolute left-8 top-8 bottom-8 w-48 bg-slate-800/50 rounded-xl border border-slate-700/50 hidden md:block p-4 space-y-3">
                                <div className="h-6 w-24 bg-blue-500/20 rounded-md" />
                                <div className="h-4 w-full bg-slate-700/50 rounded" />
                                <div className="h-4 w-3/4 bg-slate-700/50 rounded" />
                                <div className="h-4 w-5/6 bg-slate-700/50 rounded" />
                            </div>
                            <div className="absolute left-8 md:left-64 right-8 top-8 bottom-8 flex flex-col gap-6">
                                <div className="h-32 w-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl border border-blue-500/30 flex items-center p-6 gap-6">
                                    <div className="h-16 w-16 rounded-full bg-blue-500/30 flex shrink-0" />
                                    <div className="space-y-3 flex-1">
                                        <div className="h-5 w-1/3 bg-blue-500/40 rounded" />
                                        <div className="h-3 w-1/4 bg-slate-600 rounded" />
                                    </div>
                                </div>
                                <div className="flex-1 flex gap-6">
                                    <div className="flex-1 bg-slate-800/50 rounded-2xl border border-slate-700/50" />
                                    <div className="flex-1 bg-slate-800/50 rounded-2xl border border-slate-700/50 hidden sm:block" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Choose Medicare?</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto">Experience a frictionless healthcare journey powered by modern technology.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Brain}
                            title="AI Symptom Matching"
                            desc="Not sure who to see? Describe what you're feeling, and our AI will recommend the exact specialist you need."
                            color="text-purple-500"
                            bg="bg-purple-50"
                        />
                        <FeatureCard
                            icon={CalendarCheck}
                            title="Instant Booking"
                            desc="View real-time doctor availability and secure your appointment slot instantly without any phone calls."
                            color="text-indigo-500"
                            bg="bg-indigo-50"
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Verified Experts"
                            desc="Every doctor on our platform is strictly vetted and verified by the SLMC ensuring you get the best care."
                            color="text-blue-500"
                            bg="bg-blue-50"
                        />
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="bg-slate-900 py-12 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center">
                            <Stethoscope size={18} className="text-white" />
                        </div>
                        <span className="font-bold text-lg text-white">Medicare</span>
                    </div>
                    <p className="text-slate-500 text-sm">
                        © 2025 Medicare E-Channeling. All rights reserved.
                    </p>
                    <div className="flex gap-4">
                        <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Admin Login</Link>
                        <span className="text-slate-700">•</span>
                        <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Doctor Portal</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, desc, color, bg }) => (
    <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:bg-white transition-all duration-300 group">
        <div className={`h-14 w-14 rounded-2xl ${bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
            <Icon size={24} className={color} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-500 leading-relaxed">{desc}</p>
    </div>
);

export default LandingPage;
