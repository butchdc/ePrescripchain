import { useState } from 'react';
import { uploadToIPFS } from '../utils/ipfsutils'; 
import { initWeb3, initContracts } from '../utils/web3utils'; 
import { getUserRoleAndAttributes } from '../utils/userqueryutils'; 

const PatientRegistration = () => {
    const [formState, setFormState] = useState({
        address: '',
        name: '',
        patientAddress: '',
        gender: '',
        dateOfBirth: '',
        nhiNumber: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

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
            const { address, name, patientAddress, gender, dateOfBirth, nhiNumber } = formState;

            if (!address || !name || !patientAddress || !gender || !dateOfBirth || !nhiNumber) {
                throw new Error('All fields are required');
            }

            const { role: searchRole } = await getUserRoleAndAttributes(address);

            if (searchRole !== 'Account is not Registered!') {
                throw new Error(`This address is already registered as ${searchRole}.`);
            }

            const role = 'Patient';
            const data = { address, role, name, patientAddress, gender, dateOfBirth, nhiNumber };
            const ipfsHash = await uploadToIPFS(data);

            const web3 = await initWeb3();
            const { registrationContract } = await initContracts(web3);

            const accounts = await web3.eth.getAccounts();
            const userAddress = accounts[0];

            await registrationContract.methods.PatientRegistration(address, ipfsHash).send({ from: userAddress });

            // Reset form state and display success message
            setFormState({
                address: '',
                name: '',
                patientAddress: '',
                gender: '',
                dateOfBirth: '',
                nhiNumber: '',
            });
            setSuccess('Patient registered successfully!');
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container p-3 bgcolor2">
            <h4>Patient Registration</h4>
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
                        id="patientAddress"
                        name="patientAddress"
                        className="form-control"
                        value={formState.patientAddress}
                        onChange={handleChange}
                        placeholder="Address"
                        autoComplete='off'
                    />
                    <label htmlFor="patientAddress">Address</label>
                </div>
                <div className="form-floating mb-3">
                    <select
                        id="gender"
                        name="gender"
                        className="form-select"
                        value={formState.gender}
                        onChange={handleChange}
                        placeholder="Gender"
                    >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                    <label htmlFor="gender">Gender</label>
                </div>
                <div className="form-floating mb-3">
                    <input
                        type="date"
                        id="dateOfBirth"
                        name="dateOfBirth"
                        className="form-control"
                        value={formState.dateOfBirth}
                        onChange={handleChange}
                        placeholder="Date of Birth"
                        autoComplete='off'
                    />
                    <label htmlFor="dateOfBirth">Date of Birth</label>
                </div>
                <div className="form-floating mb-3">
                    <input
                        type="text"
                        id="nhiNumber"
                        name="nhiNumber"
                        className="form-control"
                        value={formState.nhiNumber}
                        onChange={handleChange}
                        placeholder="NHI No"
                        autoComplete='off'
                    />
                    <label htmlFor="nhiNumber">NHI No</label>
                </div>
                <button className="btn btn-sm btn-primary" type="submit" disabled={loading}>
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>
            {error && <p className="text-danger mt-3">{error}</p>}
            {success && <p className="text-success mt-3">{success}</p>}
        </div>
    );
};

export default PatientRegistration;
