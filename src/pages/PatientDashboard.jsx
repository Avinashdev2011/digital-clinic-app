import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebaseConfig.js';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';

const PatientDashboard = () => {
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [error, setError] = useState('');
    
    const [appointments, setAppointments] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loadingData, setLoadingData] = useState(true);

    const [showConfirmation, setShowConfirmation] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState(null);
    
    // Effect for handling authentication state
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoadingAuth(false);
        });
        return () => unsubscribeAuth();
    }, []);

    // Effect for fetching data when the user state changes
    useEffect(() => {
        if (user) {
            setLoadingData(true);
            // Listener for appointments
            const appointmentsQuery = query(collection(db, "appointments"), where("userId", "==", user.uid));
            const unsubscribeAppointments = onSnapshot(appointmentsQuery, snapshot => {
                const appts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAppointments(appts.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate)));
            });

            // Listener for user profile
            const userDocRef = doc(db, "users", user.uid);
            const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
                setProfile(doc.exists() ? doc.data() : null);
                setLoadingData(false); // Stop loading after profile is fetched
            });

            return () => {
                unsubscribeAppointments();
                unsubscribeUser();
            };
        } else {
            // Clear data if no user
            setAppointments([]);
            setProfile(null);
            setLoadingData(false);
        }
    }, [user]); // This effect re-runs whenever the user object changes

    const handleAuth = async (e) => {
        e.preventDefault();
        const { name, email, password } = e.target.elements;
        setError('');
        try {
            if (isRegisterMode) {
                const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
                // Create a document for the new user in the 'users' collection
                await setDoc(doc(db, "users", userCredential.user.uid), { 
                    name: name.value, 
                    email: email.value 
                });
            } else {
                await signInWithEmailAndPassword(auth, email.value, password.value);
            }
        } catch (err) {
            setError("Authentication failed. Please check your details.");
            console.error(err);
        }
    };
    
    const promptCancelAppointment = (appId) => {
        setAppointmentToCancel(appId);
        setShowConfirmation(true);
    };

    const handleConfirmCancel = async () => {
        if (appointmentToCancel) {
            try {
                await updateDoc(doc(db, "appointments", appointmentToCancel), { status: 'Cancelled' });
            } catch (error) {
                console.error("Error cancelling appointment:", error);
            } finally {
                setShowConfirmation(false);
                setAppointmentToCancel(null);
            }
        }
    };

    const getStatusBadge = (status) => {
        const colors = { 
            Pending: 'bg-yellow-100 text-yellow-800', 
            Confirmed: 'bg-green-100 text-green-800', 
            Completed: 'bg-blue-100 text-blue-800', 
            Cancelled: 'bg-slate-200 text-slate-700' 
        };
        return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors[status] || 'bg-slate-100'}`}>{status}</span>;
    };

    if (loadingAuth) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span className="text-slate-600 text-lg">Authenticating...</span>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center py-12 px-4 fade-in-page">
                <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-slate-200 flex flex-col items-center">
                    <div className="w-16 h-16 bg-emerald-500 text-white flex items-center justify-center rounded-full mb-4 shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
                    </div>
                    <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">{isRegisterMode ? 'Patient Registration' : 'Patient Login'}</h1>
                    <p className="text-slate-500 mb-6 text-center">Sign in to manage your appointments.</p>
                    <form onSubmit={handleAuth} className="w-full">
                        <div className="space-y-4">
                            {isRegisterMode && <input name="name" type="text" placeholder="Full Name" required className="w-full p-3 border border-slate-300 rounded-md transition-all duration-300 form-input" />}
                            <input name="email" type="email" placeholder="Your Email" required className="w-full p-3 border border-slate-300 rounded-md transition-all duration-300 form-input" />
                            <input name="password" type="password" placeholder="Password (min. 6 characters)" required className="w-full p-3 border border-slate-300 rounded-md transition-all duration-300 form-input" />
                            <button type="submit" className="w-full bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors">{isRegisterMode ? 'Register' : 'Sign In'}</button>
                            {error && <p className="text-sm text-red-500 text-center h-5 pt-1">{error}</p>}
                        </div>
                    </form>
                    <p className="text-sm text-slate-600 mt-4">
                        <span>{isRegisterMode ? 'Already have an account?' : "Don't have an account?"}</span>
                        <button onClick={() => setIsRegisterMode(!isRegisterMode)} className="font-semibold text-emerald-600 hover:text-emerald-700 ml-1">{isRegisterMode ? 'Login here' : 'Register here'}</button>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-page">
                <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">My Appointments</h2>
                    <div className="space-y-4">
                        {loadingData ? (
                            <p>Loading appointments...</p>
                        ) : appointments.length > 0 ? appointments.map(app => (
                            <div key={app.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-slate-800">{app.clinicName}</p>
                                    <p className="text-sm text-slate-500 mt-1">{new Date(app.appointmentDate).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
                                </div>
                                <div className="text-right">
                                    {getStatusBadge(app.status)}
                                    {(app.status === 'Pending' || app.status === 'Confirmed') && <button onClick={() => promptCancelAppointment(app.id)} className="cancel-btn text-xs font-semibold text-red-500 hover:text-red-700 mt-2">CANCEL</button>}
                                </div>
                            </div>
                        )) : (
                            <div className="text-center text-slate-500 bg-white p-8 rounded-xl shadow-sm border">You have no appointments scheduled.</div>
                        )}
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">My Profile</h2>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        {loadingData ? (
                           <div className="animate-pulse"><div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div><div className="h-4 bg-slate-200 rounded w-1/2"></div></div>
                        ) : profile ? (
                            <div className="space-y-3">
                                <div><p className="text-sm font-medium text-slate-500">Name</p><p className="font-semibold text-slate-800">{profile.name || 'N/A'}</p></div>
                                <div><p className="text-sm font-medium text-slate-500">Email</p><p className="font-semibold text-slate-800">{profile.email || 'N/A'}</p></div>
                            </div>
                        ) : (
                            <p>Could not load profile.</p>
                        )}
                    </div>
                </div>
            </main>

            {showConfirmation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                        <h3 className="text-lg font-bold text-slate-800">Confirm Cancellation</h3>
                        <p className="text-slate-600 mt-2">Are you sure you want to cancel this appointment?</p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setShowConfirmation(false)} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">No, keep it</button>
                            <button onClick={handleConfirmCancel} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Yes, cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PatientDashboard;

