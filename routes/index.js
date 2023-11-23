var express = require('express');
var router = express.Router();
var bitcore = require('bitcore-lib');
var Web3 = require('web3');
var web3 = new Web3("");

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/createWallet', function (req, res) {
  var pass = req.body.passphrase;

  var value = Buffer.from(pass.replace(/-/g, ' '));
  var hash = bitcore.crypto.Hash.sha256(value);
  var bn = bitcore.crypto.BN.fromBuffer(hash);
  var bitcoinPb = new bitcore.PrivateKey(bn, testnet).toAddress().toString();
  var bitcoinPk = new bitcore.PrivateKey(bn, testnet).toWIF();

  //bsc
  var bsc = web3bsc.eth.accounts.create(pass);

  var wallet = [
    {
      name: "BTC",
      addr: bitcoinPb,
      pk: bitcoinPk

    },
    {
      name: "BSC",
      addr: bsc.address,
      pk: bsc.privateKey
    }
  ]

  res.send(wallet);
});

module.exports = router;
