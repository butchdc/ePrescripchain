import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { initWeb3, initContracts } from '../../utils/web3utils';
import { downloadFromIPFS } from '../../utils/apiutils';
import PreviewPrescription from '../previewprescription';
import PharmacySelection from '../forms/pharmacyselection'; 

const apiBaseURL = process.env.REACT_APP_API_BASE_URL;

const PhysicianHome = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [web3, setWeb3] = useState(null);
    const [currentUser, setCurrentUser] = useState('');
    const [contracts, setContracts] = useState(null);
    const [selectedPrescriptionID, setSelectedPrescriptionID] = useState(null);
    const [selectedPrescriptionIDForAssigning, setSelectedPrescriptionIDForAssigning] = useState(null);
    const [assignmentSuccess, setAssignmentSuccess] = useState(false);

    const closeButtonRef = useRef(null);

    useEffect(() => {
        const initialize = async () => {
            try {
                const web3Instance = await initWeb3();
                setWeb3(web3Instance);

                const contractsInstance = await initContracts(web3Instance);
                setContracts(contractsInstance);

                const accounts = await web3Instance.eth.getAccounts();
                setCurrentUser(accounts[0]);
            } catch (err) {
                setError(`Initialization error: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        initialize();
    }, []);

    useEffect(() => {
        const fetchPrescriptions = async () => {
            if (!web3 || !currentUser || !contracts) return;

            setLoading(true);
            setAssignmentSuccess(false);

            try {
                const response = await axios.get(`${apiBaseURL}prescriptions`, {
                    params: { createdBy: currentUser }
                });

                let prescriptionsData = [];

                if (response.data.message) {
                    if (response.data.message.includes('No prescriptions found')) {
                        prescriptionsData = [];
                    } else {
                        throw new Error(response.data.message);
                    }
                } else if (Array.isArray(response.data)) {
                    if (response.data.length === 0) {
                        prescriptionsData = [];
                    } else {
                        prescriptionsData = await Promise.all(
                            response.data.map(async (prescription) => {
                                try {
                                    const patientAddress = prescription.address;

                                    if (!web3.utils.isAddress(patientAddress)) {
                                        throw new Error(`Invalid patient address: ${patientAddress}`);
                                    }

                                    const patientIPFSHash = await contracts.registrationContract.methods.getPatientIPFSHash(patientAddress).call();
                                    const patientData = await downloadFromIPFS(patientIPFSHash);

                                    const statusDescriptions = [
                                        "Created",              
                                        "Assigned",     
                                        "ReadyForCollection",   
                                        "Collected",            
                                        "Cancelled"             
                                    ];
                                    
                                    const prescriptionData = await contracts.prescriptionContract.methods.accessPrescription(prescription.prescriptionID).call({ from: currentUser });

                                    let pharmacyData=null;
                                    if (prescriptionData[2]>0) {
                                        const pharmacyAddress = await contracts.prescriptionContract.methods.getAssignedPharmacy(
                                            prescription.prescriptionID
                                        ).call({from: currentUser});
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
                                        status: statusDescriptions[prescriptionData[2]]
                                    };
                                } catch (err) {
                                    console.error(`Failed to fetch data for patient ${prescription.address}:`, err);
                                    return null; // Ensure we return null if there's an error to avoid processing faulty data
                                }
                            })
                        );

                        // Filter out any null entries from the data
                        prescriptionsData = prescriptionsData.filter(data => data !== null);
                    }
                }

                setPrescriptions(prescriptionsData);
                setError(null);
            } catch (err) {
                setError(`Failed to fetch prescriptions: ${err.message}`);
                setPrescriptions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPrescriptions();
    }, [web3, currentUser, contracts, assignmentSuccess]);

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toISOString().split('T')[0];
    };

    const handleBack = () => {
        setSelectedPrescriptionID(null);
    };

    const handleView = (prescriptionID) => {
        setSelectedPrescriptionID(prescriptionID);
    };

    const handleAssign = (prescriptionID) => {
        setSelectedPrescriptionIDForAssigning(prescriptionID);
    };

    if (selectedPrescriptionID) {
        return <PreviewPrescription prescriptionID={selectedPrescriptionID} onBack={handleBack} />;
    };

    const handleAssignmentSuccess = () => {
        setAssignmentSuccess(true);
        if (closeButtonRef.current) {
            closeButtonRef.current.click();
        }
    };
    


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
                                <th className='text-center'>Prescription ID</th>                            
                                <th className='text-center'>Date</th>
                                <th>Patient</th>
                                <th className='text-center'>Patient NHI</th>
                                <th className='text-center'>Status</th>
                                <th className='text-center'>Pharmacy</th>
                                <th className='text-center'>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prescriptions.length > 0 ? (
                                prescriptions.map((prescription, index) => (
                                    <tr key={index}>
                                        <td className='text-center'>{prescription.id}</td>                                    
                                        <td className='text-center'>{formatDate(prescription.date)}</td>
                                        <td>
                                            <div className="vstack">
                                                <div className='m-0 p-0'>{prescription.patientName}</div>
                                                <div style={{ fontSize: 10 }}>{prescription.patientAddress}</div>
                                            </div>
                                        </td>
                                        <td className='text-center'>{prescription.patientNHI}</td>
                                        <td className='text-center'>{prescription.status}</td>
                                        <td className="text-center">
                                            {!prescription.pharmacyName ? (
                                                <button 
                                                    className="btn btn-sm btn-warning "
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#assignPharmacyModal"
                                                    onClick={()=>handleAssign(prescription.id)}
                                                >
                                                    Assign Pharmacy
                                                </button>
                                            ):
                                            <div className="vstack">
                                                <div className='m-0 p-0'>{prescription.pharmacyName}</div>
                                                <div style={{ fontSize: 10 }}>{prescription.pharmacyAddress}</div>
                                            </div>
                                            }
                                        </td>
                                        <td className='text-center'>
      
                                                <button 
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => handleView(prescription.id)}
                                                >
                                                    View Details
                                                </button>

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
                                    >Close
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
