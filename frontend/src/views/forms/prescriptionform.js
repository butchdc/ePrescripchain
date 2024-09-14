import { useState, useEffect } from 'react';
import { initWeb3, initContracts } from '../../utils/web3utils';
import { getUserRoleAndAttributes } from '../../utils/userqueryutils';
import { uploadToIPFS, savePrescriptionToDB } from '../../utils/apiutils';
import { v4 as uuidv4 } from 'uuid';

const PrescriptionForm = () => {
    const [physicianAddress, setPhysicianAddress] = useState('');
    const [patientAddress, setPatientAddress] = useState('');
    const [isPatientRegistered, setIsPatientRegistered] = useState(null);
    const [patientAttributes, setPatientAttributes] = useState({});
    const [drugs, setDrugs] = useState([{ name: '', sig: '', mitte: '', mitteUnit: 'tablet(s)', repeat: '' }]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUserAddress = async () => {
            try {
                const web3 = await initWeb3();
                const [userAddress] = await web3.eth.getAccounts();
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
        setDrugs(drugs.map((drug, i) => i === index ? { ...drug, [name]: value } : drug));
        setError(null);
    };

    const addDrug = () => setDrugs([...drugs, { name: '', sig: '', mitte: '', mitteUnit: 'tablet(s)', repeat: '' }]);

    const removeDrug = (index) => setDrugs(drugs.filter((_, i) => i !== index));

    const verifyPatientAddress = async () => {
        try {
            const { role, attributes } = await getUserRoleAndAttributes(patientAddress);
            if (role === 'Patient') {
                setIsPatientRegistered(true);
                setPatientAttributes(attributes);
                console.log(patientAttributes);
            } else {
                setIsPatientRegistered(false);
                setPatientAttributes({});
            }
        } catch (err) {
            console.error("Error verifying patient address:", err);
            setError("Error verifying patient address");
            setIsPatientRegistered(false);
            setPatientAttributes({});
        }
    };

    const prepareDataForIPFS = (prescriptionID) => ({
        prescriptionID,
        physicianAddress,
        patientAddress,
        drugs: drugs.map(({ name, sig, mitte, mitteUnit, repeat }) => ({ name, sig, mitte, mitteUnit, repeat })),
        date: new Date()
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (!physicianAddress || !patientAddress || drugs.some(({ name, sig, mitte, repeat }) => !name || !sig || !mitte || !repeat)) {
                throw new Error('All fields are required');
            }

            if (!isPatientRegistered) {
                throw new Error('Patient is not registered');
            }

            const prescriptionID = uuidv4().replace(/-/g, '');
            //const prescriptionID = uuidv4();

            const dataToUpload = prepareDataForIPFS(prescriptionID);
            const ipfsHash = await uploadToIPFS(dataToUpload);

            const web3 = await initWeb3();
            const { prescriptionContract } = await initContracts(web3);

            await prescriptionContract.methods.prescriptionCreation(prescriptionID.toString(), patientAddress, ipfsHash).send({ from: physicianAddress });

            await savePrescriptionToDB({
                address: patientAddress,
                ipfsHash,
                createdBy: physicianAddress,
                date: Date.now(),
                prescriptionID,
                status: 'In-Progress'
            });

            setPatientAddress('');
            setDrugs([{ name: '', sig: '', mitte: '', mitteUnit: 'tablet(s)', repeat: '' }]);
            setIsPatientRegistered(null);
            setSuccess('Prescription submitted successfully!');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-3 bgcolor2">
            <h4 className="mb-2">Create Prescription</h4>
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
                    {isPatientRegistered && (
                        <div className="mt-3">
                            <div className='smallfont'>Patient Information</div>
                            <table className="table table-sm table-striped">
                                <tbody>
                                    <tr>
                                        <th>Address</th>
                                        <td className='border-start'>{patientAttributes.address}</td>
                                        <td></td><td></td>
                                    </tr>
                                    <tr>
                                        <th>Name</th>
                                        <td className='border-start'>{patientAttributes.name}</td>
                                        <th className='border-start'>Date of Birth</th>
                                        <td className='border-start text-center'>{patientAttributes.dateOfBirth}</td>
                                    </tr>
                                    <tr>
                                        <th>Patient Address</th>
                                        <td className='border-start'>{patientAttributes.patientAddress}</td>
                                        <th className='border-start'>NHI Number</th>
                                        <td className='border-start text-center'>{patientAttributes.nhiNumber}</td>
                                    </tr>
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
                                                min={1}
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
                                                <option value="tablet(s)">tablet(s)</option>
                                                <option value="capsule(s)">capsule(s)</option>
                                                <option value="mL">mL</option>
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
                                            min={1}
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
