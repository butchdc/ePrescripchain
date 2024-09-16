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

export const updatePrescriptionPharmacyToDB = async (prescriptionID, pharmacyAddress) => {
    try {
        const { data: [prescription] = [] } = await axios.get(`${apiBaseURL}prescriptions`, { params: { prescriptionID } });
        if (!prescription) throw new Error('No prescription found with the given ID.');
        
        await axios.post(`${apiBaseURL}prescriptions`, { ...prescription, assignedTo: pharmacyAddress });
    } catch (error) {
        console.error('Error updating prescription pharmacy to database:', error.message);
        throw new Error('Failed to update prescription pharmacy to the database');
    }
};

export const updateStatusToDB = async (prescriptionID, newStatus) => {
    try {
        const response = await axios.get(`${apiBaseURL}prescriptions`, {
            params: { prescriptionID }
        });
        const prescriptions = response.data;
        if (prescriptions.length === 0) {
        throw new Error('No prescription found with the given ID.');
        }
        const prescription = prescriptions[0]; 
        await axios.post(`${apiBaseURL}prescriptions`, {
            ...prescription,
            status: newStatus
        });
    } catch (error) {
        console.error('Error updating prescription status to database:', error.message);
        throw new Error('Failed to update prescription status to the database');
    }

};



export const saveStatusTimestampToDB = async (prescriptionID, status, timestamp) => {
    const statusDescriptions = [
        { status: "Awaiting Pharmacy Assignment", note: "Your prescription has been created and is waiting to be assigned to a pharmacy." },
        { status: "Awaiting For Confirmation", note: "Your prescription has been assigned to a pharmacy and is awaiting confirmation." },
        { status: "Preparing", note: "Your prescription has been confirmed by the pharmacy and is now being prepared." },
        { status: "Ready For Collection", note: "Your prescription is ready for collection. You can pick it up from the pharmacy." },
        { status: "Collected", note: "Your prescription has been collected. Contact the pharmacy if you need further assistance." },
        { status: "Cancelled", note: "Your prescription has been cancelled by the physician. If you have questions, please contact the physician’s office." },
        { status: "Reassigned", note: "Your prescription is being reassigned to your physician for further review. Please contact your physician for any updates or additional assistance." }
    ];

    const getStatusNote = (status) => {
        const statusDescription = statusDescriptions.find(desc => desc.status === status);
        return statusDescription ? statusDescription.note : '';
    };

    try {
        // Prompt user for additional notes
        const userNotes = prompt("Enter additional notes (optional):", "");
        // Use user input or default note
        const finalNotes = userNotes !== null ? userNotes !== '' ? userNotes : getStatusNote(status):getStatusNote(status);

        const response = await axios.post(`${apiBaseURL}prescriptions/status-timestamps`, {
            prescriptionID,
            status,
            timestamp,
            notes: finalNotes
        });

        console.log('Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error saving status timestamp to database:', error.message);
        throw new Error('Failed to save status timestamp to the database');
    }
};


