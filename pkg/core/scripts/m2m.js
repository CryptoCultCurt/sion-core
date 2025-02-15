const hre = require("hardhat");
const fs = require("fs");

const {showM2M} = require("@sion-contracts/common/utils/script-utils");

async function main() {
    await showM2M();
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

