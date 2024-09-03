import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { encryptValue, decryptValue } from '../utils/ipfsutils'; 

const ConfigPage = () => {
    const [settings, setSettings] = useState({
        registrationContractAddress: '',
        registrationContractABI: '',
        prescriptionContractAddress: '',
        prescriptionContractABI: '',
        ipfsClientURL: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');

    const apiBaseURL = process.env.REACT_APP_API_BASE_URL;

    const fetchSetting = useCallback(async (key) => {
        if (!apiBaseURL) {
            setError('API base URL is not configured.');
            return '';
        }

        try {
            const response = await axios.get(`${apiBaseURL}/${key}`);
            if (response.data.error) {
                if (response.data.error.includes('Setting not found')) {
                    return '';
                }
                setError(`Error: ${response.data.error}`);
                return '';
            }
            return response.data.value || '';
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setError(`The setting '${key}' was not found.`);
            } else {
                setError(`Error fetching ${key}: ${error.message}`);
            }
            return '';
        }
    }, [apiBaseURL]);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!apiBaseURL) return;

            try {
                const addressReg = await fetchSetting('registrationContractAddress');
                const abiReg = await fetchSetting('registrationContractABI');
                const addressPres = await fetchSetting('prescriptionContractAddress');
                const abiPres = await fetchSetting('prescriptionContractABI');
                const url = await fetchSetting('ipfsClientURL');
                
                setSettings({
                    registrationContractAddress: decryptValue(addressReg),
                    registrationContractABI: decryptValue(abiReg),
                    prescriptionContractAddress: decryptValue(addressPres),
                    prescriptionContractABI: decryptValue(abiPres),
                    ipfsClientURL: decryptValue(url)
                });
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        };

        fetchSettings();
    }, [fetchSetting, apiBaseURL]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prevSettings => ({
            ...prevSettings,
            [name]: value
        }));
    };

    const handleSave = async () => {
        if (!apiBaseURL) {
            setError('API base URL is not configured.');
            return;
        }

        // Encrypt the values before sending them
        const encryptedSettings = {
            registrationContractAddress: encryptValue(settings.registrationContractAddress),
            registrationContractABI: encryptValue(settings.registrationContractABI),
            prescriptionContractAddress: encryptValue(settings.prescriptionContractAddress),
            prescriptionContractABI: encryptValue(settings.prescriptionContractABI),
            ipfsClientURL: encryptValue(settings.ipfsClientURL)
        };

        try {
            await axios.all([
                axios.put(`${apiBaseURL}/registrationContractAddress`, { value: encryptedSettings.registrationContractAddress }),
                axios.put(`${apiBaseURL}/registrationContractABI`, { value: encryptedSettings.registrationContractABI }),
                axios.put(`${apiBaseURL}/prescriptionContractAddress`, { value: encryptedSettings.prescriptionContractAddress }),
                axios.put(`${apiBaseURL}/prescriptionContractABI`, { value: encryptedSettings.prescriptionContractABI }),
                axios.put(`${apiBaseURL}/ipfsClientURL`, { value: encryptedSettings.ipfsClientURL })
            ]);
            setIsEditing(false);
            alert('Settings updated successfully');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setError('Failed to update some settings. One or more endpoints were not found.');
            } else {
                console.error('Error updating settings:', error);
                setError('Failed to update settings: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    return (
        <div className="container my-4">
            <h1 className="mb-4">Settings</h1>
            {error && <div className="alert alert-danger">{error}</div>}
            <form>
                <div className="row mb-3">
                    {/* Column 1: Registration Contract */}
                    <div className="col-md-6">
                        <div className="form-floating mb-3">
                            <input
                                type="text"
                                className="form-control"
                                id="registrationContractAddress"
                                name="registrationContractAddress"
                                value={settings.registrationContractAddress}
                                onChange={handleChange}
                                disabled={!isEditing}
                                required
                            />
                            <label htmlFor="registrationContractAddress">Registration Contract Address</label>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="registrationContractABI" className="form-label">Registration Contract ABI:</label>
                            <textarea
                                className="form-control"
                                id="registrationContractABI"
                                name="registrationContractABI"
                                rows="5"
                                value={settings.registrationContractABI}
                                onChange={handleChange}
                                disabled={!isEditing}
                                required
                            />
                        </div>
                    </div>

                    {/* Column 2: Prescription Contract */}
                    <div className="col-md-6">
                        <div className="form-floating mb-3">
                            <input
                                type="text"
                                className="form-control"
                                id="prescriptionContractAddress"
                                name="prescriptionContractAddress"
                                value={settings.prescriptionContractAddress}
                                onChange={handleChange}
                                disabled={!isEditing}
                                required
                            />
                            <label htmlFor="prescriptionContractAddress">Prescription Contract Address</label>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="prescriptionContractABI" className="form-label">Prescription Contract ABI:</label>
                            <textarea
                                className="form-control"
                                id="prescriptionContractABI"
                                name="prescriptionContractABI"
                                rows="5"
                                value={settings.prescriptionContractABI}
                                onChange={handleChange}
                                disabled={!isEditing}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="mb-3 form-floating">
                    <input
                        type="text"
                        className="form-control"
                        id="ipfsClientURL"
                        name="ipfsClientURL"
                        value={settings.ipfsClientURL}
                        onChange={handleChange}
                        disabled={!isEditing}
                        required
                    />
                    <label htmlFor="ipfsClientURL">IPFS Client URL</label>
                </div>

                <div className="mb-3">
                    {isEditing ? (
                        <button type="button" className="btn btn-primary" onClick={handleSave}>Save</button>
                    ) : (
                        <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(true)}>Edit</button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default ConfigPage;
