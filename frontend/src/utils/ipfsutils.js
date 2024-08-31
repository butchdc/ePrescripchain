import { create } from 'ipfs-http-client';
import CryptoJS from 'crypto-js';
import { IPFS_CLIENT } from '../config'; 

// Initialize IPFS client
const ipfsClient = create({ url: IPFS_CLIENT.URL });

// Secret key for encryption and decryption from environment variable
const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;

const encryptData = (data) => {
    const dataString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(dataString, SECRET_KEY).toString();
};

const decryptData = (encryptedData) => {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const dataString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(dataString);
};

export const uploadToIPFS = async (data) => {
    try {
        const encryptedData = encryptData(data);
        const result = await ipfsClient.add(encryptedData);
        return result.path; // This is the CID
    } catch (error) {
        console.error("IPFS Upload Error:", error);
        throw new Error("Failed to upload data to IPFS");
    }
};

export const downloadFromIPFS = async (cid) => {
    try {
        const stream = ipfsClient.cat(cid);
        let encryptedData = '';

        for await (const chunk of stream) {
            encryptedData += new TextDecoder().decode(chunk);
        }

        return decryptData(encryptedData); // Decrypt the data
    } catch (error) {
        console.error("IPFS Download Error:", error);
        throw new Error("Failed to retrieve data from IPFS");
    }
};
