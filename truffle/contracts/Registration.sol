// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Registration {

    address public administrator;
    
    // Mappings to check if an address is registered as an entity
    mapping(address => bool) public Physician;
    mapping(address => bool) public Patient;
    mapping(address => bool) public Pharmacy;
    mapping(address => bool) public isRegulatoryAuthority;

    event ContractDeployed(address administrator);
    event RegulatoryAuthorityRegistered(address indexed administrator, address indexed regulatory_authority);
    event PhysicianRegistered(address indexed regulatory_authority, address indexed Physician);
    event PharmacyRegistered(address indexed regulatory_authority, address indexed Pharmacy);
    event PatientRegistered(address indexed regulatory_authority, address indexed Patient);

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

    function registerRegulatoryAuthority(address _regulatoryAuthority) public onlyAdministrator {
        require(_regulatoryAuthority != address(0), "Invalid address");
        require(!isRegulatoryAuthority[_regulatoryAuthority], "Regulatory authority already registered");
        
        isRegulatoryAuthority[_regulatoryAuthority] = true;
        
        emit RegulatoryAuthorityRegistered(msg.sender, _regulatoryAuthority);
    }

    function PhysicianRegistration(address user) public onlyRegulatoryAuthority {
        require(user != address(0), "Invalid address");
        require(!Physician[user], "The physician is already registered");
        Physician[user] = true;
        emit PhysicianRegistered(msg.sender, user);
    }

    function PharmacyRegistration(address _Pharmacy) public onlyRegulatoryAuthority {
        require(_Pharmacy != address(0), "Invalid address");
        Pharmacy[_Pharmacy] = true;
        emit PharmacyRegistered(msg.sender, _Pharmacy);
    }

    function PatientRegistration(address user) public onlyRegulatoryAuthority {
        require(user != address(0), "Invalid address");
        require(!Patient[user], "The patient is already registered");
        Patient[user] = true;
        emit PatientRegistered(msg.sender, user);
    }
}
