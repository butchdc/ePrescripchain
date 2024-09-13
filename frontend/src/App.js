import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import About from './views/about';
import Navbar from './views/navbar';
import RegulatoryAuthorityRegistration from './views/forms/regulatoryauthorityregistration'; 
import PhysicianRegistration from './views/forms/physicianregistration'; 
import PharmacyRegistration from './views/forms/pharmacyregistration'; 
import PatientRegistration from './views/forms/patientregistration'; 
import useUserRole from './hooks/useuserrole';
import RedirectToHome from './views/redirecttohome';
import QueryPage from './views/querypage';
import ConfigPage from './components/configpage';
import PrescriptionForm from './views/forms/prescriptionform';
import DownloadFromIPFS from './components/downloadfromipfs';
import Sample from './views/sample';
import RegulatoryHome from './views/homes/regulatoryHome';
import PhysicianHome from './views/homes/physicianHome';
import AccessPrescription from './views/forms/accessprescription';
import PharmacyHome from './views/homes/pharmacyHome';

// Component to handle errors
const ErrorBoundary = ({ error, children }) => {
  if (error) {
    return <div>Error: {error}</div>;
  }
  return children;
};

function App() {
  const { role, loading, error, ethereumAvailable } = useUserRole();

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <div className="App">
        {!ethereumAvailable && (
          <div className="alert alert-warning" role="alert">
            MetaMask is not installed. Some features may not be available.
          </div>
        )}
        <Navbar role={role} />
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
                      <Route path="/query-page" element={<QueryPage />} />
                      <Route path="/ipfs-query" element={<DownloadFromIPFS />} />
                    </>
                  )}
                  {role === 'Physician' && (
                    <>
                      <Route path='/' element={<PhysicianHome />} />
                      <Route path='/create-prescription' element={<PrescriptionForm />} />
                      <Route path='/access-prescription/' element={<AccessPrescription />} />
                    </>
                  )}
                  {role === 'Pharmacy' && (
                    <>
                      <Route path='/' element={<PharmacyHome />} />
                      <Route path='/access-prescription/' element={<AccessPrescription />} />
                    </>
                  )}
                  <Route path="*" element={<RedirectToHome />} />
                </Routes>
              </ErrorBoundary>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
