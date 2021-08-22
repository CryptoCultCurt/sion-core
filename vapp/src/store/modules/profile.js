const state = {
    contracts: null,
    account: null,
    web3: null,


    currentTotalData: null,
    balance: {
        ovn: 0,
        usdc: 0,
    },

    gasPrice: 0,
};

const getters = {


    contracts(state) {
        return state.contracts;
    },
    account(state) {
        return state.account;
    },

    balance(state) {
        return state.balance;
    },

    currentTotalData(state) {
        return state.currentTotalData;
    },

    web3(state) {
        return state.web3;
    },


    gasPrice(state) {
        return state.gasPrice;
    },
};

const actions = {


    async refreshBalance({commit, dispatch, getters}){

        let usdc = await getters.contracts.usdc.methods.balanceOf(getters.account).call();
        let ovn =  await getters.contracts.ovn.methods.balanceOf(getters.account).call();

        commit('setBalance', {
            ovn: ovn,
            usdc: usdc
        })

    },

    async refreshProfile({commit, dispatch, getters}){

        dispatch('refreshGasPrice');
        dispatch('refreshCurrentTotalData');
        dispatch('refreshBalance');
    },

    async refreshGasPrice({commit, dispatch, getters}){
        getters.web3.eth.getGasPrice(function(e, r) { commit('setGasPrice', r) })
    },

    async refreshCurrentTotalData({commit, dispatch, getters}){

        getters.contracts.m2m.methods.activesPrices().call().then(value => {

            let data = [];

            console.log(value);
            let balance = value[0][0]['balance'];
            data.push({name: 'USDC', value: balance, status: 'UP'});

            commit('setCurrentTotalData', data)
        })



    }


};

const mutations = {

    setCurrentTotalData(state, currentTotalData) {
        state.currentTotalData = currentTotalData;
    },

    setContracts(state, contracts) {
        state.contracts = contracts;
    },

    setAccount(state, account) {
        state.account = account;
    },

    setWeb3(state, web3) {
        state.web3 = web3;
    },

    setBalance(state, balance) {
        state.balance= balance;
    },

    setGasPrice(state, price) {
        state.gasPrice = price;
    },

};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
};
