"use strict";

import jwt from "jsonwebtoken";

export async function ok(values, res) {
    var data = {
        status: 200,
        values: values,
    };
    res.json(data);
    res.end();
}

export async function ok2(apikey, api_function, message, symbol, name, result, res) {


    jwt.verify(apikey, process.env.JWT_SECRET_KEY, function (err, decoded) {
        if (err) {
            res.status(401).json({ message: 'Please register token first.' });
            return;
        } else {
            const myObj = {
                "status": true,
                "api_key": apikey,
                "message": message,
                "api_function": api_function,
                "symbol": symbol,
                "name": name,
                "result": result,
            };
            res.status(200).json(myObj);
            return;
        }
    });
}

export async function fail2(apikey, api_function, message, symbol, name, result, res) {

    jwt.verify(apikey, process.env.JWT_SECRET_KEY, function (err, decoded) {
        if (err) {
            return res.status(401).json({ message: 'Please register token first.' });
        } else {
            const myObj = {
                "status": true,
                "api_key": apikey,
                "message": message,
                "api_function": api_function,
                "symbol": symbol,
                "name": name,
                "result": result,
            };
            console.error(`${symbol} -> ${api_function} : ${result}`);
            return res.status(400).json(myObj);
        }
    });
}


export async function fail(values, res) {
    var data = {
        status: values,
        error: values,
    };
    res.json(data);
}