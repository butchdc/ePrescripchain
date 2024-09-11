// 2_deploy_contracts.js

const Registration = artifacts.require("Registration");
const Prescription = artifacts.require("Prescription");

module.exports = async function (deployer, network, accounts) {
  // Deploy Registration contract
  //await deployer.deploy(Registration, {from: accounts[0]});
  const registrationInstance = await Registration.deployed();

  // Deploy Prescription contract with the address of the deployed Registration contract
  await deployer.deploy(Prescription, registrationInstance.address, {from: accounts[0]});
};
