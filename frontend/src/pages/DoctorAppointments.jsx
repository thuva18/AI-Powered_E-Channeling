import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Badge, EmptyState, SectionHeader } from '../components/ui/Common';
import { Button } from '../components/ui/Button';
import { CheckCircle, XCircle, RefreshCw, Calendar, Clock, CheckSquare, AlertCircle } from 'lucide-react';

// ── Inline toast ───────────────────────────────────────────────────────────────
const Toast = ({ toast }) => {
    if (!toast) return null;
    return (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl font-medium text-sm animate-slide-in-right
            ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
        </div>
    );
};

// ── Confirm dialog ─────────────────────────────────────────────────────────────
const ConfirmDialog = ({ action, onConfirm, onCancel }) => {
    if (!action) return null;
    const config = {
        ACCEPTED: { title: 'Accept Appointment', desc: 'Are you sure you want to accept this appointment?', btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white', btnLabel: 'Accept' },
        REJECTED: { title: 'Reject Appointment', desc: 'Are you sure you want to reject this appointment? This cannot be undone.', btnClass: 'bg-red-600 hover:bg-red-700 text-white', btnLabel: 'Reject' },
        COMPLETED: { title: 'Mark as Completed', desc: 'Mark this appointment as completed?', btnClass: 'bg-blue-600 hover:bg-blue-700 text-white', btnLabel: 'Mark Complete' },
    };
    const c = config[action.status];
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onCancel} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-up">
                <h3 className="font-bold text-slate-900 text-base mb-2">{c.title}</h3>
                <p className="text-sm text-slate-500 mb-5">{c.desc}</p>
                <div className="flex gap-3 justify-end">
                    <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${c.btnClass}`}>
                        {c.btnLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

const DoctorAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [updating, setUpdating] = useState(null);
    const [toast, setToast] = useState(null);
    const [confirm, setConfirm] = useState(null); // { id, status }

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/doctors/appointments');
            setAppointments(data);
        } catch {
            showToast('Failed to load appointments.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

    const handleStatusRequest = (id, status) => {
        setConfirm({ id, status });
    };

    const handleStatusConfirm = async () => {
        const { id, status } = confirm;
        setConfirm(null);
        setUpdating(id + status);
        try {
            await api.patch(`/doctors/appointments/${id}/status`, { status });
            // Optimistic update — no full reload needed
            setAppointments(prev =>
                prev.map(apt => apt._id === id ? { ...apt, status } : apt)
            );
            const labels = { ACCEPTED: 'Appointment accepted', REJECTED: 'Appointment rejected', COMPLETED: 'Marked as completed' };
            showToast(labels[status] || 'Status updated');
        } catch {
            showToast('Could not update status. Please try again.', 'error');
        } finally {
            setUpdating(null);
        }
    };

    const filters = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'];
    const filtered = filter === 'ALL' ? appointments : appointments.filter(a => a.status === filter);

    return (
        <div className="space-y-6">
            <Toast toast={toast} />
            <ConfirmDialog action={confirm} onConfirm={handleStatusConfirm} onCancel={() => setConfirm(null)} />

            <SectionHeader
                title="Appointment Requests"
                subtitle={`Showing ${filtered.length} of ${appointments.length} bookings`}
                action={
                    <Button variant="ghost" size="sm" onClick={fetchAppointments} isLoading={loading}>
                        <RefreshCw size={14} /> Refresh
                    </Button>
                }
            />

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {filters.map((f) => {
                    const count = f === 'ALL' ? appointments.length : appointments.filter(a => a.status === f).length;
                    return (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${filter === f
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
                                }`}
                        >
                            {f} {count > 0 && <span className={`ml-1 ${filter === f ? 'opacity-70' : 'opacity-60'}`}>({count})</span>}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="card p-8">
                    <div className="space-y-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="skeleton h-10 w-10 rounded-xl shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="skeleton h-3 w-1/3" />
                                    <div className="skeleton h-3 w-1/4" />
                                </div>
                                <div className="skeleton h-6 w-20 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="card">
                    <EmptyState
                        icon={<Calendar size={28} />}
                        title="No appointments found"
                        description={`No ${filter === 'ALL' ? '' : filter.toLowerCase() + ' '}appointments in the system yet.`}
                    />
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60">
                                    {['Patient', 'Date', 'Time Slot', 'Status', 'Payment', 'Actions'].map((h) => (
                                        <th key={h} className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((apt) => (
                                    <tr key={apt._id} className={`table-row transition-all ${updating === apt._id + apt.status ? 'opacity-60' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-sm font-bold shrink-0">
                                                    {apt.patientId?.email?.[0]?.toUpperCase() || 'P'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">{apt.patientId?.email || 'Patient'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-sm text-slate-700">
                                                <Calendar size={13} className="text-slate-400" />
                                                {new Date(apt.appointmentDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-sm text-slate-700">
                                                <Clock size={13} className="text-slate-400" />
                                                {apt.timeSlot || '—'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><Badge status={apt.status} /></td>
                                        <td className="px-6 py-4"><Badge status={apt.paymentStatus} /></td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {apt.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusRequest(apt._id, 'ACCEPTED')}
                                                            disabled={!!updating}
                                                            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all border border-emerald-200 disabled:opacity-50"
                                                        >
                                                            <CheckCircle size={13} /> Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusRequest(apt._id, 'REJECTED')}
                                                            disabled={!!updating}
                                                            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 transition-all border border-red-200 disabled:opacity-50"
                                                        >
                                                            <XCircle size={13} /> Reject
                                                        </button>
                                                    </>
                                                )}
                                                {apt.status === 'ACCEPTED' && (
                                                    <button
                                                        onClick={() => handleStatusRequest(apt._id, 'COMPLETED')}
                                                        disabled={!!updating}
                                                        className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 active:scale-95 transition-all border border-blue-200 disabled:opacity-50"
                                                    >
                                                        <CheckSquare size={13} /> Complete
                                                    </button>
                                                )}
                                                {(apt.status === 'REJECTED' || apt.status === 'COMPLETED') && (
                                                    <span className="text-xs text-slate-400 italic">—</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorAppointments;
