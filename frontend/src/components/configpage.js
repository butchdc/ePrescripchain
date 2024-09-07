import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { encryptValue, decryptValue } from '../utils/apiutils'; 

const ConfigPage = () => {
    const [settings, setSettings] = useState({
        registrationContractAddress: '',
        registrationContractABI: '',
        prescriptionContractAddress: '',
        prescriptionContractABI: '',
        ipfsClientURL: '',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const apiBaseURL = process.env.REACT_APP_API_BASE_URL;

    const fetchSetting = useCallback(async (key) => {
        if (!apiBaseURL) {
            setError('API base URL is not configured.');
            return '';
        }

        try {
            const response = await axios.get(`${apiBaseURL}settings/${key}`);
            if (response.data.error) {
                if (response.data.error.includes('Setting not found')) {
                    return '';
                }
                setError(`Error: ${response.data.error}`);
                return '';
            }
            return response.data.value || '';
        } catch (error) {
            const message = error.response?.status === 404
                ? `The setting '${key}' was not found.`
                : `Error fetching ${key}: ${error.message}`;
            setError(message);
            return '';
        }
    }, [apiBaseURL]);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!apiBaseURL) return;

            try {
                const [addressReg, abiReg, addressPres, abiPres, url, blockchainUrl] = await Promise.all([
                    fetchSetting('registrationContractAddress'),
                    fetchSetting('registrationContractABI'),
                    fetchSetting('prescriptionContractAddress'),
                    fetchSetting('prescriptionContractABI'),
                    fetchSetting('ipfsClientURL'),
                ]);

                setSettings({
                    registrationContractAddress: decryptValue(addressReg),
                    registrationContractABI: decryptValue(abiReg),
                    prescriptionContractAddress: decryptValue(addressPres),
                    prescriptionContractABI: decryptValue(abiPres),
                    ipfsClientURL: decryptValue(url),
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

        setIsSaving(true);
        const encryptedSettings = {
            registrationContractAddress: encryptValue(settings.registrationContractAddress),
            registrationContractABI: encryptValue(settings.registrationContractABI),
            prescriptionContractAddress: encryptValue(settings.prescriptionContractAddress),
            prescriptionContractABI: encryptValue(settings.prescriptionContractABI),
            ipfsClientURL: encryptValue(settings.ipfsClientURL),
        };

        try {
            await axios.all([
                axios.put(`${apiBaseURL}settings/registrationContractAddress`, { value: encryptedSettings.registrationContractAddress }),
                axios.put(`${apiBaseURL}settings/registrationContractABI`, { value: encryptedSettings.registrationContractABI }),
                axios.put(`${apiBaseURL}settings/prescriptionContractAddress`, { value: encryptedSettings.prescriptionContractAddress }),
                axios.put(`${apiBaseURL}settings/prescriptionContractABI`, { value: encryptedSettings.prescriptionContractABI }),
                axios.put(`${apiBaseURL}settings/ipfsClientURL`, { value: encryptedSettings.ipfsClientURL }),
            ]);
            setIsEditing(false);
            alert('Settings updated successfully');
        } catch (error) {
            setError('Failed to update settings: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="container my-4 bgcolor2">
            <h4 className="">Settings</h4>
            {error && <div className="alert alert-danger">{error}</div>}
            <form>
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

                <div className="mb-3 form-floating">
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
                    <label htmlFor="registrationContractABI" className="form-label">Registration Contract ABI</label>
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

                <div className="mb-3 form-floating">
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
                    <label htmlFor="prescriptionContractABI" className="form-label">Prescription Contract ABI</label>
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

                <div className="mb-3">
                    {isEditing ? (
                        <button 
                            type="button" 
                            className="btn btn-primary" 
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    ) : (
                        <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={() => setIsEditing(true)}
                        >
                            Edit
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default ConfigPage;
