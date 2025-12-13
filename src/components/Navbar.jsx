import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig.js';

const Navbar = () => {
    const [user, setUser] = useState(null);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = () => {
        signOut(auth);
        setMobileMenuOpen(false);
    };

    const navLinks = [
        { path: "/", label: "Home" },
        { path: "/#clinic-list-section", label: "Find a Clinic", isAnchor: true },
        { path: "/patient_dashboard.html", label: "My Dashboard" }
    ];

    const getLinkClass = ({ isActive }) =>
        `nav-link text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'active' : ''}`;

    const getMobileLinkClass = ({ isActive }) =>
        `mobile-nav-link text-gray-600 hover:bg-gray-100 block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'active' : ''}`;

    return (
        <nav className="navbar-canvas sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                             <div className="w-10 h-10 bg-teal-500 text-white flex items-center justify-center rounded-lg shadow-md">
                               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-hospital"><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M18 18h-5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h5v7z"/><path d="M11 2a2 2 0 0 1 2 2v2h-4V4a2 2 0 0 1 2-2z"/><path d="M14 2v4"/><path d="M10 2v4"/><path d="M19 18v2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-2"/><path d="M10 11V9"/></svg>
                            </div>
                            <span className="font-bold text-xl text-slate-800">Virtual Clinic</span>
                        </Link>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            {navLinks.map(link => (
                                link.isAnchor 
                                ? <a key={link.label} href={link.path} className="nav-link text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">{link.label}</a>
                                : <NavLink key={link.label} to={link.path} className={getLinkClass}>{link.label}</NavLink>
                            ))}
                            {user ? (
                                <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600 transition-colors">Logout</button>
                            ) : (
                                <Link to="/patient_dashboard.html" className="bg-teal-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-600 transition-colors">Login / Register</Link>
                            )}
                        </div>
                    </div>
                    <div className="-mr-2 flex md:hidden">
                        <button type="button" onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} className="bg-transparent inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
                            {isMobileMenuOpen ? (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            ) : (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            {isMobileMenuOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                         {navLinks.map(link => (
                            link.isAnchor 
                            ? <a key={link.label} href={link.path} onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link text-gray-600 hover:bg-gray-100 block px-3 py-2 rounded-md text-base font-medium">{link.label}</a>
                            : <NavLink key={link.label} to={link.path} onClick={() => setMobileMenuOpen(false)} className={getMobileLinkClass}>{link.label}</NavLink>
                        ))}
                         {user ? (
                            <button onClick={handleLogout} className="w-full text-left bg-red-500 text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition-colors">Logout</button>
                        ) : (
                            <Link to="/patient_dashboard.html" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link bg-teal-500 text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-teal-600 transition-colors">Login / Register</Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;

