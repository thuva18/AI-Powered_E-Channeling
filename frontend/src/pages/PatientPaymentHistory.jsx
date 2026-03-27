import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
    CreditCard, Calendar, CheckCircle, Clock, RefreshCw, Receipt,
<<<<<<< Updated upstream
    XCircle, AlertCircle, Building2, Wallet, BarChart3, Filter,
=======
    XCircle, AlertCircle, BarChart3, Filter,
>>>>>>> Stashed changes
} from 'lucide-react';

const METHOD_META = {
    PAYHERE: { label: 'PayHere', icon: '🏦', color: 'bg-orange-100 text-orange-700' },
    BANK_TRANSFER: { label: 'Bank Transfer', icon: '🏛️', color: 'bg-blue-100 text-blue-700' },
    PAYPAL: { label: 'PayPal', icon: '💳', color: 'bg-sky-100 text-sky-700' },
};

const STATUS_META = {
    SUCCESS: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle },
    APPROVED: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle },
    PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700', Icon: Clock },
    PENDING_APPROVAL: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-700', Icon: Clock },
    FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700', Icon: XCircle },
    REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', Icon: XCircle },
};

const TABS = ['ALL', 'SUCCESS', 'APPROVED', 'PENDING_APPROVAL', 'FAILED', 'REJECTED'];
const TAB_LABELS = {
    ALL: 'All', SUCCESS: 'Paid', APPROVED: 'Approved',
    PENDING_APPROVAL: 'Pending', FAILED: 'Failed', REJECTED: 'Rejected',
};

const PatientPaymentHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/payments/my-transactions');
            setTransactions(data);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    const filtered = activeTab === 'ALL'
        ? transactions
        : transactions.filter(t => t.status === activeTab);

    const totalPaid = transactions
        .filter(t => t.status === 'SUCCESS' || t.status === 'APPROVED')
        .reduce((s, t) => s + (t.amount || 0), 0);

    const totalPending = transactions
        .filter(t => t.status === 'PENDING_APPROVAL')
        .reduce((s, t) => s + (t.amount || 0), 0);

    const paidCount = transactions.filter(t => t.status === 'SUCCESS' || t.status === 'APPROVED').length;
    const pendingCount = transactions.filter(t => t.status === 'PENDING_APPROVAL').length;

    const canViewReceipt = (status) => status === 'SUCCESS' || status === 'APPROVED';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Payment History</h1>
                    <p className="text-sm text-slate-400">Your consultation payment records</p>
                </div>
                <button onClick={fetchTransactions} disabled={loading}
                    className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {/* Stats */}
            {!loading && transactions.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="card p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                            <CheckCircle size={18} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Total Paid</p>
                            <p className="font-bold text-emerald-600">LKR {totalPaid.toLocaleString()}</p>
                            <p className="text-xs text-slate-400">{paidCount} transactions</p>
                        </div>
                    </div>
                    <div className="card p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                            <Clock size={18} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Pending</p>
                            <p className="font-bold text-amber-600">LKR {totalPending.toLocaleString()}</p>
                            <p className="text-xs text-slate-400">{pendingCount} awaiting</p>
                        </div>
                    </div>
                    <div className="card p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                            <BarChart3 size={18} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Total</p>
                            <p className="font-bold text-slate-800">{transactions.length}</p>
                            <p className="text-xs text-slate-400">all transactions</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab filter */}
            {!loading && transactions.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                    {TABS.map(tab => {
                        const count = tab === 'ALL' ? transactions.length
                            : transactions.filter(t => t.status === tab).length;
                        return (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === tab
                                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700'
                                    }`}>
                                {TAB_LABELS[tab]}
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}>{count}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="card p-4 flex items-center gap-4">
                            <div className="skeleton h-12 w-12 rounded-xl shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="skeleton h-3.5 w-1/3" />
                                <div className="skeleton h-3 w-1/4" />
                            </div>
                            <div className="skeleton h-6 w-24 rounded-full" />
                        </div>
                    ))}
                </div>
            ) : transactions.length === 0 ? (
                <div className="card p-14 text-center">
                    <CreditCard size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="font-semibold text-slate-600">No payment records yet</p>
                    <p className="text-sm text-slate-400 mt-1">Book an appointment to see payment records here</p>
                    <Link to="/patient" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
                        Book Appointment →
                    </Link>
                </div>
            ) : filtered.length === 0 ? (
                <div className="card p-10 text-center">
                    <Filter size={28} className="mx-auto text-slate-300 mb-3" />
                    <p className="font-semibold text-slate-600">No transactions in this category</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(txn => {
                        const apt = txn.appointmentId;
                        const doctor = apt?.doctorId;
                        const statusMeta = STATUS_META[txn.status] || STATUS_META.PENDING;
                        const methodMeta = METHOD_META[txn.method] || { label: txn.method, icon: '💰', color: 'bg-slate-100 text-slate-700' };
                        const { Icon: StatusIcon } = statusMeta;

                        return (
                            <div key={txn._id} className="card p-4 hover:shadow-md transition-all duration-200">
                                <div className="flex items-start gap-3">
                                    {/* Doctor avatar */}
                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
                                        {doctor?.firstName?.[0]?.toUpperCase() || 'D'}
                                    </div>

                                    {/* Main info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">
                                                    Dr. {doctor?.firstName} {doctor?.lastName}
                                                </p>
                                                <p className="text-xs text-slate-400">{doctor?.specialization}</p>
                                            </div>
                                            <p className="font-bold text-slate-800 shrink-0">LKR {txn.amount?.toLocaleString()}</p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            {/* Date */}
                                            {apt?.appointmentDate && (
                                                <span className="flex items-center gap-1 text-xs text-slate-500">
                                                    <Calendar size={11} className="text-blue-500" />
                                                    {new Date(apt.appointmentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            )}
                                            {/* Method badge */}
                                            <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${methodMeta.color}`}>
                                                {methodMeta.icon} {methodMeta.label}
                                            </span>
                                            {/* Status badge */}
                                            <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${statusMeta.color}`}>
                                                <StatusIcon size={10} /> {statusMeta.label}
                                            </span>
                                        </div>

                                        {/* Reference (for dummy methods pending) */}
                                        {txn.paymentReference && (
                                            <p className="text-xs text-slate-400 mt-1 font-mono">
                                                Ref: {txn.paymentReference}
                                            </p>
                                        )}

                                        {/* Receipt link */}
                                        {canViewReceipt(txn.status) && (
                                            <Link to={`/patient/payments/receipt/${txn._id}`}
                                                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                                <Receipt size={12} /> View Receipt
                                            </Link>
                                        )}

                                        {/* Pending info */}
                                        {txn.status === 'PENDING_APPROVAL' && (
                                            <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                                                <AlertCircle size={11} /> Awaiting admin verification (1-2 hours)
                                            </p>
                                        )}

                                        {/* Rejection note */}
                                        {txn.status === 'REJECTED' && txn.adminNote && (
                                            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                                                <XCircle size={11} /> {txn.adminNote}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PatientPaymentHistory;
