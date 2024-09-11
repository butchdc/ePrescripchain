module.exports = async function (callback) {
    const accounts = await web3.eth.getAccounts();
    console.log("Accounts:", accounts);
    callback();
  };
  