import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    BookOpen, Plus, Trash2, Edit3, X, Save,
    Calendar, ChevronDown, ChevronRight,
    FileText, AlertCircle, CheckCircle,
    Search, Activity, Eye, EyeOff, Smile, Meh, Frown,
    Pill, ClipboardList,
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────────
const MOOD_STATUSES = ['Improving', 'Stable', 'Worsening'];

const MOOD_CONFIG = {
    Improving: {
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: Smile,
        dot: 'bg-emerald-500',
        label: '😊 Improving',
    },
    Stable: {
        badge: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: Meh,
        dot: 'bg-amber-500',
        label: '😐 Stable',
    },
    Worsening: {
        badge: 'bg-red-100 text-red-700 border-red-200',
        icon: Frown,
        dot: 'bg-red-500',
        label: '😟 Worsening',
    },
};

const PAIN_COLOR = (level) => {
    if (level <= 3) return 'bg-emerald-500';
    if (level <= 6) return 'bg-amber-500';
    return 'bg-red-500';
};

const PAIN_LABEL = (level) => {
    if (level <= 3) return 'Mild';
    if (level <= 6) return 'Moderate';
    return 'Severe';
};

const today = () => new Date().toISOString().slice(0, 10);

// ── Toast ──────────────────────────────────────────────────────────────────────
const Toast = ({ toast }) => {
    if (!toast) return null;
    return (
        <div className={`fixed top-5 right-5 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl font-medium text-sm animate-fade-up
            ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{toast.msg}</span>
        </div>
    );
};

// ── Delete Confirm Modal ───────────────────────────────────────────────────────
const DeleteModal = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onCancel} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-up">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="font-bold text-slate-900 text-base text-center mb-1">Delete Journal Entry?</h3>
            <p className="text-sm text-slate-500 text-center mb-5">
                This entry will be permanently deleted and cannot be recovered.
            </p>
            <div className="flex gap-3">
                <button onClick={onCancel}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
                    Cancel
                </button>
                <button onClick={onConfirm}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors">
                    Delete
                </button>
            </div>
        </div>
    </div>
);

// ── Journal Form Modal ────────────────────────────────────────────────────────
const JournalModal = ({ entry, onClose, onSave }) => {
    const isEdit = !!entry?._id;

    const [form, setForm] = useState({
        title: entry?.title || '',
        entryDate: entry?.entryDate ? entry.entryDate.slice(0, 10) : today(),
        symptoms: entry?.symptoms || '',
        medications: entry?.medications || '',
        moodStatus: entry?.moodStatus || 'Stable',
        painLevel: entry?.painLevel ?? '',
        notes: entry?.notes || '',
        visibility: entry?.visibility || 'PRIVATE',
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

    const handleSave = async () => {
        setError('');
        if (!form.title.trim()) { setError('Title is required'); return; }
        if (!form.entryDate) { setError('Entry date is required'); return; }

        const payload = { ...form };
        if (payload.painLevel === '') delete payload.painLevel;
        else payload.painLevel = Number(payload.painLevel);

        setSaving(true);
        try {
            let savedEntry;
            if (isEdit) {
                const res = await api.put(`/patients/journals/${entry._id}`, payload);
                savedEntry = res.data.data;
            } else {
                const res = await api.post('/patients/journals', payload);
                savedEntry = res.data.data;
            }
            onSave(savedEntry, isEdit);
        } catch (e) {
            const msg = e?.response?.data?.message || 'Failed to save entry. Please try again.';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-up">

                {/* Header */}
                <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <BookOpen size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                {isEdit ? 'Edit Journal Entry' : 'New Journal Entry'}
                            </h2>
                            <p className="text-xs text-slate-400">Track your personal health record</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-7 py-5 space-y-5">

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                            <AlertCircle size={15} className="shrink-0 text-red-500" />
                            {error}
                        </div>
                    )}

                    {/* Basic Info */}
                    <section>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <ClipboardList size={13} /> Entry Details
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Title */}
                            <div className="col-span-2 space-y-1.5">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="journal-title"
                                    placeholder="e.g. Morning health check, Post-workout notes…"
                                    value={form.title}
                                    onChange={set('title')}
                                    className="input-field"
                                />
                            </div>

                            {/* Entry Date */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Entry Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="journal-entryDate"
                                    type="date"
                                    value={form.entryDate}
                                    max={today()}
                                    onChange={set('entryDate')}
                                    className="input-field"
                                />
                            </div>

                            {/* Visibility */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-slate-700">Visibility</label>
                                <select
                                    id="journal-visibility"
                                    value={form.visibility}
                                    onChange={set('visibility')}
                                    className="input-field appearance-none">
                                    <option value="PRIVATE">🔒 Private</option>
                                    <option value="SHARED">🌐 Shared with Doctor</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Mood & Pain */}
                    <section>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Activity size={13} /> Mood & Pain
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {/* Mood Status */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Mood Status</label>
                                <div className="flex gap-2 flex-wrap">
                                    {MOOD_STATUSES.map(mood => {
                                        const cfg = MOOD_CONFIG[mood];
                                        return (
                                            <button
                                                key={mood}
                                                type="button"
                                                onClick={() => setForm(p => ({ ...p, moodStatus: mood }))}
                                                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${form.moodStatus === mood
                                                    ? cfg.badge + ' shadow-sm scale-105'
                                                    : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                                {cfg.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Pain Level */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Pain Level
                                    {form.painLevel !== '' &&
                                        <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full text-white ${PAIN_COLOR(Number(form.painLevel))}`}>
                                            {form.painLevel}/10 — {PAIN_LABEL(Number(form.painLevel))}
                                        </span>
                                    }
                                </label>
                                <input
                                    id="journal-painLevel"
                                    type="range"
                                    min="1"
                                    max="10"
                                    step="1"
                                    value={form.painLevel === '' ? 1 : form.painLevel}
                                    onChange={(e) => setForm(p => ({ ...p, painLevel: e.target.value }))}
                                    className="w-full accent-blue-600"
                                />
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>1 — No pain</span>
                                    <span className="text-center">5 — Moderate</span>
                                    <span>10 — Unbearable</span>
                                </div>
                                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer mt-1">
                                    <input
                                        type="checkbox"
                                        checked={form.painLevel === ''}
                                        onChange={(e) => setForm(p => ({ ...p, painLevel: e.target.checked ? '' : 5 }))}
                                        className="rounded"
                                    />
                                    No pain today (skip)
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Symptoms & Medications */}
                    <section>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Pill size={13} /> Symptoms & Medications
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-slate-700">Symptoms</label>
                                <textarea
                                    id="journal-symptoms"
                                    rows={3}
                                    placeholder="Describe any symptoms you noticed today…"
                                    value={form.symptoms}
                                    onChange={set('symptoms')}
                                    className="input-field resize-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-slate-700">Medications Taken</label>
                                <textarea
                                    id="journal-medications"
                                    rows={3}
                                    placeholder="List any medications or supplements you took…"
                                    value={form.medications}
                                    onChange={set('medications')}
                                    className="input-field resize-none"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Notes */}
                    <section>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <FileText size={13} /> Additional Notes
                        </h3>
                        <textarea
                            id="journal-notes"
                            rows={4}
                            placeholder="Any other observations, thoughts, or reminders…"
                            value={form.notes}
                            onChange={set('notes')}
                            className="input-field resize-none"
                        />
                    </section>
                </div>

                {/* Footer */}
                <div className="px-7 py-5 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center gap-2">
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Saving…
                            </span>
                        ) : (
                            <><Save size={15} /> {isEdit ? 'Update Entry' : 'Save Entry'}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Journal Card ──────────────────────────────────────────────────────────────
const JournalCard = ({ entry, onEdit, onDelete }) => {
    const [expanded, setExpanded] = useState(false);
    const moodCfg = MOOD_CONFIG[entry.moodStatus] || MOOD_CONFIG.Stable;

    const formattedDate = new Date(entry.entryDate).toLocaleDateString('en-US', {
        day: '2-digit', month: 'short', year: 'numeric',
    });

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden animate-fade-up">
            {/* Card Header */}
            <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
                onClick={() => setExpanded(e => !e)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Mood dot */}
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${moodCfg.badge} border`}>
                        <moodCfg.icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{entry.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Calendar size={11} /> {formattedDate}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${moodCfg.badge}`}>
                                {entry.moodStatus}
                            </span>
                            {entry.painLevel && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${PAIN_COLOR(entry.painLevel)}`}>
                                    Pain {entry.painLevel}/10
                                </span>
                            )}
                            <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                {entry.visibility === 'PRIVATE'
                                    ? <><EyeOff size={10} /> Private</>
                                    : <><Eye size={10} /> Shared</>}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="ml-3 shrink-0">
                    {expanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4">
                    {/* Pain level bar */}
                    {entry.painLevel && (
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pain Level</p>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className={`h-2.5 rounded-full transition-all ${PAIN_COLOR(entry.painLevel)}`}
                                        style={{ width: `${(entry.painLevel / 10) * 100}%` }}
                                    />
                                </div>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full text-white ${PAIN_COLOR(entry.painLevel)}`}>
                                    {entry.painLevel}/10 · {PAIN_LABEL(entry.painLevel)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Symptoms */}
                    {entry.symptoms && (
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Symptoms</p>
                            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 leading-relaxed">
                                {entry.symptoms}
                            </p>
                        </div>
                    )}

                    {/* Medications */}
                    {entry.medications && (
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Medications</p>
                            <p className="text-sm text-slate-600 bg-blue-50/60 rounded-xl px-4 py-3 border border-blue-100 leading-relaxed">
                                {entry.medications}
                            </p>
                        </div>
                    )}

                    {/* Notes */}
                    {entry.notes && (
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Notes</p>
                            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 leading-relaxed">
                                {entry.notes}
                            </p>
                        </div>
                    )}

                    {/* No optional content */}
                    {!entry.symptoms && !entry.medications && !entry.notes && !entry.painLevel && (
                        <p className="text-sm text-slate-400 italic text-center py-2">No additional details recorded.</p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                            onClick={() => onEdit(entry)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors">
                            <Edit3 size={13} /> Edit
                        </button>
                        <button
                            onClick={() => onDelete(entry._id)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors">
                            <Trash2 size={13} /> Delete
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const PatientHealthJournal = () => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);       // null | 'new' | entryObject
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [toast, setToast] = useState(null);

    // Filters
    const [search, setSearch] = useState('');
    const [filterMood, setFilterMood] = useState('ALL');
    const [filterDate, setFilterDate] = useState('');

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const load = async (opts = {}) => {
        if (!opts.silent) setLoading(true);
        try {
            const params = {};
            if (search.trim()) params.search = search.trim();
            if (filterMood !== 'ALL') params.moodStatus = filterMood;
            if (filterDate) params.entryDate = filterDate;

            const { data } = await api.get('/patients/journals', { params });
            setEntries(data.data || []);
        } catch (e) {
            console.error(e);
            showToast('Failed to load journal entries.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Initial load on mount
    useEffect(() => { load(); }, []);  // eslint-disable-line

    // Instant reload when mood/date filter changes
    useEffect(() => {
        if (!loading) load({ silent: true });
    }, [filterMood, filterDate]); // eslint-disable-line

    // Debounced reload for search input (200ms)
    useEffect(() => {
        const delay = setTimeout(() => load({ silent: true }), 200);
        return () => clearTimeout(delay);
    }, [search]); // eslint-disable-line

    // Optimistic update: instantly update state, no full reload
    const handleSave = (savedEntry, isEdit) => {
        setModal(null);
        if (isEdit) {
            // Replace the updated entry in-place
            setEntries(prev => prev.map(e => e._id === savedEntry._id ? savedEntry : e));
            showToast('Journal entry updated!');
        } else {
            // Prepend new entry to top of list
            setEntries(prev => [savedEntry, ...prev]);
            showToast('Journal entry created!');
        }
    };

    const handleDelete = (id) => setDeleteTarget(id);

    const confirmDelete = async () => {
        const id = deleteTarget;
        setDeleteTarget(null);
        try {
            await api.delete(`/patients/journals/${id}`);
            setEntries(prev => prev.filter(e => e._id !== id));
            showToast('Journal entry deleted.');
        } catch {
            showToast('Failed to delete entry.', 'error');
        }
    };

    const clearFilters = () => {
        setSearch('');
        setFilterMood('ALL');
        setFilterDate('');
    };

    const hasFilters = search || filterMood !== 'ALL' || filterDate;

    // Stats
    const stats = {
        total: entries.length,
        improving: entries.filter(e => e.moodStatus === 'Improving').length,
        stable: entries.filter(e => e.moodStatus === 'Stable').length,
        worsening: entries.filter(e => e.moodStatus === 'Worsening').length,
    };

    return (
        <div className="space-y-6">
            <Toast toast={toast} />

            {/* Modals */}
            {modal && (
                <JournalModal
                    entry={modal === 'new' ? null : modal}
                    onClose={() => setModal(null)}
                    onSave={handleSave}
                />
            )}
            {deleteTarget && (
                <DeleteModal onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                        <BookOpen size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Health Journal</h1>
                        <p className="text-sm text-slate-400">Track your daily health, mood & symptoms</p>
                    </div>
                </div>
                <button
                    id="new-journal-btn"
                    onClick={() => setModal('new')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all">
                    <Plus size={16} /> New Entry
                </button>
            </div>

            {/* Stats Row */}
            {!loading && entries.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total Entries', value: stats.total, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                        { label: 'Improving', value: stats.improving, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                        { label: 'Stable', value: stats.stable, color: 'bg-amber-50 text-amber-700 border-amber-200' },
                        { label: 'Worsening', value: stats.worsening, color: 'bg-red-50 text-red-700 border-red-200' },
                    ].map(s => (
                        <div key={s.label} className={`p-3 rounded-xl border text-center ${s.color}`}>
                            <p className="text-2xl font-bold">{s.value}</p>
                            <p className="text-xs font-semibold mt-0.5 opacity-80">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Search & Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            id="journal-search"
                            placeholder="Search by title…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="input-field !pl-10"
                        />
                    </div>

                    {/* Date filter */}
                    <div className="relative">
                        <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            id="journal-date-filter"
                            type="date"
                            value={filterDate}
                            max={today()}
                            onChange={e => setFilterDate(e.target.value)}
                            className="input-field !pl-10"
                        />
                    </div>
                </div>

                {/* Mood filter buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-400 mr-1">Mood:</span>
                    {['ALL', ...MOOD_STATUSES].map(m => (
                        <button
                            key={m}
                            onClick={() => setFilterMood(m)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${filterMood === m
                                ? m === 'ALL'
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : MOOD_CONFIG[m].badge + ' shadow-sm'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                            {m === 'ALL' ? 'All Moods' : MOOD_CONFIG[m].label}
                        </button>
                    ))}

                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="ml-auto flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={12} /> Clear filters
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 flex gap-4 animate-pulse">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 shrink-0" />
                            <div className="flex-1 space-y-2 pt-1">
                                <div className="h-3.5 bg-slate-100 rounded w-1/3" />
                                <div className="h-3 bg-slate-100 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : entries.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                        <BookOpen size={26} className="text-blue-400" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base mb-2">
                        {hasFilters ? 'No entries match your filters' : 'No journal entries yet'}
                    </h3>
                    <p className="text-sm text-slate-400 mb-5 max-w-xs mx-auto">
                        {hasFilters
                            ? 'Try adjusting your search or filters to find entries.'
                            : 'Start tracking your health journey. Create your first entry to record symptoms, mood, and medications.'}
                    </p>
                    {!hasFilters && (
                        <button
                            onClick={() => setModal('new')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                            <Plus size={15} /> Create First Entry
                        </button>
                    )}
                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
                            <X size={15} /> Clear Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-xs text-slate-400 font-medium px-1">
                        Showing {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                    </p>
                    {entries.map(e => (
                        <JournalCard
                            key={e._id}
                            entry={e}
                            onEdit={setModal}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PatientHealthJournal;
