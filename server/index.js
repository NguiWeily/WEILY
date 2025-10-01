/**
 * AI LP Portfolio Manager - Backend (simplified, JS)
 * - Uses Alchemy SDK and ethers for on-chain reads
 * - Mocked LLM plan endpoint (returns structured JSON)
 * - Returns unsigned calldata placeholders (so frontend can sign)
 *
 * NOTE: This is a prototype. Do NOT use in production without security review.
 *
 * Environment variables:
 *  - ALCHEMY_API_KEY
 *  - OPENAI_API_KEY  (optional for real LLM integration)
 *
 * Run:
 *  cd server
 *  npm install
 *  node index.js
 */

const express = require('express');
const bodyParser = require('body-parser');
const { Alchemy, Network } = require('alchemy-sdk');
const ethers = require('ethers');
const fetch = require('node-fetch');
require('dotenv').config();

const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY || '';
if (!ALCHEMY_KEY) console.warn('Warning: ALCHEMY_API_KEY not set in .env');

const alchemy = new Alchemy({ apiKey: ALCHEMY_KEY, network: Network.ETH_MAINNET });
const provider = new ethers.providers.AlchemyProvider('homestead', ALCHEMY_KEY);

const app = express();
app.use(bodyParser.json());

const UNI_V2_PAIR_ABI = [
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function getReserves() view returns (uint112,uint112,uint32)',
  'function totalSupply() view returns (uint256)'
];
const ERC20_ABI = [
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function balanceOf(address) view returns (uint256)'
];

async function safeCall(contract, method, args = []) {
  try { return await contract[method](...args); } catch (e) { return undefined; }
}

async function getPriceUSD(tokenAddress) {
  // best-effort via CoinGecko contract endpoint
  try {
    const key = tokenAddress.toLowerCase();
    const r = await fetch(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${key}`);
    if (r.status === 200) {
      const j = await r.json();
      return j.market_data?.current_price?.usd ?? null;
    }
  } catch (e) {}
  return null;
}

app.get('/api/positions', async (req, res) => {
  const address = (req.query.address || '').trim();
  if (!ethers.utils.isAddress(address)) return res.status(400).json({ error: 'invalid address' });
  try {
    const tokenBalances = await alchemy.core.getTokenBalances(address);
    const nonZero = tokenBalances.tokenBalances.filter(t => t.tokenBalance && t.tokenBalance !== '0x0');
    const candidates = nonZero.slice(0, 80);
    const pools = [];

    for (const t of candidates) {
      const tokenAddress = t.contractAddress;
      if (!tokenAddress) continue;
      const pair = new ethers.Contract(tokenAddress, UNI_V2_PAIR_ABI, provider);
      const token0 = await safeCall(pair, 'token0');
      const token1 = await safeCall(pair, 'token1');
      const reserves = await safeCall(pair, 'getReserves');
      const totalSupply = await safeCall(pair, 'totalSupply');
      if (token0 && token1 && reserves && totalSupply) {
        try {
          const token0C = new ethers.Contract(token0, ERC20_ABI, provider);
          const token1C = new ethers.Contract(token1, ERC20_ABI, provider);
          const [sym0, sym1, dec0, dec1] = await Promise.all([
            safeCall(token0C, 'symbol'), safeCall(token1C, 'symbol'),
            safeCall(token0C, 'decimals'), safeCall(token1C, 'decimals')
          ]);
          const lpBalance = ethers.BigNumber.from(t.tokenBalance);
          const reserve0 = ethers.BigNumber.from(reserves[0]);
          const reserve1 = ethers.BigNumber.from(reserves[1]);
          const share = lpBalance.isZero() ? ethers.BigNumber.from(0) : lpBalance.mul(ethers.constants.WeiPerEther).div(totalSupply);
          const user0 = reserve0.mul(share).div(ethers.constants.WeiPerEther);
          const user1 = reserve1.mul(share).div(ethers.constants.WeiPerEther);
          const price0 = await getPriceUSD(token0);
          const price1 = await getPriceUSD(token1);
          const usd0 = price0 ? Number(ethers.utils.formatUnits(user0, dec0 ?? 18)) * price0 : null;
          const usd1 = price1 ? Number(ethers.utils.formatUnits(user1, dec1 ?? 18)) * price1 : null;
          const usdTotal = (usd0 ?? 0) + (usd1 ?? 0);
          pools.push({
            type: 'uniswap_v2',
            pairAddress: tokenAddress,
            token0: { address: token0, symbol: sym0, decimals: dec0, userAmount: user0.toString(), price: price0, usd: usd0 },
            token1: { address: token1, symbol: sym1, decimals: dec1, userAmount: user1.toString(), price: price1, usd: usd1 },
            totalSupply: totalSupply.toString(),
            lpBalance: lpBalance.toString(),
            usdValue: usdTotal
          });
        } catch (e) { continue; }
      }
    }

    res.json({ pools });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'failed to fetch positions' });
  }
});

app.post('/api/generate-plan', async (req, res) => {
  const { pools } = req.body;
  // Mock plan: suggest holding all
  const plan = {
    summary: `Mock plan for ${pools?.length || 0} pools`,
    steps: (pools || []).map((p, i) => ({ action: 'hold', pool: p.pairAddress || `pool-${i}`, percent: 100 }))
  };
  res.json({ text: JSON.stringify(plan, null, 2), plan });
});

app.post('/api/execute-plan', async (req, res) => {
  const { plan, address } = req.body;
  // Return unsigned placeholder txs for demo
  const unsignedTxs = [
    { to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', data: '0x' }
  ];
  res.json({ unsignedTxs });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
