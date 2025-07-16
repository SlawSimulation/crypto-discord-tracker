import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const token = process.env.DISCORD_TOKEN;

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
const tokens = {
  doge: 'dogecoin',
  shdw: 'genesysgo-shadow',
  yfi: 'yearn-finance',
  usdc: 'usd-coin',
};

async function fetchPrices() {
  const ids = Object.values(tokens).join(',');
  const url = `${COINGECKO_API}?ids=${ids}&vs_currencies=usd`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`CoinGecko API error: ${response.statusText}`);
  return response.json();
}

async function updateStatus() {
  try {
    const data = await fetchPrices();
    const prices = {
      DOGE: data[tokens.doge]?.usd,
      SHDW: data[tokens.shdw]?.usd,
      YFI: data[tokens.yfi]?.usd,
      USDC: data[tokens.usdc]?.usd,
    };

    const status = `DOGE $${prices.DOGE?.toFixed(4)} | SHDW $${prices.SHDW?.toFixed(4)} | YFI $${prices.YFI?.toFixed(2)} | USDC $${prices.USDC?.toFixed(2)}`;
    await client.user.setActivity(status, { type: 'WATCHING' });
    console.log(`✅ Status updated: ${status}`);
  } catch (err) {
    console.error('❌ Failed to update status:', err);
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await updateStatus();

  // Update every 5 minutes
  setInterval(updateStatus, 5 * 60 * 1000);
});

client.login(token);
