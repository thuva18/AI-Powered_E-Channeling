import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Users, Search, Mail, Phone, Calendar, FileText, Tag, ImageIcon,
    ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, CheckSquare,
} from 'lucide-react';
import { SectionHeader, EmptyState } from '../components/ui/Common';

// ── Status badge ───────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    ACCEPTED: { label: 'Accepted', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    COMPLETED: { label: 'Completed', icon: CheckSquare, color: 'bg-blue-100 text-blue-700 border-blue-200' },
    REJECTED: { label: 'Rejected', icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' },
    PENDING: { label: 'Pending', icon: Clock, color: 'bg-amber-100 text-amber-700 border-amber-200' },
    CANCELLED: { label: 'Cancelled', icon: XCircle, color: 'bg-slate-100 text-slate-500 border-slate-200' },
};

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${cfg.color}`}>
            <Icon size={10} /> {cfg.label}
        </span>
    );
};

// ── Image lightbox ─────────────────────────────────────────────────────────────
const ImageLightbox = ({ src, onClose }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-md animate-fade-in" onClick={onClose}>
        <img src={src} alt="symptom" className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl border border-white/20" onClick={e => e.stopPropagation()} />
        <button onClick={onClose} className="absolute top-5 right-5 h-9 w-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center font-bold transition-colors text-lg">✕</button>
    </div>
);

// ── Single appointment history entry ──────────────────────────────────────────
const AppointmentHistoryItem = ({ apt }) => {
    const [lightboxSrc, setLightboxSrc] = useState(null);
    const hasSymptoms = apt.symptomDescription || (apt.symptoms?.length > 0);
    const hasImages = apt.symptomImages?.length > 0;

    return (
        <>
            {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Appointment header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                            <Calendar size={13} className="text-blue-500" />
                            {new Date(apt.appointmentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <span className="text-slate-300">·</span>
                        <span className="text-sm font-medium text-slate-500">{apt.timeSlot}</span>
                    </div>
                    <StatusBadge status={apt.status} />
                </div>

                {/* Symptom body */}
                {(hasSymptoms || hasImages) ? (
                    <div className="px-4 py-3 space-y-3">
                        {/* Symptom description */}
                        {apt.symptomDescription && (
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                                    <FileText size={11} /> Symptoms
                                </p>
                                <p className="text-sm text-slate-700 leading-relaxed bg-blue-50/50 rounded-xl px-3 py-2 border border-blue-100">
                                    {apt.symptomDescription}
                                </p>
                            </div>
                        )}

                        {/* Tags */}
                        {apt.symptoms?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {apt.symptoms.map((s, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                                        <Tag size={9} /> {s}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Images */}
                        {hasImages && (
                            <div className="space-y-1.5">
                                <p className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                                    <ImageIcon size={11} /> Images ({apt.symptomImages.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {apt.symptomImages.map((src, idx) => (
                                        <div key={idx} className="group relative cursor-pointer" onClick={() => setLightboxSrc(src)}>
                                            <img
                                                src={src}
                                                alt={`img-${idx}`}
                                                className="h-16 w-16 object-cover rounded-xl border-2 border-blue-200 group-hover:border-blue-400 group-hover:scale-105 shadow-sm transition-all duration-200"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="px-4 py-3 text-xs text-slate-400 italic">No symptom data submitted.</p>
                )}
            </div>
        </>
    );
};

// ── Patient card with expandable appointment history ──────────────────────────
const PatientCard = ({ patient }) => {
    const [expanded, setExpanded] = useState(false);
    const [history, setHistory] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const handleExpand = async () => {
        if (!expanded && history === null) {
            setLoadingHistory(true);
            try {
                const { data } = await api.get(`/doctors/patients/${patient._id}/appointments`);
                setHistory(data);
            } catch {
                setHistory([]);
            } finally {
                setLoadingHistory(false);
            }
        }
        setExpanded(prev => !prev);
    };

    return (
        <div className={`card overflow-hidden transition-all duration-300 ${expanded ? 'shadow-xl shadow-blue-500/10' : 'hover:shadow-lg'}`}>
            {/* Patient info header */}
            <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-3 w-full">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
                        {(patient.name?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">{patient.name || 'Unknown Patient'}</h3>
                        <p className="text-xs text-slate-400 truncate">
                            {patient.gender || 'Unknown gender'}
                            {patient.dob ? ` · ${Math.floor((new Date() - new Date(patient.dob)) / 31557600000)} yrs` : ''}
                        </p>
                    </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600 pt-3 border-t border-slate-50">
                    <p className="flex items-center gap-2">
                        <Mail size={14} className="text-slate-400" />
                        <span className="truncate">{patient.email}</span>
                    </p>
                    {patient.phone && (
                        <p className="flex items-center gap-2">
                            <Phone size={14} className="text-slate-400" />
                            <span>{patient.phone}</span>
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                        {patient.totalVisits} Visit{patient.totalVisits !== 1 ? 's' : ''}
                    </div>
                    <div className="text-xs font-medium text-slate-400">
                        Last: {new Date(patient.lastVisit).toLocaleDateString()}
                    </div>
                </div>

                {/* Toggle button */}
                <button
                    onClick={handleExpand}
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${expanded
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-400/30'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
                        }`}
                >
                    {loadingHistory ? (
                        <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                    ) : expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {expanded ? 'Hide' : 'View'} Appointment History
                </button>
            </div>

            {/* Expandable history */}
            {expanded && history !== null && (
                <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 space-y-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                        Appointment History & Symptoms
                    </p>
                    {history.length === 0 ? (
                        <p className="text-xs text-slate-400 italic px-1">No appointment records found.</p>
                    ) : (
                        history.map(apt => <AppointmentHistoryItem key={apt._id} apt={apt} />)
                    )}
                </div>
            )}
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const DoctorPatients = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const { data } = await api.get('/doctors/patients');
                setPatients(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, []);

    const filtered = patients.filter(p =>
        (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.phone && p.phone.includes(search))
    );

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Patient Directory"
                subtitle={`${patients.length} registered patients`}
            />

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    placeholder="Search by name, email, or phone..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="input-field pl-11"
                />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="card p-5 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="skeleton h-12 w-12 rounded-xl" />
                                <div className="space-y-2 flex-1">
                                    <div className="skeleton h-4 w-2/3" />
                                    <div className="skeleton h-3 w-1/2" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="card">
                    <EmptyState
                        icon={<Users size={32} />}
                        title={search ? 'No patients found' : 'No patients yet'}
                        description={search ? 'Try adjusting your search terms.' : 'Patients who book appointments with you will appear here.'}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(patient => (
                        <PatientCard key={patient._id} patient={patient} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default DoctorPatients;
