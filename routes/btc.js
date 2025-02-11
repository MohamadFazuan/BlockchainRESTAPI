
import pkgaxios from 'axios';
const { get, post } = pkgaxios;
import { Router } from 'express';
var btcRouter = Router();
import dotenv from 'dotenv';
dotenv.config()
import { ok2, fail2 } from '../config/resformat.js';
import { bitcoin } from '../config/wallet_info.js';
import bitcore from 'bitcore-lib';
import { validate } from 'bitcoin-address-validation';
import bitcoinjs from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';
import sb from 'satoshi-bitcoin';
import bip39 from 'bip39';
import { BIP32Factory } from 'bip32';

const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);

btcRouter.post('/createSegwitWallet', function (req, res) {

    try {
        const mnemonic = req.body.passphrase;

        var value = Buffer.from(mnemonic.replace(/-/g, ' '));
        var hash = bitcore.crypto.Hash.sha256(value);
        var bn = bitcore.crypto.BN.fromBuffer(hash);
        var bitcoinPb = new bitcore.PrivateKey(bn, bitcore.Networks.mainnet).toAddress().toString();
        var bitcoinPk = new bitcore.PrivateKey(bn, bitcore.Networks.mainnet).toWIF();

        const network_bitcoin = bitcoinjs.networks.bitcoin;
        const path_btc = `m/84'/0'/0'/0`;
        const seed = bip39.mnemonicToSeedSync(mnemonic);
        let root = bip32.fromSeed(seed, network_bitcoin);
        let newAccount_bitcoin = root.derivePath(path_btc);
        let node = newAccount_bitcoin.derive(0);
        let btcAddress = bitcoinjs.payments.p2wpkh({
            pubkey: node.publicKey,
            network: network_bitcoin,
        }).address;

        var wallet = [
            {
                segwit_address: btcAddress,
                segwit_address_url: bitcoin("address/" + btcAddress).explorer,
                segwit_privateKey: node.toWIF(),
                legacy_address: bitcoinPb,
                legacy_address_url: bitcoin("address/" + bitcoinPb).explorer,
                legacy_privateKey: bitcoinPk,
                mnemonic: mnemonic.split(" "),
            }
        ]

        // var wallet = [
        //     {
        //         address: btcAddress,
        //         address_url: bitcoin("address/" + btcAddress).explorer,
        //         privateKey: node.toWIF(),
        //         mnemonic: mnemonic.split(" "),
        //     }
        // ]

        ok2(req.headers.authorization, "createWallet", 'SUCCESSFUL', bitcoin().symbol, bitcoin().name, wallet, res);

    } catch (e) {
        fail2(req.headers.authorization, "createWallet", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);

    }
});

btcRouter.post('/createWallet', function (req, res) {

    try {
        const mnemonic = req.body.passphrase;

        var value = Buffer.from(mnemonic.replace(/-/g, ' '));
        var hash = bitcore.crypto.Hash.sha256(value);
        var bn = bitcore.crypto.BN.fromBuffer(hash);
        var bitcoinPb = new bitcore.PrivateKey(bn, bitcore.Networks.mainnet).toAddress().toString();
        var bitcoinPk = new bitcore.PrivateKey(bn, bitcore.Networks.mainnet).toWIF();

        // const network_bitcoin = bitcoinjs.networks.bitcoin;
        // const path_btc = `m/84'/0'/0'/0`;
        // const seed = bip39.mnemonicToSeedSync(mnemonic).slice(0, 32);
        // let root = bip32.fromSeed(seed, network_bitcoin);
        // let newAccount_bitcoin = root.derivePath(path_btc);
        // let node = newAccount_bitcoin.derive(0).derive(0);
        // let btcAddress = bitcoinjs.payments.p2wpkh({
        //     pubkey: node.publicKey,
        //     network: network_bitcoin,
        // }).address;
        // console.log(btcAddress);

        // var wallet = [
        //     {
        //         segwit_address: btcAddress,
        //         segwit_address_url: bitcoin("address/" + btcAddress).explorer,
        //         segwit_privateKey: node.toWIF(),
        //         legacy_address: bitcoinPb,
        //         legacy_address_url: bitcoin("address/" + bitcoinPb).explorer,
        //         legacy_privateKey: bitcoinPk,
        //         mnemonic: mnemonic.split(" "),
        //     }
        // ]

        var wallet = [
            {
                address: bitcoinPb,
                address_url: bitcoin("address/" + bitcoinPb).explorer,
                privateKey: bitcoinPk,
                mnemonic: mnemonic.split(" "),
            }
        ]

        ok2(req.headers.authorization, "createWallet", 'SUCCESSFUL', bitcoin().symbol, bitcoin().name, wallet, res);

    } catch (e) {
        fail2(req.headers.authorization, "createWallet", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);

    }
});

btcRouter.post('/importSegwitWallet', function (req, res) {

    try {
        var pass = req.body.passphrase;

        if (!bip39.validateMnemonic(pass)) {
            console.log("BTC importSegwitWallet: Invalid passphrase");
            return fail2(req.headers.authorization, "importSegwitWallet", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, "Invalid passphrase", res);

        } else {
            var value = Buffer.from(pass.replace(/-/g, ' '));
            var hash = bitcore.crypto.Hash.sha256(value);
            var bn = bitcore.crypto.BN.fromBuffer(hash);
            var bitcoinPb = new bitcore.PrivateKey(bn, bitcore.Networks.mainnet).toAddress().toString();
            var bitcoinPk = new bitcore.PrivateKey(bn, bitcore.Networks.mainnet).toWIF();

            const network_bitcoin = bitcoinjs.networks.bitcoin;
            const path_btc = `m/84'/0'/0'/0`;
            const seed = bip39.mnemonicToSeedSync(pass);
            let root = bip32.fromSeed(seed, network_bitcoin);
            let newAccount_bitcoin = root.derivePath(path_btc);
            let node = newAccount_bitcoin.derive(0);
            let btcAddress = bitcoinjs.payments.p2wpkh({
                pubkey: node.publicKey,
                network: network_bitcoin,
            }).address;

            var wallet = [
                {
                    segwit_address: btcAddress,
                    segwit_address_url: bitcoin("address/" + btcAddress).explorer,
                    segwit_privateKey: node.toWIF(),
                    legacy_address: bitcoinPb,
                    legacy_address_url: bitcoin("address/" + bitcoinPb).explorer,
                    legacy_privateKey: bitcoinPk,
                }
            ]

            // var wallet = [
            //     {
            //         address: bitcoinPb,
            //         address_url: bitcoin("address/" + bitcoinPb).explorer,
            //         privateKey: bitcoinPk,
            //     }
            // ]

            ok2(req.headers.authorization, "importSegwitWallet", 'SUCCESSFUL', bitcoin().symbol, bitcoin().name, wallet, res);
        }

    } catch (e) {
        fail2(req.headers.authorization, "importSegwitWallet", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);

    }
});

btcRouter.post('/importWallet', function (req, res) {

    try {
        var pass = req.body.passphrase;

        if (!bip39.validateMnemonic(pass)) {
            console.log("BTC importWallet: Invalid passphrase");
            return fail2(req.headers.authorization, "importWallet", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, "Invalid passphrase", res);

        } else {
            var value = Buffer.from(pass.replace(/-/g, ' '));
            var hash = bitcore.crypto.Hash.sha256(value);
            var bn = bitcore.crypto.BN.fromBuffer(hash);
            var bitcoinPb = new bitcore.PrivateKey(bn, bitcore.Networks.mainnet).toAddress().toString();
            var bitcoinPk = new bitcore.PrivateKey(bn, bitcore.Networks.mainnet).toWIF();

            // const network_bitcoin = bitcoinjs.networks.bitcoin;
            // const path_btc = `m/84'/0'/0'/0`;
            // const seed = bip39.mnemonicToSeedSync(pass).slice(0, 32);
            // let root = bip32.fromSeed(seed, network_bitcoin);
            // let newAccount_bitcoin = root.derivePath(path_btc);
            // let node = newAccount_bitcoin.derive(0).derive(0);
            // let btcAddress = bitcoinjs.payments.p2wpkh({
            //     pubkey: node.publicKey,
            //     network: network_bitcoin,
            // }).address;

            // var wallet = [
            //     {
            //         segwit_address: btcAddress,
            //         segwit_address_url: bitcoin("address/" + btcAddress).explorer,
            //         segwit_privateKey: node.toWIF(),
            //         legacy_address: bitcoinPb,
            //         legacy_address_url: bitcoin("address/" + bitcoinPb).explorer,
            //         legacy_privateKey: bitcoinPk,
            //     }
            // ]

            var wallet = [
                {
                    address: bitcoinPb,
                    address_url: bitcoin("address/" + bitcoinPb).explorer,
                    privateKey: bitcoinPk,
                }
            ]

            ok2(req.headers.authorization, "importWallet", 'SUCCESSFUL', bitcoin().symbol, bitcoin().name, wallet, res);
        }

    } catch (e) {
        fail2(req.headers.authorization, "importWallet", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);

    }
});

btcRouter.post('/getBalanceByAddress', async function (req, res) {
    try {

        const address = req.body.address;

        const validAddress = validate(address);

        if (!validAddress || null || undefined) {
            return fail2(req.headers.authorization, "getBalanceByAddress", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, "Invalid Address", res);
        } else {
            // const url = `https://api.bitcore.io/api/${bitcoin().symbol}/mainnet/address/${address}/balance`;
            // const balance = await get(url);

            const data = { "id": 1, "method": "qn_addressBalance", "params": [address] };
            const balance = await post(process.env.QUICKNODE_BITCOIN, data, {
            }).catch((e) => {
                return fail2(req.headers.authorization, "getBalanceByAddress", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);
            });

            // const url = process.env.BLOCKDAEMON_UNI_BITCOIN + `account/${address}`;
            // const balance = await get(url, {
            //     headers: {
            //         "authorization": "Bearer " + process.env.BLOCKDAEMON_UNI_KEY
            //     }
            // }).catch((e) => {
            //     return fail2(req.headers.authorization, "getBalanceByAddress", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);
            // });

            let bal = 0;

            balance.data.forEach((val) => {
                console.log(val.value);
                bal += val.value;
            });

            const balFloat = bal / 100000000;
            // const balConfirmed = (balance.data.confirmed) / 100000000
            // const balUnconfirmed = (balance.data.unconfirmed) / 100000000

            var wallet = [
                {
                    address: address,
                    address_url: bitcoin("address/" + address).explorer,
                    balance: parseInt(bal),
                    decimal: parseInt(bitcoin(address).decimal),
                    symbol: bitcoin().symbol,
                    full_balance: balFloat.toFixed(8) + " " + bitcoin().symbol,
                    full_balance_float: parseFloat(balFloat),
                    full_confirmed: parseFloat(balFloat),
                    // full_unconfirmed: parseFloat(balUnconfirmed)
                }
            ];

            ok2(req.headers.authorization, "getBalanceByAddress", 'SUCCESSFUL', bitcoin().symbol, bitcoin().name, wallet, res);
        }
    } catch (e) {
        fail2(req.headers.authorization, "getBalanceByAddress", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);

    }
});

function timeConverter(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp);

    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = a.getMonth() + 1;
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = year + '-' + month + '-' + date + ' ' + hour + ':' + min + ':' + sec;
    return time;
}

function senderReceiver(addrOne, address) {

    var type;

    if (addrOne === address) {
        type = "Send";
        return type;
    } else {
        type = "Receive";
        return type;
    }
}

function blockConfirmationStatus(block) {
    if (block == 0) {
        return "pending"
    } else if (block >= 1) {
        return "confirmed"
    }
}

// async function fetchMongo(data) {
//     //message
//     const docs = await Model.find({ hash: data, coin: bitcoin().name }).exec();

//     // MongoDB may return the docs in any order unless you explicitly sort
//     return docs.map((doc) => doc.message);
// }


btcRouter.post('/getTransactionByAddress', async function (req, res) {

    try {
        const address = req.body.address;

        const validAddress = validate(address);

        if (!validAddress) {

            return fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, "Invalid Address", res);

        } else {
            // transaction list
            // const url = `https://api.bitcore.io/api/${bitcoin().symbol}/mainnet/address/${address}/txs`;
            // const tx = await get(url).catch((e) => {
            //     fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);
            // });
            const url = process.env.BLOCKDAEMON_UNI_BITCOIN + `account/${address}/txs`;
            await get(url, {
                headers: {
                    "authorization": "Bearer " + process.env.BLOCKDAEMON_UNI_KEY
                }
            }).then(async (tx) => {

                const fruits = [];

                for (var i = 0; i < tx.data.data.length; i++) {

                    // get transaction time
                    // const urls = `https://api.bitcore.io/api/${bitcoin().symbol}/mainnet/tx/${tx.data.data[i].id}`;
                    // const txs = await get(urls).catch((e) => {
                    //     fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);
                    // });

                    // console.log(tx.data.data[i].id);
                    // const urls = process.env.BLOCKDAEMON_UNI_BITCOIN + `tx/${tx.data.data[i].id}`;
                    // await get(urls, {
                    //     headers: {
                    //         "authorization": "Bearer " + process.env.BLOCKDAEMON_UNI_KEY
                    //     }
                    // }).then(async (txs) => {

                    // console.log('kedua');
                    // console.log("");
                    // console.log(txs.data.date);
                    const time = new Date(tx.data.data[i].date * 1000).getTime();

                    // console.log(time);

                    let receiverArr = [];
                    let senderArr = [];
                    let amountArr = [];

                    tx.data.data[i].events.map((send) => {
                        if (send.source !== undefined) {
                            senderArr.push(send.source);
                        }
                    });

                    tx.data.data[i].events.map((receive) => {
                        if (receive.destination !== undefined) {
                            receiverArr.push(receive.destination);
                        }
                    });

                    // console.log(receiverArr);
                    // console.log(tx.data.data[i].events);


                    tx.data.data[i].events.map((amount) => {
                        if (amount.type === 'utxo_output') {
                            amountArr.push(amount.amount);
                        }
                    });

                    const gas = tx.data.data[i].events.map((gasUsed) => {
                        if (gasUsed.type === 'fee') {
                            return gasUsed.amount
                        }
                    });

                    const sender = senderArr[0].toString();
                    // console.log('sender ',sender);
                    const receiver = receiverArr[0].toString();
                    // console.log('receiver ',receiver);
                    const value = amountArr[0].toString();
                    // console.log(amount);

                    // type
                    const type = senderReceiver(sender, address);

                    const gas_value_full = gas[0] / 100000000;

                    fruits.push({
                        type: type,
                        timestamp: time / 1000,
                        timestamp_text: timeConverter(time),
                        chain: bitcoin().symbol,
                        sender: sender,
                        receiver: receiver,
                        amount: parseInt(value),
                        full_amount: value / 100000000 + " " + bitcoin().symbol,
                        gas: parseInt(gas),
                        gas_value_full: parseFloat(gas_value_full) + " " + bitcoin().symbol,
                        // coinbase: txs.data.coin,
                        // mintIndex: txs.data.id,
                        // spentTxid: tx.data[i].spentTxid,
                        mintTxid: tx.data.data[i].id,
                        // mintHeight: txs.data.height,
                        // spentHeight: tx.data[i].spentHeight,
                        // script: tx.data[i].script,
                        // balance: parseInt(tx.data[i].value) / 100000000,
                        // full_balance: (tx.data[i].value / 100000000) + " " + bitcoin().symbol,
                        decimal: parseInt(bitcoin().decimal),
                        confirmations: tx.data.data[i].confirmations,
                        confirmation_status: blockConfirmationStatus(tx.data.data[i].confirmations)
                        // message: (await fetchMongo(tx.data[i].mintTxid)).toString()
                    });

                    // }).catch((e) => {
                    //     return fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);
                    // });
                }

                var wallet = [
                    {
                        address: address,
                        address_url: bitcoin("address/" + address).explorer,
                        transactions: fruits
                    }
                ];

                ok2(req.headers.authorization, "getTransactionByAddress", 'SUCCESSFUL', bitcoin().symbol, bitcoin().name, wallet, res);
            }).catch((e) => {
                return fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);
            });
        }
    } catch (e) {
        fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);

    }
});

btcRouter.post('/getTransactionByTxHash', async function (req, res) {

    try {
        const txHash = req.body.txHash;

        // const url = `https://api.bitcore.io/api/${bitcoin().symbol}/mainnet/tx/${txHash}`;
        // const tx = await get(url).catch((e) => {
        //     fail2(req.headers.authorization, "getTransactionByTxHash", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);
        // });
        // console.log(tx.data);
        const url = process.env.BLOCKDAEMON_UNI_BITCOIN + `tx/${txHash}`;
        const tx = await get(url, {
            headers: {
                "authorization": "Bearer " + process.env.BLOCKDAEMON_UNI_KEY
            }
        }).catch((e) => {
            return fail2(req.headers.authorization, "getTransactionByTxHash", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);
        });

        // console.log(tx.data.events);

        const time = new Date(tx.data.date * 1000).getTime();
        // console.log(time);

        // const rawTxData = { "jsonrpc": "1.0", "id": "curltest", "method": "getrawtransaction", "params": [txHash, true] };

        // const txstx = await post(process.env.QUICKNODE_BITCOIN, rawTxData, {
        //     // headers: {
        //     //     "authorization": "Bearer " + process.env.BLOCKDAEMON_KEY
        //     // }
        // }).catch((e) => {
        //     fail2(req.headers.authorization, "gasEstimate", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);
        // });
        // console.log((txstx.data.result.vout[0].scriptPubKey.addresses).toString());

        let receiverArr = [];
        let senderArr = [];

        tx.data.events.map((send) => {
            if (send.source !== undefined) {
                senderArr.push(send.source);
            }
        });
        // console.log('sender', senderArr.length);

        tx.data.events.map((receive) => {
            if (receive.destination !== undefined && receive.destination !== senderArr.toString()) {
                receiverArr.push(receive.destination);
            }
        });
        // console.log('receiver', receiverArr.length);

        const sender = senderArr.toString();
        const receiver = receiverArr.toString();
        const amount = tx.data.events[2].amount;

        const gasArr = tx.data.events.map((gasUsed) => {
            return gasUsed.amount
        });
        const gas = gasArr[0];
        const gas_value_full = gasArr[0] / 100000000;

        // console.log((await fetchMongo(tx.data.txid)).toString());

        var wallet = [
            {
                timestamp: time / 1000,
                timestamp_text: timeConverter(time),
                tx: tx.data.txid,
                sender: sender,
                receiver: receiver,
                full_url_tx: bitcoin(tx.data.txid).tx_explorer,
                // block: tx.data.blockHeight,
                block_confirmation: tx.data.confirmations,
                confirmation_status: blockConfirmationStatus(tx.data.confirmations),
                amount: amount,
                decimal: parseInt(bitcoin().decimal),
                full_amount: (amount / 100000000) + " " + bitcoin().symbol,
                full_amount_float: parseFloat(amount / 100000000),
                gas: parseInt(gas),
                full_gas: (gas_value_full) + " " + bitcoin().symbol,
                full_gas_float: parseFloat(gas_value_full),
                // message: (await fetchMongo(tx.data.txid)).toString()
            }
        ];

        ok2(req.headers.authorization, "getTransactionByTxHash", 'SUCCESSFUL', bitcoin().symbol, bitcoin().name, wallet, res);
    } catch (e) {
        fail2(req.headers.authorization, "getTransactionByTxHash", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.meesage, res);
    }
});

btcRouter.post('/gasEstimate', async function (req, res) {

    try {
        // const privateKey = req.body.privKey;
        const sender = req.body.sender;
        const amount = req.body.amount;
        const receiver = req.body.receiver;
        // const fee = req.body.fee;
        // const message = req.body.message;

        const validSender = validate(sender);
        const validReceiver = validate(receiver);

        if (!(validSender && validReceiver) || undefined || null) {
            fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, "Invalid Address", res);

        } else {
            // const keypair = ECPair.fromWIF(
            //     privateKey,
            //     bitcoinjs.networks.bitcoin
            // );

            // const utxos = await get(
            //     `https://api.bitcore.io/api/BTC/mainnet/address/${sender}/?unspent=true`
            // ).catch((e) => {
            //     fail2(req.headers.authorization, "gasEstimate", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);
            // });

            const urls = process.env.BLOCKDAEMON_UNI_BITCOIN + `account/${sender}/utxo`;
            const utxo = await get(urls, {
                headers: {
                    "authorization": "Bearer " + process.env.BLOCKDAEMON_UNI_KEY
                }
            }).catch((e) => {
                return fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);
            });

            const utxos = [];

            utxo.data.data.forEach((is_spent) => {
                if (is_spent.is_spent === false) {
                    utxos.push(is_spent);
                }
            });

            // console.log(utxos.length);

            const tx = new bitcoinjs.Psbt(bitcoinjs.networks.bitcoin);

            let inputs = [];

            let totalValue = 0;

            for (let i = 0; i < utxos.length; i++) {

                // console.log(utxos[i]);

                const nonWitnessData = { "jsonrpc": "1.0", "id": "curltest", "method": "getrawtransaction", "params": [utxos[i].mined.tx_id, false] };

                const nonWitnessutxo = await post(process.env.QUICKNODE_BITCOIN, nonWitnessData, {
                    // headers: {
                    //     "authorization": "Bearer " + process.env.BLOCKDAEMON_KEY
                    // }
                }).catch((e) => {
                    return fail2(req.headers.authorization, "gasEstimate", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);
                });

                // console.log(JSON.stringify(nonWitnessutxo.data.result));

                inputs.push({
                    hash: utxos[i].mined.tx_id,
                    index: utxos[i].mined.index,
                    scriptPubKey: utxos[i].mined.meta.script,
                    nonWitnessUtxo: Buffer.from(nonWitnessutxo.data.result, 'hex'),
                })

                totalValue += utxos[i].value;
            }

            inputs.forEach(element => {
                tx.addInput(element);
            });

            tx.addOutput({
                address: receiver,
                value: sb.toSatoshi(amount)
            });

            // tx.addOutput({
            //     address: sender,
            //     value: 5000000000 - sb.toSatoshi(amount)
            // })

            const size = (tx.txInputs.length * 180) + (tx.txOutputs.length * 34) + 10;
            // console.log(`size :`,size);

            // tx.signAllInputs(keypair);
            // tx.finalizeAllInputs();

            const url = `https://bitcoinfees.earn.com/api/v1/fees/recommended`;
            const tx_gas = await get(url).catch((e) => {
                return fail2(req.headers.authorization, "gasEstimate", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);
            });
            var fastestFee = 19.4;
            var halfHourFee = 8.5;
            var hourFee = 1;

            // console.log(fastestFee.toString());

            // const nonWitnessData = { "jsonrpc": "1.0", "id": "curltest", "method": "decoderawtransaction", "params": [tx.extractTransaction().toHex()] };
            // const nonWitnessutxo = await post(process.env.QUICKNODE_BITCOIN, nonWitnessData, {
            //     // headers: {
            //     //     "authorization": "Bearer " + process.env.BLOCKDAEMON_KEY
            //     // }
            // }).catch((e) => {
            //     fail2(req.headers.authorization, "gasEstimate", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);
            // });

            var wallet = [
                {
                    fastestFee: {
                        inSatoshi: parseInt((fastestFee) * size),
                        inBTC: parseFloat((sb.toBitcoin(parseInt((fastestFee) * size))))
                    },
                    halfHourFee: {
                        inSatoshi: parseInt((halfHourFee) * size),
                        inBTC: parseFloat((sb.toBitcoin(parseInt((halfHourFee) * size))))
                    },
                    hourFee: {
                        inSatoshi: parseInt((hourFee) * size),
                        inBTC: parseFloat((sb.toBitcoin(parseInt((hourFee) * size))))
                    },
                    balance_for_tx: {
                        fastestFee: parseFloat((sb.toBitcoin(totalValue) - (sb.toBitcoin(parseInt((fastestFee) * size)))).toFixed(8)),
                        halfHourFee: parseFloat((sb.toBitcoin(totalValue) - (sb.toBitcoin(parseInt((halfHourFee) * size)))).toFixed(8)),
                        hourFee: parseFloat((sb.toBitcoin(totalValue) - (sb.toBitcoin(parseInt((hourFee) * size)))).toFixed(8))
                    },
                },

            ];

            ok2(req.headers.authorization, "gasEstimate", 'SUCCESSFUL', bitcoin().symbol, bitcoin().name, wallet, res);
        }
    } catch (e) {
        fail2(req.headers.authorization, "gasEstimate", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.meesage, res);
    }

});

async function getConfimationTransaction(sender) {
    console.log("Get past transaction confirmation");

    const urls = `https://api.bitcore.io/api/${bitcoin().symbol}/mainnet/address/${sender}/txs`;
    const txs = await get(urls).catch((e) => {
        return fail2(req.headers.authorization, "getConfimationTransaction", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);
    });

    const txHash = txs.data[0].mintTxid;

    const dataConfirm = { "jsonrpc": "1.0", "id": "curltest", "method": "gettxout", "params": [txHash, 0] };
    const confirm = await post(process.env.QUICKNODE_BITCOIN, dataConfirm, {
        // headers: {
        //     "authorization": "Bearer " + process.env.BLOCKDAEMON_KEY
        // }
    }).catch((e) => {
        return fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);
    });

    if (blockConfirmationStatus(confirm.data.result.confirmations) === "confirmed") {
        return true
    } else {
        return false
    }
}

btcRouter.post('/sendTransaction', async function (req, res) {

    try {
        const privateKey = req.body.privKey;
        const sender = req.body.sender;
        const amount = req.body.amount;
        const receiver = req.body.receiver;
        const fee = req.body.fee;
        // const message = req.body.message;

        if (await getConfimationTransaction(sender)) {
            if (fee > amount) {
                return fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, "Dust code. Increase your transfer amount", res);

            } else {
                const validSender = validate(sender);
                const validReceiver = validate(receiver);

                console.log("Validating address...");
                if (!(validSender && validReceiver) || undefined || null) {
                    return fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, "Invalid Address", res);

                } else {

                    console.log("Valid sender and receiver address...");

                    const keypair = ECPair.fromWIF(
                        privateKey,
                        bitcoinjs.networks.bitcoin
                    );

                    // const utxos = await get(
                    //     `https://api.bitcore.io/api/BTC/mainnet/address/${sender}/?unspent=true`
                    // ).catch((e) => {
                    //     fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);
                    // });

                    const urls = process.env.BLOCKDAEMON_UNI_BITCOIN + `account/${sender}/utxo`;
                    const utxo = await get(urls, {
                        headers: {
                            "authorization": "Bearer " + process.env.BLOCKDAEMON_UNI_KEY
                        }
                    }).catch((e) => {
                        return fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);
                    });

                    const utxos = [];

                    utxo.data.data.forEach((is_spent) => {
                        if (is_spent.is_spent === false) {
                            utxos.push(is_spent);
                        }
                    });

                    const tx = new bitcoinjs.Psbt(process.env.QUICKNODE_BITCOIN);

                    let inputs = [];

                    let totalValue = 0;

                    console.log("Creating input and output...");
                    console.log("Calculate utxos...");
                    for (let i = 0; i < utxos.length; i++) {

                        const nonWitnessData = { "jsonrpc": "1.0", "id": "curltest", "method": "getrawtransaction", "params": [utxos[i].mined.tx_id, false] };

                        const nonWitnessutxo = await post(process.env.QUICKNODE_BITCOIN, nonWitnessData, {
                            // headers: {
                            //     "authorization": "Bearer " + process.env.BLOCKDAEMON_KEY
                            // }
                        }).catch((e) => {
                            return fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);
                        });

                        // console.log(JSON.stringify(nonWitnessutxo.data.result));

                        inputs.push({
                            hash: utxos[i].mined.tx_id,
                            index: utxos[i].mined.index,
                            scriptPubKey: utxos[i].mined.meta.script,
                            nonWitnessUtxo: Buffer.from(nonWitnessutxo.data.result, 'hex'),
                        })

                        totalValue += utxos[i].value;
                    }

                    console.log(`totalValue`, totalValue - sb.toSatoshi(amount) - sb.toSatoshi(fee));
                    if ((totalValue - sb.toSatoshi(amount) - sb.toSatoshi(fee)) === 0) {
                        inputs.forEach(element => {
                            tx.addInput(element);
                        });

                        tx.addOutput({
                            address: receiver,
                            value: sb.toSatoshi(amount)
                        });

                        console.log("Signing all inputs and outputs...");
                        tx.signAllInputs(keypair);
                        console.log("Finalizing all inputs and outputs...");
                        tx.finalizeAllInputs();

                        console.log("Signed transaction :" + tx.extractTransaction().toHex());
                        console.log("Sending transaction...");
                        const signedTx = { "jsonrpc": "1.0", "id": "curltest", "method": "sendrawtransaction", "params": [tx.extractTransaction().toHex()] };
                        const send = await post(process.env.QUICKNODE_BITCOIN, signedTx, {
                            // headers: {
                            //     "authorization": "Bearer " + process.env.BLOCKDAEMON_KEY
                            // }
                        }).catch((e) => {
                            return fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);
                        });

                        console.log(`Result: ${send.data.result}`);

                        var wallet = [
                            {
                                txid: send.data.result,
                                chain: bitcoin(sender).symbol,
                                full_url_tx: bitcoin(send.data.result).tx_explorer,
                                value: amount,
                                sender: sender,
                                receiver: receiver,
                                amount_sent: amount + " " + bitcoin(sender).symbol,
                                // message: message
                            }
                        ];

                        ok2(req.headers.authorization, "sendTransaction", 'SUCCESSFUL', bitcoin().symbol, bitcoin().name, wallet, res);
                    } else if ((totalValue - sb.toSatoshi(amount) - sb.toSatoshi(fee)) < 0) {
                        return fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, "Not enough balance", res);
                    } else {
                        inputs.forEach(element => {
                            tx.addInput(element);
                        });

                        tx.addOutput({
                            address: receiver,
                            value: sb.toSatoshi(amount)
                        });

                        tx.addOutput({
                            address: sender,
                            value: totalValue - sb.toSatoshi(amount) - (sb.toSatoshi(fee))
                        })

                        console.log("Signing all inputs and outputs...");
                        tx.signAllInputs(keypair);
                        console.log("Finalizing all inputs and outputs...");
                        tx.finalizeAllInputs();

                        console.log("Signed transaction :" + tx.extractTransaction().toHex());
                        console.log("Sending transaction...");
                        const signedTx = { "jsonrpc": "1.0", "id": "curltest", "method": "sendrawtransaction", "params": [tx.extractTransaction().toHex()] };
                        const send = await post(process.env.QUICKNODE_BITCOIN, signedTx, {
                            // headers: {
                            //     "authorization": "Bearer " + process.env.BLOCKDAEMON_KEY
                            // }
                        }).catch((e) => {
                            return fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);
                        });

                        console.log(`Result: ${send.data.result}`);

                        var wallet = [
                            {
                                txid: send.data.result,
                                chain: bitcoin(sender).symbol,
                                full_url_tx: bitcoin(send.data.result).tx_explorer,
                                value: amount,
                                sender: sender,
                                receiver: receiver,
                                amount_sent: amount + " " + bitcoin(sender).symbol,
                                // message: message
                            }
                        ];
                        ok2(req.headers.authorization, "sendTransaction", 'SUCCESSFUL', bitcoin().symbol, bitcoin().name, wallet, res);
                    }
                }
            }
        } else {
            return fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, "Waiting for previous transaction to be confirmed to avoid double spending", res);
        }
    } catch (e) {
        fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, e.message, res);
    }
});

btcRouter.post('/sendRawTransaction', async function (req, res, next) {
    try {
        const serializedTx = req.body.serializedTx;

        const signedTx = { "jsonrpc": "1.0", "id": "curltest", "method": "sendrawtransaction", "params": [serializedTx] };
        const send = await post(process.env.BLOCKDAEMON, signedTx, {
            headers: {
                "authorization": "Bearer " + process.env.BLOCKDAEMON_KEY
            }
        });

        // res.json(send.data.result)

        var wallet = [
            {
                hash: send.data
            }
        ];

        ok2(req.headers.authorization, "sendRawTransaction", 'SUCCESSFUL', bitcoin().symbol, bitcoin().name, wallet, res);
    } catch (e) {
        fail2(req.headers.authorization, "sendRawTransaction", 'UNSUCCESSFUL', bitcoin().symbol, bitcoin().name, "Server Error", res);
    }

});

export default btcRouter;
