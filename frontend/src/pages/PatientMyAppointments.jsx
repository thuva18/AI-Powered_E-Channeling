import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Calendar, Clock, CheckCircle, XCircle, RefreshCw, Ban, Stethoscope } from 'lucide-react';

const STATUS_CONFIG = {
    PENDING: { label: 'Pending', color: 'badge-pending', icon: Clock },
    ACCEPTED: { label: 'Accepted', color: 'badge-approved', icon: CheckCircle },
    REJECTED: { label: 'Rejected', color: 'badge-rejected', icon: XCircle },
    COMPLETED: { label: 'Completed', color: 'bg-blue-100 text-blue-700 border border-blue-200', icon: CheckCircle },
    CANCELLED: { label: 'Cancelled', color: 'bg-slate-100 text-slate-600 border border-slate-200', icon: Ban },
};

const PatientMyAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/patients/appointments');
            setAppointments(data);
        } catch { showToast('Failed to load appointments', 'error'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

    const handleCancel = async (id) => {
        if (!window.confirm('Cancel this appointment?')) return;
        setCancelling(id);
        try {
            await api.patch(`/patients/appointments/${id}/cancel`);
            setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: 'CANCELLED' } : a));
            showToast('Appointment cancelled.');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to cancel', 'error');
        } finally { setCancelling(null); }
    };

    const upcoming = appointments.filter(a => ['PENDING', 'ACCEPTED'].includes(a.status));
    const past = appointments.filter(a => !['PENDING', 'ACCEPTED'].includes(a.status));

    const AppointmentCard = ({ apt }) => {
        const cfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.PENDING;
        const Icon = cfg.icon;
        const doc = apt.doctorId;
        return (
            <div className="card p-5 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-all">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
                    {doc?.firstName?.[0]?.toUpperCase() || 'D'}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                            <p className="font-bold text-slate-900">Dr. {doc?.firstName} {doc?.lastName}</p>
                            <p className="text-xs text-slate-400">{doc?.specialization}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 ${cfg.color}`}>
                            <Icon size={10} /> {cfg.label}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2.5">
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                            <Calendar size={12} className="text-blue-500" />
                            {new Date(apt.appointmentDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                            <Clock size={12} className="text-blue-500" /> {apt.timeSlot}
                        </span>
                        {doc?.consultationFee > 0 && (
                            <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                                💰 LKR {doc.consultationFee?.toLocaleString()}
                            </span>
                        )}
                    </div>
                    {apt.symptomDescription && (
                        <p className="text-xs text-slate-400 mt-2 italic line-clamp-1">"{apt.symptomDescription}"</p>
                    )}
                </div>
                {apt.status === 'PENDING' && (
                    <button
                        onClick={() => handleCancel(apt._id)}
                        disabled={cancelling === apt._id}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors self-start shrink-0 disabled:opacity-50">
                        {cancelling === apt._id
                            ? <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                            : <Ban size={12} />} Cancel
                    </button>
                )}
            </div>
        );
    };

    return (
        <>
            {toast && (
                <div className={`fixed top-5 right-5 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl font-medium text-sm animate-fade-up cursor-pointer ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
                    onClick={() => setToast(null)}>
                    {toast.msg}
                </div>
            )}

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">My Appointments</h1>
                        <p className="text-sm text-slate-400">Track all your scheduled visits</p>
                    </div>
                    <button onClick={fetchAppointments} disabled={loading}
                        className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="card p-5 flex gap-4">
                                <div className="skeleton h-12 w-12 rounded-2xl shrink-0" />
                                <div className="flex-1 space-y-2"><div className="skeleton h-4 w-1/3" /><div className="skeleton h-3 w-1/4" /></div>
                            </div>
                        ))}
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="card p-12 text-center">
                        <Stethoscope size={36} className="mx-auto text-slate-300 mb-3" />
                        <p className="font-semibold text-slate-600">No appointments yet</p>
                        <p className="text-sm text-slate-400 mt-1">Head to Book Appointment to get started</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {upcoming.length > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Upcoming ({upcoming.length})</h2>
                                {upcoming.map(a => <AppointmentCard key={a._id} apt={a} />)}
                            </div>
                        )}
                        {past.length > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Past ({past.length})</h2>
                                {past.map(a => <AppointmentCard key={a._id} apt={a} />)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default PatientMyAppointments;
