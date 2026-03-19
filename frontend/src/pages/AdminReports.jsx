import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { generateStandardPDF, generateAdvancedPDF } from '../utils/reportPdf';
import {
    FileText, Download, Save, RefreshCw, Calendar, CreditCard,
    Users, CheckCircle, XCircle, Clock, BarChart3, Trash2,
    Eye, TrendingUp, Activity, AlertCircle, Stethoscope,
    ArrowRight, X, Star, Zap, ChevronDown, Pencil,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtLKR = n => `LKR ${(n || 0).toLocaleString()}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── Mini UI atoms ────────────────────────────────────────────────────────────
const Bar = ({ value, max, color = '#3b82f6' }) => (
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${max > 0 ? Math.min(100, value / max * 100) : 0}%`, background: color }} />
    </div>
);

const MiniStat = ({ label, value, bg = 'bg-blue-50', tc = 'text-blue-700', icon }) => (
    <div className={`${bg} rounded-xl p-3`}>
        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">{icon} {label}</p>
        <p className={`text-xl font-bold ${tc}`}>{value}</p>
    </div>
);

const SectionCheck = ({ id, label, desc, checked, onChange, color = 'blue' }) => {
    const ring = { blue: 'border-blue-500 bg-blue-50', violet: 'border-violet-500 bg-violet-50', emerald: 'border-emerald-500 bg-emerald-50', amber: 'border-amber-500 bg-amber-50', red: 'border-red-500 bg-red-50', indigo: 'border-indigo-500 bg-indigo-50' };
    return (
        <label htmlFor={id} className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${checked ? ring[color] || ring.blue : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            <div className={`mt-0.5 h-4 w-4 rounded flex items-center justify-center border-2 shrink-0 transition-colors ${checked ? `bg-${color}-600 border-${color}-600` : 'border-slate-300'}`}>
                {checked && <CheckCircle size={10} className="text-white" />}
            </div>
            <input id={id} type="checkbox" className="hidden" checked={checked} onChange={onChange} />
            <div>
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </div>
        </label>
    );
};

const Preset = ({ label, onClick }) => (
    <button onClick={onClick} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all">{label}</button>
);

// ─── View Report Modal ────────────────────────────────────────────────────────
const ViewReportModal = ({ report, onClose }) => {
    if (!report) return null;
    const d = report.data;
    const METHOD_META = { PAYHERE: { label: 'PayHere', color: '#f97316' }, BANK_TRANSFER: { label: 'Bank Transfer', color: '#3b82f6' }, PAYPAL: { label: 'PayPal', color: '#0ea5e9' } };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">{report.type === 'advanced' ? 'Advanced' : 'Standard'} Report</p>
                            <h2 className="text-xl font-bold">{report.name}</h2>
                            <p className="text-blue-200 text-sm mt-1">{report.dateFrom} → {report.dateTo} · Saved {fmtDate(report.savedAt)}</p>
                        </div>
                        <button onClick={onClose} className="h-9 w-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center"><X size={16} /></button>
                    </div>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                    {/* Appointment Summary */}
                    {d?.appointments && (
                        <div>
                            <h3 className="text-sm font-bold text-slate-700 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2"><Calendar size={14} className="text-blue-500" /> Appointment Summary</h3>
                            <div className="grid grid-cols-5 gap-3">
                                <MiniStat label="Total" value={d.appointments.total} bg="bg-blue-50" tc="text-blue-700" icon="📋" />
                                <MiniStat label="Completed" value={d.appointments.completed} bg="bg-emerald-50" tc="text-emerald-700" icon="✅" />
                                <MiniStat label="Accepted" value={d.appointments.accepted} bg="bg-indigo-50" tc="text-indigo-700" icon="🗓️" />
                                <MiniStat label="Pending" value={d.appointments.pending} bg="bg-amber-50" tc="text-amber-700" icon="⏳" />
                                <MiniStat label="Cancelled" value={d.appointments.cancelled} bg="bg-red-50" tc="text-red-600" icon="❌" />
                            </div>
                        </div>
                    )}
                    {/* Doctor Performance (advanced) */}
                    {d?.doctorPerformance?.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-slate-700 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2"><Stethoscope size={14} className="text-violet-500" /> Doctor Performance</h3>
                            <div className="card overflow-hidden">
                                <table className="w-full text-left">
                                    <thead><tr className="bg-slate-50 border-b border-slate-100">{['Doctor', 'Specialization', 'Total', 'Completed%', 'Cancelled%'].map(h => <th key={h} className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase">{h}</th>)}</tr></thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {d.doctorPerformance.map(doc => (
                                            <tr key={doc._id} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3 text-sm font-semibold text-slate-800">Dr. {doc.name}</td>
                                                <td className="px-4 py-3 text-xs text-slate-500">{doc.specialization}</td>
                                                <td className="px-4 py-3 text-sm font-bold text-slate-700">{doc.total}</td>
                                                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">{doc.completionRate}%</span></td>
                                                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-bold">{doc.cancellationRate}%</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {/* Doctor Revenue (standard) */}
                    {d?.doctorRevenue?.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-slate-700 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2"><Stethoscope size={14} className="text-violet-500" /> Doctor Revenue</h3>
                            <div className="card overflow-hidden">
                                <table className="w-full text-left">
                                    <thead><tr className="bg-slate-50 border-b border-slate-100">{['Doctor', 'Specialization', 'Appointments', 'Revenue', 'Avg/Visit'].map(h => <th key={h} className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase">{h}</th>)}</tr></thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {d.doctorRevenue.map(doc => (
                                            <tr key={doc._id} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3 text-sm font-semibold text-slate-800">Dr. {doc.firstName} {doc.lastName}</td>
                                                <td className="px-4 py-3 text-xs text-slate-500">{doc.specialization}</td>
                                                <td className="px-4 py-3 text-sm font-bold text-slate-700">{doc.appointments}</td>
                                                <td className="px-4 py-3 text-sm font-bold text-emerald-600">{fmtLKR(doc.revenue)}</td>
                                                <td className="px-4 py-3 text-xs text-slate-500">{doc.appointments > 0 ? fmtLKR(Math.round(doc.revenue / doc.appointments)) : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {/* Cancellation (advanced) */}
                    {d?.cancellation && (
                        <div>
                            <h3 className="text-sm font-bold text-slate-700 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2"><XCircle size={14} className="text-red-500" /> Cancellation Analysis</h3>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <MiniStat label="Total Cancelled" value={d.cancellation.total} bg="bg-red-50" tc="text-red-600" icon="❌" />
                                <MiniStat label="Cancellation Rate" value={`${d.cancellation.rate}%`} bg="bg-amber-50" tc="text-amber-700" icon="📉" />
                            </div>
                        </div>
                    )}
                    {/* Financial */}
                    {d?.financial && (
                        <div>
                            <h3 className="text-sm font-bold text-slate-700 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2"><CreditCard size={14} className="text-emerald-500" /> Financial Summary</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <MiniStat label="Total Revenue" value={fmtLKR(d.financial.total)} bg="bg-emerald-50" tc="text-emerald-700" icon="💰" />
                                <MiniStat label="Avg Transaction" value={fmtLKR(Math.round(d.financial.avg))} bg="bg-blue-50" tc="text-blue-700" icon="💳" />
                                <MiniStat label="Success Rate" value={`${d.financial.successRate}%`} bg="bg-indigo-50" tc="text-indigo-700" icon="✅" />
                            </div>
                        </div>
                    )}
                    {/* Payment Details (standard) */}
                    {d?.payments && (
                        <div>
                            <h3 className="text-sm font-bold text-slate-700 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2"><CreditCard size={14} className="text-amber-500" /> Payment Details</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <MiniStat label="Total Revenue" value={fmtLKR(d.payments.totalRevenue)} bg="bg-emerald-50" tc="text-emerald-700" icon="💰" />
                                <MiniStat label="Success Rate" value={`${d.payments.successRate}%`} bg="bg-blue-50" tc="text-blue-700" icon="✅" />
                                <MiniStat label="Refunds" value={d.payments.refunds} bg="bg-red-50" tc="text-red-600" icon="↩️" />
                            </div>
                            {d.payments.byMethod?.length > 0 && (
                                <div className="card p-4 mt-3 space-y-2">
                                    {d.payments.byMethod.map(m => {
                                        const meta = METHOD_META[m._id] || { label: m._id, color: '#94a3b8' };
                                        return (
                                            <div key={m._id} className="flex items-center gap-3">
                                                <span className="text-xs font-semibold text-slate-700 w-28">{meta.label}</span>
                                                <div className="flex-1"><Bar value={m.amount} max={d.payments.totalRevenue} color={meta.color} /></div>
                                                <span className="text-xs font-bold text-slate-700 w-24 text-right">{fmtLKR(m.amount)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                    {/* Peak Hours (advanced) */}
                    {d?.peakHours?.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-slate-700 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2"><Zap size={14} className="text-indigo-500" /> Peak Hours</h3>
                            <div className="card p-4 space-y-2">
                                {d.peakHours.map(h => (
                                    <div key={h.hour} className="flex items-center gap-3">
                                        <span className="text-xs font-semibold text-slate-700 w-12">{h.displayLabel || h.label}</span>
                                        <div className="flex-1"><Bar value={h.count} max={Math.max(...d.peakHours.map(x => x.count))} color="#6366f1" /></div>
                                        <span className="text-xs font-bold text-slate-700 w-8 text-right">{h.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── STANDARD REPORT TAB ─────────────────────────────────────────────────────
const StandardTab = ({ savedReports, setSavedReports, showToast, setViewReport, setTab, editConfig }) => {
    const [dateFrom, setDateFrom] = useState(editConfig?.dateFrom || '');
    const [dateTo, setDateTo] = useState(editConfig?.dateTo || '');
    const [reportName, setReportName] = useState(editConfig?.name || '');
    const SECTIONS = { appointmentSummary: true, doctorRevenue: true, paymentDetails: true };
    const [previewData, setPreviewData] = useState(editConfig?.data || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const applyPreset = (preset) => {
        const now = new Date(); let from = new Date(), to = new Date();
        if (preset === 'last7') from.setDate(now.getDate() - 7);
        else if (preset === 'last30') from.setDate(now.getDate() - 30);
        else if (preset === 'thisMonth') from = new Date(now.getFullYear(), now.getMonth(), 1);
        else if (preset === 'lastMonth') { from = new Date(now.getFullYear(), now.getMonth() - 1, 1); to = new Date(now.getFullYear(), now.getMonth(), 0); }
        setDateFrom(from.toISOString().split('T')[0]);
        setDateTo(to.toISOString().split('T')[0]);
        setPreviewData(null);
    };

    const fetchPreview = useCallback(async () => {
        if (!dateFrom || !dateTo) { setError('Select a date range first'); return; }
        setLoading(true); setError('');
        try {
            const { data } = await api.get('/admin/report-data', { params: { dateFrom, dateTo } });
            setPreviewData(data);
        } catch (e) { setError(e.response?.data?.message || 'Failed to load'); }
        finally { setLoading(false); }
    }, [dateFrom, dateTo]);

    useEffect(() => {
        if (!dateFrom || !dateTo) return;
        const t = setTimeout(fetchPreview, 700);
        return () => clearTimeout(t);
    }, [dateFrom, dateTo, fetchPreview]);

    const handleSave = async () => {
        if (!dateFrom || !dateTo || !reportName.trim() || !previewData) { showToast('Fill name, date range and generate preview first', 'error'); return; }

        const payload = {
            name: reportName.trim(), type: 'standard', dateFrom, dateTo,
            sections: SECTIONS, data: previewData,
        };
        try {
            if (editConfig && editConfig._id) {
                const { data } = await api.put(`/admin/saved-reports/${editConfig._id}`, payload);
                setSavedReports(prev => prev.map(x => x._id === data._id ? data : x));
                showToast('Report updated!');
            } else {
                const { data } = await api.post('/admin/saved-reports', payload);
                setSavedReports(prev => [data, ...prev]);
                showToast('Report saved!');
                setReportName('');
            }
        } catch (e) {
            showToast(e.response?.data?.message || 'Failed to preserve report', 'error');
        }
    };

    const handlePDF = () => {
        if (!previewData) { showToast('Generate preview first', 'error'); return; }
        generateStandardPDF({ reportName, dateFrom, dateTo, data: previewData });
        showToast('PDF downloaded!');
    };

    const METHOD_META = { PAYHERE: { label: 'PayHere', color: '#f97316' }, BANK_TRANSFER: { label: 'Bank Transfer', color: '#3b82f6' }, PAYPAL: { label: 'PayPal', color: '#0ea5e9' } };

    return (
        <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2 space-y-5">
                {editConfig && (
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                        <Pencil size={14} className="text-amber-600 shrink-0" />
                        <span className="font-semibold text-amber-800">Editing:</span>
                        <span className="text-amber-700">{editConfig.name}</span>
                        <span className="text-amber-500 text-xs ml-auto">Save to update the saved report</span>
                    </div>
                )}
                <div className="card p-5">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Report Name *</label>
                    <input className="input-field w-full text-sm" placeholder="e.g. Monthly Revenue Report – February 2026" value={reportName} onChange={e => setReportName(e.target.value)} />
                </div>
                <div className="card p-5 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Calendar size={15} className="text-blue-500" /> Date Range</h3>
                    <div className="flex flex-wrap gap-2">
                        {[['last7', 'Last 7 Days'], ['last30', 'Last 30 Days'], ['thisMonth', 'This Month'], ['lastMonth', 'Last Month']].map(([k, l]) => <Preset key={k} label={l} onClick={() => applyPreset(k)} />)}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">From</label><input type="date" className="input-field w-full text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
                        <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">To</label><input type="date" className="input-field w-full text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
                    </div>
                </div>
                <div className="card p-4 border border-blue-100 bg-blue-50/50">
                    <p className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1.5"><FileText size={12} /> Fixed Sections — All Included</p>
                    <div className="flex gap-2 flex-wrap">
                        {['📅 Appointment Summary', '🩺 Doctor Revenue', '💳 Payment Details'].map(s => (
                            <span key={s} className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">{s}</span>
                        ))}
                    </div>
                </div>
                <div className="card p-5">
                    <div className="flex flex-wrap gap-3">
                        <button onClick={fetchPreview} disabled={loading || !dateFrom || !dateTo} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Preview</button>
                        <button onClick={handleSave} disabled={!previewData || !reportName.trim()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 shadow-sm shadow-blue-500/20 transition-all"><Save size={14} /> {editConfig ? 'Update Report' : 'Save Report'}</button>
                        <button onClick={handlePDF} disabled={!previewData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-semibold hover:from-red-600 hover:to-orange-600 disabled:opacity-50 shadow-sm transition-all"><Download size={14} /> Export PDF</button>
                    </div>
                </div>
            </div>
            {/* Live Preview Pane */}
            <div className="sticky top-6">
                <div className="card border-2 border-blue-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-300 animate-pulse" />
                        <p className="text-sm font-bold text-white">Live Preview</p>
                        {loading && <RefreshCw size={12} className="text-blue-200 animate-spin ml-auto" />}
                    </div>
                    <div className="p-4 space-y-4">
                        {!dateFrom || !dateTo ? (
                            <div className="text-center py-10"><Calendar size={36} className="mx-auto text-slate-300 mb-3" /><p className="text-sm text-slate-400">Select a date range</p></div>
                        ) : error ? (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700"><AlertCircle size={13} className="shrink-0" /> {error}</div>
                        ) : loading ? (
                            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}</div>
                        ) : previewData ? (
                            <>
                                <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
                                    <p className="font-bold text-slate-700 mb-1.5">Standard Report</p>
                                    <p><span className="text-slate-400">Period:</span> <span className="font-semibold text-slate-700">{dateFrom} → {dateTo}</span></p>
                                    <p><span className="text-slate-400">Sections:</span> <span className="font-semibold text-slate-700">3 (all)</span></p>
                                </div>
                                {previewData.appointments && (
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">📅 Appointments</p>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <MiniStat label="Total" value={previewData.appointments.total} bg="bg-blue-50" tc="text-blue-700" />
                                            <MiniStat label="Completed" value={previewData.appointments.completed} bg="bg-emerald-50" tc="text-emerald-700" />
                                            <MiniStat label="Pending" value={previewData.appointments.pending} bg="bg-amber-50" tc="text-amber-700" />
                                            <MiniStat label="Cancelled" value={previewData.appointments.cancelled} bg="bg-red-50" tc="text-red-600" />
                                        </div>
                                    </div>
                                )}
                                {previewData.doctorRevenue?.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">🩺 Top Doctors</p>
                                        <div className="space-y-1.5">
                                            {previewData.doctorRevenue.slice(0, 3).map(doc => (
                                                <div key={doc._id} className="flex justify-between items-center bg-violet-50 rounded-lg px-2.5 py-1.5">
                                                    <p className="text-[11px] font-semibold text-slate-700 truncate">Dr. {doc.firstName}</p>
                                                    <p className="text-[11px] font-bold text-violet-700 shrink-0">{fmtLKR(doc.revenue)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {previewData.payments && (
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">💳 Payments</p>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between bg-emerald-50 rounded-lg px-2.5 py-1.5">
                                                <span className="text-[11px] text-slate-600">Total Revenue</span>
                                                <span className="text-[11px] font-bold text-emerald-700">{fmtLKR(previewData.payments.totalRevenue)}</span>
                                            </div>
                                            <div className="flex justify-between bg-blue-50 rounded-lg px-2.5 py-1.5">
                                                <span className="text-[11px] text-slate-600">Success Rate</span>
                                                <span className="text-[11px] font-bold text-blue-700">{previewData.payments.successRate}%</span>
                                            </div>
                                            {previewData.payments.byMethod?.map(m => {
                                                const meta = METHOD_META[m._id] || { label: m._id, color: '#94a3b8' };
                                                return (
                                                    <div key={m._id} className="flex justify-between bg-slate-50 rounded-lg px-2.5 py-1.5">
                                                        <span className="text-[11px] text-slate-600">{meta.label}</span>
                                                        <span className="text-[11px] font-bold text-slate-700">{fmtLKR(m.amount)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── ADVANCED REPORT TAB ─────────────────────────────────────────────────────
const AdvancedTab = ({ savedReports, setSavedReports, showToast, editConfig }) => {
    const [dateFrom, setDateFrom] = useState(editConfig?.dateFrom || '');
    const [dateTo, setDateTo] = useState(editConfig?.dateTo || '');
    const [reportName, setReportName] = useState(editConfig?.name || '');
    const [selectedDoctors, setSelectedDoctors] = useState([]);
    const [doctorDropOpen, setDoctorDropOpen] = useState(false);
    const [advSections, setAdvSections] = useState(
        editConfig?.advSections || { appointmentSummary: true, doctorPerformance: true, cancellationAnalysis: true, financialSummary: true, peakHours: true }
    );
    const [data, setData] = useState(editConfig?.data || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [allDoctors, setAllDoctors] = useState(editConfig?.data?.allDoctors || []);

    const applyPreset = (preset) => {
        const now = new Date(); let from = new Date(), to = new Date();
        if (preset === 'last7') from.setDate(now.getDate() - 7);
        else if (preset === 'last30') from.setDate(now.getDate() - 30);
        else if (preset === 'thisMonth') from = new Date(now.getFullYear(), now.getMonth(), 1);
        else if (preset === 'lastMonth') { from = new Date(now.getFullYear(), now.getMonth() - 1, 1); to = new Date(now.getFullYear(), now.getMonth(), 0); }
        setDateFrom(from.toISOString().split('T')[0]);
        setDateTo(to.toISOString().split('T')[0]);
        setData(null);
    };

    const fetchData = useCallback(async () => {
        if (!dateFrom || !dateTo) { setError('Select a date range first'); return; }
        setLoading(true); setError('');
        try {
            const params = { dateFrom, dateTo };
            if (selectedDoctors.length) params.doctorIds = selectedDoctors.join(',');
            const { data: d } = await api.get('/admin/advanced-report-data', { params });
            setData(d);
            if (d.allDoctors?.length) setAllDoctors(d.allDoctors);
        } catch (e) { setError(e.response?.data?.message || 'Failed to load'); }
        finally { setLoading(false); }
    }, [dateFrom, dateTo, selectedDoctors]);

    useEffect(() => {
        if (!dateFrom || !dateTo) return;
        const t = setTimeout(fetchData, 700);
        return () => clearTimeout(t);
    }, [dateFrom, dateTo, fetchData]);

    const handleSave = async () => {
        if (!dateFrom || !dateTo || !reportName.trim() || !data) { showToast('Fill name, dates and generate first', 'error'); return; }

        const payload = {
            name: reportName.trim(), type: 'advanced', dateFrom, dateTo,
            advSections, data,
        };

        try {
            if (editConfig && editConfig._id) {
                const { data: updated } = await api.put(`/admin/saved-reports/${editConfig._id}`, payload);
                setSavedReports(prev => prev.map(x => x._id === updated._id ? updated : x));
                showToast('Report updated!');
            } else {
                const { data: created } = await api.post('/admin/saved-reports', payload);
                setSavedReports(prev => [created, ...prev]);
                showToast('Advanced report saved!');
                setReportName('');
            }
        } catch (e) {
            showToast(e.response?.data?.message || 'Failed to preserve report', 'error');
        }
    };

    const handlePDF = () => {
        if (!data) { showToast('Generate data first', 'error'); return; }
        generateAdvancedPDF({ reportName, dateFrom, dateTo, advSections, data });
        showToast('PDF downloaded!');
    };

    const toggleDoc = id => setSelectedDoctors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const activeSections = Object.values(advSections).filter(Boolean).length;

    const ADVSECTIONS = [
        { key: 'appointmentSummary', label: 'Appointment Summary', desc: 'Status breakdown & top specializations', color: 'blue' },
        { key: 'doctorPerformance', label: 'Doctor Performance', desc: 'Completion rate, cancellation rate per doctor', color: 'violet' },
        { key: 'cancellationAnalysis', label: 'Cancellation Analysis', desc: 'Cancel rate, by day & by doctor', color: 'red' },
        { key: 'financialSummary', label: 'Financial Summary', desc: 'Revenue, avg transaction, daily trend', color: 'emerald' },
        { key: 'peakHours', label: 'Peak Hours', desc: 'Busiest appointment time slots', color: 'indigo' },
    ];

    return (
        <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2 space-y-5">
                {editConfig && (
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                        <Pencil size={14} className="text-amber-600 shrink-0" />
                        <span className="font-semibold text-amber-800">Editing:</span>
                        <span className="text-amber-700">{editConfig.name}</span>
                        <span className="text-amber-500 text-xs ml-auto">Save to update</span>
                    </div>
                )}
                {/* Report info */}
                <div className="card p-5 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center"><Zap size={13} className="text-white" /></div>
                        <h3 className="text-sm font-bold text-slate-800">Advanced Report Configuration</h3>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Report Name *</label>
                        <input className="input-field w-full text-sm" placeholder="e.g. Doctor Performance Q1 2026" value={reportName} onChange={e => setReportName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Date Range</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {[['last7', 'Last 7d'], ['last30', 'Last 30d'], ['thisMonth', 'This Month'], ['lastMonth', 'Last Month']].map(([k, l]) => <Preset key={k} label={l} onClick={() => applyPreset(k)} />)}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">From</label><input type="date" className="input-field w-full text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
                            <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">To</label><input type="date" className="input-field w-full text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
                        </div>
                    </div>
                </div>

                {/* Doctor filter */}
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Users size={15} className="text-blue-500" /> Doctor Filter <span className="text-xs text-slate-400 font-normal">(optional — leave empty for all)</span></h3>
                        {selectedDoctors.length > 0 && <button onClick={() => setSelectedDoctors([])} className="text-xs text-red-500 hover:text-red-600 font-semibold">Clear all</button>}
                    </div>
                    <div className="relative">
                        <button onClick={() => setDoctorDropOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 hover:border-blue-400 transition-colors">
                            <span>{selectedDoctors.length > 0 ? `${selectedDoctors.length} doctor(s) selected` : 'All doctors'}</span>
                            <ChevronDown size={14} className={`transition-transform ${doctorDropOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {doctorDropOpen && allDoctors.length > 0 && (
                            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                                {allDoctors.map(doc => (
                                    <label key={doc._id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                                        <input type="checkbox" checked={selectedDoctors.includes(doc._id)} onChange={() => toggleDoc(doc._id)} className="rounded" />
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">Dr. {doc.firstName} {doc.lastName}</p>
                                            <p className="text-xs text-slate-400">{doc.specialization}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                        {doctorDropOpen && allDoctors.length === 0 && (
                            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-center text-sm text-slate-400">Generate data first to load doctors</div>
                        )}
                    </div>
                </div>

                {/* Sections */}
                <div className="card p-5 space-y-3">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><FileText size={15} className="text-violet-500" /> Report Sections <span className="ml-auto text-xs text-slate-400">{activeSections}/5</span></h3>
                    <div className="grid grid-cols-2 gap-3">
                        {ADVSECTIONS.map(s => (
                            <SectionCheck key={s.key} id={`ad-${s.key}`} label={s.label} desc={s.desc} checked={advSections[s.key]} onChange={() => setAdvSections(p => ({ ...p, [s.key]: !p[s.key] }))} color={s.color} />
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="card p-5">
                    <div className="flex flex-wrap gap-3">
                        <button onClick={fetchData} disabled={loading || !dateFrom || !dateTo} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Generate Data</button>
                        <button onClick={handleSave} disabled={!data || !reportName.trim()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 shadow-sm transition-all"><Save size={14} /> {editConfig ? 'Update Report' : 'Save Report'}</button>
                        <button onClick={handlePDF} disabled={!data} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-semibold hover:from-red-600 hover:to-orange-600 disabled:opacity-50 transition-all shadow-sm"><Download size={14} /> Export PDF</button>
                    </div>
                </div>
            </div>

            {/* Advanced Preview Pane */}
            <div className="sticky top-6">
                <div className="card border-2 border-violet-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 flex items-center gap-2">
                        <Zap size={12} className="text-violet-300" />
                        <p className="text-sm font-bold text-white">Advanced Preview</p>
                        {loading && <RefreshCw size={12} className="text-violet-200 animate-spin ml-auto" />}
                    </div>
                    <div className="p-4 space-y-3">
                        {!dateFrom || !dateTo ? (
                            <div className="text-center py-10"><Zap size={36} className="mx-auto text-slate-300 mb-3" /><p className="text-sm text-slate-400">Select date range to begin</p></div>
                        ) : error ? (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700"><AlertCircle size={13} className="shrink-0" /> {error}</div>
                        ) : loading ? (
                            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}</div>
                        ) : data ? (
                            <>
                                <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
                                    <p className="font-bold text-slate-700 mb-1">{dateFrom} → {dateTo}</p>
                                    <p className="text-slate-500">{activeSections} sections · {selectedDoctors.length || 'All'} doctors</p>
                                </div>
                                {advSections.appointmentSummary && data.appointments && (
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <MiniStat label="Total" value={data.appointments.total} bg="bg-blue-50" tc="text-blue-700" />
                                        <MiniStat label="Completed" value={data.appointments.completed} bg="bg-emerald-50" tc="text-emerald-700" />
                                        <MiniStat label="Pending" value={data.appointments.pending} bg="bg-amber-50" tc="text-amber-700" />
                                        <MiniStat label="Cancelled" value={data.appointments.cancelled} bg="bg-red-50" tc="text-red-600" />
                                    </div>
                                )}
                                {advSections.doctorPerformance && data.doctorPerformance?.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">🩺 Top Doctors</p>
                                        <div className="space-y-1.5">
                                            {data.doctorPerformance.slice(0, 3).map(d => (
                                                <div key={d._id} className="flex justify-between bg-violet-50 rounded-lg px-2.5 py-1.5">
                                                    <p className="text-[11px] font-semibold text-slate-700 truncate">Dr. {d.name}</p>
                                                    <p className="text-[11px] font-bold text-violet-700">{d.completionRate}%</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {advSections.cancellationAnalysis && data.cancellation && (
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <MiniStat label="Cancelled" value={data.cancellation.total} bg="bg-red-50" tc="text-red-600" />
                                        <MiniStat label="Cancel Rate" value={`${data.cancellation.rate}%`} bg="bg-amber-50" tc="text-amber-700" />
                                    </div>
                                )}
                                {advSections.financialSummary && data.financial && (
                                    <div className="bg-emerald-50 rounded-lg px-3 py-2 flex justify-between">
                                        <span className="text-[11px] text-slate-600">Revenue</span>
                                        <span className="text-[11px] font-bold text-emerald-700">{fmtLKR(data.financial.total)}</span>
                                    </div>
                                )}
                                {advSections.peakHours && data.peakHours?.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">⚡ Peak Hours</p>
                                        {data.peakHours.slice(0, 4).map(h => (
                                            <div key={h.hour} className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-semibold text-slate-600 w-10">{h.displayLabel}</span>
                                                <Bar value={h.count} max={Math.max(...data.peakHours.map(x => x.count))} color="#6366f1" />
                                                <span className="text-[10px] font-bold text-slate-700 w-5 text-right">{h.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── HISTORY TAB ─────────────────────────────────────────────────────────────
const HistoryTab = ({ savedReports, setSavedReports, showToast, setViewReport, switchTab, onEdit }) => {
    const [deleteId, setDeleteId] = useState(null);

    const handleDelete = async (id) => {
        try {
            await api.delete(`/admin/saved-reports/${id}`);
            setSavedReports(prev => prev.filter(r => r._id !== id));
            showToast('Report deleted');
        } catch (e) {
            showToast('Failed to delete report', 'error');
        } finally {
            setDeleteId(null);
        }
    };

    const handleDownloadAgain = (r) => {
        if (r.type === 'advanced') {
            generateAdvancedPDF({ reportName: r.name, dateFrom: r.dateFrom, dateTo: r.dateTo, advSections: r.advSections || r.sections || {}, data: r.data });
        } else {
            generateStandardPDF({ reportName: r.name, dateFrom: r.dateFrom, dateTo: r.dateTo, sections: r.sections || {}, data: r.data });
        }
        showToast('PDF re-downloaded!');
    };

    if (savedReports.length === 0) return (
        <div className="card p-16 text-center">
            <BarChart3 size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="font-bold text-slate-700">No saved reports</p>
            <p className="text-sm text-slate-400 mt-1">Create a Standard or Advanced report and save it</p>
            <div className="flex justify-center gap-3 mt-5">
                <button onClick={() => switchTab('standard')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"><FileText size={14} /> Standard <ArrowRight size={13} /></button>
                <button onClick={() => switchTab('advanced')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700"><Zap size={14} /> Advanced <ArrowRight size={13} /></button>
            </div>
        </div>
    );

    return (
        <>
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)' }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4"><Trash2 size={20} className="text-red-500" /></div>
                        <h3 className="text-base font-bold text-center text-slate-900">Delete Report?</h3>
                        <p className="text-sm text-center text-slate-500 mt-1 mb-5">This cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                            <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-800">Saved Reports</p>
                    <span className="text-xs text-slate-400">{savedReports.length} total</span>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60">
                            {['Report Name', 'Type', 'Period', 'Saved On', 'Actions'].map(h => (
                                <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {savedReports.map(r => (
                            <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${r.type === 'advanced' ? 'bg-gradient-to-br from-violet-600 to-indigo-500' : 'bg-gradient-to-br from-blue-600 to-blue-500'}`}>
                                            {r.type === 'advanced' ? <Zap size={14} className="text-white" /> : <FileText size={14} className="text-white" />}
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800">{r.name}</p>
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.type === 'advanced' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>{r.type === 'advanced' ? 'Advanced' : 'Standard'}</span>
                                </td>
                                <td className="px-5 py-4">
                                    <p className="text-xs text-slate-700 font-medium">{r.dateFrom}</p>
                                    <p className="text-[10px] text-slate-400">to {r.dateTo}</p>
                                </td>
                                <td className="px-5 py-4"><span className="text-xs text-slate-400">{fmtDate(r.savedAt)}</span></td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-1.5">
                                        <button onClick={() => setViewReport(r)} className="h-7 w-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600" title="View"><Eye size={13} /></button>
                                        <button onClick={() => onEdit(r)} className="h-7 w-7 rounded-lg bg-amber-50 hover:bg-amber-100 flex items-center justify-center text-amber-600" title="Edit"><Pencil size={13} /></button>
                                        <button onClick={() => handleDownloadAgain(r)} className="h-7 w-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500" title="Re-download PDF"><Download size={13} /></button>
                                        <button onClick={() => setDeleteId(r._id)} className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500" title="Delete"><Trash2 size={13} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const AdminReports = () => {
    const [tab, setTab] = useState('standard');
    const [savedReports, setSavedReports] = useState([]);
    const [viewReport, setViewReport] = useState(null);
    const [toast, setToast] = useState(null);
    const [editConfig, setEditConfig] = useState(null);

    // Fetch saved reports from database on mount
    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await api.get('/admin/saved-reports');
                setSavedReports(data);
            } catch (e) { console.error('Failed to load saved reports'); }
        };
        load();
    }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
    };

    const handleEdit = (report) => {
        setEditConfig(report);
        setTab(report.type === 'advanced' ? 'advanced' : 'standard');
    };

    const TABS = [
        { key: 'standard', label: 'Standard Report', icon: FileText, desc: 'Appointments, Doctor Revenue, Payments' },
        { key: 'advanced', label: 'Advanced Report', icon: Zap, desc: 'Performance, Cancellation, Peak Hours, Financial' },
        { key: 'history', label: `Saved Reports (${savedReports.length})`, icon: BarChart3, desc: 'View, re-download & manage saved reports' },
    ];

    return (
        <>
            {toast && (
                <div onClick={() => setToast(null)} className={`fixed top-5 right-5 z-[999] flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold cursor-pointer animate-fade-up ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {toast.type === 'error' ? <XCircle size={15} /> : <CheckCircle size={15} />} {toast.msg}
                </div>
            )}
            <ViewReportModal report={viewReport} onClose={() => setViewReport(null)} />

            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Reports & Analytics</h1>
                    <p className="text-sm text-slate-400">Generate, preview, save and export platform reports as PDF</p>
                </div>

                {/* Tab nav */}
                <div className="grid grid-cols-3 gap-3">
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${tab === t.key ? (t.key === 'advanced' ? 'border-violet-500 bg-violet-50' : t.key === 'history' ? 'border-blue-400 bg-blue-50' : 'border-blue-500 bg-blue-50') : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${tab === t.key ? (t.key === 'advanced' ? 'bg-violet-600' : 'bg-blue-600') : 'bg-slate-100'}`}>
                                <t.icon size={16} className={tab === t.key ? 'text-white' : 'text-slate-500'} />
                            </div>
                            <div>
                                <p className={`text-sm font-bold ${tab === t.key ? (t.key === 'advanced' ? 'text-violet-800' : 'text-blue-800') : 'text-slate-700'}`}>{t.label}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">{t.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {tab === 'standard' && <StandardTab key={editConfig?._id || 'std'} savedReports={savedReports} setSavedReports={setSavedReports} showToast={showToast} setViewReport={setViewReport} setTab={setTab} editConfig={editConfig?.type === 'standard' ? editConfig : null} />}
                {tab === 'advanced' && <AdvancedTab key={editConfig?._id || 'adv'} savedReports={savedReports} setSavedReports={setSavedReports} showToast={showToast} editConfig={editConfig?.type === 'advanced' ? editConfig : null} />}
                {tab === 'history' && <HistoryTab savedReports={savedReports} setSavedReports={setSavedReports} showToast={showToast} setViewReport={setViewReport} switchTab={setTab} onEdit={handleEdit} />}
            </div>
        </>
    );
};

export default AdminReports;
