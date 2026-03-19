import { useState, useEffect } from 'react';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Badge, EmptyState, SectionHeader } from '../components/ui/Common';
import {
    BookOpen, Plus, Trash2, Edit3, X, Save,
    User, Calendar, Phone, Pill, ChevronRight, ChevronDown,
    ClipboardList, FileText, Stethoscope, AlertCircle, CheckCircle,
} from 'lucide-react';

// ── Status color map ──────────────────────────────────────────────────────────
const STATUS_COLORS = {
    Active: 'bg-blue-50 text-blue-700 border-blue-200',
    Recovered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Follow-up': 'bg-amber-50 text-amber-700 border-amber-200',
    Referred: 'bg-purple-50 text-purple-700 border-purple-200',
    Chronic: 'bg-red-50 text-red-700 border-red-200',
};

const STATUSES = ['Active', 'Recovered', 'Follow-up', 'Referred', 'Chronic'];
const GENDERS = ['Male', 'Female', 'Other'];

// ── Empty prescription row ────────────────────────────────────────────────────
const emptyRx = () => ({ medication: '', dosage: '', frequency: '', duration: '' });

const JournalModal = ({ entry, patients, onClose, onSave }) => {
    const isEdit = !!entry?._id;
    const [form, setForm] = useState({
        patientId: entry?.patientId ? (typeof entry.patientId === 'object' ? entry.patientId._id : entry.patientId) : '',
        patientName: entry?.patientName || '',
        patientAge: entry?.patientAge || '',
        patientGender: entry?.patientGender || '',
        contactNumber: entry?.contactNumber || '',
        visitDate: entry?.visitDate ? entry.visitDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
        diagnosis: entry?.diagnosis || '',
        prescription: entry?.prescription?.length ? entry.prescription : [emptyRx()],
        notes: entry?.notes || '',
        followUpDate: entry?.followUpDate ? entry.followUpDate.slice(0, 10) : '',
        status: entry?.status || 'Active',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));
    const setRx = (idx, field) => (e) => {
        const rx = [...form.prescription];
        rx[idx] = { ...rx[idx], [field]: e.target.value };
        setForm(p => ({ ...p, prescription: rx }));
    };
    const addRx = () => setForm(p => ({ ...p, prescription: [...p.prescription, emptyRx()] }));
    const removeRx = (idx) => setForm(p => ({ ...p, prescription: p.prescription.filter((_, i) => i !== idx) }));

    const handleSave = async () => {
        if (!form.patientName.trim()) { setError('Patient name is required'); return; }
        if (!form.diagnosis.trim()) { setError('Diagnosis is required'); return; }
        setSaving(true);
        try {
            if (isEdit) await api.put(`/doctors/journal/${entry._id}`, form);
            else await api.post('/doctors/journal', form);
            onSave();
        } catch (e) {
            setError('Failed to save entry. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-up">
                {/* Header */}
                <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                            <BookOpen size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">{isEdit ? 'Edit Journal Entry' : 'New Journal Entry'}</h2>
                            <p className="text-xs text-slate-400">Patient record & prescription</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-7 py-5 space-y-6">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                            <AlertCircle size={15} className="shrink-0 text-red-500" />
                            {error}
                        </div>
                    )}

                    {/* Patient info */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <User size={14} /> Patient Information
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2 space-y-1.5">
                                <label className="block text-sm font-semibold text-slate-700">Link to Registered Patient (Optional)</label>
                                <select
                                    value={form.patientId}
                                    onChange={(e) => {
                                        const pid = e.target.value;
                                        setForm(p => ({ ...p, patientId: pid }));
                                        if (pid) {
                                            const pData = patients.find(x => x._id === pid);
                                            if (pData) {
                                                const age = pData.dob ? Math.floor((new Date() - new Date(pData.dob)) / 31557600000) : '';
                                                setForm(prev => ({
                                                    ...prev,
                                                    patientName: pData.name,
                                                    contactNumber: pData.phone || prev.contactNumber,
                                                    patientGender: pData.gender || prev.patientGender,
                                                    patientAge: age || prev.patientAge
                                                }));
                                            }
                                        }
                                    }}
                                    className="input-field appearance-none"
                                >
                                    <option value="">-- No link (External patient) --</option>
                                    {patients?.map(p => <option key={p._id} value={p._id}>{p.name} ({p.totalVisits} recent visits)</option>)}
                                </select>
                            </div>
                            <Input label="Patient Name *" id="pname" placeholder="Full name" value={form.patientName} onChange={set('patientName')} className="col-span-2" />
                            <Input label="Age" id="page" type="number" placeholder="e.g. 45" value={form.patientAge} onChange={set('patientAge')} />
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-slate-700">Gender</label>
                                <select value={form.patientGender} onChange={set('patientGender')} className="input-field appearance-none">
                                    <option value="">Select…</option>
                                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <Input label="Contact Number" id="pcontact" placeholder="07XXXXXXXX" value={form.contactNumber} onChange={set('contactNumber')} />
                            <Input label="Visit Date *" id="vdate" type="date" value={form.visitDate} onChange={set('visitDate')} />
                        </div>
                    </section>

                    {/* Diagnosis */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <ClipboardList size={14} /> Diagnosis & Status
                        </h3>
                        <div className="space-y-3">
                            <Textarea label="Diagnosis *" id="diag" placeholder="Primary diagnosis / clinical findings…" value={form.diagnosis} onChange={set('diagnosis')} />
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-slate-700">Case Status</label>
                                <div className="flex flex-wrap gap-2">
                                    {STATUSES.map(s => (
                                        <button
                                            key={s} type="button"
                                            onClick={() => setForm(p => ({ ...p, status: s }))}
                                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${form.status === s ? STATUS_COLORS[s] : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Prescriptions */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Pill size={14} /> Prescription
                            </h3>
                            <button onClick={addRx} type="button" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors">
                                <Plus size={12} /> Add Medication
                            </button>
                        </div>
                        <div className="space-y-2">
                            {form.prescription.map((rx, idx) => (
                                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-slate-500">Medication #{idx + 1}</p>
                                        {form.prescription.length > 1 && (
                                            <button onClick={() => removeRx(idx)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input value={rx.medication} placeholder="Medication name" onChange={setRx(idx, 'medication')} className="input-field text-sm" />
                                        <input value={rx.dosage} placeholder="Dosage (e.g. 500mg)" onChange={setRx(idx, 'dosage')} className="input-field text-sm" />
                                        <input value={rx.frequency} placeholder="Frequency (e.g. Twice daily)" onChange={setRx(idx, 'frequency')} className="input-field text-sm" />
                                        <input value={rx.duration} placeholder="Duration (e.g. 7 days)" onChange={setRx(idx, 'duration')} className="input-field text-sm" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Notes & follow-up */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <FileText size={14} /> Notes & Follow-up
                        </h3>
                        <div className="space-y-3">
                            <Textarea label="Clinical Notes" id="notes" placeholder="Observations, test results, treatment plan…" value={form.notes} onChange={set('notes')} />
                            <Input label="Follow-up Date" id="fdate" type="date" value={form.followUpDate} onChange={set('followUpDate')} />
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="px-7 py-5 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} isLoading={saving}>
                        <Save size={15} /> {isEdit ? 'Update Entry' : 'Save Entry'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

// ── JournalCard ───────────────────────────────────────────────────────────────
const JournalCard = ({ entry, onEdit, onDelete }) => {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="card overflow-hidden transition-all duration-300 animate-fade-up">
            {/* Card header */}
            <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
                onClick={() => setExpanded(e => !e)}
            >
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-400 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm relative">
                        {entry.patientName?.[0]?.toUpperCase() || 'P'}
                        {entry.patientId && (
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center" title="Registered Patient">
                                <CheckCircle size={10} className="text-white" />
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            {entry.patientName}
                        </p>
                        <p className="text-xs text-slate-400">
                            {entry.patientAge ? `${entry.patientAge} yrs · ` : ''}{entry.patientGender || '—'} ·{' '}
                            {new Date(entry.visitDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`hidden sm:inline-flex badge border ${STATUS_COLORS[entry.status] || 'badge-pending'}`}>{entry.status}</span>
                    {expanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                </div>
            </div>

            {/* Diagnosis preview */}
            <div className="px-5 pb-3 border-t border-slate-50">
                <p className="text-sm text-slate-600 font-medium mt-2 flex items-start gap-1.5">
                    <Stethoscope size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    {entry.diagnosis}
                </p>
            </div>

            {/* Expanded details */}
            {expanded && (
                <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
                    {/* Prescriptions */}
                    {entry.prescription?.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Pill size={12} /> Prescription</p>
                            <div className="space-y-2">
                                {entry.prescription.map((rx, i) => (
                                    <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 bg-blue-50/60 rounded-xl px-4 py-2.5 border border-blue-100">
                                        <div><p className="text-xs text-slate-400">Medication</p><p className="text-sm font-semibold text-slate-800">{rx.medication || '—'}</p></div>
                                        <div><p className="text-xs text-slate-400">Dosage</p><p className="text-sm font-medium text-slate-700">{rx.dosage || '—'}</p></div>
                                        <div><p className="text-xs text-slate-400">Frequency</p><p className="text-sm font-medium text-slate-700">{rx.frequency || '—'}</p></div>
                                        <div><p className="text-xs text-slate-400">Duration</p><p className="text-sm font-medium text-slate-700">{rx.duration || '—'}</p></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {entry.notes && (
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><FileText size={12} /> Notes</p>
                            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 leading-relaxed">{entry.notes}</p>
                        </div>
                    )}

                    {/* Follow-up + contact */}
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                        {entry.contactNumber && <span className="flex items-center gap-1"><Phone size={11} /> {entry.contactNumber}</span>}
                        {entry.followUpDate && <span className="flex items-center gap-1"><Calendar size={11} /> Follow-up: {new Date(entry.followUpDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(entry)}>
                            <Edit3 size={13} /> Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => onDelete(entry._id)}>
                            <Trash2 size={13} /> Delete
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Delete confirm modal ───────────────────────────────────────────────────────
const DeleteConfirmModal = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onCancel} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-up">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="font-bold text-slate-900 text-base text-center mb-1">Delete Journal Entry?</h3>
            <p className="text-sm text-slate-500 text-center mb-5">This entry will be permanently deleted and cannot be recovered.</p>
            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                    Delete
                </button>
            </div>
        </div>
    </div>
);

// ── Toast ──────────────────────────────────────────────────────────────────────
const JournalToast = ({ toast }) => {
    if (!toast) return null;
    return (
        <div className={`fixed top-5 right-5 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl font-medium text-sm animate-slide-in-right cursor-pointer
            ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{toast.msg}</span>
        </div>
    );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const PersonalJournal = () => {
    const [entries, setEntries] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);  // null | 'new' | entryObj
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [deleteTarget, setDeleteTarget] = useState(null); // id to delete
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const load = async () => {
        setLoading(true);
        try {
            const [jRes, pRes] = await Promise.all([
                api.get('/doctors/journal'),
                api.get('/doctors/patients')
            ]);
            setEntries(jRes.data);
            setPatients(pRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleDelete = (id) => {
        setDeleteTarget(id);
    };

    const confirmDelete = async () => {
        const id = deleteTarget;
        setDeleteTarget(null);
        try {
            await api.delete(`/doctors/journal/${id}`);
            setEntries(prev => prev.filter(e => e._id !== id));
            showToast('Journal entry deleted.');
        } catch {
            showToast('Failed to delete entry.', 'error');
        }
    };

    const handleSave = () => { setModal(null); load(); showToast('Journal entry saved!'); };

    const filtered = entries.filter(e => {
        const matchSearch = e.patientName.toLowerCase().includes(search.toLowerCase()) || e.diagnosis.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'ALL' || e.status === filterStatus;
        return matchSearch && matchStatus;
    });

    return (
        <div className="space-y-6">
            {modal && (
                <JournalModal
                    entry={modal === 'new' ? null : modal}
                    patients={patients}
                    onClose={() => setModal(null)}
                    onSave={handleSave}
                />
            )}
            {deleteTarget && (
                <DeleteConfirmModal onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
            )}
            <JournalToast toast={toast} />

            <SectionHeader
                title="Personal Journal"
                subtitle={`${entries.length} patient records`}
                action={
                    <Button onClick={() => setModal('new')}>
                        <Plus size={15} /> New Entry
                    </Button>
                }
            />

            {/* Search + filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <BookOpen size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        placeholder="Search by patient name or diagnosis…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="input-field"
                        style={{ paddingLeft: '36px' }}
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['ALL', ...STATUSES].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${filterStatus === s ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Journal count strip */}
            <div className="flex flex-wrap gap-3">
                {STATUSES.map(s => {
                    const count = entries.filter(e => e.status === s).length;
                    if (!count) return null;
                    return (
                        <span key={s} className={`badge border ${STATUS_COLORS[s]}`}>
                            {count} {s}
                        </span>
                    );
                })}
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="card p-5 flex gap-4">
                            <div className="skeleton h-10 w-10 rounded-xl shrink-0" />
                            <div className="flex-1 space-y-2 pt-1">
                                <div className="skeleton h-3.5 w-1/3" />
                                <div className="skeleton h-3 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="card">
                    <EmptyState
                        icon={<BookOpen size={28} />}
                        title={search || filterStatus !== 'ALL' ? 'No matching records' : 'No journal entries yet'}
                        description={search || filterStatus !== 'ALL' ? 'Try a different search or filter.' : "Click 'New Entry' to start recording patient visits, prescriptions, and notes."}
                    />
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(e => (
                        <JournalCard key={e._id} entry={e} onEdit={setModal} onDelete={handleDelete} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PersonalJournal;
