import { useState, useEffect } from 'react';
import { initWeb3, initContracts } from '../utils/web3utils';
import { getUserRoleAndAttributes } from '../utils/userqueryutils';
import { uploadToIPFS, savePrescriptionToDB } from '../utils/apiutils';

const PrescriptionForm = () => {
    const [physicianAddress, setPhysicianAddress] = useState('');
    const [patientAddress, setPatientAddress] = useState('');
    const [isPatientRegistered, setIsPatientRegistered] = useState(null);
    const [patientAttributes, setPatientAttributes] = useState({});
    const [drugs, setDrugs] = useState([{ name: '', sig: '', mitte: '', mitteUnit: 'tablets', repeat: '' }]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUserAddress = async () => {
            try {
                const web3 = await initWeb3();
                const accounts = await web3.eth.getAccounts();
                const userAddress = accounts[0];
                setPhysicianAddress(userAddress);
            } catch (err) {
                console.error("Error getting current address:", err);
                setError("Error retrieving address");
            }
        };

        fetchUserAddress();
    }, []);

    const handleDrugChange = (index, e) => {
        const { name, value } = e.target;
        const newDrugs = [...drugs];
        newDrugs[index][name] = value;
        setDrugs(newDrugs);
        setError(null);
    };

    const addDrug = () => {
        setDrugs([...drugs, { name: '', sig: '', mitte: '', mitteUnit: 'tablets', repeat: '' }]);
    };

    const removeDrug = (index) => {
        const newDrugs = drugs.filter((_, i) => i !== index);
        setDrugs(newDrugs);
    };

    const verifyPatientAddress = async () => {
        try {
            const { role, attributes } = await getUserRoleAndAttributes(patientAddress);

            if (role === 'Patient') {
                setIsPatientRegistered(true);
                const { name, patientAddress, gender, dateOfBirth, nhiNumber } = attributes;
                setPatientAttributes({ name, patientAddress, gender, dateOfBirth, nhiNumber }); 
            } else {
                setIsPatientRegistered(false);
                setPatientAttributes({}); 
            }
        } catch (err) {
            console.error("Error verifying patient address:", err);
            setError("Error verifying patient address");
        }
    };

    const prepareDataForIPFS = () => {
        return {
            physicianAddress,
            patientAddress,
            drugs: drugs.map(drug => ({
                name: drug.name,
                sig: drug.sig,
                mitte: drug.mitte,
                mitteUnit: drug.mitteUnit,
                repeat: drug.repeat
            }))
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Check that all required fields are filled
            if (!physicianAddress || !patientAddress || drugs.some(drug => !drug.name || !drug.sig || !drug.mitte || !drug.repeat)) {
                throw new Error('All fields are required');
            }

            if (isPatientRegistered === false) {
                throw new Error('Patient is not registered');
            }

            // Prepare the data to be uploaded to IPFS
            const dataToUpload = prepareDataForIPFS();
            console.log(dataToUpload);
            const ipfsHash = await uploadToIPFS(dataToUpload);

            // Initialize Web3 and contract instances
            const web3 = await initWeb3();
            const { prescriptionContract } = await initContracts(web3);

            // Call prescriptionCreation method on the smart contract
            const tx = await prescriptionContract.methods.prescriptionCreation(patientAddress, ipfsHash).send({ from: physicianAddress });

            // Extract the prescription ID from the event
            const prescriptionCreatedEvent = tx.events.PrescriptionCreated.returnValues;
            const prescriptionID = prescriptionCreatedEvent.prescriptionID;
    
            const prescriptionIDNumber = Number(prescriptionID)
            // Save the prescription details to the database
            await savePrescriptionToDB({
                address: patientAddress,
                ipfsHash,
                createdBy: physicianAddress,
                date: Date.now(),
                prescriptionID: prescriptionIDNumber, 
            });

            // Reset form state after successful submission
            setPatientAddress('');
            setDrugs([{ name: '', sig: '', mitte: '', mitteUnit: 'tablets', repeat: '' }]);
            setSuccess('Prescription submitted successfully!');
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-3 bgcolor2">
            <h4 className="mb-2">Prescription Form</h4>
            <form onSubmit={handleSubmit} className="needs-validation" noValidate>
                <div className="form-group mb-3">
                    <label htmlFor="patientAddress" className="smallfont">Patient Address</label>
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            id="patientAddress"
                            value={patientAddress}
                            onChange={(e) => setPatientAddress(e.target.value)}
                            required
                            autoComplete='off'
                            tabIndex={1}
                        />
                        <button
                            type="button"
                            className="btn btn-sm btn-success"
                            onClick={verifyPatientAddress}
                            tabIndex={-1}
                        >
                            Verify Patient Address
                        </button>
                    </div>
                    {isPatientRegistered === false && (
                        <div className="alert alert-warning mt-2" role="alert">
                            The patient address is not registered.
                        </div>
                    )}
                    {isPatientRegistered === true && (
                        <div className="mt-3">
                            <div className='smallfont'>Patient Information</div>
                            <table className="table table-sm table-striped">
                                <tbody>
                                    {Object.entries(patientAttributes).map(([key, value]) => (
                                        <tr key={key}>
                                            <td style={{fontSize: 14, fontWeight: 500, color: '#00558C'}} className='col-1'>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()}</td>
                                            <td className='border-start col-4'>{value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {drugs.map((drug, index) => (
                    <div className="form-group mb-3" key={index}>
                        <hr className="mb-2" /> 
                        <div className="d-flex justify-content-between mb-2">
                            <h5 className="mb-2">Drug {index + 1}</h5>
                            {drugs.length > 1 && (
                                <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    onClick={() => removeDrug(index)}
                                    tabIndex={-1}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                        <div className="row mb-3">
                            <div className="col-12 col-md-6">
                                <div className="form-group mb-2">
                                    <label htmlFor={`drugName${index}`} className="smallfont">Drug Name</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        id={`drugName${index}`}
                                        name="name"
                                        value={drug.name}
                                        onChange={(e) => handleDrugChange(index, e)}
                                        required
                                        autoComplete='off'
                                        tabIndex={2 + index * 6}
                                    />
                                </div>
                                <div className="d-flex">
                                    <div className="form-group mb-2 flex-grow-1 me-2">
                                        <label htmlFor={`drugMitte${index}`} className="smallfont">Mitte (Quantity)</label>
                                        <div className="input-group">
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                id={`drugMitte${index}`}
                                                name="mitte"
                                                value={drug.mitte}
                                                onChange={(e) => handleDrugChange(index, e)}
                                                required
                                                autoComplete='off'
                                                tabIndex={4 + index * 6}
                                            />
                                            <select
                                                className="form-select form-select-sm"
                                                id={`drugMitteUnit${index}`}
                                                name="mitteUnit"
                                                value={drug.mitteUnit}
                                                onChange={(e) => handleDrugChange(index, e)}
                                                required
                                                autoComplete='off'
                                                tabIndex={5 + index * 6}
                                            >
                                                <option value="tablets">tablets</option>
                                                <option value="capsules">capsules</option>
                                                <option value="ml">ml</option>
                                                <option value="g">g</option>
                                                <option value="mg">mg</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group mb-2 flex-grow-1">
                                        <label htmlFor={`drugRepeat${index}`} className="smallfont">Repeat (Times)</label>
                                        <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            id={`drugRepeat${index}`}
                                            name="repeat"
                                            value={drug.repeat}
                                            onChange={(e) => handleDrugChange(index, e)}
                                            required
                                            autoComplete='off'
                                            tabIndex={6 + index * 6}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-md-6">
                                <div className="form-group mb-2">
                                    <label htmlFor={`drugSig${index}`} className="smallfont">Sig (Instructions)</label>
                                    <textarea
                                        className="form-control form-control-sm"
                                        id={`drugSig${index}`}
                                        name="sig"
                                        rows="4"
                                        value={drug.sig}
                                        onChange={(e) => handleDrugChange(index, e)}
                                        required
                                        autoComplete='off'
                                        tabIndex={3 + index * 6}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                <div className="d-flex justify-content-between">
                    <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={addDrug}
                        tabIndex={-1}
                    >
                        Add Drug
                    </button>
                    <button
                        type="submit"
                        className="btn btn-sm btn-primary"
                        disabled={loading || !isPatientRegistered}
                        tabIndex={-1}
                    >
                        {loading ? 'Submitting...' : 'Submit Prescription'}
                    </button>
                </div>
                {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}
                {success && <div className="alert alert-success mt-3" role="alert">{success}</div>}
            </form>
        </div>
    );
};

export default PrescriptionForm;
