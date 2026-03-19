import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import {
    Receipt, Calendar, Clock, User, Stethoscope, CreditCard,
    CheckCircle, Printer, ArrowLeft, ShieldCheck, Building2, Wallet,
} from 'lucide-react';

const METHOD_LABELS = {
    PAYHERE: { label: 'PayHere', icon: '🏦', color: 'text-orange-700 bg-orange-100' },
    BANK_TRANSFER: { label: 'Bank Transfer', icon: '🏛️', color: 'text-blue-700 bg-blue-100' },
    PAYPAL: { label: 'PayPal', icon: '💳', color: 'text-sky-700 bg-sky-100' },
};

const PaymentReceipt = () => {
    const { transactionId } = useParams();
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchReceipt = async () => {
            try {
                const { data } = await api.get(`/payments/${transactionId}/receipt`);
                setReceipt(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load receipt.');
            } finally {
                setLoading(false);
            }
        };
        fetchReceipt();
    }, [transactionId]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
                <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-500">Loading receipt…</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="card p-10 text-center max-w-md mx-auto">
            <Receipt size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">Receipt Not Available</p>
            <p className="text-sm text-slate-400 mt-1">{error}</p>
            <Link to="/patient/payments" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
                <ArrowLeft size={14} /> Back to Payment History
            </Link>
        </div>
    );

    const method = METHOD_LABELS[receipt.payment.method] || { label: receipt.payment.method, icon: '💰', color: 'text-slate-700 bg-slate-100' };

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            {/* Actions bar */}
            <div className="flex items-center justify-between print:hidden">
                <Link to="/patient/payments" className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">
                    <ArrowLeft size={15} /> Payment History
                </Link>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-sm shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                    <Printer size={15} /> Print / Save PDF
                </button>
            </div>

            {/* Receipt card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100 print:shadow-none print:border-0">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur mb-4">
                        <Receipt size={26} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Payment Receipt</h1>
                    <p className="text-blue-100 text-sm mt-1">Medicare E-Channeling Portal</p>
                    <div className="mt-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-xl px-4 py-2">
                        <span className="text-xs text-blue-100 uppercase tracking-wider">Receipt No.</span>
                        <span className="font-bold font-mono text-white">{receipt.receiptNumber}</span>
                    </div>
                </div>

                {/* Status banner */}
                <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 border-b border-emerald-100">
                    <CheckCircle size={16} className="text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-700">Payment {receipt.payment.status === 'SUCCESS' ? 'Successful' : 'Approved'}</span>
                    <span className="ml-auto text-xs text-emerald-600">
                        {receipt.issuedAt
                            ? new Date(receipt.issuedAt).toLocaleString('en-GB', {
                                day: '2-digit', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                            })
                            : '—'}
                    </span>
                </div>

                <div className="p-6 space-y-5">
                    {/* Patient & Doctor details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <User size={14} className="text-blue-600" />
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</p>
                            </div>
                            <p className="font-bold text-slate-800">{receipt.patient.name || 'N/A'}</p>
                            <p className="text-sm text-slate-500 mt-0.5">{receipt.patient.email}</p>
                            {receipt.patient.phone && <p className="text-xs text-slate-400 mt-0.5">{receipt.patient.phone}</p>}
                            {receipt.patient.nic && <p className="text-xs text-slate-400">NIC: {receipt.patient.nic}</p>}
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Stethoscope size={14} className="text-blue-600" />
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor</p>
                            </div>
                            <p className="font-bold text-slate-800">{receipt.doctor.name}</p>
                            <p className="text-sm text-slate-500 mt-0.5">{receipt.doctor.specialization}</p>
                        </div>
                    </div>

                    {/* Appointment details */}
                    <div className="bg-slate-50 rounded-xl p-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Appointment Details</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-blue-500 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-400">Date</p>
                                    <p className="text-sm font-semibold text-slate-800">
                                        {receipt.appointment.date
                                            ? new Date(receipt.appointment.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
                                            : '—'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-blue-500 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-400">Time Slot</p>
                                    <p className="text-sm font-semibold text-slate-800">{receipt.appointment.timeSlot}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment details */}
                    <div className="bg-slate-50 rounded-xl p-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Payment Details</p>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600">Payment Method</span>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${method.color}`}>
                                {method.icon} {method.label}
                            </span>
                        </div>
                        {receipt.payment.reference && (
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-600">Reference</span>
                                <span className="font-mono text-sm font-semibold text-slate-800">{receipt.payment.reference}</span>
                            </div>
                        )}
                        {receipt.payment.payherePaymentId && (
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-600">Gateway Ref</span>
                                <span className="font-mono text-xs font-semibold text-slate-800">{receipt.payment.payherePaymentId}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between border-t border-slate-200 mt-3 pt-3">
                            <span className="font-bold text-slate-700">Total Paid</span>
                            <span className="font-bold text-xl text-blue-600">
                                LKR {receipt.payment.amount?.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Security footer */}
                    <div className="flex items-center justify-center gap-2 pt-2 text-xs text-slate-400">
                        <ShieldCheck size={13} className="text-emerald-500" />
                        This is a digitally generated receipt. No signature required.
                    </div>
                </div>

                {/* Barcode-style footer */}
                <div className="bg-slate-900 px-6 py-4 text-center">
                    <p className="font-mono text-xs tracking-[0.3em] text-slate-400">{receipt.receiptNumber}</p>
                    <p className="text-slate-600 text-[10px] mt-1">Medicare E-Channeling Portal · mediportal.lk</p>
                </div>
            </div>
        </div>
    );
};

export default PaymentReceipt;
