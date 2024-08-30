// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./Registration.sol";

contract Prescription {

    Registration public reg_contract;

    struct PharmacySelect {
        address registeredPharmacy;
        bool isSelected;
    }

    mapping(address => PharmacySelect[]) public PharmaciesSelection;
    mapping(address => uint) public selectionCounter;

    enum ApprovalRequestState { Pending, Approved }
    ApprovalRequestState public approvalState;

    enum MedicineCollectionState { ReadyForCollection, Collected }
    MedicineCollectionState public medicineCollectionState;

    uint public patientID;
    uint public drug1CRN; 
    uint public drug2CRN; 
    uint public drug3CRN; 

    event PharmacyEligible(address _pharmacy);
    event PharmacyIneligible(address _pharmacy);
    event Approved(address _pharmacy);
    event PrescriptionCreated(
        address physician,
        uint patientID,
        uint drug1CRN,
        uint drug2CRN,
        uint drug3CRN,
        bytes32 IPFShash
    );
    event ApprovalIsRequested(
        address _pharmacy,
        uint patientID,
        uint drug1CRN,
        uint drug2CRN,
        uint drug3CRN
    );
    event MedicationIsPrepared(address _pharmacy, uint patientID);
    event MedicationIsCollected(address patient, uint patientID, bytes32 IPFShash);

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

    function stringToBytes32(string memory source) internal pure returns (bytes32 result) {
        bytes memory temp = bytes(source);
        if (temp.length > 32) {
            revert("String too long");
        }
        assembly {
            result := mload(add(temp, 32))
        }
    }

    function prescriptionCreation(
        uint _patientID,
        uint _drug1CRN,
        uint _drug2CRN,
        uint _drug3CRN,
        string memory _IPFShash
    ) public onlyPhysician {
        patientID = _patientID;
        drug1CRN = _drug1CRN;
        drug2CRN = _drug2CRN;
        drug3CRN = _drug3CRN;
        emit PrescriptionCreated(
            msg.sender,
            patientID,
            drug1CRN,
            drug2CRN,
            drug3CRN,
            stringToBytes32(_IPFShash)
        );
    }

    function selectPharmacy(address _pharmacyAddress) public onlyPatients {
        require(selectionCounter[msg.sender] < 5, "A patient can only select up to 5 pharmacies");
        require(reg_contract.Pharmacy(_pharmacyAddress), "Only registered pharmacies can be selected");

        PharmaciesSelection[msg.sender].push(PharmacySelect(_pharmacyAddress, true));
        selectionCounter[msg.sender] += 1;
        approvalState = ApprovalRequestState.Pending;
    }

    function pharmacyApproval(address _patient) public onlyRegisteredPharmacies {
        require(approvalState == ApprovalRequestState.Pending, "Can't give approval as there is no request");

        for (uint i = 0; i < selectionCounter[_patient]; i++) {
            if (PharmaciesSelection[_patient][i].registeredPharmacy == msg.sender && PharmaciesSelection[_patient][i].isSelected) {
                approvalState = ApprovalRequestState.Approved;
                emit PharmacyEligible(msg.sender);
                emit Approved(msg.sender);
                return;
            }
        }

        emit PharmacyIneligible(msg.sender);
    }

    function medicationPreparation(uint _patientID) public onlyRegisteredPharmacies {
        patientID = _patientID;
        emit MedicationIsPrepared(msg.sender, patientID);
        medicineCollectionState = MedicineCollectionState.ReadyForCollection;
    }

    function medicationCollection(uint _patientID, string memory _IPFShash) public onlyPatients {
        require(medicineCollectionState == MedicineCollectionState.ReadyForCollection, "Can't collect medication since it is not ready");
        patientID = _patientID;
        medicineCollectionState = MedicineCollectionState.Collected;
        emit MedicationIsCollected(msg.sender, patientID, stringToBytes32(_IPFShash));
    }
}
