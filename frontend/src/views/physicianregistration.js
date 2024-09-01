import React, { useState } from 'react';
import { uploadToIPFS } from '../utils/ipfsutils'; 
import { initWeb3, initContracts } from '../utils/web3utils'; 
import useUserRole from '../hooks/useuserrole'; 

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
                throw new Error('Only regulatory authorities can register physicians');
            }

            const { address, name, speciality, contactNumber, nzmcNo } = formState;

            if (!address || !name || !speciality || !contactNumber || !nzmcNo) {
                throw new Error('All fields are required');
            }

            const data = { name, speciality, contactNumber, nzmcNo };
            const ipfsHash = await uploadToIPFS(data);

            const web3 = await initWeb3();
            const { registrationContract } = await initContracts(web3); 

            const accounts = await web3.eth.getAccounts();
            const userAddress = accounts[0];

            await registrationContract.methods.PhysicianRegistration(address, ipfsHash).send({ from: userAddress });

            setSuccess('Physician registered successfully!');
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
            <h4>Physician Registration</h4>
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
                            id="speciality"
                            name="speciality"
                            className="form-control"
                            value={formState.speciality}
                            onChange={handleChange}
                            placeholder="Speciality"
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
                        />
                        <label htmlFor="nzmcNo">NZMC No</label>
                    </div>
                    <button className="btn btn-sm btn-primary" type="submit" disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
            ) : (
                <p className="mt-3">You do not have the required permissions to register a physician.</p>
            )}
            {error && <p className="text-danger mt-3">{error}</p>}
            {success && <p className="text-success mt-3">{success}</p>}
        </div>
    );
};

export default PhysicianRegistration;
