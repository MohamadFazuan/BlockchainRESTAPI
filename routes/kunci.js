import pkgaxios from 'axios';
const { get } = pkgaxios;
import { Router } from 'express';
var kunciRouter = Router();
import dotenv from 'dotenv';
dotenv.config()
import Web3 from 'web3';
import { ok, ok2, fail2 } from '../config/resformat.js';
import { binance, kunci } from '../config/wallet_info.js';
import pkgbitcore from '@ethereumjs/tx';
const { Transaction } = pkgbitcore;
import _Common from '@ethereumjs/common'
const Common = _Common.default
var web3bsc = new Web3(process.env.QUICKNODE_BSC);
import abi from '../abi.json' assert { type: 'json' };
import InputDataDecoder from 'ethereum-input-data-decoder';
const kunciContract = process.env.KUNCI_CONTRACT;
import bip39 from 'bip39';
import ethers from 'ethers';

kunciRouter.post('/createWallet', function (req, res) {

  try {

    const mnemonic = bip39.generateMnemonic();
    // const path_bsc = `m/44'/60'/0'/0`;
    const bsc = ethers.Wallet.fromMnemonic(mnemonic);

    var wallet = [
      {
        address: bsc.address,
        address_url: kunci(bsc.address).explorer,
        privateKey: bsc.privateKey.slice(2),
      }
    ];

    ok2(req.headers.authorization, "createWallet", 'SUCCESSFUL', kunci().symbol, kunci().name, wallet, res);


  } catch (e) {
    fail2(req.headers.authorization, "createWallet", 'UNSUCCESSFUL', kunci().symbol, kunci().name, e.message, res);

  }
});

kunciRouter.post('/importWallet', async function (req, res) {

  try {
    const pass = req.body.passphrase;

    if (!bip39.validateMnemonic(pass)) {
      return fail2(req.headers.authorization, "importWallet", 'UNSUCCESSFUL', kunci().symbol, kunci().name, "Invalid passphrase", res);

    } else {
      // const path_bsc = `m/44'/60'/0'/0`;
      const bsc = ethers.Wallet.fromMnemonic(pass);

      var wallet = [
        {
          address: bsc.address,
          address_url: kunci('address/' + bsc.address).explorer,
          privateKey: bsc.privateKey.slice(2),
        }
      ];

      ok2(req.headers.authorization, "importWallet", 'SUCCESSFUL', kunci().symbol, kunci().name, wallet, res);
    }
  } catch (e) {
    fail2(req.headers.authorization, "importWallet", 'UNSUCCESSFUL', kunci().symbol, kunci().name, e.message, res);

  }
});

kunciRouter.post('/getBalanceByAddress', async function (req, res, next) {
  try {
    const address = req.body.address;

    const validAddress = await web3bsc.utils.isAddress(address)

    if (!validAddress) {
      return fail2(req.headers.authorization, "getBalanceByAddress", 'UNSUCCESSFUL', kunci().symbol, kunci().name, "Invalid Address", res);

    } else {

      const contract = new web3bsc.eth.Contract(abi, kunciContract);
      var balance = await contract.methods.balanceOf(address).call();

      var amount_value_full = balance / Math.pow(10, parseInt(kunci(address).decimal));

      var wallet = [
        {
          address: address,
          address_url: kunci(address).explorer,
          balance: parseInt(balance),
          decimal: parseInt(kunci(address).decimal),
          symbol: kunci(address).symbol,
          full_balance: amount_value_full + " " + kunci(address).symbol,
          full_balance_float: parseFloat(amount_value_full),
        }
      ];
      ok2(req.headers.authorization, "getBalanceByAddress", 'SUCCESSFUL', kunci().symbol, kunci().name, wallet, res);
    }

  } catch (e) {
    fail2(req.headers.authorization, "getBalanceByAddress", 'UNSUCCESSFUL', kunci().symbol, kunci().name, e.message, res);

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

// function hex_to_ascii(str1) {
//   var hex = str1.toString();
//   var str = '';
//   for (var n = 0; n < hex.length; n += 2) {
//     str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
//   }
//   return str;
// }

// async function fetchMongo(data) {

//   const docs = await Model.find({ hash: data, coin: kunci().name }).exec();
//   // console.log(docs.map((doc) => doc.message));

//   // MongoDB may return the docs in any order unless you explicitly sort
//   const result = docs.map((doc) => doc.message);
//   return result;
// }

function blockConfirmationStatus(block) {
  if (block == 0) {
    return "pending"
  } else if (block >= 5) {
    return "confirmed"
  }
}

kunciRouter.post('/getTransactionByTxHash', async function (req, res, next) {
  try {
    var txnHash = req.body.txnHash;

    var tx = await web3bsc.eth.getTransaction(txnHash);

    var gasUsed = (await web3bsc.eth.getTransactionReceipt(txnHash)).gasUsed

    const currentBlock = await web3bsc.eth.getBlockNumber();
    const block_confirmation = currentBlock - tx.blockNumber;

    var amount_value_full = await web3bsc.utils.fromWei(tx.value);
    var gas_value_full = (await web3bsc.utils.fromWei(tx.gasPrice)) * gasUsed;

    var blockinfo = await web3bsc.eth.getBlock(tx.blockNumber);

    const decoder = new InputDataDecoder(abi);
    const result = decoder.decodeData(tx.input);
    var tokentransfernumber;

    if (result.method === "transfer") {
      tokentransfernumber = await web3bsc.utils.hexToNumber(result.inputs[1]._hex);
      // console.log(result.inputs[1]._hex);
    }
    else {
      tokentransfernumber = await web3bsc.utils.hexToNumber(result.inputs[2]._hex);
      // console.log(result.inputs[2]._hex);
    }

    var amount_token_value_full = tokentransfernumber / Math.pow(10, parseInt(kunci().decimal));

    var wallet = [
      {
        timestamp: blockinfo.timestamp,
        timestamp_text: timeConverter(blockinfo.timestamp),
        tx: txnHash,
        full_url_tx: kunci().tx_explorer + txnHash,
        block: tx.blockNumber,
        block_confirmation: block_confirmation,
        confirmation_status: blockConfirmationStatus(block_confirmation),
        amount: parseInt(tokentransfernumber),
        decimal: parseInt(kunci().decimal),
        full_amount: amount_token_value_full + " " + kunci().symbol,
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

    ok2(req.headers.authorization, "getTransactionByTxHash", 'SUCCESSFUL', kunci().symbol, kunci().name, wallet, res);


  } catch (e) {
    fail2(req.headers.authorization, "getTransactionByTxHash", 'UNSUCCESSFUL', kunci().symbol, kunci().name, e.message, res);

  }
});

function toFixed(x) {
  if (Math.abs(x) < 1.0) {
    var e = parseInt(x.toString().split('e-')[1]);
    if (e) {
      x *= Math.pow(10, e - 1);
      x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
    }
  } else {
    var e = parseInt(x.toString().split('+')[1]);
    if (e > 20) {
      e -= 20;
      x /= Math.pow(10, e);
      x += (new Array(e + 1)).join('0');
    }
  }
  return x;
}


kunciRouter.post('/gasEstimate', async function (req, res, next) {

  try {
    const sender = req.body.sender;
    const receiver = req.body.receiver;
    const amount_tosend = req.body.amount;

    const contract = new web3bsc.eth.Contract(abi, kunciContract);

    const validAddress = await web3bsc.utils.isAddress(sender);
    var balanceWei = await contract.methods.balanceOf(sender).call();
    var balance = balanceWei / Math.pow(10, parseInt(kunci().decimal));

    var balanceWeiBNB = await web3bsc.eth.getBalance(sender);
    var balanceBNB = web3bsc.utils.fromWei(balanceWeiBNB);

    if (!validAddress) {
      return fail2(req.headers.authorization, "gasEstimate", 'UNSUCCESSFUL', kunci().symbol, kunci().name, "Invalid Address", res);

    } else {

      // const nonce = await web3bsc.eth.getTransactionCount(sender);

      // const gaslimit = await web3bsc.eth.estimateGas({
      //   nonce: web3bsc.utils.toHex(nonce),
      // });

      var amount = amount_tosend * Math.pow(10, kunci().decimal);

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

        ok2(req.headers.authorization, "gasEstimate", 'SUCCESSFUL', kunci().symbol, kunci().name, wallet, res);
      }).catch(async (error) => {

        let gaslimit = 37000;

        const gasPrice = await web3bsc.eth.getGasPrice();
        console.log(gasPrice);

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

        ok2(req.headers.authorization, "gasEstimate", 'SUCCESSFUL', kunci().symbol, kunci().name, wallet, res);
      });
    }
  } catch (e) {
    fail2(req.headers.authorization, "gasEstimate", 'UNSUCCESSFUL', kunci().symbol, kunci().name, e.message, res);

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

kunciRouter.post('/getTransactionByAddress', async function (req, res, next) {
  try {
    var address = req.body.address;
    var limit = req.body.limit;

    const validAddress = await web3bsc.utils.isAddress(address);

    if (!validAddress) {
      return fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', kunci().symbol, kunci().name, e.message, res);

    } else {

      const url = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=0x6cf271270662be1C4fc1b7BB7D7D7Fc60Cc19125&address=${address}&page=1&offset=${limit}&startblock=0&endblock=999999999&sort=desc&apikey=R9UPSKWD5PK5MJHWWKD6A2VQJYH3BE35C1`;

      const tx = await get(url).catch((e) => {
        return fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', kunci().symbol, kunci().name, e.message, res);
      });

      const fruits = [];

      for (var i = 0; i < tx.data.result.length; i++) {

        var amount_value_full = tx.data.result[i].value / Math.pow(10, parseInt(kunci().decimal));

        var gasUsed = (await web3bsc.eth.getTransactionReceipt(tx.data.result[i].hash)).gasUsed

        var gas_value_full = await web3bsc.utils.fromWei(tx.data.result[i].gasPrice) * gasUsed;

        fruits.push({
          type: senderReceiver(tx.data.result[i].from, address),
          timestamp: parseInt(tx.data.result[i].timeStamp),
          timestamp_text: timeConverter(parseInt(tx.data.result[i].timeStamp)),
          tx: tx.data.result[i].hash,
          full_url_tx: kunci().tx_explorer + tx.data.result[i].hash,
          block: parseInt(tx.data.result[i].blockNumber),
          block_confirmation: parseInt(tx.data.result[i].confirmations),
          confirmation_status: blockConfirmationStatus(parseInt(tx.data.result[i].confirmations)),
          amount: parseInt(tx.data.result[i].value),
          decimal: parseInt(kunci().decimal),
          full_amount: amount_value_full + " " + kunci().symbol,
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
          address_url: kunci(address).explorer,
          transactions: fruits
        }
      ];

      ok2(req.headers.authorization, "getTransactionByAddress", 'SUCCESSFUL', kunci().symbol, kunci().name, wallet, res);
    }
  } catch (e) {
    fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', kunci().symbol, kunci().name, e.message, res);

  }
});

async function validateBalance(address, amount) {
  try {

    const contract = new web3bsc.eth.Contract(abi, kunciContract);
    var balance = await contract.methods.balanceOf(address).call();

    var amount_value_full = balance / Math.pow(10, parseInt(kunci(address).decimal));

    if (amount > parseFloat(amount_value_full)) {
      console.info(`validate: `, amount > parseFloat(amount_value_full));
      return true
    } else {
      return false
    }

  } catch (e) {
    fail2(req.headers.authorization, "validateBalance", 'UNSUCCESSFUL', kunci().symbol, kunci().name, e.message, res);

  }
}

kunciRouter.post('/sendTransaction', async function (req, res, next) {
  try {
    const sender = req.body.sender;
    const receiver = req.body.receiver;
    const amount_tosend = req.body.amount;
    const privKey = req.body.privKey;
    const message = req.body.message;
    const gaslimit_var = req.body.gaslimit;
    const gasprice_var = req.body.gaspri;

    console.info('Requested: ', {
      sender: sender,
      receiver: receiver,
      amount: amount_tosend,
      gaslimit: gaslimit_var,
      gasprice: gasprice_var
    });

    const validAddressSender = await web3bsc.utils.isAddress(sender);
    const validAddressReceiver = await web3bsc.utils.isAddress(receiver);

    console.log("Validating address...");
    if (!(validAddressSender && validAddressReceiver)) {
      return fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', kunci().symbol, kunci().name, e.message, res);

    } else {
      console.log("Valid sender and receiver address...");

      console.log("Validating balance...");

      let validateBal = await validateBalance(sender, amount_tosend);

      if (validateBal) {
        return fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', kunci().symbol, kunci().name, "Transfer amount exceeds balance", res);
      } else {
        console.info(`Amount to send: ${amount_tosend} `);

        var amount = amount_tosend * Math.pow(10, kunci().decimal);
        console.log(`Amount to send in KUNCI: ${amount}`);

        const contract = new web3bsc.eth.Contract(abi, kunciContract);

        const amount2 = web3bsc.utils.toBN(parseInt(amount));
        console.log(`Amount to send in BigInterger: ${amount2}`);
        
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
          to: kunciContract,
        }
        console.log(`Transaction param :${JSON.stringify(txParams)}`);

        const customChainParams = { name: 'custom', chainId: 56 }
        const customChainCommon = Common.forCustomChain('mainnet', customChainParams)
        const tx = Transaction.fromTxData(txParams, { common: customChainCommon });
        const privateKey = Buffer.from(
          privKey,
          'hex',
        )

        console.log('Signing privatekey...');
        const signedTx = tx.sign(privateKey);

        console.log('Serialize hex...');
        const serializedTx = signedTx.serialize().toString('hex');

        console.log('Send serialized hex...');

        var amount_value_full = amount2 / Math.pow(10, parseInt(kunci().decimal));

        web3bsc.eth.sendSignedTransaction("0x" + serializedTx).then((receipt) => {

          var wallet = [
            {
              tx: receipt.transactionHash,
              full_url_tx: kunci().tx_explorer + receipt.transactionHash,
              amount: amount2.toString(),
              decimal: kunci().decimal,
              full_amount: amount_value_full + " " + kunci().symbol,
              amount_float: parseFloat(amount_value_full),
              gas: receipt.gasUsed * gasprice_var,
              gasUsed: receipt.gasUsed,
              gasLimit: gaslimit_var,
              gasPrice: web3bsc.utils.fromWei(gasprice_var.toString(), 'ether') + " " + binance().symbol,
              gasPrice: gasprice_var,
              sender: sender,
              receiver: receiver,
              contract: kunciContract
              // message: message
            }
          ];

          ok2(req.headers.authorization, "sendTransaction", 'SUCCESSFUL', kunci().symbol, kunci().name, wallet, res);
        }).catch((e) => {
          return fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', kunci().symbol, kunci().name, e.message, res);
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
        //     coin: kunci().name
        //   })
        //   console.log(data);

        //   const dataToSave = await data.save();
        //   console.log(`${JSON.stringify(dataToSave)} saved`);
        // }).catch((e) => {
        //   fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', kunci().symbol, kunci().name, e.message, res);
        // });
      }

    }

  } catch (e) {
    return fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', kunci().symbol, kunci().name, e.message, res);
  }

});

kunciRouter.post('/sendSerializedTransaction', async function (req, res, next) {
  try {
    const serializedTx = req.body.sender;

    const receipt = await web3bsc.eth.sendSignedTransaction("0x" + serializedTx);

    var wallet = [
      {
        timestamp: blockinfo.timestamp,
        timestamp_text: timeConverter(blockinfo.timestamp),
        tx: txnHash,
        full_url_tx: kunci().tx_explorer + receipt.txnHash,
        block: tx.blockNumber,
        block_confirmation: block_confirmation,
        amount: tx.value,
        decimal: parseInt(kunci().decimal),
        full_amount: amount_value_full + " " + kunci().symbol,
        full_amount_float: parseFloat(amount_value_full),
        gas: parseInt(tx.gasPrice),
        full_gas: gas_value_full + " " + kunci().symbol,
        full_gas_float: parseFloat(gas_value_full),
        sender: tx.from,
        receiver: tx.to,
        // message: tx.input
      }
    ];

    ok2(req.headers.authorization, "sendSerializedTransaction", 'SUCCESSFUL', kunci().symbol, kunci().name, wallet, res);

  } catch (e) {
    fail2(req.headers.authorization, "sendSerializedTransaction", 'UNSUCCESSFUL', kunci().symbol, kunci().name, e.message, res);

  }

});

export default kunciRouter;
