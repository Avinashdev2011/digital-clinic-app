import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';
import CustomSelect from '../components/CustomSelect.jsx'; // Import the new component

// Data for the popular searches section, derived from index.html
const popularSearches = [
    { name: 'Family Medicine', service: 'General Medicine', bgColor: 'bg-blue-100', textColor: 'text-blue-600', hoverBg: 'hover:bg-blue-600', icon: <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2a.3.3 0 0 0-.2.3V5a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v2.3a.3.3 0 1 0 .5 0V9a2 2 0 0 1 2-2h1a2 2 0 0 0 2-2V2.3a.3.3 0 1 0-.5 0V5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 0-.5.5v2.3a.3.3 0 1 0 .5 0V8a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 1-.5-.5V2.3a.3.3 0 1 0-.5 0V5a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v2.3a.3.3 0 1 0 .5 0V9a2 2 0 0 1 2-2h1a2 2 0 0 0 2-2V2.3a.3.3 0 1 0-.5 0V5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 0-.5.5v2.3a.3.3 0 1 0 .5 0V8a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 1-.5-.5V2.3a.3.3 0 1 0-.5 0V5a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v2.3a.3.3 0 1 0 .5 0V9a2 2 0 0 1 2-2h1a2 2 0 0 0 2-2V2.3a.3.3 0 1 0-.5 0V5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 0-.5.5v2.3a.3.3 0 1 0 .5 0V8a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 1-.5-.5V2.3a.3.3 0 1 0-.5 0z"/><path d="M8 8v12a4 4 0 0 0 4 4h0a4 4 0 0 0 4-4V8"/></svg> },
    { name: 'Cardiology', service: 'Cardiology', bgColor: 'bg-red-100', textColor: 'text-red-600', hoverBg: 'hover:bg-red-600', icon: <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.7-1 2.1 4.3 1.4-2.3h4.1"/></svg> },
    { name: 'Dentistry', service: 'Dental Care', bgColor: 'bg-sky-100', textColor: 'text-sky-600', hoverBg: 'hover:bg-sky-600', icon: <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11.2 2c-1 .4-2 1-2.6 2.4-2 3.9-2 6.6-.4 8.1.8 1 1.6.3 2.2-.4.6-.8.2-2-.7-3.2-1-1-1.2-2.3-.8-3.2.4-.8 1.2-.8 2-.4.8.4 1.2 1.2 1.2 2.3 0 1.1-.3 2.2-1 3.2-1 1.3-1.4 2.4-.8 3.2.6.7 1.4 1 2.2.4 1.6-1.5 1.6-4.2-.4-8.1-.6-1.4-1.6-2-2.6-2.4-1-.4-2.1-.4-3.1 0z"/><path d="M5.4 13.8c-2.3 2.1-2.8 4.6-1.8 6.1 1 1.5 3 2 5.4 1 2.4-1 2.8-3.5 1.8-5.1-1-1.6-3-2-5.4-2z"/><path d="M18.6 13.8c2.3 2.1 2.8 4.6 1.8 6.1-1 1.5-3 2-5.4 1-2.4-1-2.8-3.5-1.8-5.1 1-1.6 3-2 5.4-2z"/></svg> },
    { name: 'Orthopedics', service: 'Orthopedics', bgColor: 'bg-indigo-100', textColor: 'text-indigo-600', hoverBg: 'hover:bg-indigo-600', icon: <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a1 1 0 0 1 1 1v2.536a2 2 0 0 0 2.28 1.992c.287-.04 1.233-.22 2.373-1.11a1 1 0 0 1 1.413.218l.22.366A12.002 12.002 0 0 1 12 22a12.002 12.002 0 0 1-7.286-15.004l.22-.366a1 1 0 0 1 1.414-.218c1.14 .89 2.086 1.07 2.373 1.11A2 2 0 0 0 11 5.536V3a1 1 0 0 1 1-1z"/></svg> },
    { name: 'Pediatrics', service: 'Pediatrics', bgColor: 'bg-emerald-100', textColor: 'text-emerald-600', hoverBg: 'hover:bg-emerald-600', icon: <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12.5a5 5 0 0 0-10 0"/><path d="M9 6.5a5 5 0 0 1 10 0"/><path d="M12.5 2a5 5 0 0 0 0 10"/><path d="M18.5 22a5 5 0 0 0 0-10"/><path d="M2 17.5a5 5 0 0 0 10 0"/></svg> },
    { name: 'Dermatology', service: 'Dermatology', bgColor: 'bg-pink-100', textColor: 'text-pink-600', hoverBg: 'hover:bg-pink-600', icon: <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/></svg> },
    { name: 'Gastroenterology', service: 'Gastroenterology', bgColor: 'bg-orange-100', textColor: 'text-orange-600', hoverBg: 'hover:bg-orange-600', icon: <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 20a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M11 6h2"/><path d="M10 10v0a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2v0"/></svg> },
    { name: 'Neurology', service: 'Neurology', bgColor: 'bg-cyan-100', textColor: 'text-cyan-600', hoverBg: 'hover:bg-cyan-600', icon: <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4.5 4.5 0 0 0-4.5 4.5v0a4.5 4.5 0 0 0 1.8 3.5a1 1 0 0 1 .4 1.5a1 1 0 0 0 .5 1.5a4.5 4.5 0 0 1 4.6 0a1 1 0 0 1 .5 1.5a1 1 0 0 0 .4 1.5a4.5 4.5 0 0 0 1.8-3.5v0A4.5 4.5 0 0 0 12 2Z"/><path d="M12 13v1"/><path d="M14.5 10.5v0a1 1 0 0 0-1-1h-3a1 1 0 0 0-1 1v0"/><path d="M12 22a4.5 4.5 0 0 1-4.5-4.5v0a4.5 4.5 0 0 1 1.8-3.5a1 1 0 0 0 .4-1.5a1 1 0 0 1 .5-1.5a4.5 4.5 0 0 0 4.6 0a1 1 0 0 1 .5 1.5a1 1 0 0 0 .4 1.5a4.5 4.5 0 0 1 1.8 3.5v0A4.5 4.5 0 0 1 12 22Z"/><path d="M12 11v-1"/><path d="M9.5 13.5v0a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v0"/><path d="M11.5 3.5a1 1 0 0 0 0 2"/><path d="M12.5 3.5a1 1 0 0 1 0 2"/><path d="M11.5 20.5a1 1 0 0 0 0-2"/><path d="M12.5 20.5a1 1 0 0 1 0-2"/><path d="M16 8a1 1 0 0 0-2-2"/><path d="M8 8a1 1 0 0 1 2-2"/><path d="M16 16a1 1 0 0 0-2 2"/><path d="M8 16a1 1 0 0 1 2 2"/></svg> },
    { name: 'Ophthalmology', service: 'Ophthalmology', bgColor: 'bg-gray-200', textColor: 'text-gray-600', hoverBg: 'hover:bg-gray-600', icon: <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg> },
];

const CLINICS_PER_LOAD = 6;

const Home = () => {
    const [allClinics, setAllClinics] = useState([]);
    const [filteredClinics, setFilteredClinics] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState('');
    const [loading, setLoading] = useState(true);
    const [clinicsToShow, setClinicsToShow] = useState(CLINICS_PER_LOAD);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const [showMicPopup, setShowMicPopup] = useState(false);
    const [micPopupMessage, setMicPopupMessage] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');

    useEffect(() => {
        const fetchClinics = async () => {
            setLoading(true);
            try {
                const querySnapshot = await getDocs(collection(db, "clinics"));
                const clinicsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllClinics(clinicsData);

                const services = new Set();
                clinicsData.forEach(clinic => {
                    if (clinic.services) clinic.services.forEach(service => services.add(service));
                });
                setDepartments(Array.from(services).sort());
            } catch (error) {
                console.error("Error fetching clinics: ", error);
            } finally {
                setLoading(false);
            }
        };
        fetchClinics();
        
        // Initialize speech recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = true; // Keep recognition continuous
            recognition.interimResults = true; // Enable interim results
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                let finalTranscript = '';
                let interim = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interim += transcript;
                    }
                }
                
                if (finalTranscript) {
                    setSearchTerm(prev => prev + finalTranscript);
                }
                
                setInterimTranscript(interim);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                // Don't stop listening on error, just show message
                setInterimTranscript('Error: ' + event.error);
            };

            recognition.onend = () => {
                // Only stop listening if explicitly requested
                if (isListening) {
                    // Restart recognition if still supposed to be listening
                    try {
                        recognition.start();
                    } catch (e) {
                        console.log('Recognition restart failed:', e);
                    }
                } else {
                    setInterimTranscript('');
                }
            };

            recognitionRef.current = recognition;
        }
    }, [isListening]); // Add isListening as dependency

    useEffect(() => {
        const results = allClinics.filter(clinic => {
            const searchTermLower = searchTerm.toLowerCase();
            // Ensure all properties are strings before calling toLowerCase()
            const nameMatch = (clinic.name || '').toLowerCase().includes(searchTermLower);
            const addressMatch = (clinic.address || '').toLowerCase().includes(searchTermLower);
            
            // Safe service matching with proper null checks
            const serviceMatch = (clinic.services || []).some(s => 
                s && typeof s === 'string' && s.toLowerCase().includes(searchTermLower)
            );
            const deptMatch = !selectedDept || (clinic.services || []).includes(selectedDept);
            
            return (nameMatch || addressMatch || serviceMatch) && deptMatch;
        });
        setFilteredClinics(results);
        setClinicsToShow(CLINICS_PER_LOAD); // Reset count on filter change
    }, [searchTerm, selectedDept, allClinics]);
    
    const handlePopularSearch = (service) => {
        setSearchTerm(''); // Clear search term
        setSelectedDept(service);
        document.getElementById('clinic-list-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleLoadMore = () => {
        setClinicsToShow(prevCount => prevCount + CLINICS_PER_LOAD);
    };

    const calculateAverageRating = (ratings) => {
        if (!ratings || ratings.length === 0) return { average: 0, count: 0 };
        const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
        return { average: (sum / ratings.length).toFixed(1), count: ratings.length };
    };

    const toggleVoiceSearch = () => {
        if (recognitionRef.current) {
            if (isListening) {
                // Stop listening
                recognitionRef.current.stop();
                setIsListening(false);
                setInterimTranscript('');
            } else {
                // Start listening
                setSearchTerm(''); // Clear current search term
                setInterimTranscript(''); // Clear interim transcript
                
                // Show popup notification
                setMicPopupMessage('Allow microphone access when prompted by your browser');
                setShowMicPopup(true);
                
                // Hide popup after 3 seconds
                setTimeout(() => {
                    setShowMicPopup(false);
                }, 3000);
                
                try {
                    recognitionRef.current.start();
                    setIsListening(true);
                } catch (e) {
                    console.error('Failed to start recognition:', e);
                    alert('Failed to start voice recognition. Please try again.');
                }
            }
        } else {
            alert('Speech recognition is not supported in your browser. Please try Chrome or Edge.');
        }
    };

    return (
        <div className="fade-in-page">
            {/* Microphone Access Popup */}
            {showMicPopup && (
                <div className="fixed top-4 right-4 bg-teal-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fadeIn">
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>{micPopupMessage}</span>
                    </div>
                </div>
            )}
            
            {/* Hero Section */}
            <div className="bg-white">
                <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl md:text-6xl fade-in">
                        Find Your Trusted Clinic
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-500 fade-in" style={{ animationDelay: '0.2s' }}>
                        Easily search for clinics, view details, and book your appointments online.
                    </p>
                    <div className="mt-8 fade-in" style={{ animationDelay: '0.4s' }}>
                        <a href="#clinic-list-section" className="inline-block bg-teal-500 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-teal-600 transition-transform transform hover:-translate-y-1">
                            Get Started
                        </a>
                    </div>
                </div>
            </div>

            {/* Clinic Listing Section */}
            <div id="clinic-list-section" className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Popular Searches Section */}
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-slate-800 mb-6 text-center">Popular Searches</h2>
                        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                            {popularSearches.map((search) => (
                                <button key={search.name} onClick={() => handlePopularSearch(search.service)} className="text-center group">
                                    <div className={`w-20 h-20 ${search.bgColor} ${search.textColor} rounded-full flex items-center justify-center mx-auto transition-all duration-300 ${search.hoverBg} hover:text-white hover:shadow-lg`}>
                                        {search.icon}
                                    </div>
                                    <p className="mt-3 font-semibold text-slate-700">{search.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">Featured Clinics</h2>
                    
                    {/* Filters */}
                    <div className="mb-8 flex flex-col md:flex-row gap-4">
                        <div className="relative w-full">
                            <input 
                                type="text" 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                placeholder="Search by name, address, or service..." 
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-shadow pl-10" 
                            />
                            <button 
                                onClick={toggleVoiceSearch}
                                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isListening ? 'text-red-500' : 'text-slate-400'} hover:text-teal-600`}
                                aria-label={isListening ? "Stop voice search" : "Start voice search"}
                            >
                                {isListening ? (
                                    // Stop microphone icon (filled red)
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"></path>
                                        <path d="M19 10v1a7 7 0 0 1-14 0v-1"></path>
                                        <line x1="12" y1="19" x2="12" y2="22"></line>
                                        <line x1="8" y1="22" x2="16" y2="22"></line>
                                    </svg>
                                ) : (
                                    // Microphone icon
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                                        <path d="M19 10v1a7 7 0 0 1-14 0v-1"></path>
                                        <line x1="12" y1="19" x2="12" y2="22"></line>
                                        <line x1="8" y1="22" x2="16" y2="22"></line>
                                    </svg>
                                )}
                            </button>
                        </div>
                        
                        <CustomSelect
                            options={departments}
                            selected={selectedDept}
                            onChange={setSelectedDept}
                            placeholder="All Departments"
                        />
                    </div>

                    {/* Clinic List */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="bg-white p-6 rounded-xl shadow-md border border-slate-200 animate-pulse">
                                    <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
                                    <div className="h-4 bg-slate-200 rounded w-12 mb-4"></div>
                                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredClinics.length > 0 ? filteredClinics.slice(0, clinicsToShow).map(clinic => {
                                    const ratingInfo = calculateAverageRating(clinic.ratings);
                                    return (
                                        <div key={clinic.id} className="bg-white p-6 rounded-xl shadow-md border border-slate-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
                                            <div className="flex-grow">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="text-xl font-bold text-slate-800 pr-2">{clinic.name}</h3>
                                                    <div className="flex items-center gap-1 text-sm font-bold text-amber-500 flex-shrink-0">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                                        <span>{ratingInfo.average}</span>
                                                        <span className="text-xs text-slate-400 font-medium">({ratingInfo.count})</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-500 mt-1 mb-4">{clinic.address}</p>
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {(clinic.services || []).slice(0, 3).map(service => <span key={service} className="bg-teal-50 text-teal-700 text-xs font-medium px-2.5 py-1 rounded-full">{service}</span>)}
                                                    {(clinic.services || []).length > 3 && <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-full">+{(clinic.services || []).length - 3} more</span>}
                                                </div>
                                            </div>
                                            <Link to={`/clinic_details.html?id=${clinic.id}`} className="mt-4 w-full text-center bg-teal-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors">
                                                View Details
                                            </Link>
                                        </div>
                                    )
                                }) : (
                                    <div className="text-center p-10 col-span-full">
                                        <p className="text-slate-600">No clinics found matching your criteria.</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Load More Button */}
                            {clinicsToShow < filteredClinics.length && (
                                <div className="text-center mt-8">
                                    <button onClick={handleLoadMore} className="bg-gray-200 text-gray-700 font-semibold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors">
                                        Load More
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;

