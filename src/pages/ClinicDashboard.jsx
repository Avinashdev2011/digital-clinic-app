import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebaseConfig.js';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const ClinicDashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [clinic, setClinic] = useState(null);
    const [appointments, setAppointments] = useState([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const q = query(collection(db, "clinics"), where("authUid", "==", currentUser.uid));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    setError("Your account is not associated with a clinic.");
                    setUser(null);
                    setClinic(null);
                    setLoading(false);
                } else {
                    setUser(currentUser);
                    const clinicDoc = querySnapshot.docs[0];
                    const clinicData = { id: clinicDoc.id, ...clinicDoc.data() };
                    setClinic(clinicData);

                    const apptsQuery = query(collection(db, "appointments"), where("clinicId", "==", clinicData.id));
                    const unsubAppointments = onSnapshot(apptsQuery, snapshot => {
                        const appts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                        setAppointments(appts.sort((a,b) => new Date(b.appointmentDate) - new Date(a.appointmentDate)));
                    });
                    
                    setLoading(false);
                    return () => unsubAppointments();
                }
            } else {
                setUser(null);
                setClinic(null);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        const { email, password } = e.target.elements;
        setError('');
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email.value, password.value);
        } catch (err) {
            setError("Invalid email or password.");
            setLoading(false);
        }
    };
    
    const handleStatusChange = async (appId, newStatus) => {
        try {
            await updateDoc(doc(db, "appointments", appId), { status: newStatus });
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Failed to update status.");
        }
    };
    
    if (loading) return <LoadingSpinner text="Authenticating..." />;

    if (!user || !clinic) {
        return (
            <div className="fade-in-page flex items-center justify-center py-12 px-4">
                <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-slate-200">
                    <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Clinic Dashboard Login</h1>
                    <p className="text-slate-500 mb-6 text-center">Please sign in to manage your clinic.</p>
                    <form onSubmit={handleLogin} className="w-full">
                        <div className="space-y-4">
                            <input name="email" type="email" placeholder="Clinic Email" required className="w-full p-3 border border-slate-300 rounded-md form-input" />
                            <input name="password" type="password" placeholder="Password" required className="w-full p-3 border border-slate-300 rounded-md form-input" />
                            <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">Sign In</button>
                            {error && <p className="text-sm text-red-500 text-center h-5 pt-1">{error}</p>}
                        </div>
                    </form>
                </div>
            </div>
        );
    }
    
    return (
        <main className="max-w-7xl mx-auto p-4 md:p-6 fade-in-page">
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 mb-6">
                <h2 className="text-2xl font-bold text-slate-800">{clinic.name}</h2>
                <p className="text-slate-600 mt-1">{clinic.address}</p>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Appointments</h2>
                <div className="space-y-4">
                    {appointments.length > 0 ? appointments.map(app => (
                        <div key={app.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                <div>
                                    <p className="font-bold text-slate-800">{app.patientName}</p>
                                    <p className="text-sm text-slate-600"><strong>Phone:</strong> {app.patientPhone || 'N/A'}</p>
                                    <p className="text-sm text-slate-500 mt-1">{new Date(app.appointmentDate).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select value={app.status} onChange={(e) => handleStatusChange(app.id, e.target.value)} className="status-select bg-slate-100 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2">
                                        {['Pending', 'Confirmed', 'Completed', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center p-10 bg-white rounded-lg shadow-sm border border-slate-200">
                            <p className="text-slate-600">There are no appointments for this clinic yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default ClinicDashboard;

