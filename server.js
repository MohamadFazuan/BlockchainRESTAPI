import createError from 'http-errors';
import express, { json, urlencoded } from 'express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import dotenv from 'dotenv';
dotenv.config();
// import { MongoClient } from 'mongodb';
// import mongoose from 'mongoose';

import bscRouter from './routes/bsc.js';
import btcRouter from './routes/btc.js';
import kunciRouter from './routes/kunci.js';
import ethRouter from './routes/eth.js';
import solRouter from './routes/sol.js';
import usdtRouter from './routes/usdt.js';
import walletRouter from './routes/wallet.js';

var app = express();

// view engine setup
// app.set('views', join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(join(__dirname, 'public')));

app.use('/v2/bsc', bscRouter);
app.use('/v2/btc', btcRouter);
app.use('/v2/kunci', kunciRouter);
app.use('/v2/eth', ethRouter);
app.use('/v2/sol', solRouter);
app.use('/v2/usdt', usdtRouter);
app.use('/v2/', walletRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

var server = app.listen(process.env.PORT, function () {
  var host = process.env.APP_URL
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)
});

export default app;
