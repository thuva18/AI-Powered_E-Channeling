import { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Search, Mail, Phone, Calendar, ChevronRight } from 'lucide-react';
import { SectionHeader, EmptyState } from '../components/ui/Common';
import { Link } from 'react-router-dom';

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
                        title={search ? "No patients found" : "No patients yet"}
                        description={search ? "Try adjusting your search terms." : "Patients who book appointments with you will automatically appear here."}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(patient => (
                        <div key={patient._id} className="card p-5 hover:shadow-lg transition-all flex flex-col items-start gap-4 animate-fade-up">
                            <div className="flex items-center gap-3 w-full">
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
                                    {(patient.name?.[0] || 'U').toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-900 truncate">{patient.name || 'Unknown Patient'}</h3>
                                    <p className="text-xs text-slate-400 truncate">{patient.gender || 'Unknown gender'} {patient.dob ? `· ${Math.floor((new Date() - new Date(patient.dob)) / 31557600000)} yrs` : ''}</p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-slate-600 w-full pt-3 border-t border-slate-50">
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

                            <div className="mt-auto w-full flex items-center justify-between pt-3">
                                <div className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                                    {patient.totalVisits} Visit{patient.totalVisits !== 1 ? 's' : ''}
                                </div>
                                <div className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                    Last: {new Date(patient.lastVisit).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DoctorPatients;
