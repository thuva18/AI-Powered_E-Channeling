import { useState, useMemo } from 'react';
import {
    ChevronLeft, ChevronRight, X, Calendar, Clock,
    User, CheckCircle, AlertCircle, XCircle, Grid3X3, List
} from 'lucide-react';

const STATUS_STYLE = {
    PENDING:   { bg: 'bg-amber-500',   light: 'bg-amber-50 border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
    ACCEPTED:  { bg: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    REJECTED:  { bg: 'bg-red-500',     light: 'bg-red-50 border-red-200',       text: 'text-red-700',     dot: 'bg-red-500'     },
    COMPLETED: { bg: 'bg-blue-500',    light: 'bg-blue-50 border-blue-200',     text: 'text-blue-700',    dot: 'bg-blue-500'    },
    CANCELLED: { bg: 'bg-slate-400',   light: 'bg-slate-50 border-slate-200',   text: 'text-slate-500',   dot: 'bg-slate-400'   },
};

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

/**
 * DoctorFullCalendar — Google Calendar-style popup
 * Props:
 *   appointments: array
 *   onClose: () => void
 */
const DoctorFullCalendar = ({ appointments = [], onClose }) => {
    const [view, setView]               = useState('month');           // 'month' | 'week'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedApt, setSelectedApt] = useState(null);

    const today = useMemo(() => {
        const d = new Date(); d.setHours(0,0,0,0); return d;
    }, []);

    // ── helpers ────────────────────────────────────────────────────────────────
    const toKey = (d) =>
        `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

    const isSameDay = (a,b) =>
        a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();

    // map: dateKey → appointments[]
    const aptMap = useMemo(() => {
        const m = {};
        appointments.forEach(apt => {
            const d = new Date(apt.appointmentDate);
            const k = toKey(d);
            if (!m[k]) m[k] = [];
            m[k].push(apt);
        });
        return m;
    }, [appointments]);

    // ── MONTH VIEW ─────────────────────────────────────────────────────────────
    const monthDays = useMemo(() => {
        const y = currentDate.getFullYear();
        const mo = currentDate.getMonth();
        const firstDay = new Date(y, mo, 1).getDay();
        const daysInM  = new Date(y, mo+1, 0).getDate();
        const daysInP  = new Date(y, mo, 0).getDate();
        const arr = [];
        for (let i = firstDay-1; i>=0; i--)
            arr.push({ date: new Date(y, mo-1, daysInP-i), cur: false });
        for (let i=1; i<=daysInM; i++)
            arr.push({ date: new Date(y, mo, i), cur: true });
        const total = arr.length > 35 ? 42 : 35;
        for (let i=1; i<=total-arr.length; i++)
            arr.push({ date: new Date(y, mo+1, i), cur: false });
        return arr;
    }, [currentDate]);

    // ── WEEK VIEW ──────────────────────────────────────────────────────────────
    const weekDays = useMemo(() => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - d.getDay()); // Sunday
        return Array.from({ length:7 }, (_,i) => {
            const day = new Date(d); day.setDate(d.getDate()+i); return day;
        });
    }, [currentDate]);

    const HOURS = Array.from({ length: 14 }, (_,i) => i+7); // 7am – 8pm

    // navigate
    const prev = () => {
        if (view === 'month') setCurrentDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1));
        else setCurrentDate(d => { const n=new Date(d); n.setDate(n.getDate()-7); return n; });
    };
    const next = () => {
        if (view === 'month') setCurrentDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1));
        else setCurrentDate(d => { const n=new Date(d); n.setDate(n.getDate()+7); return n; });
    };
    const goToday = () => setCurrentDate(new Date());

    const heading = view === 'month'
        ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
        : `${weekDays[0].toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${weekDays[6].toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;

    // parse hour from timeSlot like "9:00 AM" or "14:30"
    const parseHour = (slot) => {
        if (!slot) return 9;
        const m = slot.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (!m) return 9;
        let h = parseInt(m[1]);
        if (m[3]?.toUpperCase() === 'PM' && h !== 12) h += 12;
        if (m[3]?.toUpperCase() === 'AM' && h === 12) h = 0;
        return h;
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-4 md:inset-8 z-[201] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-up">

                {/* ── Top Bar ── */}
                <div className="h-16 shrink-0 border-b border-slate-100 flex items-center justify-between px-6 bg-white">
                    <div className="flex items-center gap-4">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center shadow-sm">
                            <Calendar size={16} className="text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900 text-base leading-none">My Schedule</h2>
                            <p className="text-xs text-slate-400 mt-0.5">{appointments.length} total appointments</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* View toggle */}
                        <div className="flex items-center bg-slate-100 rounded-xl p-1">
                            <button
                                onClick={() => setView('month')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view==='month' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Grid3X3 size={12} /> Month
                            </button>
                            <button
                                onClick={() => setView('week')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view==='week' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <List size={12} /> Week
                            </button>
                        </div>

                        {/* Nav */}
                        <button onClick={goToday} className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition-colors">
                            Today
                        </button>
                        <button onClick={prev} className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                            <ChevronLeft size={14} className="text-slate-600" />
                        </button>
                        <button onClick={next} className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                            <ChevronRight size={14} className="text-slate-600" />
                        </button>
                        <span className="text-sm font-bold text-slate-800 min-w-[160px] text-center hidden sm:block">
                            {heading}
                        </span>

                        <button onClick={onClose} className="ml-2 h-8 w-8 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* ── Status legend ── */}
                <div className="shrink-0 flex items-center gap-4 px-6 py-2 bg-slate-50 border-b border-slate-100">
                    {Object.entries(STATUS_STYLE).slice(0,4).map(([s,v]) => (
                        <div key={s} className="flex items-center gap-1.5">
                            <div className={`h-2 w-2 rounded-full ${v.dot}`} />
                            <span className="text-[10px] font-semibold text-slate-500 capitalize">{s.toLowerCase()}</span>
                        </div>
                    ))}
                </div>

                {/* ── Calendar Body ── */}
                <div className="flex-1 overflow-auto">

                    {/* ════ MONTH VIEW ════ */}
                    {view === 'month' && (
                        <div className="h-full flex flex-col">
                            {/* DOW header */}
                            <div className="grid grid-cols-7 border-b border-slate-100">
                                {DAY_LABELS.map(d => (
                                    <div key={d} className="py-2 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        {d}
                                    </div>
                                ))}
                            </div>
                            {/* Day cells */}
                            <div className="flex-1 grid grid-cols-7" style={{ gridAutoRows: '1fr' }}>
                                {monthDays.map((dayObj, idx) => {
                                    const key  = toKey(dayObj.date);
                                    const apts = aptMap[key] || [];
                                    const isT  = isSameDay(dayObj.date, today);
                                    return (
                                        <div
                                            key={idx}
                                            className={`border-b border-r border-slate-100 p-1.5 min-h-[80px] ${!dayObj.cur ? 'bg-slate-50/50' : ''}`}
                                        >
                                            <div className={`h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold mb-1 ${
                                                isT ? 'bg-blue-600 text-white' : dayObj.cur ? 'text-slate-700' : 'text-slate-300'
                                            }`}>
                                                {dayObj.date.getDate()}
                                            </div>
                                            {apts.slice(0,3).map((apt,i) => {
                                                const s = STATUS_STYLE[apt.status] || STATUS_STYLE.PENDING;
                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => setSelectedApt(apt)}
                                                        className={`w-full text-left text-[9px] font-semibold px-1.5 py-0.5 rounded-md mb-0.5 truncate border ${s.light} ${s.text} hover:opacity-80 transition-opacity`}
                                                    >
                                                        {apt.timeSlot || '—'} · {apt.patientId?.email?.split('@')[0] || 'Patient'}
                                                    </button>
                                                );
                                            })}
                                            {apts.length > 3 && (
                                                <button
                                                    onClick={() => setSelectedApt(apts[3])}
                                                    className="text-[9px] text-blue-500 font-semibold hover:underline"
                                                >
                                                    +{apts.length - 3} more
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ════ WEEK VIEW ════ */}
                    {view === 'week' && (
                        <div className="flex h-full min-h-[500px]">
                            {/* Time gutter */}
                            <div className="w-14 shrink-0 border-r border-slate-100 pt-10">
                                {HOURS.map(h => (
                                    <div key={h} className="h-16 flex items-start justify-end pr-2">
                                        <span className="text-[9px] text-slate-400 font-semibold -mt-2">
                                            {h % 12 === 0 ? 12 : h % 12}{h < 12 ? 'am' : 'pm'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Day columns */}
                            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(7,1fr)` }}>
                                {weekDays.map((day, di) => {
                                    const key  = toKey(day);
                                    const apts = aptMap[key] || [];
                                    const isT  = isSameDay(day, today);
                                    return (
                                        <div key={di} className="border-r border-slate-100 last:border-r-0">
                                            {/* Header */}
                                            <div className={`h-10 flex flex-col items-center justify-center border-b border-slate-100 ${isT ? 'bg-blue-50' : ''}`}>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                    {DAY_LABELS[day.getDay()]}
                                                </span>
                                                <span className={`text-sm font-black ${isT ? 'text-blue-600' : 'text-slate-700'}`}>
                                                    {day.getDate()}
                                                </span>
                                            </div>

                                            {/* Hour rows */}
                                            <div className="relative">
                                                {HOURS.map(h => (
                                                    <div key={h} className="h-16 border-b border-slate-50 hover:bg-slate-50/50" />
                                                ))}

                                                {/* Appointment pills positioned by time */}
                                                {apts.map((apt, ai) => {
                                                    const h = parseHour(apt.timeSlot);
                                                    const topPx = (h - 7) * 64 + 4;
                                                    const s = STATUS_STYLE[apt.status] || STATUS_STYLE.PENDING;
                                                    return (
                                                        <button
                                                            key={ai}
                                                            onClick={() => setSelectedApt(apt)}
                                                            className={`absolute left-1 right-1 rounded-lg px-1.5 py-1 text-left border ${s.light} ${s.text} hover:opacity-90 transition-opacity shadow-sm`}
                                                            style={{ top: topPx, minHeight: 40 }}
                                                        >
                                                            <p className="text-[9px] font-bold truncate">{apt.timeSlot}</p>
                                                            <p className="text-[8px] truncate opacity-80">
                                                                {apt.patientId?.email?.split('@')[0] || 'Patient'}
                                                            </p>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Appointment Detail Panel ── */}
            {selectedApt && (
                <>
                    <div
                        className="fixed inset-0 z-[300]"
                        onClick={() => setSelectedApt(null)}
                    />
                    <div className="fixed z-[301] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-up">
                        {/* Colored top bar */}
                        <div className={`h-2 w-full ${STATUS_STYLE[selectedApt.status]?.bg || 'bg-slate-400'}`} />
                        <div className="p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${STATUS_STYLE[selectedApt.status]?.light} ${STATUS_STYLE[selectedApt.status]?.text} border`}>
                                        {selectedApt.status}
                                    </span>
                                    <h3 className="font-bold text-slate-900 mt-2 text-sm">Appointment Details</h3>
                                </div>
                                <button onClick={() => setSelectedApt(null)} className="h-7 w-7 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <div className="h-8 w-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                        {(selectedApt.patientId?.email?.[0] || 'P').toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-800 truncate">Patient</p>
                                        <p className="text-xs text-slate-500 truncate">{selectedApt.patientId?.email || 'Unknown'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <Calendar size={13} className="text-blue-500 shrink-0" />
                                    {new Date(selectedApt.appointmentDate).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <Clock size={13} className="text-blue-500 shrink-0" />
                                    {selectedApt.timeSlot || 'Time not set'}
                                </div>

                                {selectedApt.symptomDescription && (
                                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                        <p className="text-[10px] font-bold text-amber-700 mb-1 uppercase tracking-wide">Symptoms</p>
                                        <p className="text-xs text-amber-800 italic">"{selectedApt.symptomDescription}"</p>
                                    </div>
                                )}

                                {selectedApt.consultationFeeCharged > 0 && (
                                    <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                                        <span className="text-xs font-semibold text-emerald-700">Consultation Fee</span>
                                        <span className="text-xs font-black text-emerald-700">LKR {selectedApt.consultationFeeCharged?.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default DoctorFullCalendar;
