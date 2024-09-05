import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { initWeb3 } from '../utils/web3utils';
import { getUserRoleAndAttributes } from '../utils/userqueryutils';

const Navbar = () => {
    const [role, setRole] = useState('');
    const [attributes, setAttributes] = useState({});
    const [userAddress, setUserAddress] = useState('');
    const [line1, setLine1] = useState('');
    const [line2, setLine2] = useState('');

    useEffect(() => {
        const fetchAccountData = async () => {
            try {
                // Initialize Web3 and get accounts
                const web3 = await initWeb3();
                const accounts = await web3.eth.getAccounts();
                const address = accounts[0];
                setUserAddress(address);

                // Fetch role and attributes
                const { role, attributes } = await getUserRoleAndAttributes(address);
                setRole(role);
                setAttributes(attributes);
                
                if(role === 'Regulatory Authority'){
                    setLine1(attributes.name);
                    setLine2(`${attributes.organization}`);
                    return;
                }
                if(role === 'Physician'){
                    setLine1(`${attributes.name} (NZMC: ${attributes.nzmcNo})`);
                    setLine2(attributes.speciality);
                    return;
                }
                if(role === 'Pharmacy'){
                    setLine1(attributes.pharmacyName);
                    setLine2(attributes.pharmacyAddress);
                    return;
                }
                if(role === 'Patient'){
                    setLine1(`${attributes.name} (NHI: ${attributes.nhiNumber})`);
                    setLine2(attributes.patientAddress);
                    return;
                }

            } catch (error) {
                setRole('Error');
            }
        };

        fetchAccountData();
    }, []);

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bgcolor1 ps-3 pe-3 m-0">
            <Link className="navbar-brand" to="/">
                <img src="/images/logo.png" className='pe-2' style={{ height: '40px', width: 'auto' }} />
                e-Prescription DApp
            </Link>
            <button 
                className="navbar-toggler" 
                type="button" 
                data-bs-toggle="collapse" 
                data-bs-target="#navbarSupportedContent" 
                aria-controls="navbarSupportedContent" 
                aria-expanded="false" 
                aria-label="Toggle navigation"
            >
                <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav me-auto">
                    {role === 'Administrator' && (
                        <>
                            <li className="nav-item">
                                <Link className="nav-link" to="/register-regulatory-authority">Register Regulatory Authority</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/query-page">Account Query</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/ipfs-query">IPFS Query</Link>
                            </li>
                        </>
                    )}
                    {role === 'Regulatory Authority' && (
                        <>
                            <li className="nav-item">
                                <Link className="nav-link" to="/register-physician">Register Physician</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/register-pharmacy">Register Pharmacy</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/register-patient">Register Patient</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/query-page">Account Query</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/ipfs-query">IPFS Query</Link>
                            </li>
                        </>
                    )}
                    {role === 'Physician' && (
                        <li className="nav-item">
                            <Link className="nav-link" to="/create-prescription">Create Prescription</Link>
                        </li>
                    )}
                </ul>
                {role != 'Account is not Registered!' ? 
                <div className="text-light">
                    <div className='m-0 p-0'>{line1} </div>                  
                    <div className='smallfont txcolor1 m-0 p-0'>{line2}</div> 
                    <div className='smallfont'>Current Role: {role}</div>
                    {/* <div style={{fontSize:6}}>{userAddress}</div> */}
                </div>
                : <div className="text-light smallfont">{role}</div>
                }
            </div>
        </nav>
    );
};

export default Navbar;
