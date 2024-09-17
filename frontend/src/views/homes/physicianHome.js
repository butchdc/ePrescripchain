import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { initWeb3, initContracts } from '../../utils/web3utils';
import { downloadFromIPFS } from '../../utils/apiutils';
import { Link } from 'react-router-dom';
import {QRCodeSVG} from 'qrcode.react';

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
                                pharmacyContactNo:  pharmacyData ? pharmacyData.contactNumber : null,
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
                    <table className="table table-bordered table-striped shadow">
                        <thead>
                            <tr>
                                <th className='col-2 text-center'>Date / Prescription ID</th>                            
                                <th className='text-center'>Patient</th>
                                <th className='col-2 text-center'>Status</th>
                                <th className='text-center'>Assigned Pharmacy</th>
                                <th className='col-2 text-center'>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prescriptions.length > 0 ? (
                                prescriptions.map((prescription, index) => (
                                    <tr key={index} style={{verticalAlign:'middle'}}>
                                        <td className='text-center'>
                                            <div className=''>{formatDate(prescription.date)}</div>
                                            <QRCodeSVG value={prescription.id.toString()} size={80} />
                                            <div className='mt-1' style={{ fontSize: 8 }}>{prescription.id}</div>
                                        </td>
                                        <td className='text-center'>
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
                                                <div className="">No Pharmacy Assigned</div>
                                            ) : (
                                                <div className="vstack">
                                                    <div className='m-0 p-0'>{prescription.pharmacyName}</div>
                                                    <div style={{ fontSize: 10 }}>{prescription.pharmacyAddress}</div>
                                                    <div style={{ fontSize: 14 }}>Phone: {prescription.pharmacyContactNo}</div>
                                                </div>
                                            )}
                                        </td>
                                        <td className='text-center'>
                                            <Link className="btn btn-sm btn-info"
                                                to={`/access-prescription/${prescription.id}`}
                                            >
                                                <i className="bi bi-prescription" style={{fontSize:24}}></i>
                                                <div style={{fontSize:10}}>View</div>
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
                </div>
            )}
        </div>
    );
};

export default PhysicianHome;
