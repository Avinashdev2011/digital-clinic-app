import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-slate-200">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
                <div className="flex justify-center gap-6 mb-4">
                    <Link to="/" className="text-sm text-slate-500 hover:text-teal-600">Home</Link>
                    <Link to="/patient_dashboard.html" className="text-sm text-slate-500 hover:text-teal-600">Patient Portal</Link>
                    <Link to="/clinic_dashboard.html" className="text-sm text-slate-500 hover:text-teal-600">Clinic Portal</Link>
                    <Link to="/admin_dashboard.html" className="text-sm text-slate-500 hover:text-teal-600">Admin Portal</Link>
                </div>
                <p className="text-base text-gray-400">&copy; 2025 Virtual Clinic Hub. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;

