import React, { useState, useEffect } from 'react';
import { initWeb3 } from '../utils/web3utils';
import { getUserRoleAndAttributes } from '../utils/userqueryutils'; // Adjust path if necessary

const PrescriptionForm = () => {
    const [physicianAddress, setPhysicianAddress] = useState('');
    const [patientAddress, setPatientAddress] = useState('');
    const [isPatientRegistered, setIsPatientRegistered] = useState(null);
    const [patientAttributes, setPatientAttributes] = useState({});
    const [diagnosis, setDiagnosis] = useState('');
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
    }, []); // Empty dependency array ensures this runs only once on mount

    const handleDrugChange = (index, e) => {
        const { name, value } = e.target;
        const newDrugs = [...drugs];
        newDrugs[index][name] = value;
        setDrugs(newDrugs);
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
                setPatientAttributes(attributes); // Set patient attributes
            } else {
                setIsPatientRegistered(false);
                setPatientAttributes({}); // Clear attributes if not a patient
            }
        } catch (err) {
            console.error("Error verifying patient address:", err);
            setError("Error verifying patient address");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (!physicianAddress || !patientAddress || !diagnosis) {
                throw new Error('All fields are required');
            }

            if (isPatientRegistered === false) {
                throw new Error('Patient is not registered');
            }

            // Assuming drugs are valid, you would add further checks or processing here
            console.log({
                physicianAddress,
                patientAddress,
                diagnosis,
                drugs
            });

            // Reset form state after successful submission
            setPatientAddress('');
            setDiagnosis('');
            setDrugs([{ name: '', sig: '', mitte: '', mitteUnit: 'tablets', repeat: '' }]);
            setSuccess('Prescription submitted successfully!');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4 bgcolor2">
            <h2 className="mb-3">Prescription Form</h2>
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
                            <div className='smallfont'>Patient Details</div>
                            <table className="table table-sm table-striped">
                                <tbody>
                                    {Object.entries(patientAttributes).map(([key, value]) => (
                                        <tr key={key}>
                                            <td className='smallfont col-2 text-secondary'>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()}</td>
                                            <td className='mediumfont border-start'>{value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="diagnosis" className="smallfont">Diagnosis</label>
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        id="diagnosis"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        required
                        autoComplete='off'
                        tabIndex={2}
                    />
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
                                                <option value="units">units</option>
                                                <option value="mg">mg</option>
                                                <option value="g">g</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group mb-2 flex-grow-1">
                                        <label htmlFor={`drugRepeat${index}`} className="smallfont">Repeat (Days)</label>
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
                            <div className="col-12 col-md-6 mb-2">
                                <div className="form-group">
                                    <label htmlFor={`drugSig${index}`} className="smallfont">SIG (Instructions)</label>
                                    <textarea
                                        className="form-control form-control-sm"
                                        id={`drugSig${index}`}
                                        name="sig"
                                        value={drug.sig}
                                        onChange={(e) => handleDrugChange(index, e)}
                                        rows="4"
                                        required
                                        autoComplete='off'
                                        tabIndex={3 + index * 6}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                <hr className="mb-1" /> 
                <div className="d-flex justify-content-between mt-3">
                    <button
                        type="button"
                        className="btn btn-sm btn-success"
                        onClick={addDrug}
                        tabIndex={100}
                    >
                        Add Another Drug
                    </button>
                    <button
                        type="submit"
                        className="btn btn-sm btn-primary"
                        disabled={loading || isPatientRegistered !== true} // Disable if not verified
                        tabIndex={101}
                    >
                        {loading ? 'Submitting...' : 'Submit Prescription'}
                    </button>
                </div>
            </form>
            {error && <p className="text-danger mt-3">{error}</p>}
            {success && <p className="text-success mt-3">{success}</p>}
        </div>
    );
};

export default PrescriptionForm;
