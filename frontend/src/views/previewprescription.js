import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { initWeb3, initContracts } from '../utils/web3utils'; 
import { downloadFromIPFS } from '../utils/apiutils'; 
import QRCode from 'qrcode';

const PreviewPrescription = ({ prescriptionID, onBack }) => {
    const [pdfUrl, setPdfUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [web3, setWeb3] = useState(null);
    const [contracts, setContracts] = useState(null);
    const [currentUser, setCurrentUser] = useState(null); 

    useEffect(() => {
        const initialize = async () => {
            try {
            // Initialize web3 and contracts
            const web3Instance = await initWeb3();
            setWeb3(web3Instance);
            const contractsInstance = await initContracts(web3Instance);
            setContracts(contractsInstance);

            // Get the current user's address from MetaMask
            const accounts = await web3Instance.eth.getAccounts();
            setCurrentUser(accounts[0]); // Set current user address

            } catch (err) {
            setError(`Initialization error: ${err.message}`);
            }
        };

        initialize();
    }, []);

    useEffect(() => {
        const fetchPrescriptionData = async () => {
            if (!web3 || !contracts || !currentUser || !prescriptionID) return;

            setLoading(true);
            try {
            // Fetch prescription data from smart contract
            const accessPrescriptionData = await contracts.prescriptionContract.methods.accessPrescription(prescriptionID).call({ from: currentUser });

            // Fetch prescription details from IPFS
            const prescriptionData = await downloadFromIPFS(accessPrescriptionData[1]);

            // Fetch physician details from IPFS
            const physicianIPFSHash = await contracts.registrationContract.methods.getPhysicianIPFSHash(prescriptionData.physicianAddress).call();
            const physicianData = await downloadFromIPFS(physicianIPFSHash);

            // Fetch patient details from IPFS
            const patientIPFSHash = await contracts.registrationContract.methods.getPatientIPFSHash(prescriptionData.patientAddress).call();
            const patientData = await downloadFromIPFS(patientIPFSHash);

            // Generate PDF
            const pdfBlob = await generatePDF(physicianData, patientData, prescriptionID,prescriptionData);
            setPdfUrl(URL.createObjectURL(pdfBlob));
            setError(null);

            } catch (err) {
            console.error('Error fetching prescription data:', err);
            setError('Error fetching prescription data');
            } finally {
            setLoading(false);
            }
        };

    fetchPrescriptionData();
    }, [web3, contracts, currentUser, prescriptionID]);

    const generatePDF = async (physicianData, patientData, prescriptionID,prescriptionData) => {
        const doc = new jsPDF();
        try {
            // Get page width and height
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // Load the logo
            const response = await fetch('/images/logo.png');
            const blob = await response.blob();
            const reader = new FileReader();

            const logoPromise = new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
            });

            const logoBase64 = await logoPromise;

            // Logo dimensions
            const logoWidth = 20;
            const logoHeight = 15;

            // Original position for the logo and title
            const logoX = 18;
            const logoY = 20;

            // Add the logo to the PDF
            doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);

            // Title position
            const title = 'e-PrescripChain';
            doc.setFontSize(20);
            doc.text(title, logoX + logoWidth +2, logoY + logoHeight / 2+3); 

            // Add physician details
            doc.setFontSize(12);
            doc.setFont('Helvetica', 'bold');
            doc.text('Physician Details', 20, logoY + logoHeight + 10);
            doc.setFont('Helvetica', 'normal');
            const physicianYStart = logoY + logoHeight + 16;
            const lineHeight = 5;
            doc.text(`${physicianData.name}`, 20, physicianYStart);
            doc.setFontSize(10);
            doc.text(`${physicianData.speciality}`, 20, physicianYStart + lineHeight);
            doc.text(`NZMC: ${physicianData.nzmcNo}`, 20, physicianYStart + 2 * lineHeight);
            doc.text(`Phone: ${physicianData.contactNumber}`, 20, physicianYStart + 3 * lineHeight);

            // Add patient details
            doc.setFontSize(12);
            doc.setFont('Helvetica', 'bold');
            doc.text('Patient Details', 20, physicianYStart + 25); 
            doc.setFont('Helvetica', 'normal');
            const patientYStart = physicianYStart + 31;
            doc.text(`${patientData.name}`, 20, patientYStart);
            doc.setFontSize(10);
            doc.text(`${patientData.patientAddress}`, 20, patientYStart + lineHeight);
            doc.text(`Date of Birth: ${patientData.dateOfBirth}`, 20, patientYStart + 2 * lineHeight);
            doc.text(`NHI: ${patientData.nhiNumber}`, 20, patientYStart + 3 * lineHeight);

            // Add QRCode
            const qrValue = `${prescriptionID}`;
            const qrCodeBase64 = await QRCode.toDataURL(qrValue);
        
            // Add QR code to the PDF
            const qrCodeSize = 30; 
            doc.addImage(qrCodeBase64, 'PNG', 151, logoY + logoHeight, qrCodeSize, qrCodeSize); 
            doc.setFontSize(6);
            doc.text(`${prescriptionID}`, 148, logoY + logoHeight+32);
            doc.setFontSize(10);

            // Add RxDate
            const date = new Date(prescriptionData.date);
            doc.text(`Rx Date: ${date.toLocaleDateString('en-GB')}`, 150, logoY + logoHeight + 38);

            // Add prescription details
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('Prescription Details', 20, patientYStart + 25); 

            // Adding drug information
            let yOffset = patientYStart + 32;
            const xOffset = 25;
            doc.setFontSize(10);
            prescriptionData.drugs.forEach((drug, index) => {
                if (yOffset + 25 > pageHeight-20) { 
                    doc.addPage(); 
                    yOffset = 60; 

                    // Add the logo to the PDF
                    doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);

                    // Title position
                    const title = 'e-PrescripChain';
                    doc.setFontSize(20);
                    doc.text(title, logoX + logoWidth +2, logoY + logoHeight / 2+3); 

                    doc.setFontSize(10);
                    // Add QR code to the PDF
                    const qrCodeSize = 30; 
                    doc.addImage(qrCodeBase64, 'PNG', 151, logoY + logoHeight, qrCodeSize, qrCodeSize); 
                    doc.setFontSize(8);
                    doc.text(`${prescriptionID}`, 148, logoY + logoHeight+32);
                    doc.setFontSize(10);

                }
                doc.setFont('Helvetica', 'bold');
                doc.text(`Drug ${index + 1}: ${drug.name}`, xOffset, yOffset);
                doc.setFont('Helvetica', 'normal');
                doc.text(`${drug.sig}`, xOffset, yOffset + lineHeight);
                doc.text(`Mitte: ${drug.mitte} ${drug.mitteUnit}`, xOffset, yOffset + 2 * (lineHeight+1));
                doc.text(`Repeat: ${drug.repeat}`, xOffset + 40, yOffset + 2 * (lineHeight+1));
                yOffset +=27; 
            });

            // Get the total number of pages
            const totalPages = doc.internal.getNumberOfPages();

            // Loop through each page to add page numbers
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i); // Set the current page
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const margin = 20; // Margin from the edge of the page

                // Set font size and style for page number
                doc.setFontSize(10);
                doc.setFont('Helvetica', 'normal');

                // Add page number text to the bottom center of the page
                doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - margin, { align: 'center' });
            }


            // Set PDF Metadata
            doc.setProperties({
            title: 'e-Prescription Document',
            author: 'e-PrescripChain System',
            subject: 'Prescription Details',
            keywords: 'prescription, medical, drug',
            creator: 'butchdc@gmail.com'
            });

            return doc.output('blob');
        } catch (error) {
            console.error('Error generating PDF:', error);
            return null;
        }
    };

    return (
        <div className="container-fluid p-0" style={{ height: 'calc(100vh - 135px)', margin: 0 }}>
            <div style={{ height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px' }}>
                    <button 
                        className="btn btn-sm btn-danger"
                        onClick={onBack}
                    >
                        Close Preview
                    </button>
                </div>  
                {loading && <p>Loading PDF...</p>}
                {error && <p className="text-danger">Error: {error}</p>}
                {pdfUrl && (
                <iframe
                    src={pdfUrl}
                    width="100%"
                    height="100%"
                    className="border-0"
                    title="PDF Preview"
                    style={{ border: 'none' }}
                ></iframe>
                )}              
            </div>
        </div>

    );
};

export default PreviewPrescription;
