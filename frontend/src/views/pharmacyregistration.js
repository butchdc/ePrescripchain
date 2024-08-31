import React, { useState } from 'react';
import { uploadToIPFS } from '../utils/ipfsutils'; 
import { initWeb3, initContract } from '../utils/web3utils'; 
import useUserRole from '../hooks/useuserrole'; 

const PharmacyRegistration = () => {
    const [formState, setFormState] = useState({
        address: '',
        pharmacyName: '',
        pharmacyAddress: '',
        contactPerson: '',
        contactNumber: '',
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
            if (role !== 'Regulatory Authority') {
                throw new Error('Only regulatory authorities can register pharmacies');
            }

            const { address, pharmacyName, pharmacyAddress, contactPerson, contactNumber } = formState;

            if (!address || !pharmacyName || !pharmacyAddress || !contactPerson || !contactNumber) {
                throw new Error('All fields are required');
            }

            const data = { pharmacyName, pharmacyAddress, contactPerson, contactNumber };
            const ipfsHash = await uploadToIPFS(data);

            const web3 = await initWeb3();
            const contract = await initContract(web3);

            const accounts = await web3.eth.getAccounts();
            const userAddress = accounts[0];

            await contract.methods.PharmacyRegistration(address, ipfsHash).send({ from: userAddress });

            setSuccess('Pharmacy registered successfully!');
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
            <h4>Pharmacy Registration</h4>
            {role === 'Regulatory Authority' ? (
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
                            id="pharmacyName"
                            name="pharmacyName"
                            className="form-control"
                            value={formState.pharmacyName}
                            onChange={handleChange}
                            placeholder="Pharmacy Name"
                        />
                        <label htmlFor="pharmacyName">Pharmacy Name</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input
                            type="text"
                            id="pharmacyAddress"
                            name="pharmacyAddress"
                            className="form-control"
                            value={formState.pharmacyAddress}
                            onChange={handleChange}
                            placeholder="Pharmacy Address"
                        />
                        <label htmlFor="pharmacyAddress">Pharmacy Address</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input
                            type="text"
                            id="contactPerson"
                            name="contactPerson"
                            className="form-control"
                            value={formState.contactPerson}
                            onChange={handleChange}
                            placeholder="Contact Person"
                        />
                        <label htmlFor="contactPerson">Contact Person</label>
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
                    <button className="btn btn-sm btn-sm btn-primary" type="submit" disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
            ) : (
                <p className="mt-3">You do not have the required permissions to register a pharmacy.</p>
            )}
            {error && <p className="text-danger mt-3">{error}</p>}
            {success && <p className="text-success mt-3">{success}</p>}
        </div>
    );
};

export default PharmacyRegistration;
