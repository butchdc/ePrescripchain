import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './views/home';
import Navbar from './views/navbar';
import RegulatoryAuthorityRegistration from './views/regulatoryauthorityregistration'; 
import PhysicianRegistration from './views/physicianregistration'; 
import PharmacyRegistration from './views/pharmacyregistration'; 
import PatientRegistration from './views/patientregistration'; 
import useUserRole from './hooks/useuserrole';
import RedirectToHome from './views/redirecttohome';
import QueryPage from './views/querypage';
import ConfigPage from './components/configpage';

function App() {
  const { role, loading, error, ethereumAvailable } = useUserRole();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Router>
      <div className="App">
        {/* Show MetaMask alert if MetaMask is not available */}
        {!ethereumAvailable && (
          <div className="alert alert-warning" role="alert">
            MetaMask is not installed. Some features may not be available.
          </div>
        )}
        <Navbar role={role} />
        <Routes>
          <Route path="/" element={<Home />} />
          {role === 'Administrator' && (
            <>
              <Route path="/register-regulatory-authority" element={<RegulatoryAuthorityRegistration />} />
              <Route path="/query-page" element={<QueryPage />} />
            </>
          )}
          {role === 'Regulatory Authority' && (
            <>
              <Route path="/register-physician" element={<PhysicianRegistration />} />
              <Route path="/register-pharmacy" element={<PharmacyRegistration />} />
              <Route path="/register-patient" element={<PatientRegistration />} />
              <Route path="/query-page" element={<QueryPage />} />
            </>
          )}
          <Route path='/config' element={<ConfigPage />} />
          <Route path="*" element={<RedirectToHome />} /> 
        </Routes>
      </div>
    </Router>
  );
}

export default App;
