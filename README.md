# OVNGT MVP

MVP of OVNGT interest bearing stablecoin



### Build Project

1. Install root packages via npm

`npm install`

3. Open folder vapp

`cd vapp`

3. Install packages via npm

`npm install`


### Run project


1. Starting Ganache:

`
ganache-cli -m "clutch captain shoe salt awake harvest setup primary inmate ugly among become" -i 999 -u 0xa0df350d2637096571F7A701CBc1C5fdE30dF76A --db ../ganache_local   -g 20 -e 1000
`

private key to add address 0xa0df350d2637096571F7A701CBc1C5fdE30dF76A  to Metamask:  0xb8c1b5c1d81f9475fdf2e334517d29f733bdfa40682207571b12fc1142cbf329

2. Staring Truffle

`truffle console `

`truffle(development) > migrate`


3. Run web 

Open folder vapp and run command:

`npm run serve`


4. Connect to your MetaMask wallet

### How to set up  MetaMask 

1. Install MetaMask 

https://metamask.io/


2. Set custom RPC

Name network: 127.0.0.1:8545
URL: http://127.0.0.1:8545
Chain ID: 1337

