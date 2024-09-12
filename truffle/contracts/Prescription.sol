// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./Registration.sol";

contract Prescription {

    // State Variables
    Registration public reg_contract;
    uint256 private prescriptionCounter;

    // Structs
    struct PrescriptionDetail {
        uint256 prescriptionID;
        address patient;
        string IPFShash;
        PrescriptionStatus status;
        address physician;
    }

    // Mappings
    mapping(uint256 => mapping(address => bool)) public hasPharmacySelected; 
    mapping(uint256 => PrescriptionDetail) public prescriptions;
    mapping(uint256 => address) public prescriptionToPharmacy;

    // Enums
    enum PrescriptionStatus { AwaitingPharmacyAssignment, AwaitingForConfirmation, Preparing, ReadyForCollection, Collected, Cancelled }

    // Events
    event PharmacySelected(address indexed _pharmacy);
    event PrescriptionCreated(
        uint256 indexed prescriptionID,
        address indexed physician,
        address indexed patient,
        string IPFShash
    );
    event PrescriptionAccepted(uint256 indexed prescriptionID, address _pharmacy);
    event PrescriptionRejected(uint256 indexed prescriptionID, address _pharmacy);
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
        bool isPharmacy = hasPharmacySelected[_prescriptionID][msg.sender];
        
        require(
            msg.sender == detail.physician || 
            msg.sender == detail.patient || 
            isPharmacy,
            "Unauthorized access"
        );
        _;
    }

    modifier onlyCreator(uint256 _prescriptionID) {
        PrescriptionDetail memory detail = prescriptions[_prescriptionID];
        require(msg.sender == detail.physician, "Only the physician who created this prescription can access it");
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
            status: PrescriptionStatus.AwaitingPharmacyAssignment,
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

    function accessPrescription(uint256 _prescriptionID) public view onlyAuthorized(_prescriptionID) returns (address, string memory, PrescriptionStatus) {
        PrescriptionDetail memory detail = prescriptions[_prescriptionID];
        require(detail.patient != address(0), "Prescription does not exist");

        return (detail.patient, detail.IPFShash, detail.status);
    }

    function selectPharmacy(uint256 _prescriptionID, address _pharmacyAddress) public {
        require(reg_contract.Pharmacy(_pharmacyAddress), "Only registered pharmacies can be selected");

        PrescriptionDetail storage detail = prescriptions[_prescriptionID];
        require(detail.patient != address(0), "Prescription does not exist");
        require(detail.status == PrescriptionStatus.AwaitingPharmacyAssignment, "Prescription is not in a state that allows pharmacy selection");

        require(msg.sender == detail.patient || msg.sender == detail.physician, "Only the patient or the prescribing physician can select a pharmacy");

        require(!hasPharmacySelected[_prescriptionID][_pharmacyAddress], "This pharmacy has already been selected for this prescription");

        hasPharmacySelected[_prescriptionID][_pharmacyAddress] = true;
        prescriptionToPharmacy[_prescriptionID] = _pharmacyAddress;

        detail.status = PrescriptionStatus.AwaitingForConfirmation;

        emit PharmacySelected(_pharmacyAddress);
        emit PrescriptionStatusUpdated(_prescriptionID, detail.status);
    }

    function acceptPrescription(uint256 _prescriptionID) public onlyRegisteredPharmacies {
        PrescriptionDetail storage detail = prescriptions[_prescriptionID];
        require(detail.patient != address(0), "Prescription does not exist");
        require(detail.status == PrescriptionStatus.AwaitingForConfirmation, "Prescription is not in AwaitingForConfirmation status");
        require(msg.sender == prescriptionToPharmacy[_prescriptionID], "Only the assigned pharmacy can accept this prescription");

        detail.status = PrescriptionStatus.Preparing;

        emit PrescriptionAccepted(_prescriptionID, msg.sender);
        emit PrescriptionStatusUpdated(_prescriptionID, detail.status);
    }

    function rejectPrescription(uint256 _prescriptionID) public onlyRegisteredPharmacies {
        PrescriptionDetail storage detail = prescriptions[_prescriptionID];
        require(detail.patient != address(0), "Prescription does not exist");
        require(detail.status == PrescriptionStatus.AwaitingForConfirmation, "Prescription is not in AwaitingForConfirmation status");
        require(msg.sender == prescriptionToPharmacy[_prescriptionID], "Only the assigned pharmacy can reject this prescription");

        detail.status = PrescriptionStatus.AwaitingPharmacyAssignment;
        delete prescriptionToPharmacy[_prescriptionID];
        hasPharmacySelected[_prescriptionID][msg.sender] = false;

        emit PrescriptionRejected(_prescriptionID, msg.sender);
        emit PrescriptionStatusUpdated(_prescriptionID, detail.status);
    }

    function medicationPreparation(uint256 _prescriptionID) public onlyRegisteredPharmacies {
        PrescriptionDetail storage detail = prescriptions[_prescriptionID];
        require(detail.patient != address(0), "Prescription does not exist");
        require(detail.status == PrescriptionStatus.Preparing, "Prescription is not in Preparing status");
        require(msg.sender == prescriptionToPharmacy[_prescriptionID], "Only the assigned pharmacy can prepare medication");

        detail.status = PrescriptionStatus.ReadyForCollection;

        emit MedicationIsPrepared(_prescriptionID, msg.sender, detail.patient);
        emit PrescriptionStatusUpdated(_prescriptionID, detail.status);
    }

    function medicationCollection(uint256 _prescriptionID) public onlyRegisteredPharmacies {
        PrescriptionDetail storage detail = prescriptions[_prescriptionID];
        require(detail.patient != address(0), "Prescription does not exist");
        require(detail.status == PrescriptionStatus.ReadyForCollection, "Medication is not ready for collection");
        require(msg.sender == prescriptionToPharmacy[_prescriptionID], "This pharmacy is not the selected pharmacy for this prescription");

        detail.status = PrescriptionStatus.Collected;

        emit MedicationIsCollected(_prescriptionID, msg.sender);
        emit PrescriptionStatusUpdated(_prescriptionID, detail.status);
    }


    function cancelPrescription(uint256 _prescriptionID) public onlyCreator(_prescriptionID) {
        PrescriptionDetail storage detail = prescriptions[_prescriptionID];
        require(detail.patient != address(0), "Prescription does not exist");
        require(detail.status == PrescriptionStatus.AwaitingPharmacyAssignment || detail.status == PrescriptionStatus.AwaitingForConfirmation, "Prescription cannot be cancelled");

        detail.status = PrescriptionStatus.Cancelled;
        emit PrescriptionCancelled(_prescriptionID, detail.patient);
        emit PrescriptionStatusUpdated(_prescriptionID, detail.status);
    }

    function getAssignedPharmacy(uint256 _prescriptionID) public view onlyAuthorized(_prescriptionID) returns (address) {
        return prescriptionToPharmacy[_prescriptionID];
    }
}
