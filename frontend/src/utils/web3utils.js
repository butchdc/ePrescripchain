import Web3 from 'web3';
import axios from 'axios';

// Retrieve the base URL for the API from environment variables
const apiBaseURL = process.env.REACT_APP_API_BASE_URL;

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

// Function to fetch a single setting from the backend
const fetchSetting = async (key) => {
    try {
        const response = await axios.get(`${apiBaseURL}/${key}`);
        return response.data.value;
    } catch (error) {
        throw new Error(`Failed to fetch ${key}: ${error.message}`);
    }
};

// Function to initialize a contract
const initContract = async (web3Instance, addressKey, abiKey) => {
    try {
        // Fetch the contract address and ABI from the backend
        const address = await fetchSetting(addressKey);
        const abiString = await fetchSetting(abiKey);

        // Parse the ABI from JSON string
        let abi;
        try {
            abi = JSON.parse(abiString);
        } catch (error) {
            throw new Error('Failed to parse ABI: ' + error.message);
        }

        // Create and return the contract instance
        const contractInstance = new web3Instance.eth.Contract(abi, address);
        return contractInstance;
    } catch (error) {
        throw new Error('Failed to initialize contract: ' + error.message);
    }
};

// Function to initialize both contracts
export const initContracts = async (web3Instance) => {
    if (!web3Instance) {
        throw new Error('Web3 instance is required');
    }

    try {
        const registrationContract = await initContract(
            web3Instance,
            'registrationContractAddress',
            'registrationContractABI'
        );

        const prescriptionContract = await initContract(
            web3Instance,
            'prescriptionContractAddress',
            'prescriptionContractABI'
        );

        return {
            registrationContract,
            prescriptionContract
        };
    } catch (error) {
        throw new Error('Failed to initialize contracts: ' + error.message);
    }
};
