import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { create } from 'ipfs-http-client';  // Correct import for IPFS HTTP client
import { REGISTRATION_CONTRACT, IPFS_CLIENT } from '../config';

// Initialize IPFS client
const ipfsClient = create({ url: IPFS_CLIENT.URL });

const Admin = () => {
    const [web3, setWeb3] = useState(null);
    const [contract, setContract] = useState(null);
    const [account, setAccount] = useState('');
    const [name, setName] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [organization, setOrganization] = useState('');

    useEffect(() => {
        const initWeb3 = async () => {
            if (window.ethereum) {
                const web3Instance = new Web3(window.ethereum);
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const contractInstance = new web3Instance.eth.Contract(
                    REGISTRATION_CONTRACT.ABI,
                    REGISTRATION_CONTRACT.ADDRESS
                );
                setWeb3(web3Instance);
                setContract(contractInstance);
            } else {
                alert('Please install MetaMask!');
            }
        };
        initWeb3();
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            if (!web3 || !contract) return;

            // Upload data to IPFS
            const result = await ipfsClient.add(JSON.stringify({
                name,
                contactNumber,
                contactEmail,
                organization
            }));

            const ipfsHash = result.path; // This is the CID
            console.log('IPFS Hash:', ipfsHash); // Log the CID to the console

            // Register the regulatory authority
            const accounts = await web3.eth.getAccounts();
            await contract.methods.registerRegulatoryAuthority(account).send({ from: accounts[0] });

            alert('Regulatory authority registered successfully!');
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div>
            <h2>Register Regulatory Authority</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Account Address:</label>
                    <input
                        type="text"
                        value={account}
                        onChange={(e) => setAccount(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Name:</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Contact Number:</label>
                    <input
                        type="text"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Contact Email:</label>
                    <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Organization:</label>
                    <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Register</button>
            </form>
        </div>
    );
}

export default Admin;
