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
2. **Create a New Workspace**: 
   - **Port**: `7545`
   - **Network ID**: `1337`
3. **Copy the Mnemonic**: Use the mnemonic provided by Ganache to set up Metamask.

### 3. Configure Metamask

1. **Open Metamask**: Click the Metamask icon in your browser.
2. **Import Wallet**: Choose "Import Wallet" and use the mnemonic copied from Ganache.
3. **Add Custom Network**:
   - **Network Name**: Localhost 7545
   - **New RPC URL**: `http://localhost:7545`
   - **Chain ID**: `1337`
   - **Currency Symbol**: ETH (optional)
   - **Block Explorer URL**: (leave blank)
4. **Save the Network**: Click "Save" to add the network to Metamask.

### 4. Setup Docker Containers

The project uses Docker to manage the services.

#### 4.1. Start Docker Containers

Run the following command to build and start the containers:

```bash
docker-compose up --build
```

This command will start the following services:
- **Frontend (DApp)**: Accessible at `http://localhost:3000`
- **IPFS Node**: Accessible at `http://127.0.0.1:5001/api/v0`
- **Backend**: Accessible at `http://localhost:3001`

#### 4.2. Verify Running Containers

Check the status of the containers:

```bash
docker ps
```

Ensure you see entries for `frontend`, `ipfs_node`, and `backend`.

### 5. Configure Frontend

1. **Create a `.env` File**: In the `frontend` directory, create a file named `.env`.
2. **Add Environment Variables**: Open the `.env` file and add the following lines with sample values:

   ```plaintext
   REACT_APP_SECRET_KEY=your-secret-key
   REACT_APP_API_BASE_URL=http://localhost:3001/api/
   GENERATE_SOURCEMAP=false
   ```

   - Replace `your-secret-key` with your actual secret key (if needed).
   - `REACT_APP_API_BASE_URL` should be set to `http://localhost:3001/api/`.
   - `GENERATE_SOURCEMAP=false` disables source maps in the build output for production.
3. **Save the File**: Save the `.env` file with the required configurations.

### 6. Configure IPFS

To configure IPFS with the required CORS settings:

1. **Access the IPFS Container**: Open a terminal and execute:

   ```bash
   docker exec -it ipfs_node sh
   ```

2. **Edit the IPFS Configuration**:
   - Open the configuration file located at `/data/ipfs/config` using a text editor:

     ```bash
     vi /data/ipfs/config
     ```

   - Update the `"API"` section to include the following headers:

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

### 7. Configure Truffle

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

### 8. Configure Settings

**Disclaimer**: The configuration page is intended solely for testing and development purposes. The settings provided here are not secure for production use and should not be used in a live environment. Always ensure proper security measures are implemented for production deployments.

1. **Open Config Page**: Navigate to `http://localhost:3000/config`.
2. **Fill in Settings**:
   - **IPFS Client URL**: `http://127.0.0.1:5001/api/v0`
   - **Registration Contract Address**: Address of the registration contract.
   - **Registration Contract ABI**: ABI of the registration contract.
   - **Prescription Contract Address**: Address of the prescription contract.
   - **Prescription Contract ABI**: ABI of the prescription contract.
   - **Accounts**: Relevant account information.

3. **Edit and Save**:
   - Click "Edit" to enable editing.
   - Click "Save" after entering all settings.

### 9. Interact with the DApp

1. **Open the Frontend**: Navigate to `http://localhost:3000` in your browser to interact with the DApp.
2. **Deploy Contracts**: Use Truffle to deploy your contracts. Ensure that your contracts are configured to point to the local Ganache network.

## Troubleshooting

- **Containers Not Starting**: Check the logs for each service using `docker-compose logs` to identify and resolve any issues.
- **Network Issues**: Ensure that your Metamask and Ganache configurations are correct and that all services are running.
- **Config Page Errors**: Ensure all required fields are filled in correctly and that the API base URL is correctly configured.

## Contributing

If you encounter any issues or have suggestions for improvements, please feel free to open an issue or submit a pull request on [GitHub](https://github.com/butchdc/ePrescription).