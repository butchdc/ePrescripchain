import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { initWeb3, initContracts } from '../../utils/web3utils';
import { downloadFromIPFS, updateStatusToDB } from '../../utils/apiutils';
import PreviewPrescription from '../previewprescription';

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
        selectedPrescriptionID: null,
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

    const handleBack = () => setState(prevState => ({ ...prevState, selectedPrescriptionID: null }));

    const handleView = (prescriptionID) => setState(prevState => ({ ...prevState, selectedPrescriptionID: prescriptionID }));

    const handleAction = async (prescriptionID,action) => {
        try {
            await state.contracts.prescriptionContract.methods[action](prescriptionID).send({ from: state.currentUser });

            if (action=='medicationCollection') {
                await updateStatusToDB(prescriptionID,'Collected');
            }

            setState(prevState=> ({...prevState, refresh: !state.refresh}));
        } catch (err) {
            console.error(`Error performing action: ${err.message}`);
            alert(`Error performing action: ${err.message}`);
        }
    };

    const { prescriptions, loading, error, selectedPrescriptionID } = state;

    if (selectedPrescriptionID) {
        return <PreviewPrescription prescriptionID={selectedPrescriptionID} onBack={handleBack} />;
    }


    return (
        <div className="container bgcolor2 p-3">
            <h4 className='mb-3'>Pharmacy Dashboard</h4>
            {loading && <p>Loading...</p>}
            {error && <p className="text-danger">Error: {error}</p>}
            {!loading && !error && (
                <div>
                    <h6>MY ASSIGNED PRESCRIPTIONS</h6>
                    <table className="table table-bordered table-striped">
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
                                    <tr key={index}>
                                        <td className='text-center' style={{ fontSize: 12 }}>
                                            <div style={{ fontSize: 16 }}>Date: {formatDate(prescription.date)}</div>
                                            <div>{prescription.id}</div>
                                        </td>
  
                                        <td>
                                            <div className="vstack">
                                                <div className='m-0 p-0'>{prescription.patientName}</div>
                                                <div>{prescription.patientNHI}</div>
                                                <div style={{ fontSize: 10 }}>{prescription.patientAddress}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="vstack">
                                                <div className='m-0 p-0'>{prescription.physicianName}</div>
                                                <div>{prescription.physicianNZMC}</div>
                                                <div style={{ fontSize: 10 }}>{prescription.physicianAddress}</div>
                                            </div>
                                        </td>
                                        <td className='text-center' style={{ fontSize: 14 }}>
                                            {statusDescriptions[prescription.status]}
                                        </td>
                                        <td className="text-center">
                                            <button 
                                                className="btn btn-sm btn-primary m-1"
                                                onClick={() => handleView(prescription.id)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-printer-fill" viewBox="0 0 16 16">
                                                <path d="M5 1a2 2 0 0 0-2 2v1h10V3a2 2 0 0 0-2-2zm6 8H5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1"/>
                                                <path d="M0 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1v-2a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2H2a2 2 0 0 1-2-2zm2.5 1a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1"/>
                                                </svg>
                                            </button>
                                            {prescription.status === 1n &&
                                                <>
                                                    <button className="btn btn-sm btn-success m-1" 
                                                        onClick={()=>handleAction(prescription.id,'acceptPrescription')}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-check-circle-fill" viewBox="0 0 16 16">
                                                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                                                        </svg>
                                                    </button>
                                                    <button className="btn btn-sm btn-danger m-1" 
                                                        onClick={()=>handleAction(prescription.id,'rejectPrescription')}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-x-circle-fill" viewBox="0 0 16 16">
                                                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z"/>
                                                        </svg>
                                                    </button>
                                                </>
                                            }
                                            {prescription.status === 2n &&
                                                <>
                                                    <button className="btn btn-sm btn-info m-1" 
                                                        onClick={()=>handleAction(prescription.id,'medicationPreparation')}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-capsule-pill" viewBox="0 0 16 16">
                                                        <path d="M11.02 5.364a3 3 0 0 0-4.242-4.243L1.121 6.778a3 3 0 1 0 4.243 4.243l5.657-5.657Zm-6.413-.657 2.878-2.879a2 2 0 1 1 2.829 2.829L7.435 7.536zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8m-.5 1.042a3 3 0 0 0 0 5.917zm1 5.917a3 3 0 0 0 0-5.917z"/>
                                                        </svg>
                                                    </button>
                                                </>
                                            }
                                            {prescription.status === 3n &&
                                                <>
                                                    <button className="btn btn-sm btn-success m-1" 
                                                        onClick={()=>handleAction(prescription.id,'medicationCollection')}                                                    
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-bag-check-fill" viewBox="0 0 16 16">
                                                        <path fill-rule="evenodd" d="M10.5 3.5a2.5 2.5 0 0 0-5 0V4h5zm1 0V4H15v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4h3.5v-.5a3.5 3.5 0 1 1 7 0m-.646 5.354a.5.5 0 0 0-.708-.708L7.5 10.793 6.354 9.646a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0z"/>
                                                        </svg>
                                                    </button>
                                                </>
                                            }
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