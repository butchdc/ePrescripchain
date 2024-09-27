// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./Registration.sol";

contract Prescription {

    // State Variables
    Registration public reg_contract;

    // Structs
    struct PrescriptionDetail {
        string prescriptionID; 
        address patient;
        string IPFShash;
        PrescriptionStatus status;
        address physician;
    }

    // Mappings
    mapping(string => mapping(address => bool)) public hasPharmacySelected; 
    mapping(string => PrescriptionDetail) public prescriptions;
    mapping(string => address) public prescriptionToPharmacy;

    // Enums
    enum PrescriptionStatus { AwaitingPharmacyAssignment, AwaitingForConfirmation, Preparing, ReadyForCollection, Collected, Cancelled, Reassigned }

    // Events
    event PharmacySelected(string prescriptionID, address indexed _pharmacy);
    event PrescriptionCreated(
        string prescriptionID, 
        address indexed physician,
        address indexed patient,
        string IPFShash
    );
    event PrescriptionAccepted(string prescriptionID, address _pharmacy); 
    event PrescriptionRejected(string prescriptionID, address _pharmacy); 
    event MedicationIsPrepared(string prescriptionID, address _pharmacy, address patient); 
    event MedicationIsCollected(string prescriptionID, address patient); 
    event PrescriptionCancelled(string prescriptionID, address patient); 

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

    modifier onlyAuthorized(string memory _prescriptionID) {
        PrescriptionDetail memory detail = prescriptions[_prescriptionID];
        bool isPharmacy = hasPharmacySelected[_prescriptionID][msg.sender];
        
        require(
            msg.sender == detail.physician || 
            msg.sender == detail.patient || 
            isPharmacy ||
            reg_contract.regulatoryAuthority(msg.sender),
            "Unauthorized access"
        );
        _;
    }

    modifier onlyCreator(string memory _prescriptionID) {
        PrescriptionDetail memory detail = prescriptions[_prescriptionID];
        require(msg.sender == detail.physician, "Only the physician who created this prescription can access it");
        _;
    }

    // Constructor
    constructor(address registrationSCAddress) {
        reg_contract = Registration(registrationSCAddress);
    }

    // Functions
    function prescriptionCreation(
        string memory _prescriptionID,
        address _patient,
        string memory _IPFShash
    ) public onlyPhysician {
        require(prescriptions[_prescriptionID].patient == address(0), "Prescription ID already exists"); 

        PrescriptionDetail memory detail = PrescriptionDetail({
            prescriptionID: _prescriptionID,
            patient: _patient,
            IPFShash: _IPFShash,
            status: PrescriptionStatus.AwaitingPharmacyAssignment,
            physician: msg.sender
        });

        prescriptions[_prescriptionID] = detail;

        emit PrescriptionCreated(
            _prescriptionID,
            msg.sender,
            _patient,
            _IPFShash
        );
    }

    function accessPrescription(string memory _prescriptionID) public view onlyAuthorized(_prescriptionID) returns (address, string memory, PrescriptionStatus) {
        PrescriptionDetail memory detail = prescriptions[_prescriptionID];
        require(detail.patient != address(0), "Prescription does not exist");

        return (detail.patient, detail.IPFShash, detail.status);
    }

    function selectPharmacy(string memory _prescriptionID, address _pharmacyAddress) public {
        require(reg_contract.Pharmacy(_pharmacyAddress), "Only registered pharmacies can be selected");

        PrescriptionDetail storage detail = prescriptions[_prescriptionID];
        require(detail.patient != address(0), "Prescription does not exist");
        require(detail.status != PrescriptionStatus.Cancelled, "Prescription is cancelled.");

        address currentPharmacy = prescriptionToPharmacy[_prescriptionID];
        
        if (currentPharmacy != address(0)) {
            bool wasAccepted = detail.status == PrescriptionStatus.Preparing || 
                              detail.status == PrescriptionStatus.ReadyForCollection ||
                              detail.status == PrescriptionStatus.Collected || 
                              detail.status == PrescriptionStatus.Cancelled;

            if (!wasAccepted) {
                hasPharmacySelected[_prescriptionID][currentPharmacy] = false;
                emit PharmacySelected(_prescriptionID, currentPharmacy);
            }
        }

        require(!hasPharmacySelected[_prescriptionID][_pharmacyAddress], "This pharmacy has already been selected for this prescription");

        hasPharmacySelected[_prescriptionID][_pharmacyAddress] = true;
        prescriptionToPharmacy[_prescriptionID] = _pharmacyAddress;

        detail.status = PrescriptionStatus.AwaitingForConfirmation;

        emit PharmacySelected(_prescriptionID, _pharmacyAddress);
    }

    function acceptPrescription(string memory _prescriptionID) public onlyRegisteredPharmacies {
        PrescriptionDetail storage detail = prescriptions[_prescriptionID];
        require(detail.patient != address(0), "Prescription does not exist");
        require(detail.status == PrescriptionStatus.AwaitingForConfirmation, "Prescription is not in AwaitingForConfirmation status");
        require(msg.sender == prescriptionToPharmacy[_prescriptionID], "Only the assigned pharmacy can accept this prescription");
        require(detail.status != PrescriptionStatus.Cancelled, "Prescription is cancelled.");

        detail.status = PrescriptionStatus.Preparing;

        emit PrescriptionAccepted(_prescriptionID, msg.sender);
    }

    function rejectPrescription(string memory _prescriptionID) public onlyRegisteredPharmacies {
        PrescriptionDetail storage detail = prescriptions[_prescriptionID];
        require(detail.patient != address(0), "Prescription does not exist");
        require(detail.status == PrescriptionStatus.AwaitingForConfirmation, "Prescription is not in AwaitingForConfirmation status");
        require(msg.sender == prescriptionToPharmacy[_prescriptionID], "Only the assigned pharmacy can reject this prescription");
        require(detail.status != PrescriptionStatus.Cancelled, "Prescription is cancelled.");

        detail.status = PrescriptionStatus.Reassigned;
        delete prescriptionToPharmacy[_prescriptionID];
        hasPharmacySelected[_prescriptionID][msg.sender] = false;

        emit PrescriptionRejected(_prescriptionID, msg.sender);
    }

    function medicationPreparation(string memory _prescriptionID) public onlyRegisteredPharmacies {
        PrescriptionDetail storage detail = prescriptions[_prescriptionID];
        require(detail.patient != address(0), "Prescription does not exist");
        require(detail.status == PrescriptionStatus.Preparing, "Prescription is not in Preparing status");
        require(msg.sender == prescriptionToPharmacy[_prescriptionID], "Only the assigned pharmacy can prepare medication");
        require(detail.status != PrescriptionStatus.Cancelled, "Prescription is cancelled.");

        detail.status = PrescriptionStatus.ReadyForCollection;

        emit MedicationIsPrepared(_prescriptionID, msg.sender, detail.patient);
    }

    function medicationCollection(string memory _prescriptionID) public onlyRegisteredPharmacies {
        PrescriptionDetail storage detail = prescriptions[_prescriptionID];
        require(detail.patient != address(0), "Prescription does not exist");
        require(detail.status == PrescriptionStatus.ReadyForCollection, "Medication is not ready for collection");
        require(msg.sender == prescriptionToPharmacy[_prescriptionID], "This pharmacy is not the selected pharmacy for this prescription");
        require(detail.status != PrescriptionStatus.Cancelled, "Prescription is cancelled.");

        detail.status = PrescriptionStatus.Collected;

        emit MedicationIsCollected(_prescriptionID, detail.patient);
    }

    function cancelPrescription(string memory _prescriptionID) public onlyCreator(_prescriptionID) {
        PrescriptionDetail storage detail = prescriptions[_prescriptionID];
        require(detail.patient != address(0), "Prescription does not exist");
        require(detail.status == PrescriptionStatus.AwaitingPharmacyAssignment || detail.status == PrescriptionStatus.AwaitingForConfirmation, "Prescription cannot be cancelled");
        require(detail.status != PrescriptionStatus.Cancelled, "Prescription is cancelled.");
        
        detail.status = PrescriptionStatus.Cancelled;
        emit PrescriptionCancelled(_prescriptionID, detail.patient);
    }

    function getAssignedPharmacy(string memory _prescriptionID) public view onlyAuthorized(_prescriptionID) returns (address) {
        return prescriptionToPharmacy[_prescriptionID];
    }
}
