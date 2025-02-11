import * as Web3 from '@solana/web3.js';
import pkgaxios from 'axios';
const { post } = pkgaxios;
import * as bip39 from "bip39";
import base58 from 'bs58';
import dotenv from 'dotenv';
import { Router } from 'express';
var solRouter = Router();
import { ok2, fail2 } from '../config/resformat.js';
import { solana } from '../config/wallet_info.js';
import ed25519HdKey from 'ed25519-hd-key';
dotenv.config();

const web3sol = new Web3.Connection(
    process.env.QUICKNODE_SOLANA,
    'confirmed'
);

solRouter.post('/createWallet', async function (req, res) {

    try {
        const mnemonic = req.body.passphrase;

        const seed = bip39.mnemonicToSeedSync(mnemonic, ""); // (mnemonic, password)
        // const sol = Web3.Keypair.fromSeed(seed.slice(0, 32));

        var derivedPath = "m/44'/501'/0'/0'";
        const derivedSeed = ed25519HdKey.derivePath(derivedPath, seed.toString('hex')).key;
        const keypair = Web3.Keypair.fromSeed(derivedSeed);

        const walletAddr = keypair.publicKey;
        const secretKey = keypair.secretKey;

        const wallet = [
            {
                address: walletAddr,
                address_url: solana("address/" + walletAddr.toString()).explorer,
                privateKey: Buffer.from(secretKey).toString('hex'),
                mnemonic: mnemonic.split(" "),
            }
        ];

        ok2(req.headers.authorization, "createWallet", 'SUCCESSFUL', solana().symbol, solana().name, wallet, res);

    } catch (e) {
        fail2(req.headers.authorization, "createWallet", 'UNSUCCESSFUL', solana().symbol, solana().name, e.message, res);

    }
});

solRouter.post('/createPassphrase', async function (req, res) {

    try {
        const mnemonic = bip39.generateMnemonic();

        const seed = bip39.mnemonicToSeedSync(mnemonic, ""); // (mnemonic, password)
        // const sol = Web3.Keypair.fromSeed(seed.slice(0, 32));

        var derivedPath = "m/44'/501'/0'/0'";
        const derivedSeed = ed25519HdKey.derivePath(derivedPath, seed.toString('hex')).key;
        const keypair = Web3.Keypair.fromSeed(derivedSeed);

        const walletAddr = keypair.publicKey;
        const secretKey = keypair.secretKey;

        const wallet = [
            {
                address: walletAddr,
                address_url: solana("address/" + walletAddr.toString()).explorer,
                privateKey: Buffer.from(secretKey).toString('hex'),
                mnemonic: mnemonic.split(" "),
            }
        ];

        ok2(req.headers.authorization, "createWallet", 'SUCCESSFUL', solana().symbol, solana().name, wallet, res);

    } catch (e) {
        fail2(req.headers.authorization, "createWallet", 'UNSUCCESSFUL', solana().symbol, solana().name, e.message, res);

    }
});

solRouter.post('/importWallet', async function (req, res) {

    try {
        const pass = req.body.passphrase;

        if (!bip39.validateMnemonic(pass)) {
            console.log("SOL importWallet: Invalid passphrase");
            return fail2(req.headers.authorization, "createWallet", 'UNSUCCESSFUL', solana().symbol, solana().name, "Invalid passphrase", res);

        } else {
            const seed = bip39.mnemonicToSeedSync(pass, ""); // (mnemonic, password)

            var derivedPath = "m/44'/501'/0'/0'";
            const derivedSeed = ed25519HdKey.derivePath(derivedPath, seed.toString('hex')).key;
            const keypair = Web3.Keypair.fromSeed(derivedSeed);

            const walletAddr = keypair.publicKey;
            const secretKey = keypair.secretKey;

            const wallet = [
                {
                    address: walletAddr,
                    address_url: solana("address/" + walletAddr.toString()).explorer,
                    privateKey: Buffer.from(secretKey).toString('hex')
                }
            ];

            ok2(req.headers.authorization, "createWallet", 'SUCCESSFUL', solana().symbol, solana().name, wallet, res);
        }

    } catch (e) {
        fail2(req.headers.authorization, "createWallet", 'UNSUCCESSFUL', solana().symbol, solana().name, e.message, res);

    }
});


solRouter.post('/getBalanceByAddress', async function (req, res, next) {
    try {
        const address = req.body.address;

        const validAddress = Web3.PublicKey.isOnCurve(address);

        if (!validAddress) {

            return fail2(req.headers.authorization, "getBalanceByAddress", 'UNSUCCESSFUL', solana().symbol, solana().name, "Invalid Address", res);

        } else {
            const balanceAddress = new Web3.PublicKey(address);
            const balance_value = await web3sol.getBalance(balanceAddress);
            const balance_value_full = balance_value / 1000000000;

            const wallet = [
                {
                    address: address,
                    address_url: solana("address/" + address).explorer,
                    balance: balance_value,
                    decimal: parseInt(solana().decimal),
                    symbol: solana().symbol,
                    full_balance: balance_value_full + " " + solana().symbol,
                    full_balance_float: parseFloat(balance_value_full)
                }
            ];
            ok2(req.headers.authorization, "getBalanceByAddress", 'SUCCESSFUL', solana().symbol, solana().name, wallet, res);
        }

    } catch (e) {
        fail2(req.headers.authorization, "getBalanceByAddress", 'UNSUCCESSFUL', solana().symbol, solana().name, e.message, res);

    }
});

function timeConverter(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp * 1000);
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

solRouter.post('/getTransactionByTxHash', async function (req, res, next) {

    try {
        const sig = req.body.signature;
        const data = await web3sol.getTransaction(sig, 'confirmed');

        // data.transaction.message.instructions.forEach((element) => {
        // console.log(element.data);
        // console.log(element.data.length);
        // if (element.data.length == 16) {
        // console.log(data.transaction.message.instructions);
        if (data.transaction.message.instructions.length == 2) {
            const receiver = data.transaction.message.accountKeys[1];
            const sender = data.transaction.message.accountKeys[0];

            //memo
            // console.log(data.transaction.message.instructions[1]);
            const memo = Buffer.from(base58.decode(data.transaction.message.instructions[1].data));
            const message = atob(memo.toString('base64'));
            //amount
            // const buf = Buffer.from(base58.decode(data.transaction.message.instructions[0].data));
            // const amount = buf.readUInt32LE(4);
            const amount = data.meta.preBalances[0] - data.meta.postBalances[0];

            const amount_value_full = amount / 1000000000

            const full_gas = data.meta.fee / 1000000000;

            var wallet = [
                {
                    timestamp: data.blockTime,
                    timestamp_text: timeConverter(data.blockTime),
                    tx: sig,
                    full_url_tx: solana(sig).tx_explorer,
                    block: data.slot,
                    block_confirmation: "finalized",
                    amount: parseInt(amount),
                    decimal: parseInt(solana().decimal),
                    full_amount: amount_value_full + " " + solana().symbol,
                    full_amount_float: parseFloat(amount_value_full),
                    gas: parseInt(data.meta.fee),
                    full_gas: full_gas + " " + solana().symbol,
                    full_gas_float: parseFloat(full_gas),
                    sender: sender.toString(),
                    receiver: receiver.toString(),
                    message: message,
                }
            ];

            ok2(req.headers.authorization, "getTransactionByTxHash", 'SUCCESSFUL', solana("").symbol, solana().name, wallet, res);
        } else if (data.transaction.message.instructions.length == 1) {
            const receiver = data.transaction.message.accountKeys[1];
            const sender = data.transaction.message.accountKeys[0];

            //memo
            // console.log(data.transaction.message.instructions[1]);
            // const memo = Buffer.from(base58.decode(data.transaction.message.instructions[1].data));
            // const message = atob(memo.toString('base64'));
            //amount
            // const buf = Buffer.from(base58.decode(data.transaction.message.instructions[0].data));
            // const amount = buf.readUInt32LE(4);
            const amount = data.meta.preBalances[0] - data.meta.postBalances[0];

            const amount_value_full = amount / 1000000000

            const full_gas = data.meta.fee / 1000000000;

            var wallet = [
                {
                    timestamp: data.blockTime,
                    timestamp_text: timeConverter(data.blockTime),
                    tx: sig,
                    full_url_tx: solana(sig).tx_explorer,
                    block: data.slot,
                    block_confirmation: "finalized",
                    amount: parseInt(amount),
                    decimal: parseInt(solana().decimal),
                    full_amount: amount_value_full + " " + solana().symbol,
                    full_amount_float: parseFloat(amount_value_full),
                    gas: parseInt(data.meta.fee),
                    full_gas: full_gas + " " + solana().symbol,
                    full_gas_float: parseFloat(full_gas),
                    sender: sender.toString(),
                    receiver: receiver.toString(),
                    // message: message,
                }
            ];

            ok2(req.headers.authorization, "getTransactionByTxHash", 'SUCCESSFUL', solana("").symbol, solana().name, wallet, res);
        } else {
            return fail2(req.headers.authorization, "getTransactionByTxHash", 'UNSUCCESSFUL', solana().symbol, solana().name, "Unreadable", res);
        }
        // }
        // });

    } catch (e) {
        fail2(req.headers.authorization, "getTransactionByTxHash", 'UNSUCCESSFUL', solana().symbol, solana().name, e.message, res);
    }
});

solRouter.post('/getTransactionByAddress', async function (req, res, next) {

    try {
        const address = req.body.address;
        const limits = req.body.limit || undefined;

        const tx = await web3sol.getSignaturesForAddress(new Web3.PublicKey(address));

        const fruits = [];

        if ((limits == undefined || null) || (limits > tx.length)) {
            for (var i = 0; i < tx.length; i++) {

                const sig = await web3sol.getTransaction(tx[i].signature, 'confirmed');

                // console.log(tx[i].signature);

                console.log(sig.transaction.message.instructions.length);

                if (sig.transaction.message.instructions.length == 2) {
                    //memo
                    const memo = Buffer.from(base58.decode(sig.transaction.message.instructions[1].data));

                    // console.log(memo.toString());

                    const message = atob(memo.toString('base64'));

                    // varMemo == message

                    const receiver = sig.transaction.message.accountKeys[1];
                    const sender = sig.transaction.message.accountKeys[0];

                    // const buf = Buffer.from(base58.decode(sig.transaction.message.instructions[0].data));
                    // console.log(base58.decode(sig.transaction.message.instructions[0].data));
                    // const amount = buf.readUInt32LE(4);
                    const amount = sig.meta.preBalances[0] - sig.meta.postBalances[0] - sig.meta.fee;
                    const amount_value_full = amount / 1000000000;

                    const gas = sig.meta.fee;
                    const gas_value_full = gas / 1000000000;

                    const block = await web3sol.getBlockHeight(sig.slot);

                    fruits.push({
                        type: senderReceiver(sender.toString(), address),
                        timestamp: parseInt(tx[i].blockTime),
                        timestamp_text: timeConverter(parseInt(tx[i].blockTime)),
                        tx: tx[i].signature,
                        full_url_tx: solana(tx[i].signature).tx_explorer,
                        block: parseInt(block),
                        amount: parseInt(amount),
                        decimal: parseInt(solana().decimal),
                        full_amount: amount_value_full + " " + solana().symbol,
                        full_amount_float: parseFloat(amount_value_full),
                        gas: parseInt(gas),
                        full_gas: gas_value_full + " " + solana().symbol,
                        full_gas_float: parseFloat(gas_value_full),
                        sender: sender.toString(),
                        receiver: receiver.toString(),
                        message: message
                    });

                } else if (sig.transaction.message.instructions.length == 1) {
                    //memo
                    // const memo = Buffer.from(base58.decode(sig.transaction.message.instructions[1].data));

                    // console.log(memo.toString());

                    // const message = atob(memo.toString('base64'));

                    // varMemo == message

                    const receiver = sig.transaction.message.accountKeys[1];
                    const sender = sig.transaction.message.accountKeys[0];

                    // const buf = Buffer.from(base58.decode(sig.transaction.message.instructions[0].data));
                    // console.log(buf);
                    // const amount = buf.readUInt32LE(4);
                    const amount = sig.meta.preBalances[0] - sig.meta.postBalances[0] - sig.meta.fee;
                    const amount_value_full = amount / 1000000000

                    const gas = sig.meta.fee;
                    const gas_value_full = gas / 1000000000;

                    const block = await web3sol.getBlockHeight(sig.slot);

                    fruits.push({
                        type: senderReceiver(sender.toString(), address),
                        timestamp: parseInt(tx[i].blockTime),
                        timestamp_text: timeConverter(parseInt(tx[i].blockTime)),
                        tx: tx[i].signature,
                        full_url_tx: solana(tx[i].signature).tx_explorer,
                        block: parseInt(block),
                        amount: parseInt(amount),
                        decimal: parseInt(solana().decimal),
                        full_amount: amount_value_full + " " + solana().symbol,
                        full_amount_float: parseFloat(amount_value_full),
                        gas: parseInt(gas),
                        full_gas: gas_value_full + " " + solana().symbol,
                        full_gas_float: parseFloat(gas_value_full),
                        sender: sender.toString(),
                        receiver: receiver.toString(),
                        // message: message
                    });

                } else {
                    // return fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', solana().symbol, solana().name, "No transaction", res);
                    //memo
                    // const memo = Buffer.from(base58.decode(sig.transaction.message.instructions[1].data));

                    // console.log(memo.toString());

                    // const message = atob(memo.toString('base64'));

                    // varMemo == message

                    const receiver = sig.transaction.message.accountKeys[1];
                    const sender = sig.transaction.message.accountKeys[0];

                    // const buf = Buffer.from(base58.decode(sig.transaction.message.instructions[0].data));
                    // console.log(base58.decode(sig.transaction.message.instructions[0].data));
                    // const amount = buf.readUInt32LE(4);
                    const amount = sig.meta.preBalances[0] - sig.meta.postBalances[0] - sig.meta.fee;
                    const amount_value_full = amount / 1000000000;

                    const gas = sig.meta.fee;
                    const gas_value_full = gas / 1000000000;

                    const block = await web3sol.getBlockHeight(sig.slot);

                    fruits.push({
                        type: senderReceiver(sender.toString(), address),
                        timestamp: parseInt(tx[i].blockTime),
                        timestamp_text: timeConverter(parseInt(tx[i].blockTime)),
                        tx: tx[i].signature,
                        full_url_tx: solana(tx[i].signature).tx_explorer,
                        block: parseInt(block),
                        amount: parseInt(amount),
                        decimal: parseInt(solana().decimal),
                        full_amount: amount_value_full + " " + solana().symbol,
                        full_amount_float: parseFloat(amount_value_full),
                        gas: parseInt(gas),
                        full_gas: gas_value_full + " " + solana().symbol,
                        full_gas_float: parseFloat(gas_value_full),
                        // sender: sender.toString(),
                        // receiver: receiver.toString(),
                        // message: message
                    });

                }

            }
        } else {
            // if (limits  tx.length) {
            //     const trxLength = {
            //         transactionCount: tx.length,
            //         message: "Limit not tallied"
            //     }
            //     return fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', solana().symbol, solana().name, trxLength, res);
            // } else {
            for (var i = 0; i < limits; i++) {

                const sig = await web3sol.getTransaction(tx[i].signature);

                // console.log(sig.transaction.message.instructions.length);

                if (sig.transaction.message.instructions.length == 2) {
                    //memo
                    const memo = Buffer.from(base58.decode(sig.transaction.message.instructions[1].data));

                    // console.log(memo.toString());

                    const message = atob(memo.toString('base64'));

                    // varMemo == message

                    const receiver = sig.transaction.message.accountKeys[1];
                    const sender = sig.transaction.message.accountKeys[0];

                    // const buf = Buffer.from(base58.decode(sig.transaction.message.instructions[0].data));
                    // console.log(base58.decode(sig.transaction.message.instructions[0].data));
                    // const amount = buf.readUInt32LE(4);
                    const amount = sig.meta.preBalances[0] - sig.meta.postBalances[0];
                    const amount_value_full = amount / 1000000000;

                    const gas = sig.meta.fee;
                    const gas_value_full = gas / 1000000000;

                    const block = await web3sol.getBlockHeight(sig.slot);

                    fruits.push({
                        type: senderReceiver(sender.toString(), address),
                        timestamp: parseInt(tx[i].blockTime),
                        timestamp_text: timeConverter(parseInt(tx[i].blockTime)),
                        tx: tx[i].signature,
                        full_url_tx: solana(tx[i].signature).tx_explorer,
                        block: parseInt(block),
                        amount: parseInt(amount),
                        decimal: parseInt(solana().decimal),
                        full_amount: amount_value_full + " " + solana().symbol,
                        full_amount_float: parseFloat(amount_value_full),
                        gas: parseInt(gas),
                        full_gas: gas_value_full + " " + solana().symbol,
                        full_gas_float: parseFloat(gas_value_full),
                        sender: sender.toString(),
                        receiver: receiver.toString(),
                        message: message
                    });

                } else if (sig.transaction.message.instructions.length == 1) {
                    //memo
                    // const memo = Buffer.from(base58.decode(sig.transaction.message.instructions[1].data));

                    // console.log(memo.toString());

                    // const message = atob(memo.toString('base64'));

                    // varMemo == message

                    const receiver = sig.transaction.message.accountKeys[1];
                    const sender = sig.transaction.message.accountKeys[0];

                    // const buf = Buffer.from(base58.decode(sig.transaction.message.instructions[0].data));
                    // console.log(buf);
                    // const amount = buf.readUInt32LE(4);
                    const amount = sig.meta.preBalances[0] - sig.meta.postBalances[0];
                    const amount_value_full = amount / 1000000000

                    const gas = sig.meta.fee;
                    const gas_value_full = gas / 1000000000;

                    const block = await web3sol.getBlockHeight(sig.slot);

                    fruits.push({
                        type: senderReceiver(sender.toString(), address),
                        timestamp: parseInt(tx[i].blockTime),
                        timestamp_text: timeConverter(parseInt(tx[i].blockTime)),
                        tx: tx[i].signature,
                        full_url_tx: solana(tx[i].signature).tx_explorer,
                        block: parseInt(block),
                        amount: parseInt(amount),
                        decimal: parseInt(solana().decimal),
                        full_amount: amount_value_full + " " + solana().symbol,
                        full_amount_float: parseFloat(amount_value_full),
                        gas: parseInt(gas),
                        full_gas: gas_value_full + " " + solana().symbol,
                        full_gas_float: parseFloat(gas_value_full),
                        sender: sender.toString(),
                        receiver: receiver.toString(),
                        // message: message
                    });

                } else {
                    // return fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', solana().symbol, solana().name, "No transaction", res);
                    //memo
                    // const memo = Buffer.from(base58.decode(sig.transaction.message.instructions[1].data));

                    // console.log(memo.toString());

                    // const message = atob(memo.toString('base64'));

                    // varMemo == message

                    const receiver = sig.transaction.message.accountKeys[1];
                    const sender = sig.transaction.message.accountKeys[0];

                    // const buf = Buffer.from(base58.decode(sig.transaction.message.instructions[0].data));
                    // console.log(base58.decode(sig.transaction.message.instructions[0].data));
                    // const amount = buf.readUInt32LE(4);
                    const amount = sig.meta.preBalances[0] - sig.meta.postBalances[0] - sig.meta.fee;
                    const amount_value_full = amount / 1000000000;

                    const gas = sig.meta.fee;
                    const gas_value_full = gas / 1000000000;

                    const block = await web3sol.getBlockHeight(sig.slot);

                    fruits.push({
                        type: senderReceiver(sender.toString(), address),
                        timestamp: parseInt(tx[i].blockTime),
                        timestamp_text: timeConverter(parseInt(tx[i].blockTime)),
                        tx: tx[i].signature,
                        full_url_tx: solana(tx[i].signature).tx_explorer,
                        block: parseInt(block),
                        amount: parseInt(amount),
                        decimal: parseInt(solana().decimal),
                        full_amount: amount_value_full + " " + solana().symbol,
                        full_amount_float: parseFloat(amount_value_full),
                        gas: parseInt(gas),
                        full_gas: gas_value_full + " " + solana().symbol,
                        full_gas_float: parseFloat(gas_value_full),
                        // sender: sender.toString(),
                        // receiver: receiver.toString(),
                        // message: message
                    });
                }
            }
            // }
        }

        var wallet = [
            {
                address: address,
                address_url: solana(address).explorer,
                transactions: fruits
            }
        ];

        ok2(req.headers.authorization, "getTransactionByAddress", 'SUCCESSFUL', solana().symbol, solana().name, wallet, res);
    } catch (e) {
        fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', solana().symbol, solana().name, e.message, res);
    }

});

solRouter.get('/gasEstimate', async function (req, res, next) {

    try {
        const json_sol = { "jsonrpc": "2.0", "id": 1, "method": "getFees" };

        const sol_gas = await post(process.env.QUICKNODE_SOLANA, json_sol, {
        }).catch((e) => {
            return fail2(req.headers.authorization, "gasEstimate", 'UNSUCCESSFUL', solana().symbol, solana().name, e.message, res);
        });

        console.log(sol_gas.data.result.value.feeCalculator.lamportsPerSignature);

        var wallet = [
            {
                gasPrices: {
                    fastestFee: {
                        inLamports: sol_gas.data.result.value.feeCalculator.lamportsPerSignature,
                        inSOL: sol_gas.data.result.value.feeCalculator.lamportsPerSignature / Web3.LAMPORTS_PER_SOL,
                    }
                }
            }
        ];

        ok2(req.headers.authorization, "gasEstimate", 'SUCCESSFUL', solana().symbol, solana().name, wallet, res);

    } catch (e) {
        fail2(req.headers.authorization, "gasEstimate", 'UNSUCCESSFUL', solana().symbol, solana().name, e.message, res);
    }
});

function zeroCount(num) {
    var str = num.toFixed(100);
    var fraction = str.split('.')[1];
    var zeros = fraction.match(/^0*/)[0].length;
    return zeros;
}

solRouter.post('/sendTransaction', async function (req, res, next) {

    try {
        const from = req.body.sender;
        const to = req.body.receiver;
        const value = req.body.value;
        const secret = req.body.secretKey;
        const message = req.body.message;

        const balanceAddress = new Web3.PublicKey(from);
        const balance_value = await web3sol.getBalance(balanceAddress);
        const balance_value_full = balance_value / 1000000000;
        const key = Uint8Array.from(Buffer.from(secret, 'hex'));

        let accountFromSeed = Web3.Keypair.fromSecretKey(key);

        if (value < balance_value_full) {
            if (zeroCount(value) <= 3) {
                console.log("Adding program to transaction param...");
                // Add transfer instruction to transaction
                var transaction = new Web3.Transaction().add(
                    Web3.SystemProgram.transfer({
                        fromPubkey: new Web3.PublicKey(from),
                        toPubkey: new Web3.PublicKey(to),
                        lamports: parseInt(Web3.LAMPORTS_PER_SOL * value)
                    }),
                    new Web3.TransactionInstruction({
                        keys: [{
                            pubkey: new Web3.PublicKey(from),
                            isSigner: true,
                            isWritable: true
                        }],
                        programId: new Web3.PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
                        data: Buffer.from(message),
                    })
                );

                console.log("Signing and send transaction...");
                // Sign transaction, broadcast, and confirm
                await Web3.sendAndConfirmTransaction(
                    web3sol,
                    transaction,
                    [accountFromSeed],
                ).then(async (signature) => {

                    // const sig = await web3sol.getTransaction(signature);
                    // const index = sig.transaction.message.instructions[0].data;
                    // const receiver = sig.transaction.message.accountKeys[1];
                    // const sender = sig.transaction.message.accountKeys[0];

                    // const buf = Buffer.from(base58.decode(index));
                    // const amount = buf.readInt32LE(4);
                    // const amount_value_full = amount / 1000000000

                    // const gas = sig.meta.fee;
                    // const gas_value_full = gas / 1000000000;

                    var wallet = [
                        {
                            tx: signature,
                            full_url_tx: solana(signature).tx_explorer,
                            amount: parseFloat(value),
                            decimal: solana().decimal,
                            full_amount: value + " " + solana().symbol,
                            amount_float: parseFloat(value),
                            sender: from,
                            receiver: to,
                            message: message
                        }
                    ];

                    ok2(req.headers.authorization, "sendTransaction", 'SUCCESSFUL', solana().symbol, solana().name, wallet, res);
                });
            } else {
                console.log("SOLANA sendTransaction: Invalid value transaction threshold");
                return fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', solana().symbol, solana().name, "Invalid value transaction threshold", res);
            }
        } else {
            console.log("SOLANA sendTransaction: Insufficient balance");
            return fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', solana().symbol, solana().name, "Insufficient balance", res);
        }
    } catch (e) {
        console.log("SOLANA sendTransaction: ", e.message);
        fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', solana().symbol, solana().name, e.message, res);

    }
});

export default solRouter;
