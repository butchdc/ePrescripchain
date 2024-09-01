// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./Registration.sol";

contract Prescription {

    Registration public reg_contract;

    struct PharmacySelect {
        address registeredPharmacy;
        bool isSelected;
    }

    // Mapping for storing the selected pharmacy for each patient or physician
    mapping(address => PharmacySelect) public PharmaciesSelection;
    mapping(address => bool) public hasPharmacySelected; 

    enum MedicineCollectionState { ReadyForCollection, Collected }
    MedicineCollectionState public medicineCollectionState;

    uint public patientID;
    string public IPFShash;  

    event PharmacySelected(address _pharmacy);
    event PrescriptionCreated(
        address physician,
        uint patientID,
        string IPFShash
    );
    event MedicationIsPrepared(address _pharmacy, uint patientID);
    event MedicationIsCollected(address patient, uint patientID, string IPFShash);

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
    }

    function prescriptionCreation(
        uint _patientID,
        string memory _IPFShash
    ) public onlyPhysician {
        patientID = _patientID;
        IPFShash = _IPFShash;
        emit PrescriptionCreated(
            msg.sender,
            patientID,
            IPFShash
        );
    }

    function selectPharmacy(address _pharmacyAddress) public {
        require(!hasPharmacySelected[msg.sender], "You have already selected a pharmacy");
        require(reg_contract.Pharmacy(_pharmacyAddress), "Only registered pharmacies can be selected");

        PharmaciesSelection[msg.sender] = PharmacySelect(_pharmacyAddress, true);
        hasPharmacySelected[msg.sender] = true;
        emit PharmacySelected(_pharmacyAddress);
    }

    function accessPrescription() public view onlyRegisteredPharmacies returns (uint, string memory) {
        PharmacySelect memory selectedPharmacy = PharmaciesSelection[msg.sender];
        require(selectedPharmacy.isSelected, "This pharmacy does not have access to the prescription");

        return (patientID, IPFShash);
    }

    function medicationPreparation(uint _patientID) public onlyRegisteredPharmacies {
        require(PharmaciesSelection[msg.sender].isSelected, "This pharmacy is not selected by the patient or physician");
        patientID = _patientID;
        emit MedicationIsPrepared(msg.sender, patientID);
        medicineCollectionState = MedicineCollectionState.ReadyForCollection;
    }

    function medicationCollection(uint _patientID, string memory _IPFShash) public onlyRegisteredPharmacies {
        require(medicineCollectionState == MedicineCollectionState.ReadyForCollection, "Can't collect medication since it is not ready");
        patientID = _patientID;
        IPFShash = _IPFShash;
        medicineCollectionState = MedicineCollectionState.Collected;
        emit MedicationIsCollected(msg.sender, patientID, _IPFShash);
    }
}
