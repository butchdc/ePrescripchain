// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./Registration.sol";

contract Prescription {

    // State Variables
    Registration public reg_contract;
    uint256 private prescriptionCounter; 

    // Structs
    struct PharmacySelect {
        address registeredPharmacy;
        bool isSelected;
    }

    struct PrescriptionDetail {
        uint256 prescriptionID;
        address patient;
        string IPFShash;
        PrescriptionStatus status;
        address physician;
    }

    // Mappings
    mapping(address => PharmacySelect) public PharmaciesSelection;
    mapping(uint256 => mapping(address => bool)) public hasPharmacySelected; // Mapping prescription ID to address to boolean
    mapping(uint256 => PrescriptionDetail) public prescriptions;
    mapping(uint256 => address) public prescriptionToPharmacy;

    // Enums
    enum PrescriptionStatus { Created, PharmacyAssigned, ReadyForCollection, Collected, Cancelled }

    // Events
    event PharmacySelected(address indexed _pharmacy);
    event PrescriptionCreated(
        uint256 indexed prescriptionID,
        address indexed physician,
        address indexed patient,
        string IPFShash
    );
    event MedicationIsPrepared(uint256 indexed prescriptionID, address _pharmacy, address patient);
    event MedicationIsCollected(uint256 indexed prescriptionID, address patient);
    event PrescriptionCancelled(uint256 indexed prescriptionID, address patient);
    event PrescriptionStatusUpdated(uint256 indexed prescriptionID, PrescriptionStatus newStatus);

    // Modifiers
    modifier onlyPhysician() {
        require(reg_contract.Physician(msg.sender), "Only the Physician is allowed to execute this function");
        _;
    }

    modifier onlyPatients() {
        require(reg_contract.Patient(msg.sender), "Only the patient is allowed to execute this function");
        _;
    }

    modifier onlyRegisteredPharmacies() {
        require(reg_contract.Pharmacy(msg.sender), "Only a registered Pharmacy can run this function");
        _;
    }

    modifier onlyAuthorized(uint256 _prescriptionID) {
        PrescriptionDetail memory detail = prescriptions[_prescriptionID];
        require(
            msg.sender == detail.physician || 
            msg.sender == detail.patient || 
            PharmaciesSelection[msg.sender].isSelected,
            "Unauthorized access"
        );
        _;
    }

    // Constructor
    constructor(address registrationSCAddress) {
        reg_contract = Registration(registrationSCAddress);
        prescriptionCounter = 1;
    }

    // Functions
    function prescriptionCreation(
        address _patient,
        string memory _IPFShash
    ) public onlyPhysician returns (uint256) {
        uint256 prescriptionID = prescriptionCounter++;
        PrescriptionDetail memory detail = PrescriptionDetail({
            prescriptionID: prescriptionID,
            patient: _patient,
            IPFShash: _IPFShash,
            status: PrescriptionStatus.Created,
            physician: msg.sender
        });

        prescriptions[prescriptionID] = detail;

        emit PrescriptionCreated(
            prescriptionID,
            msg.sender,
            _patient,
            _IPFShash
        );

        return prescriptionID;
    }

    function selectPharmacy(uint256 _prescriptionID, address _pharmacyAddress) public {
        require(reg_contract.Pharmacy(_pharmacyAddress), "Only registered pharmacies can be selected");

        PrescriptionDetail storage detail = prescriptions[_prescriptionID];
        require(detail.patient != address(0), "Prescription does not exist");
        require(detail.status == PrescriptionStatus.Created, "Prescription is not in a state that allows pharmacy selection");

        // Ensure only the patient or the physician who created the prescription can select a pharmacy
        require(msg.sender == detail.patient || msg.sender == detail.physician, "Only the patient or the prescribing physician can select a pharmacy");

        // Check if the user has already selected a pharmacy for this specific prescription
        require(!hasPharmacySelected[_prescriptionID][msg.sender], "You have already selected a pharmacy for this prescription");

        PharmaciesSelection[msg.sender] = PharmacySelect(_pharmacyAddress, true);
        hasPharmacySelected[_prescriptionID][msg.sender] = true;  

        detail.status = PrescriptionStatus.PharmacyAssigned;
        prescriptionToPharmacy[_prescriptionID] = _pharmacyAddress;  

        emit PharmacySelected(_pharmacyAddress);
        emit PrescriptionStatusUpdated(_prescriptionID, detail.status);
    }

    function accessPrescription(uint256 _prescriptionID) public view onlyAuthorized(_prescriptionID) returns (address, string memory, PrescriptionStatus) {
        PrescriptionDetail memory detail = prescriptions[_prescriptionID];
        require(detail.patient != address(0), "Prescription does not exist");

        return (detail.patient, detail.IPFShash, detail.status);
    }

    function medicationPreparation(uint256 _prescriptionID) public onlyRegisteredPharmacies {
        PrescriptionDetail storage detail = prescriptions[_prescriptionID];
        require(detail.patient != address(0), "Prescription does not exist");
        require(detail.status != PrescriptionStatus.Cancelled, "Prescription is cancelled");
        require(PharmaciesSelection[msg.sender].isSelected, "This pharmacy is not selected by the patient or physician");
        require(detail.status == PrescriptionStatus.PharmacyAssigned, "Medication is not ready for collection");

        emit MedicationIsPrepared(_prescriptionID, msg.sender, detail.patient);
        detail.status = PrescriptionStatus.ReadyForCollection;
    }

    function medicationCollection(uint256 _prescriptionID) public onlyRegisteredPharmacies {
        PrescriptionDetail storage detail = prescriptions[_prescriptionID];
        require(detail.patient != address(0), "Prescription does not exist");
        require(detail.status != PrescriptionStatus.Cancelled, "Prescription is cancelled");
        require(detail.status == PrescriptionStatus.ReadyForCollection, "Can't collect medication since it is not ready");

        detail.status = PrescriptionStatus.Collected;
        emit MedicationIsCollected(_prescriptionID, detail.patient);
    }

    function cancelPrescription(uint256 _prescriptionID) public onlyPhysician {
        PrescriptionDetail storage detail = prescriptions[_prescriptionID];
        require(detail.patient != address(0), "Prescription does not exist");
        require(detail.status == PrescriptionStatus.Created || detail.status == PrescriptionStatus.PharmacyAssigned, "Prescription cannot be cancelled");

        detail.status = PrescriptionStatus.Cancelled;
        emit PrescriptionCancelled(_prescriptionID, detail.patient);
    }

    function getAssignedPharmacy(uint256 _prescriptionID) public view onlyAuthorized(_prescriptionID) returns (address) {
        return prescriptionToPharmacy[_prescriptionID];
    }
}
