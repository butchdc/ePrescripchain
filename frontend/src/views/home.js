const Home = () => {
    return (
        <div>
            <div className="container-fluid p-0">
                <div className="p-4">
                    <h1>Welcome to the Blockchain e-Prescription System</h1>
                    <p>Welcome to the innovative Blockchain e-Prescription System, where cutting-edge technology meets healthcare. Our platform uses blockchain to transform the way prescriptions are managed, ensuring greater security, transparency, and efficiency for both healthcare providers and patients.</p>              
                    <h2>Key Benefits</h2>
                    <ul>
                        <li><strong>Enhanced Security:</strong> Encrypted and immutable records reduce the risk of prescription fraud and unauthorized access.</li>
                        <li><strong>Transparency:</strong> Every transaction is recorded on the blockchain, providing a clear and auditable history of all actions.</li>
                        <li><strong>Efficient Processes:</strong> Simplifies the management, approval, and tracking of prescriptions, improving workflow for healthcare providers and patients.</li>
                        <li><strong>Improved Privacy:</strong> Sensitive information is securely encrypted, ensuring access is restricted to authorized individuals only.</li>
                    </ul>
                    <h2>How to Get Started</h2>
                    <p className="text-danger mb-0">You are seeing this page because the Blockchain e-Prescription System requires certain setup steps to ensure proper functionality.</p>
                    <p className="mb-0">To use the Blockchain e-Prescription System, follow these steps:</p>
                    <ul>
                        <li><strong>Install MetaMask:</strong> MetaMask is a browser extension that acts as a digital wallet for interacting with blockchain applications. <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">Download and install MetaMask here</a>.</li>
                        <li><strong>Set Up Your Wallet:</strong> Follow the instructions in MetaMask to create a new wallet or import an existing one. Be sure to securely save your seed phrase.</li>
                        <li><strong>Register with the Regulatory Authority:</strong> To use the system, your MetaMask account must be registered with the regulatory authority. Ensure your account is registered to gain access.</li>
                        <li><strong>Access the System:</strong> Navigate to the e-prescription system’s web interface and connect your MetaMask wallet to start using the application.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
 
export default Home;