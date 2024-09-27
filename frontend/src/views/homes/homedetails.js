import { useEffect, useState } from 'react';
import axios from 'axios';
import { initWeb3, initContracts } from '../../utils/web3utils';
import { getUserRoleAndAttributes } from '../../utils/userqueryutils';
import { downloadFromIPFS } from '../../utils/apiutils';
import { Link } from 'react-router-dom';

const apiBaseURL = process.env.REACT_APP_API_BASE_URL;

const statusDescriptions = [
    <><i className='bi bi-clock h5'></i> Awaiting Pharmacy Assignment</>,
    <><i className='bi bi-question-circle h5'></i> Awaiting For Confirmation</>,
    <><i className='bi bi-hourglass-split h5'></i> Preparing</>,
    <><i className='bi bi-check-circle h5'></i> Ready For Collection</>,
    <span className= 'text-white' ><i className='bi bi-basket h5'></i> Collected</span>,
    <><i className='bi bi-x-circle h5'></i> Cancelled</>,
    <><i className='bi bi-arrow-repeat h5'></i> Reassigned</>
];

const statusColors = [
    "#D3D3D3", 
    "#ADD8E6", 
    "#FFDAB9", 
    "#90EE90", 
    "#388E3C", 
    "#F08080", 
    "#FFFFE0" 
];

const HomeDetails = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState('');
    const [role, setRole] = useState('');
    const [contracts, setContracts] = useState(null);

    const [limit, setLimit] = useState(5);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    useEffect(() => {
        const initialize = async () => {
            try {
                const web3Instance = await initWeb3();
                const accounts = await web3Instance.eth.getAccounts();
                setCurrentUser(accounts[0]);

                const contractsInstance = await initContracts(web3Instance);
                setContracts(contractsInstance);

                const { role: fetchedRole } = await getUserRoleAndAttributes(accounts[0]);
                setRole(fetchedRole);

                // Reset state and fetch initial prescriptions
                if(role){
                    await fetchPrescriptions(fetchedRole, accounts[0]);
                    setOffset(prev => prev + limit);
                }

            } catch (err) {
                console.error('Initialization error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        initialize();
    }, [role]); 

    const fetchPrescriptions = async (userRole, userAddress) => {
        try {
            const params = {
                limit,
                offset,
                ...{
                    'Physician': { createdBy: userAddress },
                    'Pharmacy': { assignedTo: userAddress },
                    'Patient': { address: userAddress }
                }[userRole]
            };

            console.log(`Fetching from: ${apiBaseURL}prescriptions/past with params:`, params);
            const response = await axios.get(`${apiBaseURL}prescriptions/past`, { params });

            if (response.data.message === "No past prescriptions found.") {
                setHasMore(false);
                return;
            }
    
            const prescriptionsData = await Promise.all(
                response.data.map(async (prescription) => {
                    try {
                        const patientAddress = prescription.address;
                        const physicianAddress = prescription.createdBy;
                        const pharmacyAddress = prescription.assignedTo ? prescription.assignedTo : null;

                        const patientIPFSHash = await contracts.registrationContract.methods.getPatientIPFSHash(patientAddress).call();
                        const patientData = await downloadFromIPFS(patientIPFSHash);

                        const physicianIPFSHash = await contracts.registrationContract.methods.getPhysicianIPFSHash(physicianAddress).call();
                        const physicianData = await downloadFromIPFS(physicianIPFSHash);

                        const pharmacyData = pharmacyAddress 
                            ? await downloadFromIPFS(await contracts.registrationContract.methods.getPharmacyIPFSHash(pharmacyAddress).call()) 
                            : null;

                        const prescriptionData = await contracts.prescriptionContract.methods.accessPrescription(prescription.prescriptionID).call({ from: currentUser });

                        return {
                            prescriptionData: prescription,
                            patientData,
                            physicianData,
                            pharmacyData,
                            status: prescriptionData[2],
                        };
                    } catch (err) {
                        console.error(`Failed to fetch data for patient ${prescription.address}:`, err);
                        return null;
                    }
                })
            );

            setPrescriptions(prev => [...prev, ...prescriptionsData.filter(data => data !== null)]);
            setError(null);
            console.log(prescriptionsData.length)
            setHasMore(prescriptionsData.length === limit); 

        } catch (error) {
            console.error('Error fetching prescriptions:', error.response ? error.response.data : error);
            setError('Failed to fetch prescriptions.');
        }
    };

    const formatDate = (timestamp) => new Date(timestamp).toISOString().split('T')[0];

    const loadMore = () => {
        if (!hasMore) return;
        setOffset(prev => prev + limit);
        fetchPrescriptions(role, currentUser);
    };

    return (
        <div>
            {loading && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <p>Loading...</p>
                </div>
            )}
            {error && (
                <div style={{ textAlign: 'center', color: 'red', padding: '20px' }}>
                    <p>Error: {error}</p>
                </div>
            )}
            {role && (
                <div>
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
                                            <div className='mt-1' style={{ fontSize: 12 }}>{prescription.prescriptionData.prescriptionID}</div>
                                        </td>
                                        {role != 'Patient' &&
                                            <td className='border-start'>
                                                <div className="vstack">
                                                    <div className='m-0 p-0'>{prescription.patientData.name}</div>
                                                    <div>{prescription.patientData.nhiNumber}</div>
                                                    <div style={{fontSize:14}}>Phone: {prescription.patientData.contactNumber}</div>
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
                                                    <div className="text-primary">No Pharmacy Assigned</div>
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
                                            </Link>
                                        </td>
                                    </tr>
                                ))

                            ):(
                                <tr>
                                    <td colSpan="6" className="text-center">No previous prescriptions found.</td>
                                </tr>
                            )
                            }
                        </tbody>
                    </table>
                    {hasMore && (
                        <button className='btn btn-sm btn-dark' onClick={loadMore}><i class="bi bi-cloud-download"></i> Load More</button>
                    )}
                </div>
            )}
        </div>
    );
};

export default HomeDetails;
