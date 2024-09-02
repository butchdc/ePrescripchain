// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Registration {

    address public administrator;
    
    // Mappings to check if an address is registered as an entity
    mapping(address => bool) public Physician;
    mapping(address => bool) public Patient;
    mapping(address => bool) public Pharmacy;
    mapping(address => bool) public regulatoryAuthority;

    // Mappings to store IPFS hashes
    mapping(address => string) public physicianIPFSHash;
    mapping(address => string) public patientIPFSHash;
    mapping(address => string) public pharmacyIPFSHash;
    mapping(address => string) public regulatoryAuthorityIPFSHash;

    event ContractDeployed(address administrator);
    event RegulatoryAuthorityRegistered(address indexed administrator, address indexed regulatory_authority, string ipfsHash);
    event PhysicianRegistered(address indexed regulatory_authority, address indexed physician, string ipfsHash);
    event PharmacyRegistered(address indexed regulatory_authority, address indexed pharmacy, string ipfsHash);
    event PatientRegistered(address indexed regulatory_authority, address indexed patient, string ipfsHash);

    modifier onlyAdministrator() {
        require(administrator == msg.sender, "Only the administrator is permitted to run this function");
        _;
    }

    modifier onlyRegulatoryAuthority() {
        require(regulatoryAuthority[msg.sender], "Only a registered regulatory authority can run this function"); // Updated variable name
        _;
    }

    constructor() {
        // Set the deployer as the administrator
        administrator = msg.sender;
        emit ContractDeployed(administrator);
    }

    function registerRegulatoryAuthority(address user, string memory _ipfsHash) public onlyAdministrator { // Renamed parameter to 'user'
        require(user != address(0), "Invalid address");
        require(!regulatoryAuthority[user], "Regulatory authority already registered"); // Updated variable name
        
        regulatoryAuthority[user] = true; // Updated variable name
        regulatoryAuthorityIPFSHash[user] = _ipfsHash;
        
        emit RegulatoryAuthorityRegistered(msg.sender, user, _ipfsHash);
    }

    function PhysicianRegistration(address user, string memory _ipfsHash) public onlyRegulatoryAuthority {
        require(user != address(0), "Invalid address");
        require(!Physician[user], "The physician is already registered");
        
        Physician[user] = true;
        physicianIPFSHash[user] = _ipfsHash;
        
        emit PhysicianRegistered(msg.sender, user, _ipfsHash);
    }

    function PharmacyRegistration(address user, string memory _ipfsHash) public onlyRegulatoryAuthority { // Renamed parameter to 'user'
        require(user != address(0), "Invalid address");
        require(!Pharmacy[user], "The pharmacy is already registered");
        
        Pharmacy[user] = true;
        pharmacyIPFSHash[user] = _ipfsHash;
        
        emit PharmacyRegistered(msg.sender, user, _ipfsHash);
    }

    function PatientRegistration(address user, string memory _ipfsHash) public onlyRegulatoryAuthority {
        require(user != address(0), "Invalid address");
        require(!Patient[user], "The patient is already registered");
        
        Patient[user] = true;
        patientIPFSHash[user] = _ipfsHash;
        
        emit PatientRegistered(msg.sender, user, _ipfsHash);
    }
    
    // Getter functions for IPFS hashes
    function getPhysicianIPFSHash(address user) public view returns (string memory) {
        return physicianIPFSHash[user];
    }

    function getPatientIPFSHash(address user) public view returns (string memory) {
        return patientIPFSHash[user];
    }

    function getPharmacyIPFSHash(address user) public view returns (string memory) {
        return pharmacyIPFSHash[user];
    }

    function getRegulatoryAuthorityIPFSHash(address user) public view returns (string memory) { // Renamed parameter to 'user'
        return regulatoryAuthorityIPFSHash[user];
    }
}
