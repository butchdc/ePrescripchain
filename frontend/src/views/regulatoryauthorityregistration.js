import React, { useState } from 'react';
import useUserRole from '../hooks/useuserrole'; // Adjust the path as necessary
import { uploadToIPFS } from '../utils/ipfsutils'; // Adjust import path as needed
import { initWeb3, initContract } from '../utils/web3utils'; // Adjust import path as needed

const RegulatoryAuthorityRegistration = () => {
    const [formState, setFormState] = useState({
        address: '',
        name: '',
        contactNumber: '',
        contactEmail: '',
        organization: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const { role, loading: roleLoading, error: roleError } = useUserRole();

    // Generic change handler for form fields
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (role !== 'Administrator') {
                throw new Error('Only administrators can register a regulatory authority');
            }

            const { address, name, contactNumber, contactEmail, organization } = formState;

            if (!address || !name || !contactNumber || !contactEmail || !organization) {
                throw new Error('All fields are required');
            }

            const data = { name, contactNumber, contactEmail, organization };
            const ipfsHash = await uploadToIPFS(data);

            const web3 = await initWeb3();
            const contract = await initContract(web3);

            const accounts = await web3.eth.getAccounts();
            const userAddress = accounts[0];

            await contract.methods.registerRegulatoryAuthority(address, ipfsHash).send({ from: userAddress });

            setSuccess('Regulatory authority registered successfully!');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (roleLoading) return <p>Loading...</p>;
    if (roleError) return <p style={{ color: 'red' }}>{roleError}</p>;

    return (
        <div className="container p-3 bgcolor2">
            <h4>Regulatory Authority Registration</h4>
            {role === 'Administrator' ? (
                <form onSubmit={handleSubmit} className="mt-3">
                    <div className="form-floating mb-3">
                        <input
                            type="text"
                            id="address"
                            name="address"
                            className="form-control"
                            value={formState.address}
                            onChange={handleChange}
                            placeholder="Account Address"
                        />
                        <label htmlFor="address">Account Address</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className="form-control"
                            value={formState.name}
                            onChange={handleChange}
                            placeholder="Name"
                        />
                        <label htmlFor="name">Name</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input
                            type="text"
                            id="contactNumber"
                            name="contactNumber"
                            className="form-control"
                            value={formState.contactNumber}
                            onChange={handleChange}
                            placeholder="Contact Number"
                        />
                        <label htmlFor="contactNumber">Contact Number</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input
                            type="email"
                            id="contactEmail"
                            name="contactEmail"
                            className="form-control"
                            value={formState.contactEmail}
                            onChange={handleChange}
                            placeholder="Contact Email"
                        />
                        <label htmlFor="contactEmail">Contact Email</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input
                            type="text"
                            id="organization"
                            name="organization"
                            className="form-control"
                            value={formState.organization}
                            onChange={handleChange}
                            placeholder="Organization"
                        />
                        <label htmlFor="organization">Organization</label>
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
            ) : (
                <p className="mt-3">You do not have the required permissions to register a regulatory authority.</p>
            )}
            {error && <p className="text-danger mt-3">{error}</p>}
            {success && <p className="text-success mt-3">{success}</p>}
        </div>
    );
};

export default RegulatoryAuthorityRegistration;
