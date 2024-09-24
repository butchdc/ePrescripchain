import { downloadFromIPFS } from './apiutils';
import { initWeb3, initContracts } from '../utils/web3utils';

const fetchAttributes = async (contractMethod, address) => {
    const ipfsHash = await contractMethod(address).call();
    return await downloadFromIPFS(ipfsHash);
};

export const getUserRoleAndAttributes = async (address) => {
    try {
        const web3 = await initWeb3();
        const { registrationContract } = await initContracts(web3);

        // Fetch role
        const isAdministrator = await registrationContract.methods.administrator().call();
        const isAdmin = isAdministrator.toLowerCase() === address.toLowerCase();
        const isPhysician = await registrationContract.methods.Physician(address).call();
        const isPatient = await registrationContract.methods.Patient(address).call();
        const isPharmacy = await registrationContract.methods.Pharmacy(address).call();
        const isRegulatoryAuthority = await registrationContract.methods.regulatoryAuthority(address).call();

        let role = null;
        let attributes = {};

        if (isAdmin) {
            role = 'Administrator';
        } else if (isRegulatoryAuthority) {
            role = 'Regulatory Authority';
            attributes = await fetchAttributes(registrationContract.methods.regulatoryAuthorityIPFSHash, address);
        } else if (isPhysician) {
            role = 'Physician';
            attributes = await fetchAttributes(registrationContract.methods.physicianIPFSHash, address);
        } else if (isPatient) {
            role = 'Patient';
            attributes = await fetchAttributes(registrationContract.methods.patientIPFSHash, address);
        } else if (isPharmacy) {
            role = 'Pharmacy';
            attributes = await fetchAttributes(registrationContract.methods.pharmacyIPFSHash, address);
        } else {
            role = 'Account is not Registered!';
        }

        return { role, attributes };
    } catch (err) {
        console.error('Error in getUserRoleAndAttributes:', err);
        throw new Error(`Failed to get user role and attributes: ${err.message}`);
    }
};
