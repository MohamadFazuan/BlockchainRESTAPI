import pkgaxios from 'axios';
const { get } = pkgaxios;
import { Router } from 'express';
var router = Router();
import dotenv from 'dotenv';
dotenv.config()
import Web3 from 'web3';
import { ok, ok2, fail2 } from '../config/resformat.js';
import { binance, usdt } from '../config/wallet_info.js';
import pkgbitcore from '@ethereumjs/tx';
const { Transaction } = pkgbitcore;
import _Common from '@ethereumjs/common'
const Common = _Common.default
var web3bsc = new Web3(process.env.QUICKNODE_BSC);
import ethers from 'ethers';
import abi from '../abiUsdt.json' assert { type: 'json' };
import InputDataDecoder from 'ethereum-input-data-decoder';
const usdtContract = process.env.USDT_CONTRACT;
// import mongoose from 'mongoose';
// import Model from '../config/model.js';
import bip39 from 'bip39';

router.post('/createWallet', function (req, res) {

  try {

    const mnemonic = bip39.generateMnemonic();
    // const path_bsc = `m/44'/60'/0'/0`;
    const bsc = ethers.Wallet.fromMnemonic(mnemonic);

    var wallet = [
      {
        address: bsc.address,
        address_url: usdt(bsc.address).explorer,
        privateKey: bsc.privateKey.slice(2),
      }
    ];

    ok2(req.headers.authorization, "createWallet", 'SUCCESSFUL', usdt().symbol, usdt().name, wallet, res);


  } catch (e) {
    fail2(req.headers.authorization, "createWallet", 'UNSUCCESSFUL', usdt().symbol, usdt().name, e.message, res);

  }
});

router.post('/importWallet', function (req, res) {

  try {
    const pass = req.body.passphrase;

    if (!bip39.validateMnemonic(pass)) {
      console.log("USDT importWallet: Invalid passphrase");
      return fail2(req.headers.authorization, "importWallet", 'UNSUCCESSFUL', usdt().symbol, usdt().name, "Invalid passphrase", res);

    } else {
      // const path_bsc = `m/44'/60'/0'/0`;
      const bsc = ethers.Wallet.fromMnemonic(pass);

      var wallet = [
        {
          address: bsc.address,
          address_url: usdt('address/' + bsc.address).explorer,
          privateKey: bsc.privateKey.slice(2),
        }
      ];

      ok2(req.headers.authorization, "importWallet", 'SUCCESSFUL', usdt().symbol, usdt().name, wallet, res);
    }
  } catch (e) {
    fail2(req.headers.authorization, "importWallet", 'UNSUCCESSFUL', usdt().symbol, usdt().name, e.message, res);

  }
});

router.post('/getBalanceByAddress', async function (req, res, next) {
  try {
    const address = req.body.address;

    const validAddress = await web3bsc.utils.isAddress(address)

    if (!validAddress) {
      return fail2(req.headers.authorization, "getBalanceByAddress", 'UNSUCCESSFUL', usdt().symbol, usdt().name, "Invalid Address", res);

    } else {

      const contract = new web3bsc.eth.Contract(abi, usdtContract);
      var balance = await contract.methods.balanceOf(address).call();

      var amount_value_full = balance / Math.pow(10, parseInt(usdt(address).decimal));

      var wallet = [
        {
          address: address,
          address_url: usdt(address).explorer,
          balance: parseInt(balance),
          decimal: parseInt(usdt(address).decimal),
          symbol: usdt(address).symbol,
          full_balance: amount_value_full + " " + usdt(address).symbol,
          full_balance_float: parseFloat(amount_value_full)
        }
      ];
      ok2(req.headers.authorization, "getBalanceByAddress", 'SUCCESSFUL', usdt().symbol, usdt().name, wallet, res);
    }

  } catch (e) {
    fail2(req.headers.authorization, "getBalanceByAddress", 'UNSUCCESSFUL', usdt().symbol, usdt().name, e.message, res);

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

// async function fetchMongo(data) {
//   //message
//   const docs = await Model.find({ hash: data, coin: usdt().name }).exec();
//   // console.log(JSON.stringify(docs));

//   // MongoDB may return the docs in any order unless you explicitly sort
//   return docs.map((doc) => doc.message);
// }

function blockConfirmationStatus(block) {
  if (block == 0) {
    return "pending"
  } else if (block >= 5) {
    return "confirmed"
  }
}

router.post('/getTransactionByTxHash', async function (req, res, next) {
  try {
    var txnHash = req.body.txnHash;

    var tx = await web3bsc.eth.getTransaction(txnHash);

    var gasUsed = (await web3bsc.eth.getTransactionReceipt(txnHash)).gasUsed;

    const currentBlock = await web3bsc.eth.getBlockNumber();
    const block_confirmation = currentBlock - tx.blockNumber;

    var amount_value_full = await web3bsc.utils.fromWei(tx.value);
    var gas_value_full = await web3bsc.utils.fromWei(tx.gasPrice) * gasUsed;

    var blockinfo = await web3bsc.eth.getBlock(tx.blockNumber);

    const decoder = new InputDataDecoder(abi);
    const result = decoder.decodeData(tx.input);
    // console.log(result);
    var tokentransfernumber;

    if (result.method === "transfer") {
      tokentransfernumber = await web3bsc.utils.hexToNumberString(result.inputs[1]._hex);


      // console.log(result.inputs[1]._hex);
    }
    else {
      tokentransfernumber = await web3bsc.utils.hexToNumberString(result.inputs[1]._hex);
      // console.log(result.inputs[2]._hex);
    }


    var amount_token_value_full = tokentransfernumber / Math.pow(10, parseInt(usdt().decimal));;

    var wallet = [
      {
        timestamp: blockinfo.timestamp,
        timestamp_text: timeConverter(blockinfo.timestamp),
        tx: txnHash,
        full_url_tx: usdt().tx_explorer + txnHash,
        block: tx.blockNumber,
        block_confirmation: block_confirmation,
        confirmation_status: blockConfirmationStatus(block_confirmation),
        amount: parseInt(tokentransfernumber),
        decimal: parseInt(usdt().decimal),
        full_amount: amount_token_value_full + " " + usdt().symbol,
        full_amount_float: parseFloat(amount_token_value_full),
        gas: parseInt(tx.gasPrice * gasUsed),
        gasUsed: parseInt(gasUsed),
        gasPrice: web3bsc.utils.fromWei(tx.gasPrice) + " " + binance().symbol,
        full_gas: gas_value_full + " " + binance().symbol,
        full_gas_float: parseFloat(gas_value_full),
        sender: tx.from,
        receiver: tx.to,
        // message: (await fetchMongo(txnHash)).toString()
      }
    ];

    ok2(req.headers.authorization, "getTransactionByTxHash", 'SUCCESSFUL', usdt().symbol, usdt().name, wallet, res);


  } catch (e) {
    fail2(req.headers.authorization, "getTransactionByTxHash", 'UNSUCCESSFUL', usdt().symbol, usdt().name, e.message, res);

  }
});

router.post('/gasEstimate', async function (req, res, next) {

  try {
    const sender = req.body.sender;
    const receiver = req.body.receiver;
    const amount_tosend = req.body.amount;

    const contract = new web3bsc.eth.Contract(abi, usdtContract);

    const validAddress = await web3bsc.utils.isAddress(sender);
    var balanceWei = await contract.methods.balanceOf(sender).call();
    var balance = balanceWei / Math.pow(10, parseInt(usdt().decimal));

    var balanceWeiBNB = await web3bsc.eth.getBalance(sender);
    var balanceBNB = web3bsc.utils.fromWei(balanceWeiBNB);

    if (!validAddress) {
      return fail2(req.headers.authorization, "gasEstimate", 'UNSUCCESSFUL', usdt().symbol, usdt().name, "Invalid Address", res);

    } else {

      const nonce = await web3bsc.eth.getTransactionCount(sender);

      // const gaslimit = await web3bsc.eth.estimateGas({
      //   nonce: web3bsc.utils.toHex(nonce), 
      // });

      var amount = amount_tosend * Math.pow(10, usdt().decimal);

      const amount2 = web3bsc.utils.toBN(parseInt(amount));
      contract.methods.transfer(receiver, amount2).estimateGas({
        from: sender,
      }).then(async (gaslimit) => {

        const gasPrice = await web3bsc.eth.getGasPrice();

        var wallet = [
          {
            gasLimits: parseInt(gaslimit),
            gasPrices: {
              fast: parseInt(gasPrice * 1.9),
              normal: parseInt(gasPrice * 1.5),
              slow: parseInt(gasPrice)
            },
            gasPrice: {
              fastestFee: {
                inWei: parseInt(gasPrice * 1.9),
                inBNB: web3bsc.utils.fromWei(parseInt(gasPrice * 1.9).toString(), 'ether')
              },
              halfHourFee: {
                inWei: parseInt(gasPrice * 1.5),
                inBNB: web3bsc.utils.fromWei(parseInt(gasPrice * 1.5).toString(), 'ether')
              },
              hourFee: {
                inWei: parseInt(gasPrice),
                inBNB: web3bsc.utils.fromWei(parseInt(gasPrice).toString(), 'ether')
              }
            },
            networkFee: {
              fastestFee: {
                inWei: parseInt((gasPrice * 1.9) * gaslimit),
                inBNB: parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice * 1.9) * gaslimit).toString(), 'ether'))
              },
              halfHourFee: {
                inWei: parseInt((gasPrice * 1.5) * gaslimit),
                inBNB: parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice * 1.5) * gaslimit).toString(), 'ether'))
              },
              hourFee: {
                inWei: parseInt((gasPrice) * gaslimit),
                inBNB: parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice) * gaslimit).toString(), 'ether'))
              }
            },
            balance: {
              contract_balance: parseFloat(balance),
              fee: {
                fastestFee: parseFloat(balanceBNB) - (parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice * 1.9) * gaslimit).toString(), 'ether'))),
                halfHourFee: parseFloat(balanceBNB) - (parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice * 1.5) * gaslimit).toString(), 'ether'))),
                hourFee: parseFloat(balanceBNB) - (parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice) * gaslimit).toString(), 'ether')))
              }
            }
          }
        ];

        ok2(req.headers.authorization, "gasEstimate", 'SUCCESSFUL', usdt().symbol, usdt().name, wallet, res);
      }).catch(async (error) => {
        let gaslimit = 37000;

        const gasPrice = await web3bsc.eth.getGasPrice();
        var wallet = [
          {
            gasLimits: parseInt(gaslimit),
            gasPrices: {
              fast: parseInt(gasPrice * 1.9),
              normal: parseInt(gasPrice * 1.5),
              slow: parseInt(gasPrice)
            },
            gasPrice: {
              fastestFee: {
                inWei: parseInt(gasPrice * 1.9),
                inBNB: web3bsc.utils.fromWei(parseInt(gasPrice * 1.9).toString(), 'ether')
              },
              halfHourFee: {
                inWei: parseInt(gasPrice * 1.5),
                inBNB: web3bsc.utils.fromWei(parseInt(gasPrice * 1.5).toString(), 'ether')
              },
              hourFee: {
                inWei: parseInt(gasPrice),
                inBNB: web3bsc.utils.fromWei(parseInt(gasPrice).toString(), 'ether')
              }
            },
            networkFee: {
              fastestFee: {
                inWei: parseInt((gasPrice * 1.9) * gaslimit),
                inBNB: parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice * 1.9) * gaslimit).toString(), 'ether'))
              },
              halfHourFee: {
                inWei: parseInt((gasPrice * 1.5) * gaslimit),
                inBNB: parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice * 1.5) * gaslimit).toString(), 'ether'))
              },
              hourFee: {
                inWei: parseInt((gasPrice) * gaslimit),
                inBNB: parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice) * gaslimit).toString(), 'ether'))
              }
            },
            balance: {
              contract_balance: parseFloat(balance),
              fee: {
                fastestFee: parseFloat(balanceBNB) - (parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice * 1.9) * gaslimit).toString(), 'ether'))),
                halfHourFee: parseFloat(balanceBNB) - (parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice * 1.5) * gaslimit).toString(), 'ether'))),
                hourFee: parseFloat(balanceBNB) - (parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice) * gaslimit).toString(), 'ether')))
              }
            }
          }
        ];

        ok2(req.headers.authorization, "gasEstimate", 'SUCCESSFUL', usdt().symbol, usdt().name, wallet, res);
      });
    }
  } catch (e) {
    fail2(req.headers.authorization, "gasEstimate", 'UNSUCCESSFUL', usdt().symbol, usdt().name, e.message, res);

  }

});

function senderReceiver(addrOne, address) {

  var type;

  if (addrOne === address.toLowerCase()) {
    type = "Send";
    return type;
  } else {
    type = "Receive";
    return type;
  }
}

router.post('/getTransactionByAddress', async function (req, res, next) {
  try {
    var address = req.body.address;
    var limit = req.body.limit;

    const validAddress = await web3bsc.utils.isAddress(address);

    if (!validAddress) {
      return fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', usdt().symbol, usdt().name, e.message, res);

    } else {

      const url = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=0x55d398326f99059fF775485246999027B3197955&address=${address}&page=1&offset=${limit}&startblock=0&endblock=999999999&sort=desc&apikey=R9UPSKWD5PK5MJHWWKD6A2VQJYH3BE35C1`;

      const tx = await get(url).catch((e) => {
        return fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', usdt().symbol, usdt().name, e.message, res);
      });

      const fruits = [];

      for (var i = 0; i < tx.data.result.length; i++) {

        //var amount_value_full = await web3bsc.utils.fromWei(tx.data.result[i].value);

        var amount_value_full = tx.data.result[i].value / Math.pow(10, parseInt(usdt().decimal));
        var gasUsed = (await web3bsc.eth.getTransactionReceipt(tx.data.result[i].hash)).gasUsed;
        var gas_value_full = await web3bsc.utils.fromWei(tx.data.result[i].gasPrice) * gasUsed;

        fruits.push({
          type: senderReceiver(tx.data.result[i].from, address),
          timestamp: parseInt(tx.data.result[i].timeStamp),
          timestamp_text: timeConverter(parseInt(tx.data.result[i].timeStamp)),
          tx: tx.data.result[i].hash,
          full_url_tx: usdt().tx_explorer + tx.data.result[i].hash,
          block: parseInt(tx.data.result[i].blockNumber),
          block_confirmation: parseInt(tx.data.result[i].confirmations),
          confirmation_status: blockConfirmationStatus(parseInt(tx.data.result[i].confirmations)),
          amount: parseInt(tx.data.result[i].value),
          decimal: parseInt(usdt().decimal),
          full_amount: amount_value_full + " " + usdt().symbol,
          full_amount_float: parseFloat(amount_value_full),
          gas: parseInt(tx.data.result[i].gasPrice * gasUsed),
          gasUsed: parseInt(gasUsed),
          gasPrice: web3bsc.utils.fromWei(tx.data.result[i].gasPrice) + " " + binance().symbol,
          full_gas: gas_value_full + " " + binance().symbol,
          full_gas_float: parseFloat(gas_value_full),
          sender: tx.data.result[i].from,
          receiver: tx.data.result[i].to,
          // message: (await fetchMongo(tx.data.result[i].hash)).toString()
        });
      }

      var wallet = [
        {
          address: address,
          address_url: usdt(address).explorer,
          transactions: fruits
        }
      ];

      ok2(req.headers.authorization, "getTransactionByAddress", 'SUCCESSFUL', usdt().symbol, usdt().name, wallet, res);
    }
  } catch (e) {
    fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', usdt().symbol, usdt().name, e.message, res);

  }
});

router.post('/sendTransaction', async function (req, res, next) {
  try {
    const sender = req.body.sender;
    const receiver = req.body.receiver;
    const amount_tosend = req.body.amount;
    const privKey = req.body.privKey;
    const message = req.body.message;
    const gaslimit_var = req.body.gaslimit;
    const gasprice_var = req.body.gaspri;

    const validAddressSender = await web3bsc.utils.isAddress(sender);
    const validAddressReceiver = await web3bsc.utils.isAddress(receiver);

    console.log("Validating address...");
    if (!(validAddressSender && validAddressReceiver)) {
      return fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', usdt().symbol, usdt().name, e.message, res);

    } else {

      console.log("Valid sender and receiver address...");

      var amount = amount_tosend * Math.pow(10, usdt().decimal);

      const contract = new web3bsc.eth.Contract(abi, usdtContract);

      const amount2 = web3bsc.utils.toBN(parseInt(amount));

      console.log("Calling contract...");
      const transfer = await contract.methods.transfer(receiver, amount2).encodeABI();

      const nonce = await web3bsc.eth.getTransactionCount(sender);

      // console.log(parseInt(parseFloat(gasprice_var) * Math.pow(10, binance().decimal)));
      const txParams = {
        nonce: web3bsc.utils.toHex(nonce),
        gasPrice: web3bsc.utils.toHex(parseInt(parseFloat(gasprice_var) * Math.pow(10, binance().decimal))),
        gasPrice: web3bsc.utils.toHex(gasprice_var),
        gasLimit: web3bsc.utils.toHex(gaslimit_var),
        from: sender,
        data: transfer,
        to: usdtContract,
      }
      console.log(`Transaction param :${JSON.stringify(txParams)}`);

      const customChainParams = { name: 'custom', chainId: 56 };
      const customChainCommon = Common.forCustomChain('mainnet', customChainParams);
      const tx = Transaction.fromTxData(txParams, { common: customChainCommon });
      const privateKey = Buffer.from(
        privKey,
        'hex',
      );

      console.log('Signing privatekey...');
      const signedTx = tx.sign(privateKey);

      console.log('Serialize hex...');
      const serializedTx = signedTx.serialize().toString('hex');

      console.log('Send serialized hex...');

      var amount_value_full = amount2 / Math.pow(10, parseInt(usdt().decimal));

      web3bsc.eth.sendSignedTransaction("0x" + serializedTx).then((receipt) => {

        var wallet = [
          {
            tx: receipt.transactionHash,
            full_url_tx: usdt().tx_explorer + receipt.transactionHash,
            amount: amount2.toString(),
            decimal: usdt().decimal,
            full_amount: amount_value_full + " " + usdt().symbol,
            amount_float: parseFloat(amount_value_full),
            gas: receipt.gasUsed * gasprice_var,
            gasUsed: receipt.gasUsed,
            gasLimit: gaslimit_var,
            gasPrice: web3bsc.utils.fromWei(gasprice_var.toString(), 'ether') + " " + binance().symbol,
            gasPrice: gasprice_var,
            sender: sender,
            receiver: receiver,
            contract: usdtContract
            // message: message
          }
        ];

        ok2(req.headers.authorization, "sendTransaction", 'SUCCESSFUL', usdt().symbol, usdt().name, wallet, res);
      }).catch((e) => {
        console.log('sendTransaction ', e.message);
        return fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', usdt().symbol, usdt().name, e.message, res);
      });
      // console.log(`Receipt : ${JSON.stringify(receipt)}`);


      //message
      // mongoose.connect(process.env.MONGODB_URI, {
      //   useNewUrlParser: true,
      //   useUnifiedTopology: true,
      // }).then(async () => {
      //   console.log("Save message to db");

      //   // const db = result.db('qcoin')
      //   // const quotesCollection = db.collection('TransactionMemo');

      //   const data = new Model({
      //     hash: receipt.transactionHash,
      //     message: message,
      //     coin: usdt().name
      //   })
      //   console.log(data);

      //   const dataToSave = await data.save();
      //   console.log(`${JSON.stringify(dataToSave)} saved`);
      // }).catch((e) => {
      //   fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', usdt().symbol, usdt().name, e.message, res);
      // });


    }

  } catch (e) {
    return fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', usdt().symbol, usdt().name, e.message, res);
  }
});

router.post('/sendSerializedTransaction', async function (req, res, next) {
  try {
    const serializedTx = req.body.sender;

    const receipt = await web3bsc.eth.sendSignedTransaction("0x" + serializedTx);

    var wallet = [
      {
        timestamp: blockinfo.timestamp,
        timestamp_text: timeConverter(blockinfo.timestamp),
        tx: txnHash,
        full_url_tx: usdt().tx_explorer + receipt.txnHash,
        block: tx.blockNumber,
        block_confirmation: block_confirmation,
        amount: tx.value,
        decimal: parseInt(usdt().decimal),
        full_amount: amount_value_full + " " + usdt().symbol,
        full_amount_float: parseFloat(amount_value_full),
        gas: parseInt(tx.gasPrice),
        full_gas: gas_value_full + " " + usdt().symbol,
        full_gas_float: parseFloat(gas_value_full),
        sender: tx.from,
        receiver: tx.to,
      }
    ];

    ok2(req.headers.authorization, "sendSerializedTransaction", 'SUCCESSFUL', usdt().symbol, usdt().name, wallet, res);

  } catch (e) {
    fail2(req.headers.authorization, "sendSerializedTransaction", 'UNSUCCESSFUL', usdt().symbol, usdt().name, e.message, res);

  }

});

export default router;
