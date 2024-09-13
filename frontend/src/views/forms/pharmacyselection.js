import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { initWeb3, initContracts } from '../../utils/web3utils'; 
import { downloadFromIPFS } from '../../utils/apiutils'; 

const apiBaseURL = process.env.REACT_APP_API_BASE_URL;

function PharmacySelection({ prescriptionID, onAssignmentSuccess }) {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [selectedPharmacy, setSelectedPharmacy] = useState(null);
    const [web3, setWeb3] = useState(null);
    const [contracts, setContracts] = useState(null);
    const [currentUser, setCurrentUser] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [prescriptionDetails, setPrescriptionDetails] = useState(null);

    useEffect(() => {
        const initialize = async () => {
            try {
                const web3Instance = await initWeb3();
                setWeb3(web3Instance);
                const contractsInstance = await initContracts(web3Instance);
                setContracts(contractsInstance);
                const [account] = await web3Instance.eth.getAccounts();
                setCurrentUser(account);
            } catch (err) {
                setError(`Initialization error: ${err.message}`);
            }
        };
        initialize();
    }, []);

    useEffect(() => {
        if (!web3 || !contracts || !currentUser || !prescriptionID) return;

        const fetchPrescriptionData = async () => {
            setLoading(true);
            try {
                const prescriptionData = await contracts.prescriptionContract.methods.accessPrescription(prescriptionID).call({ from: currentUser });
                const patientIPFSHash = await contracts.registrationContract.methods.getPatientIPFSHash(prescriptionData[0]).call();
                const patientData = await downloadFromIPFS(patientIPFSHash);
                setPrescriptionDetails({
                    prescriptionID,
                    patientName: patientData.name,
                    patientAddress: patientData.patientAddress,
                    patientNHI: patientData.nhiNumber
                });
            } catch (err) {
                console.error('Error fetching prescription data:', err);
                setError('Error fetching prescription data');
            } finally {
                setLoading(false);
            }
        };
        fetchPrescriptionData();
    }, [web3, contracts, currentUser, prescriptionID]);

    useEffect(() => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        const fetchSuggestions = async () => {
            try {
                const response = await axios.get(`${apiBaseURL}entities/pharmacies`, {
                    params: { pharmacyName: `%${query}%` }
                });
                setSuggestions(response.data);
            } catch (error) {
                console.error("Error fetching suggestions:", error);
                setError('Error fetching pharmacies');
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (pharmacy) => {
        setSelectedPharmacy(pharmacy);
        setQuery('');
        setSuggestions([]);
    };

    const handleAssign = async () => {
        if (!web3 || !contracts || !currentUser || !prescriptionID || !selectedPharmacy) {
            setError('Incomplete data for assignment');
            return;
        }

        setLoading(true);
        try {
            await contracts.prescriptionContract.methods
                .selectPharmacy(prescriptionID, selectedPharmacy.address)
                .send({ from: currentUser });

            const { data: [prescription] = [] } = await axios.get(`${apiBaseURL}prescriptions`, { params: { prescriptionID } });
            if (!prescription) throw new Error('No prescription found with the given ID.');
        
            // Update the prescription with the assigned pharmacy
            await axios.post(`${apiBaseURL}prescriptions`, { ...prescription, assignedTo: selectedPharmacy.address });

            onAssignmentSuccess();
        } catch (err) {
            console.error('Error assigning pharmacy:', err);
            setError('Error assigning pharmacy');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            {prescriptionDetails && (
                <div style={{ fontSize: 16 }}>
                    <div style={{ fontSize: 20 }}>Prescription ID: {prescriptionDetails.prescriptionID}</div>
                    <div>{prescriptionDetails.patientName}</div>
                    <div>{prescriptionDetails.patientAddress}</div>
                    <div>{prescriptionDetails.patientNHI}</div>
                </div>
            )}
            {selectedPharmacy && (
                <div>
                    <hr />
                    <h5>Selected Pharmacy:</h5>
                    <div>{selectedPharmacy.pharmacyName}</div>
                    <div>{selectedPharmacy.pharmacyAddress}</div>
                    <div style={{ fontSize: 12 }}>{selectedPharmacy.address}</div>
                    <button 
                        className="btn btn-sm btn-success"
                        onClick={handleAssign}
                    >
                        Assign
                    </button>
                </div>
            )}
            {error && <div className="alert alert-danger mt-3">{error}</div>}
            {loading && <div>Loading...</div>}
            <hr />
            <h5>Search Pharmacy</h5>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter at least 3 characters to search available pharmacies..."
                className="form-control"
            />
            <div className="mt-2">
                {query.length >= 3 && (
                    suggestions.length > 0 ? (
                        <ul className="list-group">
                            {suggestions.map((pharmacy) => (
                                <li
                                    key={pharmacy.address} 
                                    className="list-group-item"
                                    onClick={() => handleSelect(pharmacy)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className='vstack'>
                                        <div>{pharmacy.pharmacyName}</div>
                                        <div style={{ fontSize: 12 }} className='text-secondary'>{pharmacy.pharmacyAddress}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="alert alert-info">No pharmacies found.</div>
                    )
                )}
            </div>
        </div>
    );
}

export default PharmacySelection;
