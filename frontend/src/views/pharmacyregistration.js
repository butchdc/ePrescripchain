import React, { useState } from 'react';
import { uploadToIPFS } from '../utils/ipfsutils'; 
import { initWeb3, initContracts } from '../utils/web3utils'; 
import { getUserRoleAndAttributes } from '../utils/userqueryutils'; 

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
    const [isRegistered, setIsRegistered] = useState(false);
    const [userRole, setUserRole] = useState('');

    // Generic change handler for form fields
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    // Check if address is already registered
    const checkAddress = async (address) => {
        try {
            const { role } = await getUserRoleAndAttributes(address);
            if (role !== 'Account is not Registered!') {
                setUserRole(role);
                return true;
            }
            return false;
        } catch (err) {
            console.error('Error checking address:', err);
            throw new Error('Failed to check address');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const { address, pharmacyName, pharmacyAddress, contactPerson, contactNumber } = formState;

            if (!address || !pharmacyName || !pharmacyAddress || !contactPerson || !contactNumber) {
                throw new Error('All fields are required');
            }

            // Check if the address is already registered
            const isAddressRegistered = await checkAddress(address);

            if (isAddressRegistered) {
                setIsRegistered(true);
                return;
            }

            const data = { pharmacyName, pharmacyAddress, contactPerson, contactNumber };
            const ipfsHash = await uploadToIPFS(data);

            const web3 = await initWeb3();
            const { registrationContract } = await initContracts(web3);

            const accounts = await web3.eth.getAccounts();
            const userAddress = accounts[0];

            await registrationContract.methods.PharmacyRegistration(address, ipfsHash).send({ from: userAddress });

            setFormState({
                address: '',
                pharmacyName: '',
                pharmacyAddress: '',
                contactPerson: '',
                contactNumber: '',
            });

            setSuccess('Pharmacy registered successfully!');
            setIsRegistered(false); 
            setUserRole(''); 
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container p-3 bgcolor2">
            <h4>Pharmacy Registration</h4>
            {isRegistered ? (
                <p className="mt-3">Account is already registered as a {userRole}.</p>
            ) : (
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
                            id="pharmacyName"
                            name="pharmacyName"
                            className="form-control"
                            value={formState.pharmacyName}
                            onChange={handleChange}
                            placeholder="Pharmacy Name"
                            autoComplete='off'
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
                            autoComplete='off'
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
                            autoComplete='off'
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
                            autoComplete='off'
                        />
                        <label htmlFor="contactNumber">Contact Number</label>
                    </div>
                    <button className="btn btn-sm btn-primary" type="submit" disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
            )}
            {error && <p className="text-danger mt-3">{error}</p>}
            {success && <p className="text-success mt-3">{success}</p>}
        </div>
    );
};

export default PharmacyRegistration;
