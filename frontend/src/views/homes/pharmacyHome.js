import { useState, useEffect } from 'react';
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
    "Cancelled"
];

const PharmacyHome = () => {
    const [state, setState] = useState({
        prescriptions: [],
        loading: true,
        error: null,
        web3: null,
        currentUser: '',
        contracts: null,
        refresh: false
    });

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
                      assignedTo: currentUser,
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
                            const physicianAddress = prescription.createdBy;

                            if (!web3.utils.isAddress(patientAddress)) {
                                throw new Error(`Invalid patient address: ${patientAddress}`);
                            }

                            const patientIPFSHash = await contracts.registrationContract.methods.getPatientIPFSHash(patientAddress).call();
                            const patientData = await downloadFromIPFS(patientIPFSHash);

                            const physicianIPFSHash = await contracts.registrationContract.methods.getPhysicianIPFSHash(physicianAddress).call();
                            const physicianData = await downloadFromIPFS(physicianIPFSHash);

                            const prescriptionData = await contracts.prescriptionContract.methods.accessPrescription(prescription.prescriptionID).call({ from: currentUser });


                            return {
                                id: prescription.prescriptionID,
                                patientAddress: prescriptionData[0],
                                patientName: patientData.name,
                                patientNHI: patientData.nhiNumber,
                                physicianAddress,
                                physicianName: physicianData.name,
                                physicianNZMC: physicianData.nzmcNo,
                                date: prescription.date,
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
    }, [state.web3, state.currentUser, state.contracts, state.refresh]);

    const formatDate = (timestamp) => new Date(timestamp).toISOString().split('T')[0];

    const { prescriptions, loading, error } = state;


    return (
        <div className="container bgcolor2 p-3">
            <h4 className='mb-3'>Pharmacy Dashboard</h4>
            {loading && <p>Loading...</p>}
            {error && <p className="text-danger">Error: {error}</p>}
            {!loading && !error && (
                <div>
                    <h6>MY ASSIGNED PRESCRIPTIONS</h6>
                    <table className="table table-bordered table-striped shadow">
                        <thead>
                            <tr>
                                <th className="col-2 text-center">Date / Prescription ID</th>
                                <th className='text-center'>Patient</th>
                                <th className='text-center'>Physician</th>
                                <th className='col-2 text-center'>Status</th>
                                <th className='col-2 text-center'>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prescriptions.length > 0 ?(
                                prescriptions.map((prescription,index)=>(
                                    <tr key={index} style={{verticalAlign:'middle'}}>
                                        <td className='text-center' >
                                            <div className=''>{formatDate(prescription.date)}</div>
                                            <QRCodeSVG value={prescription.id.toString()} size={80} />
                                            <div className='mt-1' style={{ fontSize: 8 }}>{prescription.id}</div>
                                        </td>
  
                                        <td className='text-center' >
                                            <div className="vstack">
                                                <div className='m-0 p-0'>{prescription.patientName}</div>
                                                <div>{prescription.patientNHI}</div>
                                                <div style={{ fontSize: 10 }}>{prescription.patientAddress}</div>
                                            </div>
                                        </td>
                                        <td className='text-center' >
                                            <div className="vstack">
                                                <div className='m-0 p-0'>{prescription.physicianName}</div>
                                                <div>{prescription.physicianNZMC}</div>
                                                <div style={{ fontSize: 10 }}>{prescription.physicianAddress}</div>
                                            </div>
                                        </td>
                                        <td className='text-center' style={{ fontSize: 14, verticalAlign:'middle' }}>
                                            {statusDescriptions[prescription.status]}
                                        </td>
                                        <td className="text-center" >
                                            <Link className="btn btn-sm btn-info"
                                                to={`/access-prescription/${prescription.id}`}
                                            >
                                                <i className="bi bi-prescription" style={{fontSize:24}}></i>
                                                <div style={{fontSize:10}}>View</div>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ):(
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
}
 
export default PharmacyHome;