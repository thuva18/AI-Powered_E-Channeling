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
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex items-center min-h-screen">
                {/* AI Generated Light Background Image */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('/images/unified_light_blue_bg.png')" }}
                />

                {/* Beautiful overlay gradients to blend the image */}
                <div className="absolute inset-0 z-0 bg-white/40 backdrop-blur-sm" />
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-50 to-transparent z-0" />

                <div className="max-w-7xl mx-auto px-6 text-center animate-fade-up relative z-10 w-full">
                    {/* Glassmorphism Wrapper for text (Light Theme) */}
                    <div className="inline-block p-10 md:p-14 rounded-[3rem] bg-white/60 backdrop-blur-3xl border border-white/80 shadow-2xl shadow-blue-500/20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/50 border border-blue-200/50 text-blue-700 text-xs font-bold uppercase tracking-widest mb-8 shadow-sm backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            AI-Powered Healthcare
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6 drop-shadow-sm">
                            Smart Channeling for <br className="hidden sm:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600">
                                Better Health.
                            </span>
                        </h1>

                        <p className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                            Describe your symptoms and our AI instantly connects you with the right specialist. Book appointments in seconds, entirely online.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                            <Link to="/patient/register" className="w-full sm:w-auto px-10 py-4 rounded-full text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2">
                                <Search size={18} className="text-white" /> Find a Doctor
                            </Link>
                            <Link to="/login" className="w-full sm:w-auto px-10 py-4 rounded-full text-base font-bold text-slate-800 bg-white/80 border border-slate-200/50 backdrop-blur-md shadow-lg hover:bg-white hover:border-slate-300 transition-all duration-300 flex items-center justify-center gap-2 group">
                                I am a Doctor <ChevronRight size={18} className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section className="py-32 bg-slate-50 relative overflow-hidden">
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[120px] -z-10 translate-x-1/3 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-[120px] -z-10 -translate-x-1/2 translate-y-1/3" />

                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20 animate-fade-up">
                        <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Why Choose Medicare?</h2>
                        <p className="text-lg lg:text-xl text-slate-500 max-w-2xl mx-auto font-medium">Experience a frictionless healthcare journey powered by modern AI technology and verified specialists.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Brain}
                            title="AI Symptom Matching"
                            desc="Not sure who to see? Describe what you're feeling, and our AI will recommend the exact specialist you need."
                            color="text-blue-600"
                            bg="bg-blue-100/50"
                        />
                        <FeatureCard
                            icon={CalendarCheck}
                            title="Instant Booking"
                            desc="View real-time doctor availability and secure your appointment slot instantly without any phone calls."
                            color="text-indigo-600"
                            bg="bg-indigo-100/50"
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Verified Experts"
                            desc="Every doctor on our platform is strictly vetted and verified by the SLMC ensuring you get the best care."
                            color="text-cyan-600"
                            bg="bg-cyan-100/50"
                        />
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="bg-slate-950 py-16 border-t border-slate-900 relative">
                <div className="absolute inset-0 bg-blue-900/5 blur-[150px] -z-10 rounded-full" />
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Stethoscope size={20} className="text-white" />
                        </div>
                        <span className="font-extrabold text-2xl text-white tracking-tight">Medicare</span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">
                        © 2026 Medicare E-Channeling. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link to="/login" className="text-sm font-semibold text-slate-500 hover:text-white transition-colors duration-300">Admin Login</Link>
                        <span className="text-slate-800">•</span>
                        <Link to="/login" className="text-sm font-semibold text-slate-500 hover:text-white transition-colors duration-300">Doctor Portal</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, desc, color, bg }) => (
    <div className="group relative p-10 rounded-[2.5rem] bg-white border border-slate-100/60 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className={`relative h-16 w-16 rounded-2xl ${bg} flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner`}>
            <Icon size={28} className={color} />
        </div>
        <h3 className="relative text-2xl font-bold text-slate-900 mb-4 tracking-tight group-hover:text-blue-600 transition-colors duration-300">{title}</h3>
        <p className="relative text-slate-500 text-lg leading-relaxed font-medium">{desc}</p>
    </div>
);

export default LandingPage;
