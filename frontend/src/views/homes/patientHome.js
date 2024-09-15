import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { initWeb3, initContracts } from '../../utils/web3utils';
import { downloadFromIPFS, updateStatusToDB } from '../../utils/apiutils';
import PharmacySelection from '../forms/pharmacyselection'; 
import { Link } from 'react-router-dom';

const apiBaseURL = process.env.REACT_APP_API_BASE_URL;

const statusDescriptions = [
    "Awaiting Pharmacy Assignment",
    "Awaiting For Confirmation",
    "Preparing",
    "Ready For Collection",
    "Collected",
    "Cancelled"
];

const PatientHome = () => {
    const [state, setState] = useState({
        prescriptions: [],
        loading: true,
        error: null,
        web3: null,
        currentUser: '',
        contracts: null
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

            setState(prevState => ({ ...prevState, loading: true}));

            try {
                const response = await axios.get(`${apiBaseURL}prescriptions`, {
                    params: {
                      address: currentUser,
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
                            const physicianAddress = prescription.createdBy;

                            if (!web3.utils.isAddress(physicianAddress)) {
                                throw new Error(`Invalid physician address: ${physicianAddress}`);
                            }

                            const physicianIPFSHash = await contracts.registrationContract.methods.getPhysicianIPFSHash(physicianAddress).call();
                            const physicianData = await downloadFromIPFS(physicianIPFSHash);

                            const prescriptionData = await contracts.prescriptionContract.methods.accessPrescription(prescription.prescriptionID).call({ from: currentUser });

                            let pharmacyData = null;
                            if (prescriptionData[2] > 0n) {
                                const pharmacyAddress = await contracts.prescriptionContract.methods.getAssignedPharmacy(prescription.prescriptionID).call({ from: currentUser });
                                const pharmacyIPFSHash = await contracts.registrationContract.methods.getPharmacyIPFSHash(pharmacyAddress).call();
                                pharmacyData = await downloadFromIPFS(pharmacyIPFSHash);
                            }

                            return {
                                id: prescription.prescriptionID,
                                physicianName: physicianData.name,
                                physicianNZMC: physicianData.nzmcNo,
                                physicianContactNo: physicianData.contactNumber,
                                date: prescription.date,
                                pharmacyName: pharmacyData ? pharmacyData.pharmacyName : null,
                                pharmacyAddress: pharmacyData ? pharmacyData.pharmacyAddress : null,
                                pharmacyContactNo: pharmacyData ? pharmacyData.contactNumber : null,
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
    }, [state.web3, state.currentUser, state.contracts]);

    const formatDate = (timestamp) => new Date(timestamp).toISOString().split('T')[0];

    const { prescriptions, loading, error } = state;

    return (
        <div className="container p-2 bgcolor2">
            <h4>Patient Dashboard</h4>
            {loading && <p>Loading...</p>}
            {error && <p className="text-danger">Error: {error}</p>}
            {!loading && !error && (
                <div>
                    <table className="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <th className='col-2 text-center'>Date / Prescription ID</th>
                                <th className='text-center'>From Physician</th>
                                <th className='text-center'>Assigned Pharmacy</th>
                                <th className='col-2 text-center'>Status</th>
                                <th className='col-2 text-center'>Action</th>    
                            </tr>
                        </thead>
                        <tbody>
                            {prescriptions.length > 0 ? (
                                prescriptions.map((prescription,index)=>(
                                    <tr key={index}>
                                        <td className='text-center'>
                                            <div>Date: {formatDate(prescription.date)}</div>
                                            <div style={{ fontSize: 12 }}>{prescription.id}</div>
                                        </td>
                                        <td>
                                            <div className="vstack ps-3">
                                                <div className=''>{prescription.physicianName}</div>
                                                <div>{prescription.physicianNZMC}</div>
                                                <div style={{fontSize:14}}>Phone: {prescription.physicianContactNo}</div>
                                            </div>
                                        </td>
                                        <td>
                                            {!prescription.pharmacyName ? (
                                                <div className="text-center">No Pharmacy Assigned</div>
                                            ):(
                                                <div className="vstack ps-3">
                                                    <div className='m-0 p-0'>{prescription.pharmacyName}</div>
                                                    <div style={{ fontSize: 12 }}>{prescription.pharmacyAddress}</div>
                                                    <div style={{ fontSize: 14 }}>Phone: {prescription.pharmacyContactNo}</div>
                                                </div>
                                            )}
                                        </td>
                                        <td className='text-center'>{statusDescriptions[prescription.status]}</td>
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
 
export default PatientHome;