import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';

// Import Components
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';

// Import Pages
import Home from './pages/Home.jsx';
import PatientDashboard from './pages/PatientDashboard.jsx';
import ClinicDashboard from './pages/ClinicDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ClinicDetails from './pages/ClinicDetails.jsx';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/index.html" element={<Home />} />
            <Route path="/patient_dashboard.html" element={<PatientDashboard />} />
            <Route path="/clinic_dashboard.html" element={<ClinicDashboard />} />
            <Route path="/admin_dashboard.html" element={<AdminDashboard />} />
            <Route path="/clinic_details.html" element={<ClinicDetails />} />
          </Routes>
        </main>
        <Footer />
        <Analytics />
      </div>
    </Router>
  );
}

export default App;

