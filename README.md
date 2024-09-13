# Project Setup Guide

## Overview

This project consists of a decentralized application (DApp) with a frontend, backend, IPFS node, and integration with Truffle. To get started, you will need to set up Metamask and Ganache for blockchain development. Below are the steps to set up and run the project using Docker.

## Prerequisites

1. **Docker**: Ensure Docker and Docker Compose are installed on your machine. You can download Docker from [here](https://www.docker.com/get-started).

2. **Metamask**: Install the Metamask extension for your browser from [here](https://metamask.io/download.html).  **Note**: Metamask is supported on Google Chrome, Mozilla Firefox, Brave, and Microsoft Edge. Ensure you are using one of these browsers to interact with the DApp.

4. **Ganache**: Install Ganache for local Ethereum blockchain development from [here](https://www.trufflesuite.com/ganache).

## Getting Started

### 1. Clone the Repository

First, clone this repository to your local machine:

```bash
git clone https://github.com/butchdc/ePrescription.git
cd ePrescription
```

### 2. Setup Docker Containers

The project uses Docker to manage the services. Follow these steps to build and run the containers.

#### 2.1. Start Docker Containers

Run the following command to start all necessary Docker containers:

```bash
docker-compose up --build
```

This command will build and start the following services:

- **Frontend (DApp)**: Accessible at `http://localhost:3000`
- **IPFS Node**: Accessible at `http://localhost:8080`
- **Backend**: Accessible at `http://localhost:3001`

#### 2.2. Verify Running Containers

Ensure the containers are running by checking their status:

```bash
docker ps
```

You should see entries for `frontend`, `ipfs_node`, and `backend`.

### 3. Configure Metamask

1. **Open Metamask**: Click the Metamask icon in your browser and create a new wallet or import an existing one.

2. **Add Custom Network**: Configure Metamask to connect to your local Ganache blockchain.

   - Open Metamask and click on the network dropdown.
   - Click "Add Network" and enter the following details:
     - **Network Name**: Localhost 7545
     - **New RPC URL**: `http://localhost:7545`
     - **Chain ID**: `1337` (default for Ganache)
     - **Currency Symbol**: ETH (optional)
     - **Block Explorer URL**: (leave blank)

3. **Save the Network**: Click "Save" to add the network to Metamask.

### 4. Configure Ganache

1. **Open Ganache**: Start Ganache application.

2. **Create a New Workspace**: If you haven't already, create a new workspace and configure it to use the following settings:
   - **Server**:
     - **Port**: `7545`
     - **Network ID**: `1337`
   - **Accounts**: Ganache will provide some default accounts and private keys which you can use to interact with your DApp.

### 5. Configure Frontend

1. **Create a `.env` File**: In the `frontend` directory, create a file named `.env`.

2. **Add Environment Variables**: Open the `.env` file and add the following lines:

   ```plaintext
   REACT_APP_SECRET_KEY=
   REACT_APP_API_BASE_URL=
   GENERATE_SOURCEMAP=false
   ```

   - Replace `REACT_APP_SECRET_KEY` with your secret key (if needed).
   - Replace `REACT_APP_API_BASE_URL` with the base URL of your backend API (e.g., `http://localhost:3001`).

3. **Save the File**: Save the `.env` file with the required configurations.

### 6. Configure IPFS

To configure IPFS with the required CORS settings:

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

### 7. Configure Truffle

1. **Edit `truffle-config.js`**: In the root directory of your project, locate the `truffle-config.js` file and configure it as follows:

   ```javascript
   module.exports = {
     // See <http://truffleframework.com/docs/advanced/configuration> for more
     // information about configuring your Truffle project.

     networks: {
       development: {
         host: "127.0.0.1",     // Localhost (default: none)
         port: 7545,            // Standard Ethereum port (default: none)
         network_id: "*",       // Any network (default: none)
       },
     },

     compilers: {
       solc: {
         version: "0.8.4",      // Specify the version of Solidity
       },
     },
   };
   ```

2. **Save the File**: Save the `truffle-config.js` file with the updated settings.

### 8. Configure Settings

After setting up all the services, you need to configure the application settings. You can do this through the `ConfigPage` in your application.

1. **Open the Config Page**: Navigate to `http://localhost:3000/config` in your browser.

2. **Fill in the Settings**: You will need to fill in the following fields:

   - **IPFS Client URL**: This should be the API URL of your IPFS node (e.g., `http://localhost:8080`).
   - **Registration Contract Address**: Address of the registration smart contract.
   - **Registration Contract ABI**: ABI (Application Binary Interface) of the registration smart contract.
   - **Prescription Contract Address**: Address of the prescription smart contract.
   - **Prescription Contract ABI**: ABI of the prescription smart contract.
   - **Accounts**: Any relevant account information.

3. **Edit and Save Settings**:

   - **Edit Mode**: Click "Edit" to enable editing mode.
   - **Save Settings**: After filling in the settings, click "Save" to store them. 

   Ensure all fields are filled out correctly to avoid any issues. If you encounter any errors, check the error messages displayed on the page.

### 9. Interact with the DApp

1. **Open the Frontend**: Navigate to `http://localhost:3000` in your browser to interact with the DApp.

2. **Deploy Contracts**: Use Truffle to deploy your contracts. Ensure that your contracts are configured to point to the local Ganache network.

## Troubleshooting

- **Containers Not Starting**: Check the logs for each service using `docker-compose logs` to identify and resolve any issues.

- **Network Issues**: Ensure that your Metamask and Ganache configurations are correct and that all services are running.

- **Config Page Errors**: Ensure all required fields are filled in correctly and that the API base URL is correctly configured.

## Contributing

If you encounter any issues or have suggestions for improvements, please feel free to open an issue or submit a pull request on [GitHub](https://github.com/butchdc/ePrescription).
