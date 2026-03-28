import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
    CreditCard, CheckCircle, Clock, XCircle, AlertCircle, RefreshCw,
    Stethoscope, Calendar, ChevronDown,
    ClipboardList, Filter, ShieldCheck,
} from 'lucide-react';

const METHOD_META = {
    PAYHERE: { label: 'PayHere', icon: '🏦', color: 'bg-orange-100 text-orange-700' },
    BANK_TRANSFER: { label: 'Bank Transfer', icon: '🏛️', color: 'bg-blue-100 text-blue-700' },
    PAYPAL: { label: 'PayPal', icon: '💳', color: 'bg-sky-100 text-sky-700' },
};

const STATUS_META = {
    SUCCESS: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    APPROVED: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
    PENDING_APPROVAL: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
    FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
    REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
};

const RejectModal = ({ transaction, onConfirm, onClose }) => {
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const handle = async () => {
        setLoading(true);
        await onConfirm(transaction._id, note);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-up">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-red-100 mx-auto mb-4">
                    <XCircle size={22} className="text-red-500" />
                </div>
                <h3 className="text-base font-bold text-slate-900 text-center">Reject Payment</h3>
                <p className="text-sm text-slate-500 text-center mt-1 mb-4">
                    Ref: <strong>{transaction.paymentReference || '—'}</strong>
                </p>
                <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700">Rejection Reason (optional)</label>
                    <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
                        placeholder="e.g. Invalid reference number, amount mismatch..."
                        className="input-field resize-none w-full text-sm" />
                </div>
                <div className="flex gap-3 mt-5">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                        Cancel
                    </button>
                    <button onClick={handle} disabled={loading}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-2 transition-all">
                        {loading ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> : null}
                        Reject
                    </button>
                </div>
            </div>
        </div>
    );
};

const TransactionCard = ({ txn, onApprove, onReject, showActions }) => {
    const patient = txn.patientId;
    const apt = txn.appointmentId;
    const doctor = apt?.doctorId;
    const statusMeta = STATUS_META[txn.status] || STATUS_META.PENDING;
    const methodMeta = METHOD_META[txn.method] || { label: txn.method, icon: '💰', color: 'bg-slate-100 text-slate-700' };

    const patientName = patient?.patientProfile
        ? `${patient.patientProfile.firstName || ''} ${patient.patientProfile.lastName || ''}`.trim()
        : patient?.email || 'Unknown';

    return (
        <div className="card p-4 hover:shadow-md transition-all duration-200">
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shrink-0">
                    {(patient?.patientProfile?.firstName?.[0] || patient?.email?.[0] || 'P').toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-800 text-sm">{patientName}</p>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${statusMeta.color}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                                    {statusMeta.label}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">{patient?.email}</p>
                        </div>
                        <p className="font-bold text-slate-800 shrink-0 text-sm">LKR {txn.amount?.toLocaleString()}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        {/* Doctor */}
                        {doctor && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Stethoscope size={11} className="text-indigo-500" />
                                Dr. {doctor.firstName} {doctor.lastName}
                            </span>
                        )}
                        {/* Date */}
                        {apt?.appointmentDate && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Calendar size={11} className="text-blue-500" />
                                {new Date(apt.appointmentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                        )}
                        {/* Method */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${methodMeta.color}`}>
                            {methodMeta.icon} {methodMeta.label}
                        </span>
                    </div>

                    {/* Reference */}
                    {txn.paymentReference && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 rounded-lg px-2.5 py-1.5">
                            <ClipboardList size={11} className="text-blue-500 shrink-0" />
                            <span className="font-medium text-slate-600">Reference:</span>
                            <span className="font-mono text-slate-800">{txn.paymentReference}</span>
                        </div>
                    )}
                    {txn.paymentNote && (
                        <p className="text-xs text-slate-400 mt-1 ml-0.5">{txn.paymentNote}</p>
                    )}

                    {/* Admin note (on rejected) */}
                    {txn.status === 'REJECTED' && txn.adminNote && (
                        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                            <XCircle size={11} /> {txn.adminNote}
                        </p>
                    )}

                    {/* Submitted at */}
                    <p className="text-[10px] text-slate-300 mt-1.5">
                        Submitted {new Date(txn.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>

                    {/* Actions */}
                    {showActions && txn.status === 'PENDING_APPROVAL' && (
                        <div className="flex gap-2 mt-3">
                            <button onClick={() => onApprove(txn._id)}
                                className="flex-1 py-2 rounded-lg text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center gap-1.5 transition-colors">
                                <CheckCircle size={13} /> Approve
                            </button>
                            <button onClick={() => onReject(txn)}
                                className="flex-1 py-2 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 flex items-center justify-center gap-1.5 transition-colors">
                                <XCircle size={13} /> Reject
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const AdminPayments = () => {
    const [tab, setTab] = useState('pending');
    const [pendingTxns, setPendingTxns] = useState([]);
    const [allTxns, setAllTxns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [actionMsg, setActionMsg] = useState('');
    const [methodFilter, setMethodFilter] = useState('ALL');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [pendingRes, allRes] = await Promise.all([
                api.get('/payments/admin/pending'),
                api.get('/payments/admin/all'),
            ]);
            setPendingTxns(pendingRes.data);
            setAllTxns(allRes.data);
        } catch {/* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const showMsg = (msg) => {
        setActionMsg(msg);
        setTimeout(() => setActionMsg(''), 3000);
    };

    const handleApprove = async (txnId) => {
        try {
            await api.patch(`/payments/admin/${txnId}/approve`);
            showMsg('✅ Payment approved successfully!');
            fetchData();
        } catch (err) {
            showMsg('❌ ' + (err.response?.data?.message || 'Approval failed'));
        }
    };

    const handleReject = async (txnId, note) => {
        try {
            await api.patch(`/payments/admin/${txnId}/reject`, { adminNote: note });
            setRejectTarget(null);
            showMsg('Payment rejected.');
            fetchData();
        } catch (err) {
            showMsg('❌ ' + (err.response?.data?.message || 'Rejection failed'));
        }
    };

    const filteredAll = methodFilter === 'ALL' ? allTxns : allTxns.filter(t => t.method === methodFilter);

    const stats = {
        totalRevenue: allTxns.filter(t => t.status === 'SUCCESS' || t.status === 'APPROVED').reduce((s, t) => s + t.amount, 0),
        pending: pendingTxns.length,
        total: allTxns.length,
    };

    return (
        <div className="space-y-6">
            {rejectTarget && (
                <RejectModal
                    transaction={rejectTarget}
                    onConfirm={handleReject}
                    onClose={() => setRejectTarget(null)}
                />
            )}

            {/* Action feedback */}
            {actionMsg && (
                <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg animate-fade-up">
                    {actionMsg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Payment Management</h1>
                    <p className="text-sm text-slate-400">Review and approve patient payments</p>
                </div>
                <button onClick={fetchData} disabled={loading}
                    className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {/* Stats */}
            {!loading && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="card p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                            <ShieldCheck size={18} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Total Revenue</p>
                            <p className="font-bold text-emerald-600 text-sm">LKR {stats.totalRevenue.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="card p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                            <Clock size={18} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Pending Approval</p>
                            <p className="font-bold text-amber-600 text-sm">{stats.pending} payments</p>
                        </div>
                    </div>
                    <div className="card p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                            <CreditCard size={18} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Total Transactions</p>
                            <p className="font-bold text-slate-800 text-sm">{stats.total}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex bg-slate-100 rounded-xl p-1">
                {[
                    { key: 'pending', label: 'Pending Approval', count: pendingTxns.length },
                    { key: 'all', label: 'All Transactions', count: allTxns.length },
                ].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t.key
                                ? 'bg-white text-blue-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}>
                        {t.label}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tab === t.key
                                ? t.key === 'pending' && t.count > 0 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                : 'bg-slate-200 text-slate-500'
                            }`}>{t.count}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="card p-4 flex items-center gap-4">
                            <div className="skeleton h-11 w-11 rounded-xl shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="skeleton h-3.5 w-1/3" />
                                <div className="skeleton h-3 w-1/2" />
                            </div>
                            <div className="skeleton h-8 w-20 rounded-lg" />
                        </div>
                    ))}
                </div>
            ) : tab === 'pending' ? (
                pendingTxns.length === 0 ? (
                    <div className="card p-14 text-center">
                        <CheckCircle size={36} className="mx-auto text-emerald-300 mb-3" />
                        <p className="font-semibold text-slate-600">All caught up!</p>
                        <p className="text-sm text-slate-400 mt-1">No payments pending approval</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-amber-600 font-semibold flex items-center gap-1.5">
                            <AlertCircle size={14} /> {pendingTxns.length} payment{pendingTxns.length > 1 ? 's' : ''} awaiting your review
                        </p>
                        {pendingTxns.map(txn => (
                            <TransactionCard key={txn._id} txn={txn}
                                showActions onApprove={handleApprove} onReject={setRejectTarget} />
                        ))}
                    </div>
                )
            ) : (
                <div className="space-y-3">
                    {/* Method filter */}
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-slate-400" />
                        <p className="text-xs text-slate-500 font-medium">Filter by method:</p>
                        <div className="flex gap-1.5">
                            {['ALL', 'PAYHERE', 'BANK_TRANSFER', 'PAYPAL'].map(m => (
                                <button key={m} onClick={() => setMethodFilter(m)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${methodFilter === m
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
                                        }`}>
                                    {m === 'ALL' ? 'All' : (METHOD_META[m]?.icon + ' ' + METHOD_META[m]?.label)}
                                </button>
                            ))}
                        </div>
                    </div>
                    {filteredAll.length === 0 ? (
                        <div className="card p-10 text-center">
                            <Filter size={28} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-sm text-slate-500">No transactions found</p>
                        </div>
                    ) : (
                        filteredAll.map(txn => (
                            <TransactionCard key={txn._id} txn={txn} showActions={false} onApprove={handleApprove} onReject={setRejectTarget} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminPayments;
