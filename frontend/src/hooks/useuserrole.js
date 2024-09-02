import { useState, useEffect } from 'react';
import { initWeb3, initContracts } from '../utils/web3utils'; 

const useUserRole = () => {
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ethereumAvailable, setEthereumAvailable] = useState(true);

    const fetchUserRole = async (userAddress) => {
        setLoading(true);
        setError(null);

        try {
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed');
            }

            setEthereumAvailable(true);

            // Initialize web3 and contract
            const web3 = await initWeb3();
            const { registrationContract } = await initContracts(web3);

            // Fetch roles from the contract
            const adminAddress = await registrationContract.methods.administrator().call();
            const isAdministrator = adminAddress.toLowerCase() === userAddress.toLowerCase();
            const isPhysician = await registrationContract.methods.Physician(userAddress).call();
            const isPatient = await registrationContract.methods.Patient(userAddress).call();
            const isPharmacy = await registrationContract.methods.Pharmacy(userAddress).call();
            const isRegulatoryAuthority = await registrationContract.methods.regulatoryAuthority(userAddress).call();

            if (isAdministrator) {
                setRole('Administrator');
            } else if (isRegulatoryAuthority) {
                setRole('Regulatory Authority');
            } else if (isPhysician) {
                setRole('Physician');
            } else if (isPatient) {
                setRole('Patient');
            } else if (isPharmacy) {
                setRole('Pharmacy');
            } else {
                setRole('Account is not Registered');
            }
        } catch (err) {
            setError(err.message);
            if (err.message === 'MetaMask is not installed') {
                setEthereumAvailable(false);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleAccountsChanged = (accounts) => {
            if (accounts.length > 0) {
                fetchUserRole(accounts[0]);
            }
        };

        const getUserAddress = async () => {
            if (!window.ethereum) {
                setEthereumAvailable(false);
                setLoading(false);
                return;
            }

            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                if (accounts.length > 0) {
                    fetchUserRole(accounts[0]);
                }
            } catch (err) {
                console.error('Failed to get user address:', err);
                setLoading(false);
            }
        };

        getUserAddress();

        // Listen for account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            }
        };
    }, []);

    return { role, loading, error, ethereumAvailable };
};

export default useUserRole;
