import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { FileText, Calendar, Stethoscope, RefreshCw } from 'lucide-react';

const PatientMedicalHistory = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/patients/journals');
            setRecords(data);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Medical History</h1>
                    <p className="text-sm text-slate-400">All your completed consultations</p>
                </div>
                <button onClick={fetch} disabled={loading}
                    className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="card p-5 space-y-3">
                            <div className="skeleton h-4 w-1/3" /><div className="skeleton h-3 w-1/2" />
                        </div>
                    ))}
                </div>
            ) : records.length === 0 ? (
                <div className="card p-12 text-center">
                    <FileText size={36} className="mx-auto text-slate-300 mb-3" />
                    <p className="font-semibold text-slate-600">No medical history yet</p>
                    <p className="text-sm text-slate-400 mt-1">Your completed appointments will appear here</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {records.map(rec => {
                        const doc = rec.doctorId;
                        return (
                            <div key={rec._id} className="card p-5 hover:shadow-md transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm">
                                        {doc?.firstName?.[0]?.toUpperCase() || 'D'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <p className="font-bold text-slate-900">Dr. {doc?.firstName} {doc?.lastName}</p>
                                                <p className="text-xs text-slate-400">{doc?.specialization}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                                                    <Stethoscope size={10} /> {rec.status || 'Active'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 mb-3">
                                            <Calendar size={12} className="text-blue-500" />
                                            {new Date(rec.visitDate).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </div>

                                        {rec.diagnosis && (
                                            <div className="mb-3">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Diagnosis</p>
                                                <p className="text-sm font-medium text-slate-800">{rec.diagnosis}</p>
                                            </div>
                                        )}

                                        {rec.prescription && rec.prescription.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Prescription</p>
                                                <div className="space-y-1">
                                                    {rec.prescription.map((rx, idx) => (
                                                        <div key={idx} className="flex flex-wrap items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                                            <span className="font-semibold">{rx.medication}</span>
                                                            <span className="text-slate-400">&bull;</span>
                                                            <span>{rx.dosage}</span>
                                                            <span className="text-slate-400">&bull;</span>
                                                            <span>{rx.frequency}</span>
                                                            <span className="text-slate-400">&bull;</span>
                                                            <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium text-xs">{rx.duration}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {rec.notes && (
                                            <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-xl mb-3">
                                                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Doctor's Notes</p>
                                                <p className="text-sm text-slate-700">{rec.notes}</p>
                                            </div>
                                        )}

                                        {rec.followUpDate && (
                                            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg w-fit">
                                                <Calendar size={13} className="text-amber-500" />
                                                Recommend Follow-up: {new Date(rec.followUpDate).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </div>
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

export default PatientMedicalHistory;
