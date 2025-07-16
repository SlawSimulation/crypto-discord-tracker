import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const token = process.env.DISCORD_TOKEN;
const apiKey = process.env.API_KEY;

async function fetchDogePrice() {
  const res = await fetch('https://api.api-ninjas.com/v1/cryptoprice?symbol=DOGEUSD', {
    headers: { 'X-Api-Key': apiKey },
  });
  if (!res.ok) throw new Error(`API Ninjas Doge API error: ${res.statusText}`);
  const data = await res.json();
  const priceUsd = Number(data.price);
  if (isNaN(priceUsd)) throw new Error('Invalid Doge price');
  return priceUsd;
}

async function fetchShdwPrice() {
  const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=genesysgo-shadow&vs_currencies=usd');
  if (!res.ok) throw new Error(`CoinGecko SHDW API error: ${res.statusText}`);
  const data = await res.json();
  const priceUsd = Number(data["genesysgo-shadow"]?.usd);
  if (isNaN(priceUsd)) throw new Error('Invalid SHDW price');
  return priceUsd;
}

async function fetchUsdToGbpRate() {
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!res.ok) throw new Error(`Exchange API error: ${res.statusText}`);
  const data = await res.json();
  const gbpRate = data.rates?.GBP;
  if (!gbpRate) throw new Error('GBP rate missing');
  return gbpRate;
}

async function updateStatus() {
  try {
    const [dogeUsd, shdwUsd, gbpRate] = await Promise.all([
      fetchDogePrice(),
      fetchShdwPrice(),
      fetchUsdToGbpRate(),
    ]);

    const dogeGbp = dogeUsd * gbpRate;
    const shdwGbp = shdwUsd * gbpRate;

    const status = `DOGE $${dogeUsd.toFixed(4)} | SHDW $${shdwUsd.toFixed(4)} | GBP £${((dogeGbp + shdwGbp) / 2).toFixed(4)}`;

    await client.user.setActivity(status, { type: 'WATCHING' });
    console.log(`Status updated: ${status}`);
  } catch (e) {
    console.error('Failed to update status:', e);
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await updateStatus();
  await client.destroy();
  process.exit(0);
});

client.login(token);
