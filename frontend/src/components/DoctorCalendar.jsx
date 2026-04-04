import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

/**
 * DoctorCalendar — mini sidebar calendar for doctors.
 * Props:
 *   appointments: array of appointment objects from /api/v1/doctors/appointments
 *   onViewFull: () => void — called when "View Full Calendar" is clicked
 */
const DoctorCalendar = ({ appointments = [], onViewFull }) => {
    const [currentMonth, setCurrentMonth] = useState(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    );
    const [tooltip, setTooltip] = useState(null); // { dateKey, x, y }

    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    // Build a map: "YYYY-MM-DD" → array of appointments
    const appointmentMap = useMemo(() => {
        const map = {};
        appointments.forEach(apt => {
            if (!['PENDING', 'ACCEPTED'].includes(apt.status)) return;
            const d = new Date(apt.appointmentDate);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (!map[key]) map[key] = [];
            map[key].push(apt);
        });
        return map;
    }, [appointments]);

    const { days, monthName, year } = useMemo(() => {
        const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        const mName = currentMonth.toLocaleString('default', { month: 'long' });
        const yr = currentMonth.getFullYear();
        const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        const daysInPrev = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();

        const arr = [];
        for (let i = startDay - 1; i >= 0; i--) {
            arr.push({ date: new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, daysInPrev - i), isCurrentMonth: false });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            arr.push({ date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i), isCurrentMonth: true });
        }
        const total = arr.length > 35 ? 42 : 35;
        for (let i = 1; i <= total - arr.length; i++) {
            arr.push({ date: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, i), isCurrentMonth: false });
        }
        return { days: arr, daysOfWeek: DOW, monthName: mName, year: yr };
    }, [currentMonth]);

    const toKey = (date) =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const isSameDay = (d1, d2) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    const DOW_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
        <div className="px-3 pb-2 shrink-0 relative">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-1 pb-1">
                Schedule
            </p>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <button
                        type="button"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                        className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                    >
                        <ChevronLeft size={12} />
                    </button>
                    <span className="text-[11px] font-bold text-slate-700">
                        {monthName} <span className="text-slate-400 font-semibold">{year}</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                        className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                    >
                        <ChevronRight size={12} />
                    </button>
                </div>

                {/* Days of week */}
                <div className="grid grid-cols-7 gap-0.5 mb-1">
                    {DOW_LABELS.map(d => (
                        <div key={d} className="text-center text-[9px] font-bold text-slate-400">{d}</div>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-0.5 relative">
                    {days.map((dayObj, idx) => {
                        const key = toKey(dayObj.date);
                        const apts = appointmentMap[key] || [];
                        const hasApts = apts.length > 0;
                        const isToday = isSameDay(dayObj.date, today);
                        const isPast = dayObj.date < today;

                        let cls = 'relative h-7 w-full flex flex-col items-center justify-center rounded-lg text-[10px] font-semibold transition-all cursor-default ';

                        if (!dayObj.isCurrentMonth) {
                            cls += 'text-slate-300 ';
                        } else if (hasApts && !isPast) {
                            cls += 'bg-red-500 text-white shadow-sm shadow-red-500/30 cursor-pointer hover:bg-red-600 ';
                        } else if (isToday) {
                            cls += 'bg-blue-600 text-white ';
                        } else if (isPast) {
                            cls += 'text-slate-300 ';
                        } else {
                            cls += 'text-slate-600 hover:bg-slate-100 ';
                        }

                        return (
                            <div
                                key={idx}
                                className={cls}
                                onMouseEnter={(e) => {
                                    if (hasApts && !isPast) {
                                        setTooltip({ key, apts, rect: e.currentTarget.getBoundingClientRect() });
                                    }
                                }}
                                onMouseLeave={() => setTooltip(null)}
                            >
                                {dayObj.date.getDate()}
                                {hasApts && !isPast && apts.length > 1 && (
                                    <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-amber-400 text-[7px] font-black text-white rounded-full flex items-center justify-center leading-none">
                                        {apts.length}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-blue-600" />
                        <span className="text-[9px] text-slate-400">Today</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-[9px] text-slate-400">Appointment</span>
                    </div>
                </div>
            </div>

            {/* View Full Calendar button */}
            <button
                onClick={onViewFull}
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold text-blue-600 hover:text-white hover:bg-blue-600 rounded-xl border border-blue-200 hover:border-blue-600 transition-all duration-200"
            >
                <CalendarDays size={11} /> View Full Calendar
            </button>

            {/* Hover Tooltip */}
            {tooltip && (
                <div
                    className="fixed z-[9999] bg-slate-900 text-white rounded-xl shadow-2xl p-3 min-w-[200px] pointer-events-none animate-fade-up"
                    style={{
                        top: tooltip.rect.bottom + 6,
                        left: Math.min(tooltip.rect.left, window.innerWidth - 220),
                    }}
                >
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        {new Date(tooltip.apts[0].appointmentDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    {tooltip.apts.slice(0, 4).map((apt, i) => (
                        <div key={i} className={`flex items-center gap-2 ${i > 0 ? 'mt-1.5 pt-1.5 border-t border-slate-700' : ''}`}>
                            <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center text-[8px] font-bold shrink-0">
                                {(apt.patientId?.email?.[0] || 'P').toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate">{apt.patientId?.email || 'Patient'}</p>
                                <p className="text-[10px] text-slate-400">{apt.timeSlot || '—'}</p>
                            </div>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${apt.status === 'ACCEPTED' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                                {apt.status}
                            </span>
                        </div>
                    ))}
                    {tooltip.apts.length > 4 && (
                        <p className="text-[9px] text-slate-400 mt-1.5">+{tooltip.apts.length - 4} more</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default DoctorCalendar;
