const {initWallet, getContract, getPrice} = require("@sion-contracts/common/utils/script-utils");

/**
 * Что делает скрипт?
 *
 * Передает права с dev аккаунта на timelock по всем контрактам Core.
 *
 * Какие права передаются?
 * - DEFAULT_ADMIN_ROLE - дает админские права на контракт
 * - UPGRADER_ROLE - позволяет выполнять upgrade proxy контракта
 *
 * Перед выполняем на проде, выполните на локальной ноде:
 * - Убедиться, что нет ошибок
 * - Убедиться, что скрипт актуальный и не требует доработки
 *
 * Как понять что все отработало корректно?
 *
 * После выполнения скрипта в каждой строке таблицы должны стоять след. значения:
 *
 * - roleAdminWallet - FALSE
 * - roleAdminTimelock - TRUE
 *
 * - roleUpgradeWallet - FALSE
 * - roleUpgradeTimelock - TRUE
 *
 * @returns
 */
async function main() {

    let names = [
        'Exchange',
        'SionToken',
        'PortfolioManager',
        'Mark2Market',
        'Market',
        'WrappedSionToken'
    ];


    await showRules(names);

    await moveRulesAll(names);

    await showRules(names);


}

async function moveRulesAll(names){
    let wallet = await initWallet();
    let timeLock = await getContract('OvnTimelockController');

    for (const name of names) {
        try {
            await moveRules(name, wallet.address, timeLock.address);
        } catch (e) {
            console.log('Error moveRules: ' + e)
        }
    }
}

async function moveRules(name, oldAddress, newAddress) {

    let contract = await getContract(name);
    console.log(`Move ${name}: ${contract.address}: oldAddress: ${oldAddress} => newAddress: ${newAddress}`);

    let price = await getPrice();

    let hasUpgradeRole = true;

    try {
        await contract.UPGRADER_ROLE();
    } catch (e) {
        hasUpgradeRole = false;
    }

    await (await contract.grantRole(await contract.DEFAULT_ADMIN_ROLE(), newAddress, price)).wait();

    if (hasUpgradeRole) {
        await (await contract.grantRole(await contract.UPGRADER_ROLE(), newAddress, price)).wait();
    }

    if (hasUpgradeRole) {
        await (await contract.revokeRole(await contract.UPGRADER_ROLE(), oldAddress, price)).wait();
    }

    await (await contract.revokeRole(await contract.DEFAULT_ADMIN_ROLE(), oldAddress, price)).wait();
}

async function showRules(names){
    let wallet = await initWallet();
    let timeLock = await getContract('OvnTimelockController');

    let items = [];
    for (const name of names) {

        let contract = await getContract(name);

        let roleUpgradeWallet = '-';
        let roleUpgradeTimelock = '-';

        try {
            roleUpgradeWallet = (await contract.hasRole(await contract.UPGRADER_ROLE(), wallet.address))
            roleUpgradeTimelock = (await contract.hasRole(await contract.UPGRADER_ROLE(), timeLock.address))
        } catch (e) {
        }

        try {
            items.push({
                name: name,
                address: contract.address,
                timelock: timeLock.address,
                roleAdminWallet: (await contract.hasRole(await contract.DEFAULT_ADMIN_ROLE(), wallet.address)),
                roleAdminTimelock: (await contract.hasRole(await contract.DEFAULT_ADMIN_ROLE(), timeLock.address)),

                roleUpgradeWallet: roleUpgradeWallet,
                roleUpgradeTimelock: roleUpgradeTimelock
            });
        } catch (e) {
            console.log('Error get hasRole: ' + e);
        }
    }

    console.table(items);
}





main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
