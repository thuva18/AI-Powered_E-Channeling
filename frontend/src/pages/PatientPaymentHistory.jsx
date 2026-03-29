import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
<<<<<<< Updated upstream
import { CreditCard, Calendar, CheckCircle, Clock, RefreshCw } from 'lucide-react';
=======
import {
    CreditCard, Calendar, CheckCircle, Clock, RefreshCw, Receipt,
    XCircle, AlertCircle, BarChart3, Filter,
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
>>>>>>> Stashed changes

const PatientPaymentHistory = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/patients/appointments');
            setPayments(data.filter(a => a.consultationFeeCharged > 0));
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const totalPaid = payments
        .filter(p => p.paymentStatus === 'PAID')
        .reduce((s, p) => s + (p.consultationFeeCharged || 0), 0);

    const totalDue = payments
        .filter(p => p.paymentStatus === 'UNPAID' && p.status !== 'CANCELLED')
        .reduce((s, p) => s + (p.consultationFeeCharged || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Payment History</h1>
                    <p className="text-sm text-slate-400">Your consultation billing records</p>
                </div>
                <button onClick={fetch} disabled={loading}
                    className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {/* Summary cards */}
            {!loading && payments.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="card p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                            <CheckCircle size={18} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Total Paid</p>
                            <p className="font-bold text-emerald-600 text-lg">LKR {totalPaid.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="card p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                            <Clock size={18} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Outstanding</p>
                            <p className="font-bold text-amber-600 text-lg">LKR {totalDue.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="card p-4 flex items-center gap-4">
                            <div className="skeleton h-10 w-10 rounded-xl shrink-0" />
                            <div className="flex-1 space-y-2"><div className="skeleton h-3.5 w-1/3" /><div className="skeleton h-3 w-1/4" /></div>
                            <div className="skeleton h-6 w-20 rounded-full" />
                        </div>
                    ))}
                </div>
            ) : payments.length === 0 ? (
                <div className="card p-12 text-center">
                    <CreditCard size={36} className="mx-auto text-slate-300 mb-3" />
                    <p className="font-semibold text-slate-600">No payment records yet</p>
                    <p className="text-sm text-slate-400 mt-1">Payment details will appear after booking appointments</p>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60">
                                    {['Doctor', 'Date', 'Fee (LKR)', 'Payment Status', 'Appt Status'].map(h => (
                                        <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {payments.map(p => {
                                    const doc = p.doctorId;
                                    const paid = p.paymentStatus === 'PAID';
                                    return (
                                        <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
                                                        {doc?.firstName?.[0]?.toUpperCase() || 'D'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">Dr. {doc?.firstName} {doc?.lastName}</p>
                                                        <p className="text-xs text-slate-400">{doc?.specialization}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                    <Calendar size={13} className="text-blue-500 shrink-0" />
                                                    {new Date(p.appointmentDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="font-bold text-slate-800">{p.consultationFeeCharged?.toLocaleString()}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit ${paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {paid ? <CheckCircle size={10} /> : <Clock size={10} />}
                                                    {paid ? 'Paid' : 'Unpaid'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${p.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                                                    p.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                                                        p.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-slate-100 text-slate-600'
                                                    }`}>{p.status}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientPaymentHistory;
