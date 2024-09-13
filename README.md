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
### 2. Start Docker Containers
Build and start the Docker containers:
```bash
docker-compose up --build
```
Verify that the containers are running:
```bash
docker ps
```
You should see `frontend`, `ipfs_node`, and `backend` services.
### 3. Configure Metamask
1. **Open Ganache**: Start Ganache and copy the mnemonic phrase.
2. **Open Metamask**: Import an existing wallet using the mnemonic from Ganache.
3. **Add Custom Network**:
   - Network Name: `Localhost 7545`
   - New RPC URL: `http://localhost:7545`
   - Chain ID: `1337`
   - Currency Symbol: `ETH` (optional)
### 4. Configure Ganache
1. **Open Ganache**: Start Ganache and set the following:
   - Port: `7545`
   - Network ID: `1337`
2. **Accounts**: Use the default accounts provided by Ganache.
### 5. Configure Frontend
1. **Create `.env` File**:
   - In the `frontend` directory, create a `.env` file.
2. **Add Environment Variables**:
   ```plaintext
   REACT_APP_SECRET_KEY=your-secret-key
   REACT_APP_API_BASE_URL=http://localhost:3001/api/
   GENERATE_SOURCEMAP=false
   ```
   - **`REACT_APP_SECRET_KEY`**: Your actual secret key.
   - **`REACT_APP_API_BASE_URL`**: URL of your backend API, typically `http://localhost:3001/api/`.
   - **`GENERATE_SOURCEMAP=false`**: Disables source maps in production.
3. **Save the File**: Ensure the `.env` file is saved with these configurations.
### 6. Configure IPFS
1. **Access IPFS Container**:
   ```bash
   docker exec -it ipfs_node sh
   ```
2. **Edit IPFS Configuration**:
   - Open `/data/ipfs/config` and update the `"API"` section:
     ```json
     "API": {
       "HTTPHeaders": {
         "Access-Control-Allow-Origin": ["*"],
         "Access-Control-Allow-Methods": ["PUT", "POST", "GET", "DELETE", "OPTIONS"],
         "Access-Control-Allow-Headers": ["Authorization", "Content-Type"]
       }
     }
     ```
   - Save and exit the editor.
3. **Restart IPFS Container**:
   ```bash
   docker restart ipfs_node
   ```
### 7. Configure Truffle
1. **Edit `truffle-config.js`**:
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
2. **Save the File**: Save `truffle-config.js` with these settings.
### 8. Configure Settings
**Disclaimer**: These configurations are for development and testing only and are not secure for production.
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
1. **Open the Frontend**: Go to `http://localhost:3000`.
2. **Deploy Contracts**: Use Truffle to deploy your contracts to the local Ganache network.
## Troubleshooting
- **Containers Not Starting**: Use `docker-compose logs` to debug issues.
- **Network Issues**: Verify Metamask and Ganache configurations.
- **Config Page Errors**: Ensure all fields are filled and API base URL is correct.
## Contributing
For issues or suggestions, open an issue or submit a pull request on [GitHub](https://github.com/butchdc/ePrescription).
