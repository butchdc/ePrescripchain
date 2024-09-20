import './App.css';
import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import About from './views/about';
import Navbar from './views/navbar';
import RegulatoryAuthorityRegistration from './views/forms/regulatoryauthorityregistration'; 
import PhysicianRegistration from './views/forms/physicianregistration'; 
import PharmacyRegistration from './views/forms/pharmacyregistration'; 
import PatientRegistration from './views/forms/patientregistration'; 
import RedirectToHome from './views/redirecttohome';
import QueryPage from './views/querypage';
import ConfigPage from './components/configpage';
import PrescriptionForm from './views/forms/prescriptionform';
import DownloadFromIPFS from './components/downloadfromipfs';
import Sample from './views/sample';
import RegulatoryHome from './views/homes/regulatoryHome';
import AccessPrescription from './views/forms/accessprescription';
import { getUserRoleAndAttributes } from './utils/userqueryutils';
import Home from './views/homes/home';

const App = () => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ethereumAvailable, setEthereumAvailable] = useState(true);
  const currentAccountRef = useRef(null);

  const fetchUserRole = async (userAddress) => {
    setLoading(true);
    setError(null);

    try {
      if (!window.ethereum) throw new Error('MetaMask is not installed');
      setEthereumAvailable(true);

      const { role: fetchedRole, attributes } = await getUserRoleAndAttributes(userAddress);
      setRole(fetchedRole);

    } catch (err) {
      setError(err.message);
      if (err.message === 'MetaMask is not installed') setEthereumAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getUserAddress = async () => {
      if (!window.ethereum) {
        setEthereumAvailable(false);
        setLoading(false);
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) fetchUserRole(accounts[0]);
      } catch (err) {
        console.error('Failed to get user address:', err);
        setLoading(false);
      }
    };

    getUserAddress();

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0 && accounts[0] !== currentAccountRef.current) {
        currentAccountRef.current = accounts[0];
        fetchUserRole(accounts[0]);
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const ErrorBoundary = ({ error, children }) => (error ? <div>Error: {error}</div> : children);

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      {!ethereumAvailable && (
        <div className="alert alert-warning" role="alert">
          MetaMask is not installed. Some features may not be available.
        </div>
      )}
      <Navbar />
      <Routes>
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/sample" element={<Sample />} />
        <Route
          path="*"
          element={
            <ErrorBoundary error={error}>
              <Routes>
                <Route path="/about" element={<About />} />
                {role === 'Administrator' && (
                  <>
                    <Route path="/" element={<About />} /> 
                    <Route path="/register-regulatory-authority" element={<RegulatoryAuthorityRegistration />} />
                    <Route path="/query-page" element={<QueryPage />} />
                    <Route path="/ipfs-query" element={<DownloadFromIPFS />} />
                  </>
                )}
                {role === 'Regulatory Authority' && (
                  <>
                    <Route path="/" element={<RegulatoryHome />} />
                    <Route path="/register-physician" element={<PhysicianRegistration />} />
                    <Route path="/register-pharmacy" element={<PharmacyRegistration />} />
                    <Route path="/register-patient" element={<PatientRegistration />} />
                    <Route path="/access-prescription" element={<AccessPrescription />} />
                    <Route path="/access-prescription/:pID" element={<AccessPrescription />} />
                    <Route path="/query-page" element={<QueryPage />} />
                    <Route path="/ipfs-query" element={<DownloadFromIPFS />} />
                  </>
                )}
                {role === 'Physician' && (
                  <>
                    <Route path='/' element={<Home />} />
                    <Route path="/create-prescription" element={<PrescriptionForm />} />
                    <Route path="/access-prescription" element={<AccessPrescription />} />
                    <Route path="/access-prescription/:pID" element={<AccessPrescription />} />
                  </>
                )}
                {role === 'Pharmacy' && (
                  <>
                    <Route path='/' element={<Home />} />
                    <Route path="/access-prescription" element={<AccessPrescription />} />
                    <Route path="/access-prescription/:pID" element={<AccessPrescription />} />
                  </>
                )}
                {role === 'Patient' && (
                  <>
                    <Route path='/' element={<Home />} />
                    <Route path="/access-prescription" element={<AccessPrescription />} />
                    <Route path="/access-prescription/:pID" element={<AccessPrescription />} />
                  </>
                )}
                <Route path="*" element={<RedirectToHome />} />
              </Routes>
            </ErrorBoundary>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
