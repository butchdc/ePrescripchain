import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { initWeb3, initContracts } from '../../utils/web3utils';
import { downloadFromIPFS, updateStatusToDB, saveStatusTimestampToDB, updatePrescriptionPharmacyToDB } from '../../utils/apiutils';
import PreviewPrescription from '../previewprescription';
import PharmacySelection from './pharmacyselection';
import { getUserRoleAndAttributes } from '../../utils/userqueryutils';
import { useParams } from 'react-router-dom'
import TimeLine from '../timeline';

const statusDescriptions = [
    "Awaiting Pharmacy Assignment",
    "Awaiting For Confirmation",
    "Preparing",
    "Ready For Collection",
    "Collected",
    "Cancelled",
    "Reassigned"
];

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
            console.log(`${prescriptionID} : ${currentUser}`);
            const accessPrescriptionData = await contracts.prescriptionContract.methods.accessPrescription(prescriptionID).call({ from: currentUser });
            console.log({accessPrescriptionData});
            const status = accessPrescriptionData[2];

            const prescriptionData = await downloadFromIPFS(accessPrescriptionData[1]);
            console.log({prescriptionData});
            console.log(status);

            const physicianIPFSHash = await contracts.registrationContract.methods.getPhysicianIPFSHash(prescriptionData.physicianAddress).call();
            const physicianData = await downloadFromIPFS(physicianIPFSHash);

            const patientIPFSHash = await contracts.registrationContract.methods.getPatientIPFSHash(prescriptionData.patientAddress).call();
            const patientData = await downloadFromIPFS(patientIPFSHash);

            let pharmacyData = null;
            const pharmacyAddress = await contracts.prescriptionContract.methods.getAssignedPharmacy(prescriptionID).call({ from: currentUser });
            if (pharmacyAddress > 0) {
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

            if (action=='rejectPrescription') {

                await updatePrescriptionPharmacyToDB(prescriptionID, null);
                await saveStatusTimestampToDB(prescriptionID, 'Reassigned', Date.now());
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
        <div className="container-fluid mt-2 bgcolor2 p-0 ps-3 pe-3">
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
                        <i className='bi bi-search' style={{fontSize:20}} ></i> 

                    }
                </button>
            </div>

            {error && <div className="alert alert-danger mt-2">{error}</div>}

            {prescriptionDetails && (
                <div className="border p-2 rounded shadow bgcolor3">
                    <div className='vstack'>
                        <div className='hstack gap-4 mb-2 pb-2 border-bottom'>
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
                                            <i className='bi bi-printer-fill' style={{fontSize:28}} ></i>
                                            <div style={{fontSize:12}}>Print</div>
                                        </button>
                                    }
                                    {(role === 'Physician' && (prescriptionDetails.status === 0n || prescriptionDetails.status === 1n)) &&
                                        <button className='btn btn-sm btn-danger' onClick={() => handleAction('cancelPrescription')}>
                                            <i className='bi bi-x-circle-fill' style={{fontSize:28}} ></i>
                                            <div style={{fontSize:12}}>Cancel</div>
                                        </button>
                                    }
                                    {role === 'Pharmacy' && prescriptionDetails.status === 1n &&
                                        <div className="hstack gap-2">
                                            <button className="btn btn-sm btn-success" onClick={() => handleAction('acceptPrescription')}>
                                                <i className='bi bi-check-circle-fill' style={{fontSize:28}} ></i>
                                                <div style={{fontSize:12}}>Accept</div>
                                            </button>
                                            <button className="btn btn-sm btn-warning" onClick={() => handleAction('rejectPrescription')}>
                                                <i className='bi bi-reply-fill' style={{fontSize:28}} ></i>
                                                <div style={{fontSize:12}}>Return</div>
                                            </button>
                                        </div>
                                    }
                                    {role === 'Pharmacy' && prescriptionDetails.status === 2n &&
                                        <div className="hstack gap-2">
                                            <button className="btn btn-sm btn-info" onClick={() => handleAction('medicationPreparation')}>
                                                <i className='bi bi-capsule-pill' style={{fontSize:28}} ></i>
                                                <div style={{fontSize:12}}>Ready</div>
                                            </button>
                                        </div>
                                    }
                                    {role === 'Pharmacy' && prescriptionDetails.status === 3n &&
                                        <div className="hstack gap-2">
                                            <button className="btn btn-sm btn-success" onClick={() => handleAction('medicationCollection')}>
                                                <i className='bi bi-bag-check-fill' style={{fontSize:28}} ></i>
                                                <div style={{fontSize:12}}>Collected</div>
                                            </button>
                                        </div>
                                    }
                                </div>
                        </div>
                        <div className='hstack'>
                            <div className='vstack ps-2 pe-2'>
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
                                                    {prescriptionDetails.status < 2n && role==='Physician' &&
                                                        <button
                                                            className="btn btn-sm btn-warning"
                                                            data-bs-toggle="modal"
                                                            data-bs-target="#assignPharmacyModal"
                                                        >
                                                            Reassign Pharmacy
                                                        </button>
                                                    }
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <div className='mb-2'>No Pharmacy Assigned</div>
                                                    {role==='Physician' && 
                                                    <button
                                                        className="btn btn-sm btn-warning"
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#assignPharmacyModal"
                                                    >
                                                        Assign Pharmacy
                                                    </button>
                                                    }
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
                            </div>
                            {/* Timeline */}
                            <div className='col-3 vstack border-start gap-0' >
                                <div className='text-center h5 p-1' style={{backgroundColor:'#CFF4FC'}}>Status Timeline</div>
                                <div style={{maxHeight:550, overflow:'auto'}}>
                                    <TimeLine prescriptionID={prescriptionID}/>
                                </div>
                            </div>
                        </div>
                    </div>

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
