# Project Setup Guide

## Overview

This project includes a decentralized application (DApp) with a frontend, backend, IPFS node, and Truffle integration. Follow these steps to set up and run the project using Docker.

## Prerequisites

1. **Docker**: Install Docker and Docker Compose from [Docker](https://www.docker.com/get-started).
2. **Metamask**: Install Metamask for your browser from [Metamask](https://metamask.io/download.html). Supported browsers: Chrome, Firefox, Brave, Edge.
3. **Ganache**: Install Ganache from [Truffle Suite](https://www.trufflesuite.com/ganache).

## Getting Started

### 1. Clone the Repository

Clone the repository and navigate into the project directory:

```bash
git clone https://github.com/butchdc/ePrescription.git
cd ePrescription
```

### 2. Configure Ganache

1. **Open Ganache**: Start the Ganache application.

2. **Create a New Workspace**: Create a new workspace in Ganache with the following settings:
   - **Server**:
     - **Port**: `7545`
     - **Network ID**: `1337`
   - **Accounts**: Ganache will provide some default accounts and private keys which you will use to interact with your DApp.

3. **Add Truffle Project**: In Ganache, add the Truffle project by specifying the workspace directory where your Truffle project is located.

### 3. Configure Metamask

1. **Open Metamask**: Click the Metamask icon in your browser and choose to import an existing wallet.

2. **Import Wallet**: Use the mnemonic phrase provided by Ganache to import the wallet into Metamask.

3. **Add Custom Network**: Configure Metamask to connect to your local Ganache blockchain:
   - Open Metamask and click on the network dropdown.
   - Click "Add Network" and enter the following details:
     - **Network Name**: Localhost 7545
     - **New RPC URL**: `http://localhost:7545`
     - **Chain ID**: `1337` (default for Ganache)
     - **Currency Symbol**: ETH (optional)
     - **Block Explorer URL**: (leave blank)
   - Click "Save" to add the network to Metamask.

### 4. Configure Truffle

1. **Edit `truffle-config.js`**: In the root directory of your project, locate the `truffle-config.js` file and configure it as follows:

   ```javascript
   module.exports = {
     networks: {
       development: {
         host: "127.0.0.1",
         port: 7545,
         network_id: "*",
       },
     },

     compilers: {
       solc: {
         version: "0.8.4",
       },
     },
   };
   ```

2. **Save the File**: Save the `truffle-config.js` file with the updated settings.

### 5. Migrate Contracts with Truffle

1. **Run Migrations**: Deploy your smart contracts to the local Ganache blockchain by running:

   ```bash
   npx truffle migrate --network development
   ```

2. **Copy Contract Addresses**: After successful migration, copy the contract addresses from the console output. These addresses will be used in the configuration page.

### 6. Setup Docker Containers

The project uses Docker to manage the services. Follow these steps to build and run the containers.

1. **Start Docker Containers**: Run the following command to build and start all necessary Docker containers:

   ```bash
   docker-compose up --build
   ```

   This command will start the following services:
   - **Frontend (DApp)**: Accessible at `http://localhost:3000`
   - **IPFS Node**: Accessible at `http://localhost:5001/api/v0`
   - **Backend**: Accessible at `http://localhost:3001`

2. **Verify Running Containers**: Ensure the containers are running by checking their status:

   ```bash
   docker ps
   ```

   You should see entries for `frontend`, `ipfs_node`, and `backend`.

### 7. Configure Frontend

1. **Create a `.env` File**: In the `frontend` directory, create a file named `.env`.

2. **Add Environment Variables**: Open the `.env` file and add the following lines with sample values:

   ```plaintext
   REACT_APP_SECRET_KEY=your-secret-key
   REACT_APP_API_BASE_URL=http://localhost:3001/api/
   GENERATE_SOURCEMAP=false
   ```

   - Replace `your-secret-key` with your actual secret key (if needed).
   - `REACT_APP_API_BASE_URL` should be set to the base URL of your backend API (e.g., `http://localhost:3001/api/`).
   - `GENERATE_SOURCEMAP=false` disables source maps in the build output for production.

3. **Save the File**: Save the `.env` file with the required configurations.

### 8. Configure IPFS

1. **Access the IPFS Container**: Open a terminal and execute:

   ```bash
   docker exec -it ipfs_node sh
   ```

2. **Edit the IPFS Configuration**:
   - Open the IPFS configuration file located at `/data/ipfs/config` using a text editor like `vi` or `nano`:

     ```bash
     vi /data/ipfs/config
     ```

   - Locate the `"API"` section in the JSON file and update it to include the following headers configuration:

     ```json
     "API": {
       "HTTPHeaders": {
         "Access-Control-Allow-Origin": ["*"],
         "Access-Control-Allow-Methods": ["PUT", "POST", "GET", "DELETE", "OPTIONS"],
         "Access-Control-Allow-Headers": ["Authorization", "Content-Type"]
       }
     }
     ```

   - Save the file and exit the editor.

3. **Restart the IPFS Container**: To apply the changes, restart the IPFS container:

   ```bash
   docker restart ipfs_node
   ```

### 9. Configure Settings

**Disclaimer**: The following configuration is intended for development and testing purposes only. The configuration page is not secure for production use and should only be used in a testing or development environment.

After setting up all the services, you need to configure the application settings. You can do this through the `ConfigPage` in your application.

1. **Open the Config Page**: Navigate to `http://localhost:3000/config` in your browser.

2. **Fill in the Settings**: You will need to fill in the following fields:
   - **IPFS Client URL**: This should be the API URL of your IPFS node (e.g., `http://localhost:5001/api/v0`).
   - **Registration Contract Address**: Address of the registration smart contract (copied from step 6).
   - **Registration Contract ABI**: ABI of the registration smart contract, found in `build/contracts/Registration.json` after running migrations.
   - **Prescription Contract Address**: Address of the prescription smart contract (copied from step 6).
   - **Prescription Contract ABI**: ABI of the prescription smart contract, found in `build/contracts/Prescription.json` after running migrations.
   - **Accounts**: Any relevant account information.

3. **Edit and Save Settings**:

   - **Edit Mode**: Click "Edit" to enable editing mode.
   - **Save Settings**: After filling in the settings, click "Save" to store them. 

   Ensure all fields are filled out correctly to avoid any issues. If you encounter any errors, check the error messages displayed on the page.

### 10. Interact with the DApp

1. **Open the Frontend**: Navigate to `http://localhost:3000` in your browser to interact with the DApp.

2. **Deploy Contracts**: Use Truffle to deploy your contracts. Ensure that your contracts are configured to point to the local Ganache network.

## Troubleshooting

- **Containers Not Starting**: Check the logs for each service using `docker-compose logs` to identify and resolve any issues.

- **Network Issues**: Ensure that your Metamask and Ganache configurations are correct and that all services are running.

- **Config Page Errors**: Ensure all required fields are filled in correctly and that the API base URL is correctly configured.

## Contributing

If you encounter any issues or have suggestions for improvements, please feel free to open an issue or submit a pull request on [GitHub](https://github.com/butchdc/ePrescription).