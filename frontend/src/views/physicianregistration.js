import React, { useState } from 'react';
import { uploadToIPFS } from '../utils/ipfsutils'; 
import { initWeb3, initContracts } from '../utils/web3utils'; 
import { getUserRoleAndAttributes } from '../utils/userqueryutils'; 

const PhysicianRegistration = () => {
    const [formState, setFormState] = useState({
        address: '',
        name: '',
        speciality: '',
        contactNumber: '',
        nzmcNo: '',
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

    // Check if address is already registered and get its role
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
        setIsRegistered(false); // Reset registration status before checking

        try {
            const { address, name, speciality, contactNumber, nzmcNo } = formState;

            if (!address || !name || !speciality || !contactNumber || !nzmcNo) {
                throw new Error('All fields are required');
            }

            // Check if the address is already registered
            const isAddressRegistered = await checkAddress(address);

            if (isAddressRegistered) {
                setIsRegistered(true);
                return; // Exit early to avoid attempting to register again
            }

            const data = { name, speciality, contactNumber, nzmcNo };
            const ipfsHash = await uploadToIPFS(data);

            const web3 = await initWeb3();
            const { registrationContract } = await initContracts(web3);

            const accounts = await web3.eth.getAccounts();
            const userAddress = accounts[0];

            await registrationContract.methods.PhysicianRegistration(address, ipfsHash).send({ from: userAddress });

            setFormState({
                address: '',
                name: '',
                speciality: '',
                contactNumber: '',
                nzmcNo: '',
            });

            setSuccess('Physician registered successfully!');
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
            <h4>Physician Registration</h4>
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
                            id="speciality"
                            name="speciality"
                            className="form-control"
                            value={formState.speciality}
                            onChange={handleChange}
                            placeholder="Speciality"
                            autoComplete='off'
                        />
                        <label htmlFor="speciality">Speciality</label>
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
                            type="text"
                            id="nzmcNo"
                            name="nzmcNo"
                            className="form-control"
                            value={formState.nzmcNo}
                            onChange={handleChange}
                            placeholder="NZMC No"
                            autoComplete='off'
                        />
                        <label htmlFor="nzmcNo">NZMC No</label>
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

export default PhysicianRegistration;
