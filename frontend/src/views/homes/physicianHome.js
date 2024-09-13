import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { initWeb3, initContracts } from '../../utils/web3utils';
import { downloadFromIPFS, updateStatusToDB } from '../../utils/apiutils';
import PreviewPrescription from '../previewprescription';
import PharmacySelection from '../forms/pharmacyselection'; 

const apiBaseURL = process.env.REACT_APP_API_BASE_URL;

const statusDescriptions = [
    "Awaiting Pharmacy Assignment",
    "Awaiting For Confirmation",
    "Preparing",
    "Ready For Collection",
    "Collected",
    "Cancelled"
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
        selectedPrescriptionIDForAssigning: null,
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
                            console.log(prescriptionData);

                            let pharmacyData = null;
                            if (prescriptionData[2] > 0n) {
                                const pharmacyAddress = await contracts.prescriptionContract.methods.getAssignedPharmacy(prescription.prescriptionID).call({ from: currentUser });
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

    const handleBack = () => setState(prevState => ({ ...prevState, selectedPrescriptionID: null }));

    const handleView = (prescriptionID) => setState(prevState => ({ ...prevState, selectedPrescriptionID: prescriptionID }));

    const handleAssign = (prescriptionID) => setState(prevState => ({ ...prevState, selectedPrescriptionIDForAssigning: prescriptionID }));

    const handleCancel = async (prescriptionID) => {
        const { contracts, currentUser } = state;
        try {
            await contracts.prescriptionContract.methods.cancelPrescription(prescriptionID).send({ from: currentUser });

            await updateStatusToDB(prescriptionID, 'Cancelled')
          

            setState(prevState => ({
                ...prevState,
                prescriptions: prevState.prescriptions.filter(prescription => prescription.id !== prescriptionID),
            }));

            alert('Prescription has been cancelled.');
        } catch (err) {
            console.error('Failed to cancel prescription:', err);
            alert('Failed to cancel prescription.');
        }
    };

    const handleAssignmentSuccess = () => {
        setState(prevState => ({ ...prevState, assignmentSuccess: true }));
        if (closeButtonRef.current) {
            closeButtonRef.current.click();
        }
    };

    const { prescriptions, loading, error, selectedPrescriptionID, selectedPrescriptionIDForAssigning } = state;

    if (selectedPrescriptionID) {
        return <PreviewPrescription prescriptionID={selectedPrescriptionID} onBack={handleBack} />;
    }

    return (
        <div className="container bgcolor2 p-3">
            <h4>Physician Dashboard</h4>
            {loading && <p>Loading...</p>}
            {error && <p className="text-danger">Error: {error}</p>}
            {!loading && !error && (
                <>
                    <table className="table table-bordered table-striped mt-3">
                        <thead>
                            <tr>
                                <th className='col-2 text-center'>Prescription ID</th>                            
                                <th className='text-center'>Date</th>
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
                                        <td className='text-center' style={{ fontSize: 12 }}>{prescription.id}</td>
                                        <td className='text-center'>{formatDate(prescription.date)}</td>
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
                                            <button 
                                                className="btn btn-sm btn-primary"
                                                onClick={() => handleView(prescription.id)}
                                            >
                                                View
                                            </button>
                                            {(prescription.status === 0n || prescription.status === 1n) && (
                                                <button 
                                                    className="btn btn-sm btn-danger ms-2"
                                                    onClick={() => handleCancel(prescription.id)}
                                                >
                                                    Cancel
                                                </button>
                                            )}
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
                                    <PharmacySelection prescriptionID={selectedPrescriptionIDForAssigning} onAssignmentSuccess={handleAssignmentSuccess} />
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
                </>
            )}
        </div>
    );
};

export default PhysicianHome;
