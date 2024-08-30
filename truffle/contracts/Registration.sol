// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Registration {

    address public administrator;
    
    // Mappings to check if an address is registered as an entity
    mapping(address => bool) public Physician;
    mapping(address => bool) public Patient;
    mapping(address => bool) public Pharmacy;
    mapping(address => bool) public isRegulatoryAuthority;

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
        require(isRegulatoryAuthority[msg.sender], "Only a registered regulatory authority can run this function");
        _;
    }

    constructor() {
        // Set the deployer as the administrator
        administrator = msg.sender;
        emit ContractDeployed(administrator);
    }

    function registerRegulatoryAuthority(address _regulatoryAuthority, string memory _ipfsHash) public onlyAdministrator {
        require(_regulatoryAuthority != address(0), "Invalid address");
        require(!isRegulatoryAuthority[_regulatoryAuthority], "Regulatory authority already registered");
        
        isRegulatoryAuthority[_regulatoryAuthority] = true;
        regulatoryAuthorityIPFSHash[_regulatoryAuthority] = _ipfsHash;
        
        emit RegulatoryAuthorityRegistered(msg.sender, _regulatoryAuthority, _ipfsHash);
    }

    function PhysicianRegistration(address user, string memory _ipfsHash) public onlyRegulatoryAuthority {
        require(user != address(0), "Invalid address");
        require(!Physician[user], "The physician is already registered");
        
        Physician[user] = true;
        physicianIPFSHash[user] = _ipfsHash;
        
        emit PhysicianRegistered(msg.sender, user, _ipfsHash);
    }

    function PharmacyRegistration(address _Pharmacy, string memory _ipfsHash) public onlyRegulatoryAuthority {
        require(_Pharmacy != address(0), "Invalid address");
        require(!Pharmacy[_Pharmacy], "The pharmacy is already registered");
        
        Pharmacy[_Pharmacy] = true;
        pharmacyIPFSHash[_Pharmacy] = _ipfsHash;
        
        emit PharmacyRegistered(msg.sender, _Pharmacy, _ipfsHash);
    }

    function PatientRegistration(address user, string memory _ipfsHash) public onlyRegulatoryAuthority {
        require(user != address(0), "Invalid address");
        require(!Patient[user], "The patient is already registered");
        
        Patient[user] = true;
        patientIPFSHash[user] = _ipfsHash;
        
        emit PatientRegistered(msg.sender, user, _ipfsHash);
    }
    
    // Getter functions for IPFS hashes
    function getPhysicianIPFSHash(address physician) public view returns (string memory) {
        return physicianIPFSHash[physician];
    }

    function getPatientIPFSHash(address patient) public view returns (string memory) {
        return patientIPFSHash[patient];
    }

    function getPharmacyIPFSHash(address pharmacy) public view returns (string memory) {
        return pharmacyIPFSHash[pharmacy];
    }

    function getRegulatoryAuthorityIPFSHash(address regulatoryAuthority) public view returns (string memory) {
        return regulatoryAuthorityIPFSHash[regulatoryAuthority];
    }
}
