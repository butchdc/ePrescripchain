import Web3 from 'web3';
import { REGISTRATION_CONTRACT } from '../config';

// Function to initialize Web3
export const initWeb3 = async () => {
    if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        return web3Instance;
    } else {
        throw new Error('Please install MetaMask!');
    }
};

// Function to initialize the contract
export const initContract = async (web3Instance) => {
    if (!web3Instance) {
        throw new Error('Web3 instance is required');
    }
    const contractInstance = new web3Instance.eth.Contract(
        REGISTRATION_CONTRACT.ABI,
        REGISTRATION_CONTRACT.ADDRESS
    );
    return contractInstance;
};
