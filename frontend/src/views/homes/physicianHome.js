import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { initWeb3, initContracts } from '../../utils/web3utils';
import { downloadFromIPFS } from '../../utils/apiutils';
import PharmacySelection from '../forms/pharmacyselection'; 
import { Link } from 'react-router-dom';

const apiBaseURL = process.env.REACT_APP_API_BASE_URL;

const statusDescriptions = [
    "Awaiting Pharmacy Assignment",
    "Awaiting For Confirmation",
    "Preparing",
    "Ready For Collection",
    "Collected",
    "Cancelled",
    "Reassigned"
];

const PhysicianHome = () => {
    const [state, setState] = useState({
        prescriptions: [],
        loading: true,
        error: null,
        web3: null,
        currentUser: '',
        contracts: null,
        selectedPrescriptionID: null,
        assignmentSuccess: false,
    });

    const closeButtonRef = useRef(null);

    useEffect(() => {
        const initialize = async () => {
            try {
                const web3Instance = await initWeb3();
                const contractsInstance = await initContracts(web3Instance);
                const accounts = await web3Instance.eth.getAccounts();

                setState(prevState => ({
                    ...prevState,
                    web3: web3Instance,
                    contracts: contractsInstance,
                    currentUser: accounts[0],
                    loading: false,
                }));
            } catch (err) {
                setState(prevState => ({
                    ...prevState,
                    error: `Initialization error: ${err.message}`,
                    loading: false,
                }));
            }
        };

        initialize();
    }, []);

    useEffect(() => {
        const fetchPrescriptions = async () => {
            const { web3, currentUser, contracts } = state;

            if (!web3 || !currentUser || !contracts) return;

            setState(prevState => ({ ...prevState, loading: true, assignmentSuccess: false }));

            try {
                const response = await axios.get(`${apiBaseURL}prescriptions`, {
                    params: {
                      createdBy: currentUser,
                      status: 'In-Progress' 
                    }
                  });

                if (response.data.message && response.data.message.includes('No prescriptions found')) {
                    setState(prevState => ({ ...prevState, prescriptions: [], error: null, loading: false }));
                    return;
                }

                const prescriptionsData = await Promise.all(
                    response.data.map(async (prescription) => {
                        try {
                            const patientAddress = prescription.address;

                            if (!web3.utils.isAddress(patientAddress)) {
                                throw new Error(`Invalid patient address: ${patientAddress}`);
                            }

                            const patientIPFSHash = await contracts.registrationContract.methods.getPatientIPFSHash(patientAddress).call();
                            const patientData = await downloadFromIPFS(patientIPFSHash);

                            const prescriptionData = await contracts.prescriptionContract.methods.accessPrescription(prescription.prescriptionID).call({ from: currentUser });

                            let pharmacyData = null;
                            const pharmacyAddress = await contracts.prescriptionContract.methods.getAssignedPharmacy(prescription.prescriptionID).call({ from: currentUser });
                            if (pharmacyAddress>0) {
                                const pharmacyIPFSHash = await contracts.registrationContract.methods.getPharmacyIPFSHash(pharmacyAddress).call();
                                pharmacyData = await downloadFromIPFS(pharmacyIPFSHash);
                            }

                            return {
                                id: prescription.prescriptionID,
                                patientAddress: prescriptionData[0],
                                patientName: patientData.name,
                                patientNHI: patientData.nhiNumber,
                                date: prescription.date,
                                pharmacyName: pharmacyData ? pharmacyData.pharmacyName : null,
                                pharmacyAddress: pharmacyData ? pharmacyData.pharmacyAddress : null,
                                status: prescriptionData[2]
                            };
                        } catch (err) {
                            console.error(`Failed to fetch data for patient ${prescription.address}:`, err);
                            return null;
                        }
                    })
                );

                setState(prevState => ({
                    ...prevState,
                    prescriptions: prescriptionsData.filter(data => data !== null),
                    error: null,
                    loading: false,
                }));
            } catch (err) {
                setState(prevState => ({
                    ...prevState,
                    error: `Failed to fetch prescriptions: ${err.message}`,
                    prescriptions: [],
                    loading: false,
                }));
            }
        };

        fetchPrescriptions();
    }, [state.web3, state.currentUser, state.contracts, state.assignmentSuccess]);

    const formatDate = (timestamp) => new Date(timestamp).toISOString().split('T')[0];

    const handleAssign = (prescriptionID) => setState(prevState => ({ ...prevState, selectedPrescriptionID: prescriptionID }));

    const handleAssignmentSuccess = () => {
        setState(prevState => ({ ...prevState, assignmentSuccess: true }));
        if (closeButtonRef.current) {
            closeButtonRef.current.click();
        }
    };

    const { prescriptions, loading, error, selectedPrescriptionID } = state;

    return (
        <div className="container bgcolor2 p-3">
            <h4 className='mb-3'>Physician Dashboard</h4>
            {loading && <p>Loading...</p>}
            {error && <p className="text-danger">Error: {error}</p>}
            {!loading && !error && (
                <div>
                    <h6 className=''>MY ACTIVE PRESCRIPTIONS</h6>
                    <table className="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <th className='col-2 text-center'>Date / Prescription ID</th>                            
                                <th>Patient</th>
                                <th className='col-2 text-center'>Status</th>
                                <th className='text-center'>Pharmacy</th>
                                <th className='col-2 text-center'>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prescriptions.length > 0 ? (
                                prescriptions.map((prescription, index) => (
                                    <tr key={index}>
                                        <td className='text-center'>
                                            <div>Date: {formatDate(prescription.date)}</div>
                                            <div style={{ fontSize: 12 }}>{prescription.id}</div>
                                        </td>
                                        <td>
                                            <div className="vstack">
                                                <div className='m-0 p-0'>{prescription.patientName}</div>
                                                <div>{prescription.patientNHI}</div>
                                                <div style={{ fontSize: 10 }}>{prescription.patientAddress}</div>
                                            </div>
                                        </td>
                                        <td className='text-center' style={{ fontSize: 14 }}>
                                            {statusDescriptions[prescription.status]}
                                        </td>
                                        <td className='text-center'>
                                            {!prescription.pharmacyName ? (
                                                <button 
                                                    className="btn btn-sm btn-warning"
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#assignPharmacyModal"
                                                    onClick={() => handleAssign(prescription.id)}
                                                >
                                                    Assign Pharmacy
                                                </button>
                                            ) : (
                                                <div className="vstack">
                                                    <div className='m-0 p-0'>{prescription.pharmacyName}</div>
                                                    <div style={{ fontSize: 10 }}>{prescription.pharmacyAddress}</div>
                                                </div>
                                            )}
                                        </td>
                                        <td className='text-center'>
                                            <Link className="btn btn-sm btn-info"
                                                to={`/access-prescription/${prescription.id}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-prescription" viewBox="0 0 16 16">
                                                <path d="M5.5 6a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 1 0V9h.293l2 2-1.147 1.146a.5.5 0 0 0 .708.708L9 11.707l1.146 1.147a.5.5 0 0 0 .708-.708L9.707 11l1.147-1.146a.5.5 0 0 0-.708-.708L9 10.293 7.695 8.987A1.5 1.5 0 0 0 7.5 6zM6 7h1.5a.5.5 0 0 1 0 1H6z"/>
                                                <path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v10.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 14.5V4a1 1 0 0 1-1-1zm2 3v10.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V4zM3 3h10V1H3z"/>
                                                </svg> View Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center">No prescriptions found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Modal for assigning pharmacy */}
                    <div className="modal fade" id="assignPharmacyModal" tabIndex="-1" aria-labelledby="assignPharmacyModalLabel" aria-hidden="true">
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header bgcolor3">
                                    <h5 className="modal-title" id="assignPharmacyModalLabel">Assign Pharmacy</h5>
                                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div className="modal-body p-2">
                                    <PharmacySelection prescriptionID={selectedPrescriptionID} onAssignmentSuccess={handleAssignmentSuccess} />
                                </div>
                                <div className="modal-footer">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary" 
                                        data-bs-dismiss="modal"
                                        ref={closeButtonRef}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhysicianHome;
