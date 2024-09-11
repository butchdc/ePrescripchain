import { useState } from 'react';
import { uploadToIPFS, saveEntityToDB } from '../../utils/apiutils'; 
import { initWeb3, initContracts } from '../../utils/web3utils'; 
import { getUserRoleAndAttributes } from '../../utils/userqueryutils'; 

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
            const { address, name, speciality, contactNumber, nzmcNo } = formState;

            if (!address || !name || !speciality || !contactNumber || !nzmcNo) {
                throw new Error('All fields are required');
            }

            const { role: searchRole } = await getUserRoleAndAttributes(address);

            if (searchRole !== 'Account is not Registered!') {
                throw new Error(`This address is already registered as ${searchRole}.`);
            }

            const role = 'Physician';
            const data = { address, role, name, speciality, contactNumber, nzmcNo };
            const ipfsHash = await uploadToIPFS(data);

            const web3 = await initWeb3();
            const { registrationContract } = await initContracts(web3);

            const accounts = await web3.eth.getAccounts();
            const userAddress = accounts[0];

            await registrationContract.methods.PhysicianRegistration(address, ipfsHash).send({ from: userAddress });

            await saveEntityToDB('physicians',{
                address,
                ipfsHash,
                createdBy: userAddress,
                date: Date.now(),
            });

            setSuccess('Physician registered successfully!');

            setFormState({
                address: '',
                name: '',
                speciality: '',
                contactNumber: '',
                nzmcNo: '',
            });

            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePaste = async (e) => {
        e.preventDefault(); 
        try {
            const clipboardData = e.clipboardData || window.clipboardData;
            const text = clipboardData.getData('Text');
            const rows = text.split('\n').map(row => row.split(';'));

            if (rows.length > 0) {
                const [address, name, speciality, contactNumber, nzmcNo] = rows[0];
                setFormState({
                    address: address || '',
                    name: name || '',
                    speciality: speciality || '',
                    contactNumber: contactNumber || '',
                    nzmcNo: nzmcNo || '',
                });
            }
        } catch (err) {
            setError('Failed to paste data from clipboard.');
            console.error('Error pasting text: ', err);
        }
    };

    return (
        <div 
            className="container p-3 bgcolor2"
            onPaste={handlePaste} 
        >
            <h4>Physician Registration</h4>
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
            {error && <p className="text-danger mt-3">{error}</p>}
            {success && <p className="text-success mt-3">{success}</p>}
        </div>
    );
};

export default PhysicianRegistration;
