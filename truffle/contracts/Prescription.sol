// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./Registration.sol";

contract Prescription {

    Registration public reg_contract;
    uint256 private prescriptionCounter; // Counter for generating incremental prescription IDs

    struct PharmacySelect {
        address registeredPharmacy;
        bool isSelected;
    }

    struct PrescriptionDetail {
        uint256 prescriptionID; // Changed to uint256 for incremental ID
        address patient;
        string IPFShash;
        MedicineCollectionState medicineCollectionState;
        address physician;
    }

    // Mapping for storing the selected pharmacy for each patient or physician
    mapping(address => PharmacySelect) public PharmaciesSelection;
    mapping(address => bool) public hasPharmacySelected;

    // Mapping to store prescriptions with unique ID
    mapping(uint256 => PrescriptionDetail) public prescriptions;

    enum MedicineCollectionState { ReadyForCollection, Collected }

    event PharmacySelected(address _pharmacy);
    event PrescriptionCreated(
        uint256 prescriptionID,
        address physician,
        address patient,
        string IPFShash
    );
    event MedicationIsPrepared(uint256 prescriptionID, address _pharmacy, address patient);
    event MedicationIsCollected(uint256 prescriptionID, address patient, string IPFShash);

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

    constructor(address registrationSCAddress) {
        reg_contract = Registration(registrationSCAddress);
        prescriptionCounter = 0; // Initialize the prescription counter
    }

    function prescriptionCreation(
        address _patient,
        string memory _IPFShash
    ) public onlyPhysician returns (uint256) {
        uint256 prescriptionID = prescriptionCounter++;
        PrescriptionDetail memory detail = PrescriptionDetail({
            prescriptionID: prescriptionID,
            patient: _patient,
            IPFShash: _IPFShash,
            medicineCollectionState: MedicineCollectionState.ReadyForCollection,
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

    function selectPharmacy(address _pharmacyAddress) public {
        require(!hasPharmacySelected[msg.sender], "You have already selected a pharmacy");
        require(reg_contract.Pharmacy(_pharmacyAddress), "Only registered pharmacies can be selected");

        PharmaciesSelection[msg.sender] = PharmacySelect(_pharmacyAddress, true);
        hasPharmacySelected[msg.sender] = true;
        emit PharmacySelected(_pharmacyAddress);
    }

    function accessPrescription(uint256 _prescriptionID) public view onlyRegisteredPharmacies returns (address, string memory) {
        PharmacySelect memory selectedPharmacy = PharmaciesSelection[msg.sender];
        require(selectedPharmacy.isSelected, "This pharmacy does not have access to the prescription");

        PrescriptionDetail memory detail = prescriptions[_prescriptionID];
        require(detail.patient != address(0), "Prescription does not exist");

        return (detail.patient, detail.IPFShash);
    }

    function medicationPreparation(uint256 _prescriptionID) public onlyRegisteredPharmacies {
        PrescriptionDetail storage detail = prescriptions[_prescriptionID];
        require(detail.patient != address(0), "Prescription does not exist");
        require(PharmaciesSelection[msg.sender].isSelected, "This pharmacy is not selected by the patient or physician");
        require(detail.medicineCollectionState == MedicineCollectionState.ReadyForCollection, "Medication is not ready for collection");

        emit MedicationIsPrepared(_prescriptionID, msg.sender, detail.patient);
        detail.medicineCollectionState = MedicineCollectionState.ReadyForCollection;
    }

    function medicationCollection(uint256 _prescriptionID, string memory _IPFShash) public onlyRegisteredPharmacies {
        PrescriptionDetail storage detail = prescriptions[_prescriptionID];
        require(detail.patient != address(0), "Prescription does not exist");
        require(detail.medicineCollectionState == MedicineCollectionState.ReadyForCollection, "Can't collect medication since it is not ready");

        detail.IPFShash = _IPFShash;
        detail.medicineCollectionState = MedicineCollectionState.Collected;
        emit MedicationIsCollected(_prescriptionID, detail.patient, _IPFShash);
    }
}
