import { useState } from 'react';

const PrescriptionForm = () => {
    const [physicianAddress, setPhysicianAddress] = useState('');
    const [patientAddress, setPatientAddress] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [drugs, setDrugs] = useState([{ name: '', sig: '', mitte: '', mitteUnit: 'ml', repeat: '' }]);

    const handleDrugChange = (index, e) => {
        const { name, value } = e.target;
        const newDrugs = [...drugs];
        newDrugs[index][name] = value;
        setDrugs(newDrugs);
    };

    const addDrug = () => {
        setDrugs([...drugs, { name: '', sig: '', mitte: '', mitteUnit: 'ml', repeat: '' }]);
    };

    const removeDrug = (index) => {
        const newDrugs = drugs.filter((_, i) => i !== index);
        setDrugs(newDrugs);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log({
            physicianAddress,
            patientAddress,
            diagnosis,
            drugs
        });
    };

    return (
        <div className="container mt-4 bgcolor2">
            <h2 className="mb-3">Prescription Form</h2>
            <form onSubmit={handleSubmit} className="needs-validation" noValidate>
                <div className="form-floating mb-2">
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        id="physicianAddress"
                        value={physicianAddress}
                        onChange={(e) => setPhysicianAddress(e.target.value)}
                        required
                    />
                    <label htmlFor="physicianAddress">Physician Address</label>
                </div>
                <div className="form-floating mb-2">
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        id="patientAddress"
                        value={patientAddress}
                        onChange={(e) => setPatientAddress(e.target.value)}
                        required
                    />
                    <label htmlFor="patientAddress">Patient Address</label>
                </div>
                <div className="form-floating mb-2">
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        id="diagnosis"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        required
                    />
                    <label htmlFor="diagnosis">Diagnosis</label>
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
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                        <div className="row mb-3">
                            <div className="col-12 col-md-6">
                                <div className="form-group mb-2">
                                    <label htmlFor={`drugName${index}`}>Drug Name</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        id={`drugName${index}`}
                                        name="name"
                                        value={drug.name}
                                        onChange={(e) => handleDrugChange(index, e)}
                                        required
                                        tabIndex={1}
                                    />
                                </div>
                                <div className="d-flex">
                                    <div className="form-group mb-2 flex-grow-1 me-2">
                                        <label htmlFor={`drugMitte${index}`}>MITTE (Quantity)</label>
                                        <div className="input-group">
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                id={`drugMitte${index}`}
                                                name="mitte"
                                                value={drug.mitte}
                                                onChange={(e) => handleDrugChange(index, e)}
                                                required
                                                tabIndex={4}
                                            />
                                            <select
                                                className="form-select form-select-sm"
                                                id={`drugMitteUnit${index}`}
                                                name="mitteUnit"
                                                value={drug.mitteUnit}
                                                onChange={(e) => handleDrugChange(index, e)}
                                                required
                                                tabIndex={5}
                                            >
                                                <option value="ml">ml</option>
                                                <option value="pcs">pcs</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group mb-2 flex-grow-1">
                                        <label htmlFor={`drugRepeat${index}`}>Repeat (Days)</label>
                                        <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            id={`drugRepeat${index}`}
                                            name="repeat"
                                            value={drug.repeat}
                                            onChange={(e) => handleDrugChange(index, e)}
                                            required
                                            tabIndex={6}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-md-6 mb-2">
                                <div className="form-group">
                                    <label htmlFor={`drugSig${index}`}>SIG (Instructions)</label>
                                    <textarea
                                        className="form-control form-control-sm"
                                        id={`drugSig${index}`}
                                        name="sig"
                                        value={drug.sig}
                                        onChange={(e) => handleDrugChange(index, e)}
                                        rows="4"
                                        required
                                        tabIndex={2}
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
                    >
                        Add Another Drug
                    </button>
                    <button
                        type="submit"
                        className="btn btn-sm btn-primary"
                    >
                        Submit Prescription
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PrescriptionForm;
