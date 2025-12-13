import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig.js';
import { collection, onSnapshot, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import ConfirmationModal from '../components/ConfirmationModal.jsx';

// --- ClinicFormModal Component ---
const ClinicFormModal = ({ isOpen, onClose, onSave, clinic }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (clinic) {
            setFormData({
                name: clinic.name || '', address: clinic.address || '', email: clinic.email || '',
                phone: clinic.phone || '', authUid: clinic.authUid || '', services: clinic.services || [],
            });
        } else {
            setFormData({ name: '', address: '', email: '', phone: '', authUid: '', services: [] });
        }
    }, [clinic, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleServicesChange = (e) => {
        const { value } = e.target;
        setFormData(prev => ({ ...prev, services: value.split(',').map(s => s.trim()).filter(Boolean) }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">

            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{clinic ? 'Edit Clinic' : 'Add New Clinic'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Clinic Name" required className="w-full p-2 border rounded form-input" />
                    <input name="address" value={formData.address} onChange={handleChange} placeholder="Address" required className="w-full p-2 border rounded form-input" />
                    <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Contact Email" required className="w-full p-2 border rounded form-input" />
                    <input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Phone Number" required className="w-full p-2 border rounded form-input" />
                    <input name="authUid" value={formData.authUid} onChange={handleChange} placeholder="Firebase Auth UID for Clinic Login" required className="w-full p-2 border rounded form-input" />
                    <textarea name="services" value={formData.services.join(', ')} onChange={handleServicesChange} placeholder="Services (comma-separated)" className="w-full p-2 border rounded form-input" />
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Save Clinic</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Main AdminDashboard Component ---
const AdminDashboard = () => {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [allClinics, setAllClinics] = useState([]);
    const [allAppointments, setAllAppointments] = useState([]);
    const [openAccordion, setOpenAccordion] = useState(null);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingClinic, setEditingClinic] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [clinicToDelete, setClinicToDelete] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const adminRef = doc(db, "admins", currentUser.uid);
                const adminSnap = await getDoc(adminRef);
                if (adminSnap.exists()) {
                    setIsAdmin(true);
                    const unsubClinics = onSnapshot(collection(db, "clinics"), snapshot => setAllClinics(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
                    const unsubAppointments = onSnapshot(collection(db, "appointments"), snapshot => setAllAppointments(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
                    setLoading(false);
                    return () => { unsubClinics(); unsubAppointments(); };
                } else { await signOut(auth); }
            } else { setIsAdmin(false); setLoading(false); }
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try { await signInWithEmailAndPassword(auth, e.target.email.value, e.target.password.value); } 
        catch (err) { setError("Admin login failed. Check credentials."); }
    };

    const handleOpenFormModal = (clinic = null) => {
        setEditingClinic(clinic);
        setIsFormModalOpen(true);
    };

    const handleSaveClinic = async (clinicData) => {
        try {
            if (editingClinic) {
                await updateDoc(doc(db, "clinics", editingClinic.id), clinicData);
            } else {
                await addDoc(collection(db, "clinics"), clinicData);
            }
            setIsFormModalOpen(false);
        } catch (error) { console.error("Error saving clinic:", error); alert("Failed to save clinic."); }
    };

    const handleDeleteClinic = (clinicId) => {
        setClinicToDelete(clinicId);
        setIsConfirmModalOpen(true);
    };

    const confirmDeleteClinic = async () => {
        if (clinicToDelete) {
            try {
                await deleteDoc(doc(db, "clinics", clinicToDelete));
            } catch (error) { console.error("Error deleting clinic:", error); alert("Failed to delete clinic."); }
        }
        setIsConfirmModalOpen(false);
        setClinicToDelete(null);
    };

    const getStatusBadge = (status) => {
        const colors = { Pending: 'bg-yellow-100 text-yellow-800', Confirmed: 'bg-green-100 text-green-800', Completed: 'bg-blue-100 text-blue-800', Cancelled: 'bg-red-100 text-red-800' };
        return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors[status] || 'bg-slate-100'}`}>{status}</span>;
    };
    
    if (loading) return <div className="p-8 text-center">Authenticating...</div>;

    if (!user || !isAdmin) {
        return (
            <div className="flex items-center justify-center py-12 px-4">
                <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border">
                    <h1 className="text-2xl font-bold text-center text-slate-800">Admin Login</h1>
                    <form onSubmit={handleLogin} className="mt-6 space-y-4">
                        <input name="email" type="email" placeholder="Admin Email" defaultValue="admin@gmail.com" required className="w-full p-3 border rounded-md form-input" />
                        <input name="password" type="password" placeholder="Password" defaultValue="Password@123" required className="w-full p-3 border rounded-md form-input" />
                        <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700">Sign In</button>
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    </form>
                </div>
            </div>
        );
    }
    
    return (
        <>
            <main className="max-w-7xl mx-auto p-4 md:p-6 fade-in-page">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Clinic Management</h2>
                    <button onClick={() => handleOpenFormModal()} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700">
                        Add New Clinic
                    </button>
                </div>
                <div className="space-y-4">
                    {allClinics.map(clinic => {
                        const clinicAppointments = allAppointments.filter(app => app.clinicId === clinic.id);
                        const isAccordionOpen = openAccordion === clinic.id;
                        return (
                            <div key={clinic.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className={`w-full text-left p-6 flex justify-between items-center`}>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800">{clinic.name}</h3>
                                        <p className="text-sm text-slate-500">{clinic.address}</p>
                                        <div className="mt-4 flex gap-2">
                                            <button onClick={() => handleOpenFormModal(clinic)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Edit</button>
                                            <button onClick={() => handleDeleteClinic(clinic.id)} className="text-sm font-medium text-red-600 hover:text-red-800">Delete</button>
                                        </div>
                                    </div>
                                    <button onClick={() => setOpenAccordion(isAccordionOpen ? null : clinic.id)} className={`accordion-header flex items-center gap-4 p-2 rounded-md hover:bg-slate-100 ${isAccordionOpen ? 'open' : ''}`}>
                                        <span className="text-sm font-medium bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">{clinicAppointments.length} Appointments</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-500 transition-transform duration-300"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </button>
                                </div>
                                <div className={`accordion-body bg-slate-50 ${isAccordionOpen ? 'open' : ''}`}>
                                    {clinicAppointments.length > 0 ? (
                                        <div className="overflow-x-auto"><table className="w-full text-sm text-left">
                                            <thead className="text-xs text-slate-700 uppercase bg-slate-100"><tr><th className="px-6 py-3">Patient</th><th className="px-6 py-3">Date & Time</th><th className="px-6 py-3">Status</th></tr></thead>
                                            <tbody>{clinicAppointments.map(app => <tr key={app.id} className="border-b"><td className="px-6 py-4">{app.patientName}</td><td className="px-6 py-4">{new Date(app.appointmentDate).toLocaleString()}</td><td className="px-6 py-4">{getStatusBadge(app.status)}</td></tr>)}</tbody>
                                        </table></div>
                                    ) : <p className="text-center text-slate-500 py-6">No appointments for this clinic.</p>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </main>
            <ClinicFormModal 
                isOpen={isFormModalOpen} 
                onClose={() => setIsFormModalOpen(false)} 
                onSave={handleSaveClinic} 
                clinic={editingClinic} 
            />
             <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDeleteClinic}
                title="Confirm Deletion"
            >
                <p>Are you sure you want to delete this clinic and all its appointments? This action cannot be undone.</p>
            </ConfirmationModal>
        </>
    );
};

export default AdminDashboard;

