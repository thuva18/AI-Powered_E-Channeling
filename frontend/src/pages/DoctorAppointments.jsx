import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Badge, EmptyState, SectionHeader } from '../components/ui/Common';
import { Button } from '../components/ui/Button';
import {
    CheckCircle, XCircle, RefreshCw, Calendar, Clock, CheckSquare, AlertCircle,
    ChevronDown, ChevronUp, ImageIcon, FileText, Tag,
} from 'lucide-react';

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
<<<<<<< Updated upstream
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onCancel} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-up">
                <h3 className="font-bold text-slate-900 text-base mb-2">{c.title}</h3>
                <p className="text-sm text-slate-500 mb-5">{c.desc}</p>
                <div className="flex gap-3 justify-end">
                    <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
=======
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={onCancel} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-fade-up border border-slate-100">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${action.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-600' :
                        action.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                            'bg-blue-100 text-blue-600'
                        }`}>
                        {action.status === 'ACCEPTED' && <CheckCircle size={24} />}
                        {action.status === 'REJECTED' && <XCircle size={24} />}
                        {action.status === 'COMPLETED' && <CheckSquare size={24} />}
                    </div>
                    <div>
                        <h3 className="font-extrabold text-slate-900 text-xl">{c.title}</h3>
                        <p className="text-sm font-medium text-slate-500 mt-0.5">{c.desc}</p>
                    </div>
                </div>
                <div className="flex gap-3 justify-end mt-8">
                    <button onClick={onCancel} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
>>>>>>> Stashed changes
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

// ── Image Lightbox ─────────────────────────────────────────────────────────────
const ImageLightbox = ({ src, onClose }) => {
    if (!src) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
            <img src={src} alt="symptom" className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl border border-white/20" onClick={e => e.stopPropagation()} />
            <button onClick={onClose} className="absolute top-5 right-5 h-9 w-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center font-bold transition-colors">
                ✕
            </button>
        </div>
    );
};

// ── Symptom Detail Panel ───────────────────────────────────────────────────────
const PAYMENT_METHOD_META = {
    PAYHERE: { label: 'Paid via PayHere', icon: '🏦', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    BANK_TRANSFER: { label: 'Paid via Bank Transfer (Admin verified)', icon: '🏛️', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    PAYPAL: { label: 'Paid via PayPal (Admin verified)', icon: '💳', color: 'bg-sky-50 text-sky-700 border-sky-200' },
};

const SymptomPanel = ({ apt }) => {
    const [lightboxSrc, setLightboxSrc] = useState(null);
    const hasSymptoms = apt.symptomDescription || (apt.symptoms && apt.symptoms.length > 0);
    const hasImages = apt.symptomImages && apt.symptomImages.length > 0;
    const paymentMeta = PAYMENT_METHOD_META[apt.paymentMethod];

    return (
        <>
            {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
            <div className="px-8 py-5 bg-blue-50/40 border-t border-blue-100/60 space-y-4">

                {/* Payment verification badge */}
                {apt.paymentStatus === 'PAID' && paymentMeta && (
                    <div className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border ${paymentMeta.color}`}>
                        <span>{paymentMeta.icon}</span> {paymentMeta.label}
                        <span className="ml-1 text-emerald-600 font-bold">✓ Payment Confirmed</span>
                    </div>
                )}
                {apt.paymentStatus !== 'PAID' && (
                    <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-amber-50 text-amber-700 border-amber-200">
                        ⏳ Payment Pending
                    </div>
                )}

                {/* Symptom description */}
                {apt.symptomDescription && (
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 uppercase tracking-wider">
                            <FileText size={13} /> Symptom Description
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed bg-white rounded-xl px-4 py-3 border border-blue-100 shadow-sm">
                            {apt.symptomDescription}
                        </p>
                    </div>
                )}

                {/* Symptom tags */}
                {apt.symptoms && apt.symptoms.length > 0 && (
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 uppercase tracking-wider">
                            <Tag size={13} /> Symptom Tags
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {apt.symptoms.map((s, idx) => (
                                <span key={idx} className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200">
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Symptom images */}
                {hasImages && (
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 uppercase tracking-wider">
                            <ImageIcon size={13} /> Uploaded Images ({apt.symptomImages.length})
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {apt.symptomImages.map((src, idx) => (
                                <div key={idx} className="relative group cursor-pointer" onClick={() => setLightboxSrc(src)}>
                                    <img
                                        src={src}
                                        alt={`symptom-image-${idx + 1}`}
                                        className="h-20 w-20 object-cover rounded-xl border-2 border-blue-200 shadow-sm group-hover:border-blue-400 group-hover:shadow-md group-hover:scale-105 transition-all duration-200"
                                    />
                                    <div className="absolute inset-0 rounded-xl bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors" />
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400">Click an image to view full size</p>
                    </div>
                )}

                {!hasSymptoms && !hasImages && (
                    <div className="flex items-center gap-2 text-slate-400 text-sm italic">
                        <FileText size={14} />
                        No symptoms or images submitted by the patient.
                    </div>
                )}
            </div>
        </>
    );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const DoctorAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [updating, setUpdating] = useState(null);
    const [toast, setToast] = useState(null);
    const [confirm, setConfirm] = useState(null); // { id, status }
    const [expandedId, setExpandedId] = useState(null); // which row is expanded

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

    const toggleExpand = (id) => {
        setExpandedId(prev => (prev === id ? null : id));
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
<<<<<<< Updated upstream
                                <tr className="border-b border-slate-100 bg-slate-50/60">
                                    {['Patient', 'Date', 'Time Slot', 'Status', 'Payment', 'Actions'].map((h) => (
                                        <th key={h} className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
=======
                                <tr className="border-b border-slate-200/60 bg-slate-50/50">
                                    {['Patient', 'Date', 'Time Slot', 'Status', 'Payment', 'Actions', 'Details'].map((h) => (
                                        <th key={h} className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-500">{h}</th>
>>>>>>> Stashed changes
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((apt) => (
<<<<<<< Updated upstream
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
=======
                                    <>
                                        <tr
                                            key={apt._id}
                                            className={`hover:bg-blue-50/30 transition-all ${updating === apt._id + apt.status ? 'opacity-50 scale-[0.99]' : ''} ${expandedId === apt._id ? 'bg-blue-50/20' : ''}`}
                                        >
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-50 border border-blue-200 flex items-center justify-center text-blue-700 text-base font-bold shrink-0 shadow-sm">
                                                        {apt.patientId?.email?.[0]?.toUpperCase() || 'P'}
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-bold text-slate-900">{apt.patientId?.email || 'Patient'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                    <Calendar size={15} className="text-blue-500" />
                                                    {new Date(apt.appointmentDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                    <Clock size={15} className="text-amber-500" />
                                                    {apt.timeSlot || '—'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5"><Badge status={apt.status} /></td>
                                            <td className="px-8 py-5"><Badge status={apt.paymentStatus} /></td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {apt.status === 'PENDING' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusRequest(apt._id, 'ACCEPTED')}
                                                                disabled={!!updating}
                                                                className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95 transition-all disabled:opacity-50"
                                                            >
                                                                <CheckCircle size={15} /> Accept
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusRequest(apt._id, 'REJECTED')}
                                                                disabled={!!updating}
                                                                className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/30 hover:border-transparent active:scale-95 transition-all disabled:opacity-50"
                                                            >
                                                                <XCircle size={15} /> Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {apt.status === 'ACCEPTED' && (
>>>>>>> Stashed changes
                                                        <button
                                                            onClick={() => handleStatusRequest(apt._id, 'COMPLETED')}
                                                            disabled={!!updating}
<<<<<<< Updated upstream
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
=======
                                                            className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 transition-all disabled:opacity-50"
                                                        >
                                                            <CheckSquare size={15} /> Complete
                                                        </button>
                                                    )}
                                                    {(apt.status === 'REJECTED' || apt.status === 'COMPLETED') && (
                                                        <span className="text-sm font-bold text-slate-400 italic bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">—</span>
                                                    )}
                                                </div>
                                            </td>
                                            {/* Details toggle */}
                                            <td className="px-8 py-5">
                                                <button
                                                    onClick={() => toggleExpand(apt._id)}
                                                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all border ${expandedId === apt._id
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
                                                        }`}
                                                >
                                                    {expandedId === apt._id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                                    {expandedId === apt._id ? 'Hide' : 'View'}
                                                    {(apt.symptomImages?.length > 0) && (
                                                        <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 text-[10px] font-bold">
                                                            <ImageIcon size={9} />{apt.symptomImages.length}
                                                        </span>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Expandable symptom detail row */}
                                        {expandedId === apt._id && (
                                            <tr key={`${apt._id}-detail`} className="bg-blue-50/20">
                                                <td colSpan={7} className="p-0">
                                                    <SymptomPanel apt={apt} />
                                                </td>
                                            </tr>
                                        )}
                                    </>
>>>>>>> Stashed changes
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
