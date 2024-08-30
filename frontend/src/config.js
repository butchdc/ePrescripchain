export const REGISTRATION_CONTRACT = {
    ADDRESS: '0x5e9CF689EE3cb182187171A9e270CE941AF5e099',
    ABI: [
        {
          "inputs": [],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "address",
              "name": "administrator",
              "type": "address"
            }
          ],
          "name": "ContractDeployed",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "regulatory_authority",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "Patient",
              "type": "address"
            }
          ],
          "name": "PatientRegistered",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "regulatory_authority",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "Pharmacy",
              "type": "address"
            }
          ],
          "name": "PharmacyRegistered",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "regulatory_authority",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "Physician",
              "type": "address"
            }
          ],
          "name": "PhysicianRegistered",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "administrator",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "regulatory_authority",
              "type": "address"
            }
          ],
          "name": "RegulatoryAuthorityRegistered",
          "type": "event"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "name": "Patient",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function",
          "constant": true
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "name": "Pharmacy",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function",
          "constant": true
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "name": "Physician",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function",
          "constant": true
        },
        {
          "inputs": [],
          "name": "administrator",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function",
          "constant": true
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "name": "isRegulatoryAuthority",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function",
          "constant": true
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_regulatoryAuthority",
              "type": "address"
            }
          ],
          "name": "registerRegulatoryAuthority",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "user",
              "type": "address"
            }
          ],
          "name": "PhysicianRegistration",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_Pharmacy",
              "type": "address"
            }
          ],
          "name": "PharmacyRegistration",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "user",
              "type": "address"
            }
          ],
          "name": "PatientRegistration",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ]
  };
  
  export const IPFS_CLIENT = {
    URL: 'http://127.0.0.1:5001/api/v0' // Replace with your IPFS URL if different
  };