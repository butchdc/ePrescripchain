import React, { useState } from 'react';
import useUserRole from '../hooks/useuserrole'; 
import { uploadToIPFS } from '../utils/ipfsutils'; 
import { initWeb3, initContracts } from '../utils/web3utils'; 

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

            const web3 = await initWeb3();
            const { registrationContract } = await initContracts(web3);

            // Check if the address is already registered
            const alreadyRegistered = await registrationContract.methods.regulatoryAuthority(address).call();

            if (alreadyRegistered) {
                throw new Error('This address is already registered.');
            }

            const data = { name, contactNumber, contactEmail, organization };
            const ipfsHash = await uploadToIPFS(data);

            const accounts = await web3.eth.getAccounts();
            const userAddress = accounts[0];

            await registrationContract.methods.registerRegulatoryAuthority(address, ipfsHash).send({ from: userAddress });

            setSuccess('Regulatory authority registered successfully!');
            // Clear the form
            setFormState({
                address: '',
                name: '',
                contactNumber: '',
                contactEmail: '',
                organization: '',
            });
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
                            autoComplete='off'                            
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
                            autoComplete='off'
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
                            autoComplete='off'
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
                            autoComplete='off'
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
                            autoComplete='off'
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
