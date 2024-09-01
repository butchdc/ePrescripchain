import { create } from 'ipfs-http-client';
import CryptoJS from 'crypto-js';
import { IPFS_CLIENT } from '../config'; 

// Initialize IPFS client
const ipfsClient = create({ url: IPFS_CLIENT.URL });

// Secret key for encryption and decryption from environment variable
const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;

// Function to encrypt individual values
const encryptValue = (value) => {
    return CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
};

// Function to decrypt individual values
const decryptValue = (encryptedValue) => {
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

export const uploadToIPFS = async (data) => {
    try {
        const encryptedData = encryptDataValues(data);
        const result = await ipfsClient.add(JSON.stringify(encryptedData));
        return result.path; // This is the CID
    } catch (error) {
        console.error("IPFS Upload Error:", error);
        throw new Error("Failed to upload data to IPFS");
    }
};

export const downloadFromIPFS = async (cid) => {
    try {
        const stream = ipfsClient.cat(cid);
        let encryptedDataString = '';

        for await (const chunk of stream) {
            encryptedDataString += new TextDecoder().decode(chunk);
        }

        const encryptedData = JSON.parse(encryptedDataString);
        return decryptDataValues(encryptedData); // Decrypt the values
    } catch (error) {
        console.error("IPFS Download Error:", error);
        throw new Error("Failed to retrieve data from IPFS");
    }
};
