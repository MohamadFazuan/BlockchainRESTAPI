import pkgaxios from 'axios';
const { get } = pkgaxios;
import { Router } from 'express';
var router = Router();
import dotenv from 'dotenv';
dotenv.config()
import Web3 from 'web3';
import { ok2, fail2 } from '../config/resformat.js';
import { binance } from '../config/wallet_info.js';
import pkgbitcore from '@ethereumjs/tx';
const { Transaction } = pkgbitcore;
import _Common from '@ethereumjs/common'
const Common = _Common.default
var web3bsc = new Web3(process.env.QUICKNODE_BSC);
import ethers from 'ethers';
import abi from '../abi.json' assert { type: 'json' };
//const InputDataDecoder = require('ethereum-input-data-decoder');
import InputDataDecoder from 'ethereum-input-data-decoder';
import bip39 from 'bip39';

router.post('/createWallet', function (req, res) {

  try {
    const mnemonic = req.body.passphrase;
    // const path_bsc = `m/44'/60'/0'/0`;
    const bsc = ethers.Wallet.fromMnemonic(mnemonic);

    var wallet = [
      {
        address: bsc.address,
        address_url: binance('address/' + bsc.address).explorer,
        privateKey: bsc.privateKey.slice(2),
        mnemonic: mnemonic.split(" "),
      }
    ];

    ok2(req.headers.authorization, "createWallet", 'SUCCESSFUL', binance().symbol, binance().name, wallet, res);

  } catch (e) {
    fail2(req.headers.authorization, "createWallet", 'UNSUCCESSFUL', binance().symbol, binance().name, e.message, res);

  }
});

router.post('/createPassphrase', function (req, res) {

  try {

    const mnemonic = bip39.generateMnemonic();
    // const path_bsc = `m/44'/60'/0'/0`;
    const bsc = ethers.Wallet.fromMnemonic(mnemonic);

    var wallet = [
      {
        address: bsc.address,
        address_url: binance('address/' + bsc.address).explorer,
        privateKey: bsc.privateKey.slice(2),
        mnemonic: mnemonic.split(" "),
      }
    ];

    ok2(req.headers.authorization, "createWallet", 'SUCCESSFUL', binance().symbol, binance().name, wallet, res);

  } catch (e) {
    fail2(req.headers.authorization, "createWallet", 'UNSUCCESSFUL', binance().symbol, binance().name, e.message, res);

  }
});

router.post('/importWallet', function (req, res) {

  try {
    const pass = req.body.passphrase;

    if (!bip39.validateMnemonic(pass)) {
      console.log("BSC importWallet: Invalid passphrase");
      return fail2(req.headers.authorization, "createWallet", 'UNSUCCESSFUL', binance().symbol, binance().name, "Invalid passphrase", res);

    } else {
      // const path_bsc = `m/44'/60'/0'/0`;
      const bsc = ethers.Wallet.fromMnemonic(pass);

      var wallet = [
        {
          address: bsc.address,
          address_url: binance('address/' + bsc.address).explorer,
          privateKey: bsc.privateKey.slice(),
        }
      ];

      ok2(req.headers.authorization, "createWallet", 'SUCCESSFUL', binance().symbol, binance().name, wallet, res);
    }
  } catch (e) {
    fail2(req.headers.authorization, "createWallet", 'UNSUCCESSFUL', binance().symbol, binance().name, e.message, res);
  }
});


router.post('/getBalanceByAddress', async function (req, res, next) {
  try {
    var address = req.body.address;

    var validAddress = await web3bsc.utils.isAddress(address);
    // console.log(validAddress);

    if (!validAddress) {
      return fail2(req.headers.authorization, "getBalanceByAddress", 'UNSUCCESSFUL', binance().symbol, binance().name, "Invalid Address", res);

    } else {
      var balance_value = await web3bsc.eth.getBalance(address);
      var balance_value_full = web3bsc.utils.fromWei(balance_value);

      var wallet = [
        {
          address: address,
          address_url: binance("address/" + address).explorer,
          balance: parseInt(balance_value),
          decimal: parseInt(binance(address).decimal),
          symbol: binance(address).symbol,
          full_balance: balance_value_full + " " + binance(address).symbol,
          full_balance_float: parseFloat(balance_value_full)
        }
      ];
      ok2(req.headers.authorization, "getBalanceByAddress", 'SUCCESSFUL', binance(address).symbol, binance(address).name, wallet, res);

    }

  } catch (e) {
    fail2(req.headers.authorization, "getBalanceByAddress", 'UNSUCCESSFUL', binance().symbol, binance().name, e.message, res);

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

function hex_to_ascii(str1) {
  var hex = str1.toString();
  var str = '';
  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}

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

    var wallet = [
      {
        timestamp: blockinfo.timestamp,
        timestamp_text: timeConverter(blockinfo.timestamp),
        tx: txnHash,
        full_url_tx: binance(txnHash).tx_explorer,
        block: tx.blockNumber,
        block_confirmation: block_confirmation,
        confirmation_status: blockConfirmationStatus(parseInt(block_confirmation)),
        amount: parseInt(tx.value),
        decimal: parseInt(binance().decimal),
        full_amount: amount_value_full + " " + binance().symbol,
        full_amount_float: parseFloat(amount_value_full),
        gas: parseInt(tx.gasPrice * gasUsed),
        gasUsed: parseInt(gasUsed),
        gasPrice: web3bsc.utils.fromWei(tx.gasPrice) + " " + binance().symbol,
        full_gas: gas_value_full + " " + binance().symbol,
        full_gas_float: parseFloat(gas_value_full),
        sender: tx.from,
        receiver: tx.to,
        // message: hex_to_ascii(tx.input.slice(2))
      }
    ];

    ok2(req.headers.authorization, "getTransactionByTxHash", 'SUCCESSFUL', binance().symbol, binance().name, wallet, res);


  } catch (e) {
    fail2(req.headers.authorization, "getTransactionByTxHash", 'UNSUCCESSFUL', binance().symbol, binance().name, e.message, res);
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

    var validAddress = await web3bsc.utils.isAddress(address);

    if (!validAddress) {
      return fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', binance().symbol, binance().name, "Invalid Address", res);

    } else {
      const url = `https://api.bscscan.com/api?module=account&action=txlist&address=${address}&page=1&offset=${limit}&startblock=0&endblock=99999999&sort=desc&apikey=R9UPSKWD5PK5MJHWWKD6A2VQJYH3BE35C1`;

      const tx = await get(url).catch((e) => {
        return fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', binance().symbol, binance().name, e.message, res);
      });

      const fruits = [];

      for (var i = 0; i < tx.data.result.length; i++) {

        var amount_value_full = await web3bsc.utils.fromWei(tx.data.result[i].value);
        var gasUsed = (await web3bsc.eth.getTransactionReceipt(tx.data.result[i].hash)).gasUsed;
        var gas_value_full = await web3bsc.utils.fromWei(tx.data.result[i].gasPrice) * gasUsed;

        var amt = parseInt(tx.data.result[i].value);
        // console.log(parseInt(tx.data.result[i].value));
        // if (amt > 0) {

        fruits.push({
          type: senderReceiver(tx.data.result[i].from, address),
          timestamp: parseInt(tx.data.result[i].timeStamp),
          timestamp_text: timeConverter(parseInt(tx.data.result[i].timeStamp)),
          tx: tx.data.result[i].hash,
          full_url_tx: binance(tx.data.result[i].hash).tx_explorer,
          block: parseInt(tx.data.result[i].blockNumber),
          block_confirmation: parseInt(tx.data.result[i].confirmations),
          confirmation_status: blockConfirmationStatus(parseInt(tx.data.result[i].confirmations)),
          amount: parseInt(tx.data.result[i].value),
          decimal: parseInt(binance().decimal),
          full_amount: amount_value_full + " " + binance().symbol,
          full_amount_float: parseFloat(amount_value_full),
          gas: parseInt(tx.data.result[i].gasPrice * gasUsed),
          gasUsed: parseInt(gasUsed),
          gasPrice: web3bsc.utils.fromWei(tx.data.result[i].gasPrice) + " " + binance().symbol,
          full_gas: gas_value_full + " " + binance().symbol,
          full_gas_float: parseFloat(gas_value_full),
          sender: tx.data.result[i].from,
          receiver: tx.data.result[i].to,
          // message: hex_to_ascii(tx.data.result[i].input.slice(2))
        });
        // }
      }

      var wallet = [
        {
          address: address,
          address_url: binance("address/" + address).explorer,
          transactions: fruits
        }
      ];

      ok2(req.headers.authorization, "getTransactionByAddress", 'SUCCESSFUL', binance("").symbol, binance().name, wallet, res);
    }

  } catch (e) {
    fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', binance().symbol, binance().name, e.message, res);
  }
});


router.post('/getAllTransactionTokenByAddress', async function (req, res, next) {
  try {
    var address = req.body.address;

    var validAddress = await web3bsc.utils.isAddress(address);

    if (!validAddress) {
      return fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', binance().symbol, binance().name, "Invalid Address", res);

    } else {
      const url = `https://api.bscscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=R9UPSKWD5PK5MJHWWKD6A2VQJYH3BE35C1`;

      const tx = await get(url).catch((e) => {
        return fail2(req.headers.authorization, "getAllTransactionTokenByAddress", 'UNSUCCESSFUL', binance().symbol, binance().name, e.message, res);
      });

      const fruits = [];
      //console.log(tx.data.result);
      for (var i = 0; i < tx.data.result.length; i++) {

        var amount_value_full = await web3bsc.utils.fromWei(tx.data.result[i].value);
        var gasUsed = (await web3bsc.eth.getTransactionReceipt(tx.data.result[i].hash)).gasUsed;
        var gas_value_full = await web3bsc.utils.fromWei(tx.data.result[i].gasPrice) * gasUsed;

        var amt = parseInt(tx.data.result[i].value);
        var cointype;
        var contract_address;
        var decimal_point;
        var amount_real;
        var amount_token_value_full;
        var receive;
        if (amt > 0) {
          cointype = "BNB";
          contract_address = "";
          decimal_point = binance().decimal;
          amount_real = amt;
          amount_token_value_full = amount_real / Math.pow(10, parseInt(decimal_point));
          receive = tx.data.result[i].to;
        }
        else {
          var decoder = new InputDataDecoder(abi);
          var result = decoder.decodeData(tx.data.result[i].input);

          //console.log(result);

          var token = new web3bsc.eth.Contract(abi, tx.data.result[i].to);

          var symbol = await token.methods.symbol().call();
          var decimal = await token.methods.decimals().call();
          var tokentransfernumber;

          cointype = symbol;
          contract_address = tx.data.result[i].to;
          decimal_point = decimal;

          receive = "0x" + result.inputs[0];

          //console.log(result);
          if (result.method === "transfer") {
            tokentransfernumber = await web3bsc.utils.hexToNumberString(result.inputs[1]._hex);
          }
          else {
            tokentransfernumber = await web3bsc.utils.hexToNumberString(result.inputs[2]._hex);
          }
          amount_real = tokentransfernumber;

          amount_token_value_full = tokentransfernumber / Math.pow(10, parseInt(decimal_point));

        }

        fruits.push({
          coin: cointype,
          contract: contract_address,
          type: senderReceiver(tx.data.result[i].from, address),
          timestamp: parseInt(tx.data.result[i].timeStamp),
          timestamp_text: timeConverter(parseInt(tx.data.result[i].timeStamp)),
          tx: tx.data.result[i].hash,
          full_url_tx: binance(tx.data.result[i].hash).tx_explorer,
          block: parseInt(tx.data.result[i].blockNumber),
          block_confirmation: parseInt(tx.data.result[i].confirmations),
          confirmation_status: blockConfirmationStatus(parseInt(tx.data.result[i].confirmations)),
          amount: parseInt(amount_real),
          decimal: parseInt(decimal_point),
          full_amount: amount_token_value_full + " " + cointype,
          full_amount_float: parseFloat(amount_token_value_full),
          gas: parseInt(tx.data.result[i].gasPrice * gasUsed),
          gasUsed: parseInt(gasUsed),
          gasPrice: web3bsc.utils.fromWei(tx.data.result[i].gasPrice) + " " + binance().symbol,
          full_gas: gas_value_full + " " + binance().symbol,
          full_gas_float: parseFloat(gas_value_full),
          sender: tx.data.result[i].from,
          receiver: receive,
          // message: hex_to_ascii(tx.data.result[i].input.slice(2))
        });
      }

      var wallet = [
        {
          address: address,
          address_url: binance("address/" + address).explorer,
          transactions: fruits
        }
      ];

      ok2(req.headers.authorization, "getAllTransactionTokenByAddress", 'SUCCESSFUL', binance("").symbol, binance().name, wallet, res);
    }

  } catch (e) {
    fail2(req.headers.authorization, "getAllTransactionTokenByAddress", 'UNSUCCESSFUL', binance().symbol, binance().name, e.message, res);

  }
});


router.post('/gasEstimate', async function (req, res, next) {

  try {
    const sender = req.body.sender;
    const receiver = req.body.receiver;
    const amount = req.body.amount;
    let gaslimit = 21000;

    var validAddress = await web3bsc.utils.isAddress(sender);

    var balanceWei = await web3bsc.eth.getBalance(sender);
    var balance = web3bsc.utils.fromWei(balanceWei);

    if (!validAddress) {
      return fail2(req.headers.authorization, "gasEstimate", 'UNSUCCESSFUL', binance().symbol, binance().name, "Invalid Address", res);

    } else {
      if (receiver == "") {
        const nonce = await web3bsc.eth.getTransactionCount(sender);

        await web3bsc.eth.estimateGas({
          nonce: web3bsc.utils.toHex(nonce),
          from: sender,
          to: receiver,
          value: web3bsc.utils.toWei(amount.toString())
        }).then(async (limitgas) => {
          const gasPrice = await web3bsc.eth.getGasPrice();

          var wallet = [
            {
              gasLimits: limitgas,
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
                before: parseFloat(balance),
                after: {
                  fastestFee: parseFloat(balance) - (parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice * 1.9) * gaslimit).toString(), 'ether'))),
                  halfHourFee: parseFloat(balance) - (parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice * 1.5) * gaslimit).toString(), 'ether'))),
                  hourFee: parseFloat(balance) - (parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice) * gaslimit).toString(), 'ether')))
                }
              }
            }
          ];

          ok2(req.headers.authorization, "gasEstimate", 'SUCCESSFUL', binance().symbol, binance().name, wallet, res);
        }).catch(async () => {
          const gasPrice = await web3bsc.eth.getGasPrice();

          var wallet = [
            {
              gasLimits: gaslimit,
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
                before: parseFloat(balance),
                after: {
                  fastestFee: parseFloat(balance) - (parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice * 1.9) * gaslimit).toString(), 'ether'))),
                  halfHourFee: parseFloat(balance) - (parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice * 1.5) * gaslimit).toString(), 'ether'))),
                  hourFee: parseFloat(balance) - (parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice) * gaslimit).toString(), 'ether')))
                }
              }
            }
          ];

          ok2(req.headers.authorization, "gasEstimate", 'SUCCESSFUL', binance().symbol, binance().name, wallet, res);
        });
      } else {
        const nonce = await web3bsc.eth.getTransactionCount(sender);

        await web3bsc.eth.estimateGas({
          nonce: web3bsc.utils.toHex(nonce),
          from: sender,
          to: receiver,
          value: web3bsc.utils.toWei(amount.toString())
        }).then(async (limitgas) => {
          const gasPrice = await web3bsc.eth.getGasPrice();

          var wallet = [
            {
              gasLimits: limitgas,
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
                before: parseFloat(balance),
                after: {
                  fastestFee: parseFloat(balance) - (parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice * 1.9) * gaslimit).toString(), 'ether'))),
                  halfHourFee: parseFloat(balance) - (parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice * 1.5) * gaslimit).toString(), 'ether'))),
                  hourFee: parseFloat(balance) - (parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice) * gaslimit).toString(), 'ether')))
                }
              }
            }
          ];

          ok2(req.headers.authorization, "gasEstimate", 'SUCCESSFUL', binance().symbol, binance().name, wallet, res);
        }).catch(async () => {
          const gasPrice = await web3bsc.eth.getGasPrice();

          var wallet = [
            {
              gasLimits: gaslimit,
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
                before: parseFloat(balance),
                after: {
                  fastestFee: parseFloat(balance) - (parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice * 1.9) * gaslimit).toString(), 'ether'))),
                  halfHourFee: parseFloat(balance) - (parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice * 1.5) * gaslimit).toString(), 'ether'))),
                  hourFee: parseFloat(balance) - (parseFloat(web3bsc.utils.fromWei(parseInt((gasPrice) * gaslimit).toString(), 'ether')))
                }
              }
            }
          ];
          ok2(req.headers.authorization, "gasEstimate", 'SUCCESSFUL', binance().symbol, binance().name, wallet, res);
        });
      }
    }
  } catch (e) {
    fail2(req.headers.authorization, "gasEstimate", 'UNSUCCESSFUL', binance().symbol, binance().name, e.message, res);

  }

});

router.post('/sendTransaction', async function (req, res, next) {
  try {
    const sender = req.body.sender;
    const receiver = req.body.receiver;
    const amount_tosend = req.body.amount;
    const privKey = req.body.privKey;
    const gaslimit_var = req.body.gaslimit;
    const gasprice_var = req.body.gaspri;
    const message = req.body.message;

    const validAddressSender = await web3bsc.utils.isAddress(sender);
    const validAddressReceiver = await web3bsc.utils.isAddress(receiver);

    console.log("Validating address...");
    if (!(validAddressSender && validAddressReceiver)) {
      return fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', binance().symbol, binance().name, "Invalid Address", res);

    } else {

      console.log("Valid sender and receiver address...");

      var amount = web3bsc.utils.toWei(amount_tosend.toString());

      const nonce = await web3bsc.eth.getTransactionCount(sender);

      const txParams = {
        nonce: web3bsc.utils.toHex(nonce),
        gasPrice: web3bsc.utils.toHex(gasprice_var),
        gasLimit: web3bsc.utils.toHex(gaslimit_var),
        from: sender,
        value: web3bsc.utils.toHex(amount),
        to: receiver,
        // data: web3bsc.utils.toHex(message)
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
      const receipt = await web3bsc.eth.sendSignedTransaction("0x" + serializedTx);
      console.log(`Receipt : ${JSON.stringify(receipt)}`);

      var amount_value_full = await web3bsc.utils.fromWei(amount.toString());

      var wallet = [
        {
          tx: receipt.transactionHash,
          full_url_tx: binance(receipt.transactionHash).tx_explorer,
          amount: parseInt(amount),
          decimal: binance().decimal,
          full_amount: amount_value_full + " " + binance().symbol,
          amount_float: parseFloat(amount_value_full),
          gas: receipt.gasUsed * gasprice_var,
          gasUsed: receipt.gasUsed,
          gasLimit: gaslimit_var,
          // gasPrice: web3bsc.utils.fromWei(parseInt(parseFloat(gasprice_var) * Math.pow(10, binance().decimal)).toString(), 'ether') + " " + binance().symbol,
          gasPrice: web3bsc.utils.fromWei(gasprice_var.toString(), 'ether') + " " + binance().symbol,
          sender: receipt.from,
          receiver: receipt.to,
          // message: message
        }
      ];

      ok2(req.headers.authorization, "sendTransaction", 'SUCCESSFUL', binance().symbol, binance().name, wallet, res);
    }


  } catch (e) {
    console.log('BSC sendTransaction : ', e.message);
    fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', binance().symbol, binance().name, e.message, res);
  }

});

router.post('/sendSerializedTransaction', async function (req, res, next) {
  try {
    const serializedTx = req.body.sender;

    const receipt = await web3bsc.eth.sendSignedTransaction("0x" + serializedTx);

    ok2(req.headers.authorization, "sendSerializedTransaction", 'SUCCESSFUL', binance("").symbol, binance().name, wallet, res);

  } catch (e) {
    fail2(req.headers.authorization, "sendSerializedTransaction", 'UNSUCCESSFUL', binance().symbol, binance().name, e.message, res);

  }

});

export default router;
