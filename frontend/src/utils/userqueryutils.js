import { downloadFromIPFS } from '../utils/ipfsutils';
import { initWeb3, initContracts } from '../utils/web3utils';

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
            const ipfsHash = await registrationContract.methods.regulatoryAuthorityIPFSHash(address).call();
            attributes = await downloadFromIPFS(ipfsHash);
        } else if (isPhysician) {
            role = 'Physician';
            const ipfsHash = await registrationContract.methods.physicianIPFSHash(address).call();
            attributes = await downloadFromIPFS(ipfsHash);
        } else if (isPatient) {
            role = 'Patient';
            const ipfsHash = await registrationContract.methods.patientIPFSHash(address).call();
            attributes = await downloadFromIPFS(ipfsHash);
        } else if (isPharmacy) {
            role = 'Pharmacy';
            const ipfsHash = await registrationContract.methods.pharmacyIPFSHash(address).call();
            attributes = await downloadFromIPFS(ipfsHash);
        } else {
            role = 'Account is not Registered!';
        }

        return { role, attributes };
    } catch (err) {
        throw new Error(err.message);
    }
};
