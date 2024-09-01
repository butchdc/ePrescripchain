import axios from 'axios';
import { create } from 'ipfs-http-client';
import CryptoJS from 'crypto-js';

// Secret key for encryption and decryption from environment variable
const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;
const apiBaseURL = process.env.REACT_APP_API_BASE_URL; 

// Function to encrypt individual values
export const encryptValue = (value) => {
    return CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
};

// Function to decrypt individual values
export const decryptValue = (encryptedValue) => {
    const bytes = CryptoJS.AES.decrypt(encryptedValue, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
};

// Encrypt only the values in the data
const encryptDataValues = (data) => {
    const encryptedData = {};
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            encryptedData[key] = encryptValue(data[key]);
        }
    }
    return encryptedData;
};

// Decrypt only the values in the data
const decryptDataValues = (encryptedData) => {
    const decryptedData = {};
    for (const key in encryptedData) {
        if (encryptedData.hasOwnProperty(key)) {
            decryptedData[key] = decryptValue(encryptedData[key]);
        }
    }
    return decryptedData;
};

// Fetch IPFS client URL from backend server using axios
const fetchIPFSClientUrl = async () => {
    try {
        const response = await axios.get(`${apiBaseURL}/ipfsClientURL`);
        return response.data.value; 
    } catch (error) {
        console.error('Failed to fetch IPFS client URL:', error);
        throw new Error('Failed to fetch IPFS client URL');
    }
};

// Initialize IPFS client dynamically
let ipfsClient;
const initializeIPFSClient = async () => {
    const encryptedURL = await fetchIPFSClientUrl();
    const url = decryptValue(encryptedURL);
    ipfsClient = create({ url });
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
export const downloadFromIPFS = async (cid) => {
    try {
        if (!ipfsClient) await initializeIPFSClient(); 

        const stream = ipfsClient.cat(cid);
        let encryptedDataString = '';

        for await (const chunk of stream) {
            encryptedDataString += new TextDecoder().decode(chunk);
        }

        const encryptedData = JSON.parse(encryptedDataString);
        return decryptDataValues(encryptedData); 
    } catch (error) {
        console.error('IPFS Download Error:', error);
        throw new Error('Failed to retrieve data from IPFS');
    }
};
