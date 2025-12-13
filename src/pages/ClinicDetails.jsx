import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, collection, addDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// We need react-leaflet for the map
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon with bundlers like Vite/Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});


const ClinicDetails = () => {
    const [searchParams] = useSearchParams();
    const clinicId = searchParams.get('id');

    const [clinic, setClinic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [userName, setUserName] = useState(null);
    
    const [reviews, setReviews] = useState([]);
    const [reviewsToShow, setReviewsToShow] = useState(3);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState(''); // 'booking', 'review', 'auth'
    const [toast, setToast] = useState({ show: false, message: '' });

    // --- Authentication State ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    setUserName(userDoc.data().name);
                }
            } else {
                setUserName(null);
            }
        });
        return () => unsubscribe();
    }, []);

    // --- Fetch Clinic Data ---
    const fetchClinicDetails = useCallback(async () => {
        if (!clinicId) {
            setError("No clinic ID provided.");
            setLoading(false);
            return;
        }
        try {
            const docRef = doc(db, "clinics", clinicId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() };
                setClinic(data);
                const sortedReviews = (data.ratings || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setReviews(sortedReviews);
            } else {
                setError("Clinic not found.");
            }
        } catch (err) {
            console.error("Error fetching clinic:", err);
            setError("Failed to fetch clinic data.");
        } finally {
            setLoading(false);
        }
    }, [clinicId]);

    useEffect(() => {
        fetchClinicDetails();
    }, [fetchClinicDetails]);

    // --- Helper Functions ---
    const showToast = (message) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const openModal = (type) => {
        setModalType(type);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalType('');
    };
    
    // --- Render Functions ---
    const renderStarRating = (rating, sizeClass = "text-2xl") => {
        let stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(<span key={i} className={`star ${i <= rating ? 'filled' : ''} ${sizeClass}`}>&#9733;</span>);
        }
        return <div className="star-rating-display">{stars}</div>;
    };

    const calculateAverageRating = (ratings) => {
        if (!ratings || ratings.length === 0) return { average: 0, count: 0 };
        const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
        return { average: (sum / ratings.length).toFixed(1), count: ratings.length };
    };

    const renderHours = (hours) => {
        if (!hours) return <p className="text-slate-500">Please call for opening hours.</p>;
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days.map(day => (
            <div key={day} className="flex justify-between items-center border-b border-slate-100 py-2">
                <span className="font-medium text-slate-700">{day}</span>
                <span className="text-slate-500">{hours[day.toLowerCase()] || 'Closed'}</span>
            </div>
        ));
    };

    const renderFeaturedDoctor = (physician) => {
        if (!physician || !physician.name) return null;
        return (
            <div className="mt-8 pt-8 border-t border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Meet Our Lead Physician</h2>
                <div className="flex flex-col sm:flex-row items-center gap-8 bg-slate-50 p-6 rounded-lg">
                    <img src={physician.imageUrl || 'https://placehold.co/400x400/BEE3F8/2D3748?text=Doctor'} alt={physician.name} className="rounded-full w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 object-cover shadow-lg" />
                    <div>
                        <h3 className="text-2xl font-bold">{physician.name}</h3>
                        <p className="text-teal-600 font-semibold text-lg mb-2">{physician.title || ''}</p>
                        <p className="text-gray-700 leading-relaxed">{physician.bio || ''}</p>
                    </div>
                </div>
            </div>
        );
    };

    // --- UI State Display ---
    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-4 md:p-8">
                 <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3 space-y-4">
                        <div className="h-10 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                        <div className="h-6 bg-slate-200 rounded w-1/2 animate-pulse"></div>
                    </div>
                    <div className="lg:col-span-2 space-y-4">
                        <div className="h-64 bg-slate-200 rounded-xl animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-6xl mx-auto p-4 md:p-8">
                <div className="text-center p-10 bg-red-50 rounded-xl shadow-md border border-red-200">
                    <p className="text-red-700">{error}</p>
                </div>
            </div>
        );
    }
    
    if (!clinic) return null;
    
    const ratingInfo = calculateAverageRating(clinic.ratings);
    const position = clinic.coordinates ? [clinic.coordinates.lat, clinic.coordinates.lng] : null;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-800 transition-colors mb-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m15 18-6-6 6-6"/></svg>
                Back to all clinics
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 fade-in">
                {/* Left Column */}
                <div className="lg:col-span-3">
                    <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
                        {/* Header */}
                        <div className="flex flex-wrap justify-between items-center gap-2">
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">{clinic.name}</h1>
                            <div className="flex items-center text-amber-500 flex-shrink-0">
                                {renderStarRating(Math.round(ratingInfo.average))}
                                <div className="ml-2 flex items-baseline whitespace-nowrap">
                                    <span className="text-lg font-bold">{ratingInfo.average}</span>
                                    <span className="ml-1 text-sm text-slate-500">({ratingInfo.count} reviews)</span>
                                </div>
                            </div>
                        </div>
                        <p className="mt-2 text-lg text-slate-600">{clinic.address}</p>
                        
                        {/* Contact Info */}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-700">
                            <p className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-teal-500"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81 .7A2 2 0 0 1 22 16.92z"/></svg><span>{clinic.phone || 'N/A'}</span></p>
                            <p className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-teal-500"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg><span>{clinic.email || 'N/A'}</span></p>
                        </div>
                        
                        {/* Sections */}
                        <div className="mt-8 pt-8 border-t border-slate-200"><h2 className="text-2xl font-bold text-slate-800 mb-4">Services</h2><div className="flex flex-wrap gap-3">{(clinic.services || []).map(s => <span key={s} className="bg-slate-100 text-slate-700 text-sm font-medium px-4 py-2 rounded-full">{s}</span>)}</div></div>
                        <div className="mt-8 pt-8 border-t border-slate-200"><h2 className="text-2xl font-bold text-slate-800 mb-4">Opening Hours</h2><div className="space-y-2 text-slate-600">{renderHours(clinic.hours)}</div></div>
                        <div className="mt-8 pt-8 border-t border-slate-200"><h2 className="text-2xl font-bold text-slate-800 mb-4">About Our Clinic</h2><p className="text-gray-700 leading-relaxed">Welcome to {clinic.name}, your trusted partner in family health and wellness. Our mission is to provide comprehensive, patient-centered care in a compassionate and welcoming environment.</p></div>
                        <div className="mt-8 pt-8 border-t border-slate-200"><h2 className="text-2xl font-bold text-slate-800 mb-4">Our Facility</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-4"><img src="https://placehold.co/600x400/BEE3F8/2D3748?text=Lobby" alt="Clinic Lobby" className="rounded-lg shadow-md aspect-video object-cover"/><img src="https://placehold.co/600x400/C6F6D5/2D3748?text=Exam+Room" alt="Exam Room" className="rounded-lg shadow-md aspect-video object-cover"/><img src="https://placehold.co/600x400/E9D8FD/2D3748?text=Reception" alt="Reception Desk" className="rounded-lg shadow-md aspect-video object-cover"/></div></div>
                        {renderFeaturedDoctor(clinic.leadPhysician)}
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-8">
                    {position && (
                        <MapContainer center={position} zoom={15} scrollWheelZoom={false} style={{ height: '300px', width: '100%', borderRadius: '0.75rem', zIndex: 10 }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                            <Marker position={position}><Popup><b>{clinic.name}</b></Popup></Marker>
                        </MapContainer>
                    )}
                    <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Appointments</h2>
                        <p className="text-slate-600 mb-4">Ready to schedule your visit? Click below to book your appointment.</p>
                        <button onClick={() => openModal(user ? 'booking' : 'auth')} className="w-full bg-teal-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-teal-600">Book an Appointment</button>
                    </div>
                    <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Leave a Review</h2>
                        <button onClick={() => openModal(user ? 'review' : 'auth')} className="w-full bg-amber-500 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-amber-600">Write a Review</button>
                    </div>
                    <div className="bg-white p-8 mt-8 rounded-xl shadow-md border border-slate-200">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Patient Reviews</h2>
                        <div>
                            {reviews.length > 0 ? (
                                reviews.slice(0, reviewsToShow).map((review, index) => (
                                    <div key={index} className="border-t border-slate-200 pt-4 mt-4">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-slate-800">{review.userName}</span>
                                            {renderStarRating(review.rating, "text-lg")}
                                        </div>
                                        {review.review && <p className="text-slate-600 mt-2">{review.review}</p>}
                                    </div>
                                ))
                            ) : <p className="text-slate-500">No reviews yet.</p>}
                        </div>
                        {reviewsToShow < reviews.length && (
                             <button onClick={() => setReviewsToShow(reviewsToShow + 3)} className="w-full text-center mt-4 bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300">Load More Reviews</button>
                        )}
                    </div>
                </div>
            </div>

            {isModalOpen && <ModalContainer type={modalType} closeModal={closeModal} showToast={showToast} clinicData={clinic} currentUser={{uid: user?.uid, name: userName}} fetchClinicDetails={fetchClinicDetails} />}
            {toast.show && <div className="fixed bottom-5 right-5 bg-slate-800 text-white py-3 px-6 rounded-lg shadow-lg z-[60] fade-in"><p>{toast.message}</p></div>}
        </div>
    );
};


// Modal Component
const ModalContainer = ({ type, closeModal, showToast, clinicData, currentUser, fetchClinicDetails }) => {
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    
    const handleAuth = async (e, originalAction) => {
        e.preventDefault();
        const form = e.target;
        const name = form.name?.value;
        const email = form.email.value;
        const password = form.password.value;
        try {
            if (isRegisterMode) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, "users", userCredential.user.uid), { name, email });
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            // Auth state change will handle closing this modal and re-opening the correct one
        } catch (error) {
            console.error("Auth error:", error);
            showToast("Authentication failed.");
        }
    };
    
    let modalTitle = '';
    let modalBody = null;

    if (type === 'auth') {
        modalTitle = isRegisterMode ? "Register to Continue" : "Login to Continue";
        modalBody = (
            <form onSubmit={(e) => handleAuth(e, type)} className="w-full">
                <div className="space-y-4">
                    {isRegisterMode && <input name="name" type="text" placeholder="Full Name" required className="w-full p-3 border border-slate-300 rounded-md" />}
                    <input name="email" type="email" placeholder="Your Email" required className="w-full p-3 border border-slate-300 rounded-md" />
                    <input name="password" type="password" placeholder="Password (min. 6 characters)" required className="w-full p-3 border border-slate-300 rounded-md" />
                    <button type="submit" className="w-full bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-emerald-700">{isRegisterMode ? 'Register' : 'Sign In'}</button>
                </div>
                 <p className="text-sm text-slate-600 mt-4 text-center">
                    {isRegisterMode ? "Already have an account?" : "Don't have an account?"}
                    <button type="button" onClick={() => setIsRegisterMode(!isRegisterMode)} className="font-semibold text-emerald-600 hover:text-emerald-700 ml-1">{isRegisterMode ? 'Login here' : 'Register here'}</button>
                </p>
            </form>
        );
    } else if (type === 'booking') {
        const handleBookingSubmit = async (e) => {
            e.preventDefault();
            const form = e.target;
            const appointmentData = {
                clinicId: clinicData.id, clinicName: clinicData.name,
                patientName: form.patientName.value,
                patientPhone: form.patientPhone.value,
                appointmentDate: form.appointmentDate.value,
                userId: currentUser.uid, status: 'Pending'
            };
            if (!appointmentData.patientName || !appointmentData.patientPhone || !appointmentData.appointmentDate) {
                showToast("Please fill in all fields."); return;
            }
            try {
                await addDoc(collection(db, "appointments"), appointmentData);
                showToast("Appointment requested successfully!");
                closeModal();
            } catch (error) { showToast("Failed to request appointment."); }
        };
        modalTitle = "Request Appointment";
        modalBody = (
            <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label><input type="text" name="patientName" defaultValue={currentUser.name || ''} required className="w-full p-2 border border-slate-300 rounded-md" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label><input type="tel" name="patientPhone" required className="w-full p-2 border border-slate-300 rounded-md" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Preferred Date & Time</label><input type="datetime-local" name="appointmentDate" required className="w-full p-2 border border-slate-300 rounded-md" /></div>
                <button type="submit" className="w-full bg-teal-500 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-teal-600">Submit Request</button>
            </form>
        );
    } else if (type === 'review') {
        const handleReviewSubmit = async (e) => {
            e.preventDefault();
            const rating = e.target.rating.value;
            const reviewText = e.target.reviewText.value;
            if (!rating) { showToast("Please select a star rating."); return; }
            const newRating = { userId: currentUser.uid, userName: currentUser.name, rating: parseInt(rating), review: reviewText, createdAt: new Date().toISOString() };
            try {
                await updateDoc(doc(db, "clinics", clinicData.id), { ratings: arrayUnion(newRating) });
                showToast("Thank you for your review!");
                closeModal();
                fetchClinicDetails(); // Refresh data
            } catch (error) { showToast("Could not submit review."); }
        };
        modalTitle = "Leave a Review";
        modalBody = (
             <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="star-rating-input"><input type="radio" id="star5" name="rating" value="5" /><label htmlFor="star5">&#9733;</label><input type="radio" id="star4" name="rating" value="4" /><label htmlFor="star4">&#9733;</label><input type="radio" id="star3" name="rating" value="3" /><label htmlFor="star3">&#9733;</label><input type="radio" id="star2" name="rating" value="2" /><label htmlFor="star2">&#9733;</label><input type="radio" id="star1" name="rating" value="1" /><label htmlFor="star1">&#9733;</label></div>
                <textarea name="reviewText" rows="3" placeholder="Share your experience..." className="w-full p-2 border border-slate-300 rounded-md"></textarea>
                <button type="submit" className="w-full bg-amber-500 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-amber-600">Submit Review</button>
            </form>
        );
    }

    return (
        <div className="modal fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70] fade-in">
            <div className="modal-content bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-800">{modalTitle}</h2>
                    <button onClick={closeModal} className="text-slate-500 hover:text-slate-800 text-3xl leading-none">&times;</button>
                </div>
                <div>{modalBody}</div>
            </div>
        </div>
    );
};

export default ClinicDetails;

