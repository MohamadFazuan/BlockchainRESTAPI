import { Router } from 'express';
var router = Router();
import dotenv from 'dotenv';
dotenv.config();
import { ok, fail } from '../config/resformat.js';
import jwt from 'jsonwebtoken';
import bip39 from 'bip39';
import ethers from 'ethers';
import * as Web3 from '@solana/web3.js';
import bitcore from 'bitcore-lib';

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/registerToken', function (req, res) {
  try {
    var email = req.body.email;
    var name = req.body.name;

    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    let data = {
      email: email,
      name: name,
    }

    const token = jwt.sign(data, jwtSecretKey);
    const value = {
      success: true,
      message: "Authentication successful!",
      token: token,
    };

    ok(value, res);
  } catch (e) {
    res.status(401).send({
      message: e.message
    })
  }
});

router.get('/createWallet', function (req, res) {
  try {

    const mnemonic = bip39.generateMnemonic();

    // bsc
    const bsc = ethers.Wallet.fromMnemonic(mnemonic);

    //eth
    const eth = ethers.Wallet.fromMnemonic(mnemonic);

    //btc
    var buf = Buffer.from(mnemonic.replace(/-/g, ' '));
    var hash = bitcore.crypto.Hash.sha256(buf);
    var bn = bitcore.crypto.BN.fromBuffer(hash);
    var bitcoinPb = new bitcore.PrivateKey(bn, bitcore.Networks.mainnet).toAddress().toString();
    var bitcoinPk = new bitcore.PrivateKey(bn, bitcore.Networks.mainnet).toWIF();

    //sol
    const seed = bip39.mnemonicToSeedSync(mnemonic, ""); // (mnemonic, password)
    const sol = Web3.Keypair.fromSeed(seed.slice(0, 32));

    const value = {
      success: true,
      message: "Authentication successful!",
      wallet: mnemonic.split(" "),
      bsc:{
        address: bsc.address,
        privateKey: bsc.privateKey
      },
      eth:{
        address: eth.address,
        privateKey: eth.privateKey
      },
      btc: {
        address: bitcoinPb,
        privateKey: bitcoinPk
      },
      sol:{
        address: sol.publicKey,
        privateKey: Buffer.from(sol.secretKey).toString('hex')
      }
    };

    ok(value, res);
  } catch (e) {
    res.status(401).send({
      message: e.message
    })
  }
});

export default router;
