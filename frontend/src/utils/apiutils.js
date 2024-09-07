import axios from 'axios';
import { create } from 'ipfs-http-client';
import CryptoJS from 'crypto-js';

// Secret key for encryption and decryption from environment variable
const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;
const apiBaseURL = process.env.REACT_APP_API_BASE_URL;

// Function to encrypt individual values
export const encryptValue = (value) => {
    try {
        // Ensure the value is a JSON string
        const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
        return CryptoJS.AES.encrypt(jsonValue, SECRET_KEY).toString();
    } catch (error) {
        console.error('Encryption error:', error);
        throw error;
    }
};

// Function to decrypt individual values
export const decryptValue = (encryptedValue) => {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedValue, SECRET_KEY);
        const decryptedValue = bytes.toString(CryptoJS.enc.Utf8);
        // Decrypted value should be JSON string, ensure to return as is or handle accordingly
        return decryptedValue;
    } catch (error) {
        console.error('Decryption error:', error);
        throw error;
    }
};

// Encrypt only the values in the data
const encryptDataValues = (data) => {
    const encryptedData = {};
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            try {
                encryptedData[key] = encryptValue(data[key]);
            } catch (error) {
                console.error(`Error encrypting key ${key}:`, error);
            }
        }
    }
    return encryptedData;
};

// Decrypt only the values in the data
const decryptDataValues = (encryptedData) => {
    const decryptedData = {};
    for (const key in encryptedData) {
        if (encryptedData.hasOwnProperty(key)) {
            try {
                const decryptedValue = decryptValue(encryptedData[key]);
                try {
                    decryptedData[key] = JSON.parse(decryptedValue);
                } catch (parseError) {
                    decryptedData[key] = decryptedValue; // Use as a plain string if JSON parsing fails
                }
            } catch (error) {
                console.error(`Error decrypting key ${key}:`, error);
                decryptedData[key] = encryptedData[key]; // Fallback to the encrypted value
            }
        }
    }
    return decryptedData;
};

// Fetch IPFS client URL from backend server using axios
const fetchIPFSClientUrl = async () => {
    try {
        const response = await axios.get(`${apiBaseURL}settings/ipfsClientURL`);
        return response.data.value;
    } catch (error) {
        console.error('Failed to fetch IPFS client URL:', error);
        throw new Error('Failed to fetch IPFS client URL');
    }
};

// Initialize IPFS client dynamically
let ipfsClient;
const initializeIPFSClient = async () => {
    try {
        const encryptedURL = await fetchIPFSClientUrl();
        const url = decryptValue(encryptedURL);
        ipfsClient = create({ url });
    } catch (error) {
        console.error('Failed to initialize IPFS client:', error);
        throw new Error('Failed to initialize IPFS client');
    }
};

// Upload data to IPFS
export const uploadToIPFS = async (data) => {
    try {
        if (!ipfsClient) await initializeIPFSClient();

        const encryptedData = encryptDataValues(data);
        const result = await ipfsClient.add(JSON.stringify(encryptedData));
        return result.path; // This is the CID
    } catch (error) {
        console.error('IPFS Upload Error:', error);
        throw new Error('Failed to upload data to IPFS');
    }
};

// Download data from IPFS
export const downloadFromIPFS = async (cid, timeout = 10000) => {
    try {
        if (!ipfsClient) await initializeIPFSClient();

        // Create a promise for the IPFS stream
        const streamPromise = (async () => {
            const stream = ipfsClient.cat(cid);
            let encryptedDataString = '';

            for await (const chunk of stream) {
                encryptedDataString += new TextDecoder().decode(chunk);
            }

            return encryptedDataString;
        })();

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), timeout)
        );

        // Use Promise.race to handle timeout
        const encryptedDataString = await Promise.race([streamPromise, timeoutPromise]);

        const encryptedData = JSON.parse(encryptedDataString);
        return decryptDataValues(encryptedData);

    } catch (error) {
        console.error('IPFS Download Error:', error.message);
        throw new Error('Failed to retrieve data from IPFS');
    }
};


// Upload prescription data to IPFS
export const uploadPrescriptionToIPFS = async (prescriptionData) => {
    try {
        if (!ipfsClient) await initializeIPFSClient();

        const encryptedData = encryptDataValues(prescriptionData);
        const result = await ipfsClient.add(JSON.stringify(encryptedData));
        return result.path; // This is the CID
    } catch (error) {
        console.error('IPFS Upload Error:', error);
        throw new Error('Failed to upload prescription data to IPFS');
    }
};

export const saveEntityToDB = async (entity, data) => {
    try {
        const response = await axios.post(`${apiBaseURL}entities/${entity}`, data);
        return response.data;
    } catch (error) {
        console.error('Error saving entity to database:', error.message);
        throw new Error('Failed to save entity to the database');
    }
};

export const savePrescriptionToDB = async (data) => {
    try {
        const response = await axios.post(`${apiBaseURL}prescriptions`, data);
        return response.data;
    } catch (error) {
        console.error('Error saving prescription to database:', error.message);
        throw new Error('Failed to save prescription to the database');
    }
};
