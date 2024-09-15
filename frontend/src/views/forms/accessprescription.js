import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { initWeb3, initContracts } from '../../utils/web3utils';
import { downloadFromIPFS, updateStatusToDB, saveStatusTimestampToDB } from '../../utils/apiutils';
import PreviewPrescription from '../previewprescription';
import PharmacySelection from './pharmacyselection';
import { getUserRoleAndAttributes } from '../../utils/userqueryutils';
import { useParams } from 'react-router-dom'

const statusDescriptions = [
    "Awaiting Pharmacy Assignment",
    "Awaiting For Confirmation",
    "Preparing",
    "Ready For Collection",
    "Collected",
    "Cancelled"
];

// status: "Awaiting Pharmacy Assignment",
// note: "Your prescription has been created and is waiting to be assigned to a pharmacy."
// status: "Awaiting For Confirmation",
// note: "Your prescription has been assigned to a pharmacy and is awaiting confirmation."
// status: "Preparing",
// note: "Your prescription has been confirmed by the pharmacy and is now being prepared."
// status: "Ready For Collection",
// note: "Your prescription is ready for collection. You can pick it up from the pharmacy."
// status: "Collected",
// note: "Your prescription has been collected. Contact the pharmacy if you need further assistance."
// status: "Cancelled",
// note: "Your prescription has been cancelled by the physician. If you have questions, please contact the physician’s office."

const AccessPrescription = () => {
    const [prescriptionID, setPrescriptionID] = useState('');
    const [prescriptionDetails, setPrescriptionDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [web3, setWeb3] = useState(null);
    const [contracts, setContracts] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isPrint, setIsPrint] = useState(false);
    const [role, setRole] = useState(null);

    const closeButtonRef = useRef(null);
    const { pID } = useParams();

    useEffect(() => {
        const initialize = async () => {
            try {
                const web3Instance = await initWeb3();
                setWeb3(web3Instance);
                const contractsInstance = await initContracts(web3Instance);
                setContracts(contractsInstance);

                const accounts = await web3Instance.eth.getAccounts();
                setCurrentUser(accounts[0]);

                const { role, attributes } = await getUserRoleAndAttributes(accounts[0]);
                setRole(role);

                if (pID) { 
                    setPrescriptionID(pID);
                    fetchPrescriptionDetails();
                }

            } catch (err) {
                setError(`Initialization error: ${err.message}`);
            }
        };

        initialize();
    }, [pID, prescriptionID]);


    const fetchPrescriptionDetails = useCallback(async () => {
        if (!web3 || !contracts || !currentUser || !prescriptionID) return;

        setLoading(true);
        setError(null);
        setPrescriptionDetails(null);

        try {
            const accessPrescriptionData = await contracts.prescriptionContract.methods.accessPrescription(prescriptionID).call({ from: currentUser });
            const status = accessPrescriptionData[2];

            const prescriptionData = await downloadFromIPFS(accessPrescriptionData[1]);

            const physicianIPFSHash = await contracts.registrationContract.methods.getPhysicianIPFSHash(prescriptionData.physicianAddress).call();
            const physicianData = await downloadFromIPFS(physicianIPFSHash);

            const patientIPFSHash = await contracts.registrationContract.methods.getPatientIPFSHash(prescriptionData.patientAddress).call();
            const patientData = await downloadFromIPFS(patientIPFSHash);

            let pharmacyData = null;
            if (status > 0 && status !== 5n) {
                const pharmacyAddress = await contracts.prescriptionContract.methods.getAssignedPharmacy(prescriptionID).call({ from: currentUser });
                const pharmacyIPFSHash = await contracts.registrationContract.methods.getPharmacyIPFSHash(pharmacyAddress).call();
                pharmacyData = await downloadFromIPFS(pharmacyIPFSHash);
            }

            const date = new Date(prescriptionData.date).toLocaleDateString('en-GB');

            setPrescriptionDetails({
                prescription: prescriptionData,
                physician: physicianData,
                patient: patientData,
                pharmacy: pharmacyData,
                rxDate: date,
                status
            });

        } catch (err) {
            setError('The requested prescription does not exist, or you are not permitted to access it.');
        } finally {
            setLoading(false);
        }
    }, [web3, contracts, currentUser, prescriptionID]);

    const handleAction = useCallback(async (action) => {
        try {
            await contracts.prescriptionContract.methods[action](prescriptionID).send({ from: currentUser });        

            if (action=='acceptPrescription') {
                await saveStatusTimestampToDB(prescriptionID, 'Preparing', Date.now());
            }

            if (action=='medicationPreparation') {
                await saveStatusTimestampToDB(prescriptionID, 'Ready For Collection', Date.now());
            }

            if (action=='medicationCollection') {
                await updateStatusToDB(prescriptionID,'Collected');
                await saveStatusTimestampToDB(prescriptionID, 'Collected', Date.now());
            }

            if (action=='cancelPrescription') {
                await updateStatusToDB(prescriptionID,'Cancelled');
                await saveStatusTimestampToDB(prescriptionID, 'Cancelled', Date.now());
            }

            fetchPrescriptionDetails();
        } catch (err) {
            setError(`Error performing action: ${err.message}`);
        }
    }, [contracts, currentUser, prescriptionID, fetchPrescriptionDetails]);

    const handleChange = (e) => {
        setPrescriptionID(e.target.value);
        setPrescriptionDetails(null);
        setError(null);
    };

    const handlePrint = () => setIsPrint(true);
    const handlePrintBack = () => setIsPrint(false);

    if (isPrint) {
        return <PreviewPrescription prescriptionID={prescriptionID} onBack={handlePrintBack} />;
    }

    

    return (
        <div className="container mt-2 bgcolor2">
            <h4 className="mb-3">Access Prescription</h4>
            <label>Prescription ID</label>
            <div className="input-group mb-3" style={{ maxWidth: 500 }}>
                <input
                    type="text"
                    id="prescriptionID"
                    className="form-control"
                    value={prescriptionID}
                    onChange={handleChange}
                    placeholder="Enter Prescription ID"
                    autoComplete="off"
                    required
                />
                <button
                    className="btn btn-primary"
                    onClick={fetchPrescriptionDetails}
                    disabled={loading}
                >
                    {loading ? 'Searching...' : 
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                        </svg>
                    }
                </button>
            </div>

            {error && <div className="alert alert-danger mt-2">{error}</div>}

            {prescriptionDetails && (
                <div className="mt-3 gap-2">
                    <div className='hstack gap-4 mb-2'>
                        <div className='hstack gap-2 col'>
                            <div className='mediumfont'>Status:</div>
                            <div className={`h3 m-0 ${prescriptionDetails.status === 5n ? 'text-danger' : (prescriptionDetails.status === 1n ? 'text-warning' : 'text-success')}`}>
                                {statusDescriptions[prescriptionDetails.status]}
                            </div>
                        </div>
                        <div className='hstack gap-2 col-auto'>
                            <div className='mediumfont'>Rx Date:</div>
                            <div>{prescriptionDetails.rxDate}</div>
                        </div>
                        <div className='col-auto hstack gap-2'>
                            {(role === 'Physician' || role === 'Pharmacy' || role) &&
                                <button className='btn btn-sm btn-primary' onClick={handlePrint}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-printer-fill" viewBox="0 0 16 16">
                                    <path d="M5 1a2 2 0 0 0-2 2v1h10V3a2 2 0 0 0-2-2zm6 8H5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1"/>
                                    <path d="M0 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1v-2a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2H2a2 2 0 0 1-2-2zm2.5 1a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1"/>
                                    </svg>
                                </button>
                            }
                            {(role === 'Physician' && (prescriptionDetails.status === 0n || prescriptionDetails.status === 1n)) &&
                                <button className='btn btn-sm btn-danger' onClick={() => handleAction('cancelPrescription')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-x-circle-fill" viewBox="0 0 16 16">
                                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z"/>
                                    </svg>
                                </button>
                            }
                            {role === 'Pharmacy' && prescriptionDetails.status === 1n &&
                                <div className="hstack gap-2">
                                    <button className="btn btn-sm btn-success" onClick={() => handleAction('acceptPrescription')}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-check-circle-fill" viewBox="0 0 16 16">
                                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                                        </svg>
                                    </button>
                                    <button className="btn btn-sm btn-warning" onClick={() => handleAction('rejectPrescription')}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-reply-fill" viewBox="0 0 16 16">
                                        <path d="M5.921 11.9 1.353 8.62a.72.72 0 0 1 0-1.238L5.921 4.1A.716.716 0 0 1 7 4.719V6c1.5 0 6 0 7 8-2.5-4.5-7-4-7-4v1.281c0 .56-.606.898-1.079.62z"/>
                                        </svg>
                                    </button>
                                </div>
                            }
                            {role === 'Pharmacy' && prescriptionDetails.status === 2n &&
                                <div className="hstack gap-2">
                                    <button className="btn btn-sm btn-info" onClick={() => handleAction('medicationPreparation')}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-capsule-pill" viewBox="0 0 16 16">
                                        <path d="M11.02 5.364a3 3 0 0 0-4.242-4.243L1.121 6.778a3 3 0 1 0 4.243 4.243l5.657-5.657Zm-6.413-.657 2.878-2.879a2 2 0 1 1 2.829 2.829L7.435 7.536zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8m-.5 1.042a3 3 0 0 0 0 5.917zm1 5.917a3 3 0 0 0 0-5.917z"/>
                                        </svg>
                                    </button>
                                </div>
                            }
                            {role === 'Pharmacy' && prescriptionDetails.status === 3n &&
                                <div className="hstack gap-2">
                                    <button className="btn btn-sm btn-success" onClick={() => handleAction('medicationCollection')}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-bag-check-fill" viewBox="0 0 16 16">
                                        <path fill-rule="evenodd" d="M10.5 3.5a2.5 2.5 0 0 0-5 0V4h5zm1 0V4H15v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4h3.5v-.5a3.5 3.5 0 1 1 7 0m-.646 5.354a.5.5 0 0 0-.708-.708L7.5 10.793 6.354 9.646a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0z"/>
                                        </svg>
                                    </button>
                                </div>
                            }
                        </div>
                    </div>

                    <table className='table table-sm'>
                        <thead className='table-info'>
                            <tr className='text-center'>
                                <td className='h5 col-4'>Physician</td>
                                <td className='h5 col-4 border-start'>Patient</td>
                                <td className='h5 col-4 border-start'>Pharmacy</td>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className='p-3'>
                                    {prescriptionDetails.physician ? (
                                        <div>
                                            <div>{prescriptionDetails.physician.name}</div>
                                            <div>{prescriptionDetails.physician.speciality}</div>
                                            <div>NZMC: {prescriptionDetails.physician.nzmcNo}</div>
                                            <div>Phone: {prescriptionDetails.physician.contactNumber}</div>
                                            <div style={{ fontSize: 10 }}>{prescriptionDetails.physician.address}</div>
                                        </div>
                                    ) : (
                                        <div>Physician details not available</div>
                                    )}
                                </td>
                                <td className='p-3 border-start'>
                                    {prescriptionDetails.patient ? (
                                        <div>
                                            <div>{prescriptionDetails.patient.name}</div>
                                            <div>{prescriptionDetails.patient.patientAddress}</div>
                                            <div>DOB: {prescriptionDetails.patient.dateOfBirth}</div>
                                            <div>NHI: {prescriptionDetails.patient.nhiNumber}</div>
                                            <div style={{ fontSize: 10 }}>{prescriptionDetails.patient.address}</div>
                                        </div>
                                    ) : (
                                        <div>Patient details not available</div>
                                    )}
                                </td>
                                <td className='p-3 border-start'>
                                    {prescriptionDetails.pharmacy ? (
                                        <div>
                                            <div>{prescriptionDetails.pharmacy.pharmacyName}</div>
                                            <div>{prescriptionDetails.pharmacy.pharmacyAddress}</div>
                                            <div>Phone: {prescriptionDetails.pharmacy.contactNumber}</div>
                                            <div style={{ fontSize: 10 }}>{prescriptionDetails.pharmacy.address}</div>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className='mb-2'>No Pharmacy Assigned</div>
                                            <button
                                                className="btn btn-sm btn-warning"
                                                data-bs-toggle="modal"
                                                data-bs-target="#assignPharmacyModal"
                                            >
                                                Assign Pharmacy
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <table className='table table-sm table-striped'>
                        <thead className='table-info'>
                            <tr className='text-center'>
                                <td className='col-1'>Index</td>
                                <td className='col-3 border-start'>Drug</td>
                                <td className='col-5 border-start'>Sig</td>
                                <td className='col-2 border-start'>Mitte</td>
                                <td className='col-1 border-start'>Repeat</td>
                            </tr>
                        </thead>
                        <tbody>
                            {prescriptionDetails.prescription.drugs.map((drug, index) => (
                                <tr key={index} className='text-center'>
                                    <td className='p-1'>{index + 1}</td>
                                    <td className='p-1 border-start'>{drug.name}</td>
                                    <td className='p-1 border-start'>{drug.sig}</td>
                                    <td className='p-1 border-start'>{drug.mitte} {drug.mitteUnit}</td>
                                    <td className='p-1 border-start'>{drug.repeat}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="modal fade" id="assignPharmacyModal" tabIndex="-1" aria-labelledby="assignPharmacyModalLabel" aria-hidden="true">
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header bgcolor3">
                                    <h5 className="modal-title" id="assignPharmacyModalLabel">Assign Pharmacy</h5>
                                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div className="modal-body p-2">
                                    <PharmacySelection prescriptionID={prescriptionID} onAssignmentSuccess={() => {
                                        fetchPrescriptionDetails();
                                        if (closeButtonRef.current) {
                                            closeButtonRef.current.click();
                                        }
                                    }} />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" ref={closeButtonRef}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccessPrescription;
