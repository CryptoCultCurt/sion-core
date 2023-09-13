const wallet = "0xeccb9b9c6fb7590a4d0588953b3170a1a84e3341";
//const whale = '0x5bdf85216ec1e38d6458c870992a69e38e03f7ef'; // arbitrum whale
const whale = '0xF977814e90dA44bFA03b6295A0616a897441aceC'; // polygon whale (binance)
async function getContract(contract) {
    const PM = await ethers.getContractFactory(contract);
    address = await hre.deployments.get(contract);
    return PM.attach(address.address);
}

async function getContractAt(contract,address) {
    const PM = await ethers.getContractFactory(contract);
    return await PM.attach(address);
}

function toDec18(number,decimals) {
    return number/1000000000000000000
}


module.exports.wallet = wallet;
module.exports.whale = whale;
module.exports.getContract = getContract;
module.exports.toDec18 = toDec18;
module.exports.getContractAt = getContractAt;