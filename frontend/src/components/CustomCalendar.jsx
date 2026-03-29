import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CustomCalendar = ({ selectedDate, onSelectDate, minDate, maxDate, className = '' }) => {
    // Current viewed month (initially derived from selectedDate or today)
    const initialViewDate = selectedDate ? new Date(selectedDate) : new Date();
    const [currentMonth, setCurrentMonth] = useState(new Date(initialViewDate.getFullYear(), initialViewDate.getMonth(), 1));

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const parsedSelectedDate = selectedDate ? new Date(selectedDate) : null;
    if (parsedSelectedDate) parsedSelectedDate.setHours(0, 0, 0, 0);

    const parsedMinDate = minDate ? new Date(minDate) : null;
    if (parsedMinDate) parsedMinDate.setHours(0, 0, 0, 0);

    const parsedMaxDate = maxDate ? new Date(maxDate) : null;
    if (parsedMaxDate) parsedMaxDate.setHours(0, 0, 0, 0);

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const { days, daysOfWeek, monthName, year } = useMemo(() => {
        const dOfW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        const mName = currentMonth.toLocaleString('default', { month: 'long' });
        const yr = currentMonth.getFullYear();

        const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        const daysInPrevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();

        const daysArray = [];

        // Previous month days
        for (let i = startDay - 1; i >= 0; i--) {
            daysArray.push({
                date: new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, daysInPrevMonth - i),
                isCurrentMonth: false,
            });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            daysArray.push({
                date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i),
                isCurrentMonth: true,
            });
        }

        // Next month days (to complete the grid of 42 cells, i.e., 6 weeks)
        const totalCells = daysArray.length > 35 ? 42 : 35;
        const remainingCells = totalCells - daysArray.length;
        for (let i = 1; i <= remainingCells; i++) {
            daysArray.push({
                date: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, i),
                isCurrentMonth: false,
            });
        }

        return { days: daysArray, daysOfWeek: dOfW, monthName: mName, year: yr };
    }, [currentMonth]);

    const isSameDay = (d1, d2) => {
        if (!d1 || !d2) return false;
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    };

    const isSelectable = (date) => {
        if (parsedMinDate && date < parsedMinDate) return false;
        if (parsedMaxDate && date > parsedMaxDate) return false;
        return true;
    };

    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-4 ${className} animate-fade-in`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button 
                    onClick={prevMonth}
                    type="button"
                    className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>
                <div className="text-sm font-bold text-slate-800">
                    {monthName} <span className="text-slate-500 font-semibold">{year}</span>
                </div>
                <button 
                    onClick={nextMonth}
                    type="button"
                    className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {daysOfWeek.map(day => (
                    <div key={day} className="text-center text-[10px] font-bold text-slate-400 py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((dayObj, idx) => {
                    const isSelected = isSameDay(dayObj.date, parsedSelectedDate);
                    const isToday = isSameDay(dayObj.date, todayDate);
                    const selectable = isSelectable(dayObj.date);
                    
                    let baseStyles = "h-8 w-full flex items-center justify-center text-xs font-semibold rounded-lg transition-all mx-auto ";
                    
                    if (!selectable) {
                        baseStyles += "text-slate-300 cursor-not-allowed ";
                    } else if (isSelected) {
                        baseStyles += "bg-blue-600 text-white shadow-md shadow-blue-500/30 ";
                    } else if (isToday) {
                        baseStyles += "text-blue-600 bg-blue-50 hover:bg-blue-100 cursor-pointer ";
                    } else if (!dayObj.isCurrentMonth) {
                        baseStyles += "text-slate-400 hover:bg-slate-50 cursor-pointer ";
                    } else {
                        baseStyles += "text-slate-700 hover:bg-slate-100 cursor-pointer ";
                    }

                    return (
                        <button
                            key={idx}
                            type="button"
                            disabled={!selectable}
                            className={baseStyles}
                            onClick={() => selectable && onSelectDate?.(dayObj.date)}
                        >
                            {dayObj.date.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default CustomCalendar;
