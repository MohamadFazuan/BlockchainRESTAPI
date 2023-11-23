var eth = process.env.ETH_CHAINID;
var eth_test = process.env.ETH_TEST_CHAINID;

var bnb = process.env.BSC_CHAINID;
var bnb_test = process.env.BSC_TEST_CHAINID;

var sol = process.env.SOLANA_CHAINID;
var sol_test = process.env.SOLANA_TEST_CHAINID;


export function bitcoin(data) {
    const bitcoin = {
        
        "symbol": 'BTC',
        "name": 'BITCOIN',
        "decimal": 8,
        "explorer": `http://blockchain.com/${data}`,
        "tx_explorer": `http://blockchain.com/btc/tx/${data}`
    }
    return bitcoin;
}

export function ethereumTest(data) {
    const ethereum = {
        
        "symbol": 'ETH',
        "name": 'Rinkeby',
        "network": eth_test,
        "explorer": `https://etherscan.io/${data}`,
        "tx_explorer": `https://etherscan.io/tx/${data}`,
        "decimal": 18
    }
    return ethereum;
}

export function ethereum(data) {
    const ethereum = {
        
        "symbol": 'ETH',
        "name": 'Ethereum',
        "network": eth,
        "explorer": `https://etherscan.io/${data}`,
        "tx_explorer": `https://etherscan.io/tx/${data}`,
        "decimal": 18
    }
    return ethereum;
}


export function binanceTest(data) {
    const binance = {
        
        "symbol": 'BNB',
        "name": 'Binance Smart Chain',
        "network": bnb_test,
        "explorer": `https://www.bscscan.com/${data}`,
        "decimal": 18,
    }
    return binance;
}

export function kunci(data) {
    const kunci = {
        
        "symbol": 'KUNCI',
        "name": 'KUNCI (Binance Smart Chain)',
        "network": bnb,
        "decimal": 6,
        "explorer": `https://bscscan.com/token/0x6cf271270662be1c4fc1b7bb7d7d7fc60cc19125?a=${data}`,
        "tx_explorer": "https://www.bscscan.com/tx/"
    }
    return kunci;
}


export function binance(data) {
    const binance = {
        
        "symbol": 'BNB',
        "name": 'Binance Smart Chain',
        "network": bnb,
        "decimal": 18,
        "explorer": `https://www.bscscan.com/${data}`,
        "tx_explorer": `https://www.bscscan.com/tx/${data}`
    }
    return binance;
}


export function solanaTest(data) {
    const solana = {
        
        "symbol": 'SOL',
        "name": 'Solana',
        "network": sol_test,
        "explorer": `https://explorer.solana.com/${data}`,
        "tx_explorer": `https://explorer.solana.com/tx/${data}`,
        "decimal": 9
    }
    return solana;
}

export function solana(data) {
    const solana = {
        
        "symbol": 'SOL',
        "name": 'Solana',
        "network": sol,
        "explorer": `https://explorer.solana.com/${data}`,
        "tx_explorer": `https://explorer.solana.com/tx/${data}`,
        "decimal": 9
    }
    return solana;
}


export function usdt(data) {
    const kunci = {
        
        "symbol": 'USDT',
        "name": 'USDT (BEP20)',
        "network": bnb,
        "decimal": 18,
        "explorer": `https://bscscan.com/token/0x55d398326f99059fF775485246999027B3197955?a=${data}`,
        "tx_explorer": "https://www.bscscan.com/tx/"
    }
    return kunci;
}
