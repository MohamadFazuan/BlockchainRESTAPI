import pkgaxios from 'axios';
const { get } = pkgaxios;
import { Router } from 'express';
var router = Router();
import dotenv from 'dotenv';
dotenv.config()
import Web3 from 'web3';
import { ok2, fail2 } from '../config/resformat.js';
import { ethereum } from '../config/wallet_info.js';
import pkgbitcore from '@ethereumjs/tx';
const { Transaction } = pkgbitcore;
import _Common from '@ethereumjs/common'
const Common = _Common.default
const web3 = new Web3(process.env.QUICKNODE_ETHEREUM);
import ethers from 'ethers';
import bip39 from 'bip39';

router.post('/createWallet', function (req, res) {

  try {
    const mnemonic = req.body.passphrase
    // const path_eth = `m/44'/60'/0'/0`;
    const eth = ethers.Wallet.fromMnemonic(mnemonic);

    var wallet = [
      {
        address: eth.address,
        address_url: ethereum("address/" + eth.address).explorer,
        privateKey: eth.privateKey.slice(2),
        mnemonic: mnemonic.split(" "),
      }
    ];
    // console.log(wallet);

    ok2(req.headers.authorization, "createWallet", 'SUCCESSFUL', ethereum().symbol, ethereum().name, wallet, res);

  } catch (e) {
    fail2(req.headers.authorization, "createWallet", 'UNSUCCESSFUL', ethereum().symbol, ethereum().name, e.message, res);

  }
});

router.post('/createPassphrase', function (req, res) {

  try {
    const mnemonic = bip39.generateMnemonic();
    // const path_eth = `m/44'/60'/0'/0`;
    const eth = ethers.Wallet.fromMnemonic(mnemonic);

    var wallet = [
      {
        address: eth.address,
        address_url: ethereum("address/" + eth.address).explorer,
        privateKey: eth.privateKey,
        mnemonic: mnemonic.split(" "),
      }
    ];

    ok2(req.headers.authorization, "createWallet", 'SUCCESSFUL', ethereum().symbol, ethereum().name, wallet, res);

  } catch (e) {
    fail2(req.headers.authorization, "createWallet", 'UNSUCCESSFUL', ethereum().symbol, ethereum().name, e.message, res);

  }
});

router.post('/importWallet', function (req, res) {

  try {

    const pass = req.body.passphrase;

    if (!bip39.validateMnemonic) {
      console.log("BTC importWallet: Invalid passphrase");
      return fail2(req.headers.authorization, "importWallet", 'UNSUCCESSFUL', ethereum().symbol, ethereum().name, "Invalid passphrase", res);

    } else {
      // const path_eth = `m/44'/60'/0'/0`;
      const eth = ethers.Wallet.fromMnemonic(pass);

      var wallet = [
        {
          address: eth.address,
          address_url: ethereum('address/' + eth.address).explorer,
          privateKey: eth.privateKey,
        }
      ];

      // console.log(wallet);

      ok2(req.headers.authorization, "importWallet", 'SUCCESSFUL', ethereum().symbol, ethereum().name, wallet, res);
    }

  } catch (e) {
    fail2(req.headers.authorization, "createWallet", 'UNSUCCESSFUL', ethereum().symbol, ethereum().name, e.message, res);

  }
});

router.post('/getBalanceByAddress', async function (req, res, next) {
  try {
    var address = req.body.address;

    var validAddress = web3.utils.isAddress(address);
    // console.log(validAddress);

    if (!validAddress) {
      return fail2(req.headers.authorization, "getBalanceByAddress", 'UNSUCCESSFUL', ethereum().symbol, ethereum().name, "Invalid Address", res);

    } else {

      var balance_value = await web3.eth.getBalance(address);
      var balance_value_full = web3.utils.fromWei(balance_value);

      var wallet = [
        {
          address: address,
          address_url: ethereum("address/" + address).explorer,
          balance: parseInt(balance_value),
          decimal: parseInt(ethereum(address).decimal),
          symbol: ethereum(address).symbol,
          full_balance: balance_value_full + " " + ethereum(address).symbol,
          full_balance_float: parseFloat(balance_value_full)
        }
      ];
      ok2(req.headers.authorization, "getBalanceByAddress", 'SUCCESSFUL', ethereum(address).symbol, ethereum(address).name, wallet, res);

    }

  } catch (e) {
    fail2(req.headers.authorization, "getBalanceByAddress", 'UNSUCCESSFUL', ethereum().symbol, ethereum().name, e.message, res);

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

    var tx = await web3.eth.getTransaction(txnHash);

    var gasUsed = (await web3.eth.getTransactionReceipt(txnHash)).gasUsed;

    const currentBlock = await web3.eth.getBlockNumber();
    const block_confirmation = currentBlock - tx.blockNumber;

    var amount_value_full = await web3.utils.fromWei(tx.value);
    var gas_value_full = await web3.utils.fromWei(tx.gasPrice) * gasUsed;

    var blockinfo = await web3.eth.getBlock(tx.blockNumber);

    var wallet = [
      {
        timestamp: blockinfo.timestamp,
        timestamp_text: timeConverter(blockinfo.timestamp),
        tx: txnHash,
        full_url_tx: ethereum(txnHash).tx_explorer,
        block: tx.blockNumber,
        block_confirmation: block_confirmation,
        confirmation_status: blockConfirmationStatus(parseInt(block_confirmation)),
        amount: parseInt(tx.value),
        decimal: parseInt(ethereum().decimal),
        full_amount: amount_value_full + " " + ethereum().symbol,
        full_amount_float: parseFloat(amount_value_full),
        gas: parseInt(tx.gasPrice * gasUsed),
        gasUsed: parseInt(gasUsed),
        gasPrice: web3.utils.fromWei(tx.gasPrice) + " " + ethereum().symbol,
        full_gas: gas_value_full + " " + ethereum().symbol,
        full_gas_float: parseFloat(gas_value_full),
        sender: tx.from,
        receiver: tx.to,
        // message: hex_to_ascii(tx.input.slice(2))
      }
    ];

    ok2(req.headers.authorization, "getTransactionByTxHash", 'SUCCESSFUL', ethereum().symbol, ethereum().name, wallet, res);

  } catch (e) {
    fail2(req.headers.authorization, "getTransactionByTxHash", 'UNSUCCESSFUL', ethereum().symbol, ethereum().name, e.message, res);
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

    var validAddress = web3.utils.isAddress(address);

    if (!validAddress) {
      return fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', ethereum().symbol, ethereum().name, "Invalid Address", res);

    } else {
      const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&page=1&offset=${limit}&startblock=0&endblock=99999999&sort=desc&apikey=HPB8TZ3FMXP3WIFU3XSWDAICSK8IWYA5ST`;

      const tx = await get(url).catch((e) => {
        return fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', ethereum().symbol, ethereum().name, e.message, res);
      });

      const fruits = [];

      for (var i = 0; i < tx.data.result.length; i++) {

        var amount_value_full = web3.utils.fromWei(tx.data.result[i].value);
        var gasUsed = (await web3.eth.getTransactionReceipt(tx.data.result[i].hash)).gasUsed;
        var gas_value_full = web3.utils.fromWei(tx.data.result[i].gasPrice) * gasUsed;

        fruits.push({
          type: senderReceiver(tx.data.result[i].from, address),
          timestamp: parseInt(tx.data.result[i].timeStamp),
          timestamp_text: timeConverter(parseInt(tx.data.result[i].timeStamp)),
          tx: tx.data.result[i].hash,
          full_url_tx: ethereum(tx.data.result[i].hash).tx_explorer,
          block: parseInt(tx.data.result[i].blockNumber),
          block_confirmation: parseInt(tx.data.result[i].confirmations),
          confirmation_status: blockConfirmationStatus(parseInt(tx.data.result[i].confirmations)),
          amount: parseInt(tx.data.result[i].value),
          decimal: parseInt(ethereum().decimal),
          full_amount: amount_value_full + " " + ethereum().symbol,
          full_amount_float: parseFloat(amount_value_full),
          gas: parseInt(tx.data.result[i].gasPrice * gasUsed),
          gasUsed: parseInt(gasUsed),
          gasPrice: web3.utils.fromWei(tx.data.result[i].gasPrice) + " " + ethereum().symbol,
          full_gas: gas_value_full + " " + ethereum().symbol,
          full_gas_float: parseFloat(gas_value_full),
          sender: tx.data.result[i].from,
          receiver: tx.data.result[i].to,
          // message: hex_to_ascii(tx.data.result[i].input.slice(2))
        });
      }

      var wallet = [
        {
          address: address,
          address_url: ethereum("address/" + address).explorer,
          transactions: fruits
        }
      ];

      ok2(req.headers.authorization, "getTransactionByAddress", 'SUCCESSFUL', ethereum("").symbol, ethereum().name, wallet, res);
    }

  } catch (e) {
    fail2(req.headers.authorization, "getTransactionByAddress", 'UNSUCCESSFUL', ethereum().symbol, ethereum().name, e.message, res);

  }
});

router.post('/gasEstimate', async function (req, res, next) {

  try {
    const sender = req.body.sender;
    const receiver = req.body.receiver;
    const amount = req.body.amount;
    let gaslimit = 21000

    var validAddress = await web3.utils.isAddress(sender);

    var balanceWei = await web3.eth.getBalance(sender);
    var balance = web3.utils.fromWei(balanceWei);

    if (!validAddress) {
      return fail2(req.headers.authorization, "gasEstimate", 'UNSUCCESSFUL', ethereum().symbol, ethereum().name, "Invalid Address", res);

    } else {
      const nonce = await web3.eth.getTransactionCount(sender);

      if (receiver == "") {
        await web3.eth.estimateGas({
          nonce: web3.utils.toHex(nonce),
          from: sender,
          to: receiver,
          value: web3.utils.toWei(amount.toString())
        }).then(async (limitgas) => {
          const gasPrice = await web3.eth.getGasPrice();

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
                  inBNB: web3.utils.fromWei(parseInt(gasPrice * 1.9).toString(), 'ether')
                },
                halfHourFee: {
                  inWei: parseInt(gasPrice * 1.5),
                  inBNB: web3.utils.fromWei(parseInt(gasPrice * 1.5).toString(), 'ether')
                },
                hourFee: {
                  inWei: parseInt(gasPrice),
                  inBNB: web3.utils.fromWei(parseInt(gasPrice).toString(), 'ether')
                }
              },
              networkFee: {
                fastestFee: {
                  inWei: parseInt((gasPrice * 1.9) * gaslimit),
                  inBNB: parseFloat(web3.utils.fromWei(parseInt((gasPrice * 1.9) * gaslimit).toString(), 'ether'))
                },
                halfHourFee: {
                  inWei: parseInt((gasPrice * 1.5) * gaslimit),
                  inBNB: parseFloat(web3.utils.fromWei(parseInt((gasPrice * 1.5) * gaslimit).toString(), 'ether'))
                },
                hourFee: {
                  inWei: parseInt((gasPrice) * gaslimit),
                  inBNB: parseFloat(web3.utils.fromWei(parseInt((gasPrice) * gaslimit).toString(), 'ether'))
                }
              },
              balance: {
                before: parseFloat(balance),
                after: {
                  fastestFee: parseFloat(balance) - (parseFloat(web3.utils.fromWei(parseInt((gasPrice * 1.9) * gaslimit).toString(), 'ether'))),
                  halfHourFee: parseFloat(balance) - (parseFloat(web3.utils.fromWei(parseInt((gasPrice * 1.5) * gaslimit).toString(), 'ether'))),
                  hourFee: parseFloat(balance) - (parseFloat(web3.utils.fromWei(parseInt((gasPrice) * gaslimit).toString(), 'ether')))
                }
              }
            }
          ];

          ok2(req.headers.authorization, "gasEstimate", 'SUCCESSFUL', ethereum().symbol, ethereum().name, wallet, res);
        }).catch(async () => {
          const gasPrice = await web3.eth.getGasPrice();

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
                  inBNB: web3.utils.fromWei(parseInt(gasPrice * 1.9).toString(), 'ether')
                },
                halfHourFee: {
                  inWei: parseInt(gasPrice * 1.5),
                  inBNB: web3.utils.fromWei(parseInt(gasPrice * 1.5).toString(), 'ether')
                },
                hourFee: {
                  inWei: parseInt(gasPrice),
                  inBNB: web3.utils.fromWei(parseInt(gasPrice).toString(), 'ether')
                }
              },
              networkFee: {
                fastestFee: {
                  inWei: parseInt((gasPrice * 1.9) * gaslimit),
                  inBNB: parseFloat(web3.utils.fromWei(parseInt((gasPrice * 1.9) * gaslimit).toString(), 'ether'))
                },
                halfHourFee: {
                  inWei: parseInt((gasPrice * 1.5) * gaslimit),
                  inBNB: parseFloat(web3.utils.fromWei(parseInt((gasPrice * 1.5) * gaslimit).toString(), 'ether'))
                },
                hourFee: {
                  inWei: parseInt((gasPrice) * gaslimit),
                  inBNB: parseFloat(web3.utils.fromWei(parseInt((gasPrice) * gaslimit).toString(), 'ether'))
                }
              },
              balance: {
                before: parseFloat(balance),
                after: {
                  fastestFee: parseFloat(balance) - (parseFloat(web3.utils.fromWei(parseInt((gasPrice * 1.9) * gaslimit).toString(), 'ether'))),
                  halfHourFee: parseFloat(balance) - (parseFloat(web3.utils.fromWei(parseInt((gasPrice * 1.5) * gaslimit).toString(), 'ether'))),
                  hourFee: parseFloat(balance) - (parseFloat(web3.utils.fromWei(parseInt((gasPrice) * gaslimit).toString(), 'ether')))
                }
              }
            }
          ];

          ok2(req.headers.authorization, "gasEstimate", 'SUCCESSFUL', ethereum().symbol, ethereum().name, wallet, res);
        });
      } else {
        await web3.eth.estimateGas({
          nonce: web3.utils.toHex(nonce),
          from: sender,
          to: receiver,
          value: web3.utils.toWei(amount.toString())
        }).then(async (limitgas) => {
          const gasPrice = await web3.eth.getGasPrice();

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
                  inETH: web3.utils.fromWei(parseInt(gasPrice * 1.9).toString(), 'ether')
                },
                halfHourFee: {
                  inWei: parseInt(gasPrice * 1.5),
                  inETH: web3.utils.fromWei(parseInt(gasPrice * 1.5).toString(), 'ether')
                },
                hourFee: {
                  inWei: parseInt(gasPrice),
                  inETH: web3.utils.fromWei(parseInt(gasPrice).toString(), 'ether')
                }
              },
              networkFee: {
                fastestFee: {
                  inWei: parseInt((gasPrice * 1.9) * gaslimit),
                  inETH: parseFloat(web3.utils.fromWei(parseInt((gasPrice * 1.9) * gaslimit).toString(), 'ether'))
                },
                halfHourFee: {
                  inWei: parseInt((gasPrice * 1.5) * gaslimit),
                  inETH: parseFloat(web3.utils.fromWei(parseInt((gasPrice * 1.5) * gaslimit).toString(), 'ether'))
                },
                hourFee: {
                  inWei: parseInt((gasPrice) * gaslimit),
                  inETH: parseFloat(web3.utils.fromWei(parseInt((gasPrice) * gaslimit).toString(), 'ether'))
                }
              },
              balance: {
                before: parseFloat(balance),
                after: {
                  fastestFee: parseFloat(balance) - (parseFloat(web3.utils.fromWei(parseInt((gasPrice * 1.9) * gaslimit).toString(), 'ether'))),
                  halfHourFee: parseFloat(balance) - (parseFloat(web3.utils.fromWei(parseInt((gasPrice * 1.5) * gaslimit).toString(), 'ether'))),
                  hourFee: parseFloat(balance) - (parseFloat(web3.utils.fromWei(parseInt((gasPrice) * gaslimit).toString(), 'ether')))
                }
              }
            }
          ];

          ok2(req.headers.authorization, "gasEstimate", 'SUCCESSFUL', ethereum().symbol, ethereum().name, wallet, res);
        }).catch(async () => {
          const gasPrice = await web3.eth.getGasPrice();

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
                  inETH: web3.utils.fromWei(parseInt(gasPrice * 1.9).toString(), 'ether')
                },
                halfHourFee: {
                  inWei: parseInt(gasPrice * 1.5),
                  inETH: web3.utils.fromWei(parseInt(gasPrice * 1.5).toString(), 'ether')
                },
                hourFee: {
                  inWei: parseInt(gasPrice),
                  inETH: web3.utils.fromWei(parseInt(gasPrice).toString(), 'ether')
                }
              },
              networkFee: {
                fastestFee: {
                  inWei: parseInt((gasPrice * 1.9) * gaslimit),
                  inETH: parseFloat(web3.utils.fromWei(parseInt((gasPrice * 1.9) * gaslimit).toString(), 'ether'))
                },
                halfHourFee: {
                  inWei: parseInt((gasPrice * 1.5) * gaslimit),
                  inETH: parseFloat(web3.utils.fromWei(parseInt((gasPrice * 1.5) * gaslimit).toString(), 'ether'))
                },
                hourFee: {
                  inWei: parseInt((gasPrice) * gaslimit),
                  inETH: parseFloat(web3.utils.fromWei(parseInt((gasPrice) * gaslimit).toString(), 'ether'))
                }
              },
              balance: {
                before: parseFloat(balance),
                after: {
                  fastestFee: parseFloat(balance) - (parseFloat(web3.utils.fromWei(parseInt((gasPrice * 1.9) * gaslimit).toString(), 'ether'))),
                  halfHourFee: parseFloat(balance) - (parseFloat(web3.utils.fromWei(parseInt((gasPrice * 1.5) * gaslimit).toString(), 'ether'))),
                  hourFee: parseFloat(balance) - (parseFloat(web3.utils.fromWei(parseInt((gasPrice) * gaslimit).toString(), 'ether')))
                }
              }
            }
          ];
          ok2(req.headers.authorization, "gasEstimate", 'SUCCESSFUL', ethereum().symbol, ethereum().name, wallet, res);
        });
      }
    }
  } catch (e) {
    fail2(req.headers.authorization, "gasEstimate", 'UNSUCCESSFUL', ethereum().symbol, ethereum().name, e.message, res);

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

    const validAddressSender = await web3.utils.isAddress(sender);
    const validAddressReceiver = await web3.utils.isAddress(receiver);

    console.log("Validating address...");

    if (!(validAddressSender && validAddressReceiver)) {
      return fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', ethereum().symbol, ethereum().name, "Invalid Address", res);

    } else {

      console.log("Valid sender and receiver address...");

      var amount = web3.utils.toWei(amount_tosend.toString());

      const nonce = await web3.eth.getTransactionCount(sender);

      const txParams = {
        nonce: web3.utils.toHex(nonce),
        // gasPrice: web3.utils.toHex(parseInt(parseFloat(gasprice_var) * Math.pow(10, ethereum().decimal))),
        gasPrice: web3.utils.toHex(gasprice_var),
        gasLimit: web3.utils.toHex(gaslimit_var),
        from: sender,
        value: web3.utils.toHex(amount),
        to: receiver,
        // data: web3.utils.toHex(message)
      }
      console.log(`Transaction param :${JSON.stringify(txParams)}`);

      const customChainParams = { name: 'custom', chainId: 1 }
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
      const receipt = await web3.eth.sendSignedTransaction("0x" + serializedTx);
      console.log(`Receipt : ${JSON.stringify(receipt)}`);

      var amount_value_full = await web3.utils.fromWei(amount.toString());


      var wallet = [
        {
          tx: receipt.transactionHash,
          full_url_tx: ethereum(receipt.transactionHash).tx_explorer,
          amount: parseInt(amount),
          decimal: ethereum().decimal,
          full_amount: amount_value_full + " " + ethereum().symbol,
          amount_float: parseFloat(amount_value_full),
          gas: receipt.gasUsed * gasprice_var,
          gasUsed: receipt.gasUsed,
          gasLimit: gaslimit_var,
          gasPrice: web3.utils.fromWei(gasprice_var.toString(), 'ether') + " " + ethereum().symbol,
          gasPrice: gasprice_var,
          sender: receipt.from,
          receiver: receipt.to,
          // message: message
        }
      ];

      ok2(req.headers.authorization, "sendTransaction", 'SUCCESSFUL', ethereum().symbol, ethereum().name, wallet, res);
    }


  } catch (e) {
    fail2(req.headers.authorization, "sendTransaction", 'UNSUCCESSFUL', ethereum().symbol, ethereum().name, e.message, res);

  }

});

// router.post('/sendSerializedTransaction', async function (req, res, next) {
//   try {
//     const serializedTx = req.body.sender;

//     const receipt = await web3.eth.sendSignedTransaction("0x" + serializedTx);

//     ok2(req.headers.authorization, "sendSerializedTransaction", 'SUCCESSFUL', ethereum("").symbol, ethereum().name, wallet, res);

//   } catch (e) {
//     fail2(req.headers.authorization, "sendSerializedTransaction", 'UNSUCCESSFUL', ethereum().symbol, ethereum().name, e.message, res);

//   }

// });

export default router;
