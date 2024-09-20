import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {initContracts,initWeb3 } from '../../utils/web3utils';
import { downloadFromIPFS } from '../../utils/apiutils';
import { getUserRoleAndAttributes } from '../../utils/userqueryutils';
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

const statusColors = [
    "#D3D3D3", // Light Gray
    "#ADD8E6", // Light Blue
    "#FFDAB9", // Light Orange
    "#90EE90", // Light Green
    "#D8BFD8", // Light Purple
    "#F08080", // Light Coral
    "#FFFFE0" // Light Yellow
];

const iconStyle = { fontSize: '2rem', color: '#31A1AC' };

const iconMap = {
    'Physician': (
        <i className="bi bi-heart-pulse-fill" style={iconStyle}></i>
    ),
    'Patient': (
        <i className="bi bi-person-fill" style={iconStyle}></i>
    ),
    'Pharmacy': (
        <i className="bi bi-prescription2" style={iconStyle}></i>
    ),
};

const Home = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState('');
    const [contracts, setContracts] = useState(null);
    const [role, setRole] = useState('');

    useEffect(() => {
        const initialize = async () => {
            try {
                const web3Instance = await initWeb3();

                const contractsInstance = await initContracts(web3Instance);
                setContracts(contractsInstance);

                const accounts = await web3Instance.eth.getAccounts();
                setCurrentUser(accounts[0]);

                const { role: fetchedRole, attributes} = await getUserRoleAndAttributes(accounts[0]);
                setRole(fetchedRole);

            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        initialize();
    }, []);

    useEffect(()=>{
        const fetchPrescriptions = async () => {
            if (!currentUser || !contracts || !role) return;
            setLoading(true);

            try{
                let response = null;

                const roleParamsMap = {
                    'Physician': { createdBy: currentUser },
                    'Pharmacy': { assignedTo: currentUser },
                    'Patient': { address: currentUser }
                };
                
                const params = {
                    status: 'In-Progress',
                    ...roleParamsMap[role] 
                };
                
                response = await axios.get(`${apiBaseURL}prescriptions`, { params });

                if (response.data.message) {
                    setLoading(false);
                    setError(null);
                    setPrescriptions([]);
                    return;
                }

                const prescriptionsData = await Promise.all(
                    response.data.map( async (prescription)=>{
                        try{
                            const patientAddress = prescription.address;
                            const physicianAddress = prescription.createdBy;
                            const pharmacyAddress = prescription.assignedTo ? prescription.assignedTo : null;

                            const patientIPFSHash = await contracts.registrationContract.methods.getPatientIPFSHash(patientAddress).call();
                            const patientData = await downloadFromIPFS(patientIPFSHash);

                            const physicianIPFSHash = await contracts.registrationContract.methods.getPhysicianIPFSHash(physicianAddress).call();
                            const physicianData = await downloadFromIPFS(physicianIPFSHash);

                            const pharmacyData = pharmacyAddress ? await downloadFromIPFS(await contracts.registrationContract.methods.getPharmacyIPFSHash(pharmacyAddress).call()) : null;

                            const prescriptionData = await contracts.prescriptionContract.methods.accessPrescription(prescription.prescriptionID).call({ from: currentUser });
                            console.log(prescription);
                            return {
                                prescriptionData: prescription,
                                patientData,
                                physicianData,
                                pharmacyData,
                                status: prescriptionData[2],
                            }

                        }catch(err){
                            console.error(`Failed to fetch data for patient ${prescription.address}:`, err);
                            return null;
                        }
                    })
                );

                setPrescriptions(prescriptionsData.filter(data => data !== null));
                setError(null);
                setLoading(false);
                console.log(prescriptionsData.filter(data => data !== null));

            }catch(err){
                setError(err.message);
                setPrescriptions([]);
                setLoading(false);
            }
        };
        fetchPrescriptions();
    },[role, currentUser, contracts, ]);

    const formatDate = (timestamp) => new Date(timestamp).toISOString().split('T')[0];

    return (
        <div className="container p-3 bgcolor2">
            {loading && <p>Loading...</p>}
            {error && <p className="text-danger">Error: {error}</p>}
            {!loading && !error && 
                <>
                    <h4 className="mb-3">{iconMap[role]} {role} Dashboard</h4>
                    <h6 className=''>MY ACTIVE PRESCRIPTIONS</h6>
                    <table className="table table-striped shadow" style={{borderRadius:'0.75rem', overflow:'hidden'}}>
                        <thead>
                            <tr className='text-center'>
                                <td className='col-2'>Date / Prescription ID</td>                            
                                {role != 'Patient' && <td className='border-start col-3'>Patient</td>}
                                {role != 'Physician' && <td className='border-start col-3'>Physician</td>}
                                {role != 'Pharmacy' && <td className='border-start col-3'>Pharmacy</td>}
                                <td className='col-3 border-start'>Status</td>
                                <td className='col-1 border-start'>Action</td>
                            </tr>
                        </thead>
                        <tbody>
                            {prescriptions.length > 0 ? (
                                prescriptions.map((prescription,index)=>(
                                    <tr key={index} className="text-center" style={{verticalAlign:'middle'}}>
                                        <td className='p-1'>
                                            <div className=''>{formatDate(prescription.prescriptionData.date)}</div>
                                            <QRCodeSVG value={prescription.prescriptionData.prescriptionID} size={80} />
                                            <div className='mt-1' style={{ fontSize: 8 }}>{prescription.prescriptionData.prescriptionID}</div>
                                        </td>
                                        {role != 'Patient' &&
                                            <td className='border-start'>
                                                <div className="vstack">
                                                    <div className='m-0 p-0'>{prescription.patientData.name}</div>
                                                    <div>{prescription.patientData.nhiNumber}</div>
                                                    <div>{prescription.patientData.contactNumber}</div>
                                                    {/* <div style={{ fontSize: 10 }}>{prescription.patientData.address}</div> */}
                                                </div>
                                            </td>
                                        }
                                        {role != 'Physician' &&
                                            <td className='border-start'>
                                                <div className="vstack ps-3">
                                                    <div className=''>{prescription.physicianData.name}</div>
                                                    <div>{prescription.physicianData.nzmcNo}</div>
                                                    <div style={{fontSize:14}}>Phone: {prescription.physicianData.contactNumber}</div>
                                                </div>
                                            </td>
                                        }   
                                        {role != 'Pharmacy' &&
                                            <td className='border-start'>
                                                {!prescription.pharmacyData ? (
                                                    <div className="">No Pharmacy Assigned</div>
                                                ) : (
                                                    <div className="vstack">
                                                        <div className='m-0 p-0'>{prescription.pharmacyData.pharmacyName}</div>
                                                        <div style={{ fontSize: 10 }}>{prescription.pharmacyData.pharmacyAddress}</div>
                                                        <div style={{ fontSize: 14 }}>Phone: {prescription.pharmacyData.contactNumber}</div>
                                                    </div>
                                                )}
                                            </td>
                                        } 
                                        <td className='border-start' >
                                            <div className='p-2 rounded' style={{background: statusColors[prescription.status]}} >
                                                {statusDescriptions[prescription.status]}
                                            </div>
                                        </td>
                                        <td className='border-start'>
                                            <Link className="btn btn-sm btn-warning buttonWidth"
                                                to={`/access-prescription/${prescription.prescriptionData.prescriptionID}`}
                                            >
                                                <i className="bi bi-prescription" style={{fontSize:28}}></i>
                                                <div style={{fontSize:10}}>View Pescription Details</div>
                                            </Link>
                                        </td>
                                    </tr>
                                ))

                            ):(
                                <tr>
                                    <td colSpan="6" className="text-center">No prescriptions found</td>
                                </tr>
                            )
                            }
                        </tbody>
                    </table>
                </>
            }
        </div>
    );
}
 
export default Home;