// post-message.js
import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const token = process.env.DISCORD_TOKEN;
const channelId = process.env.DISCORD_CHANNEL_ID;

async function fetchDogePrice() {
  const response = await fetch('https://api.api-ninjas.com/v1/cryptoprice?symbol=DOGEUSD', {
    headers: { 'X-Api-Key': process.env.API_KEY },
  });
  if (!response.ok) throw new Error(`API Ninjas Doge API error: ${response.statusText}`);
  const data = await response.json();
  const priceUsd = Number(data.price);
  if (isNaN(priceUsd)) throw new Error('Invalid Doge price');
  return priceUsd;
}

async function fetchShdwPrice() {
  const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=genesysgo-shadow&vs_currencies=usd');
  if (!response.ok) throw new Error(`CoinGecko SHDW API error: ${response.statusText}`);
  const data = await response.json();
  const priceUsd = Number(data["genesysgo-shadow"]?.usd);
  if (isNaN(priceUsd)) throw new Error('Invalid SHDW price');
  return priceUsd;
}

async function fetchUsdToGbpRate() {
  const exchangeResponse = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!exchangeResponse.ok) throw new Error(`Exchange rate API error: ${exchangeResponse.statusText}`);
  const exchangeData = await exchangeResponse.json();
  const gbpRate = exchangeData.rates?.GBP;
  if (!gbpRate) throw new Error('GBP rate not found');
  return gbpRate;
}

client.once('ready', async () => {
  try {
    console.log(`Logged in as ${client.user.tag}`);
    const gbpRate = await fetchUsdToGbpRate();

    // Fetch prices
    const [dogePriceUsd, shdwPriceUsd] = await Promise.all([
      fetchDogePrice(),
      fetchShdwPrice(),
    ]);

    // Calculate GBP
    const dogePriceGbp = dogePriceUsd * gbpRate;
    const shdwPriceGbp = shdwPriceUsd * gbpRate;

    const now = new Date().toUTCString();

    // Get channel
    const channel = await client.channels.fetch(channelId);
    if (!channel) throw new Error('Channel not found');

    // Compose message
    const message = `
📈 SHDW (Shadow Token) Price:
USD: $${shdwPriceUsd.toFixed(4)}
GBP: £${shdwPriceGbp.toFixed(4)}


📈 Dogecoin Price:
USD: $${dogePriceUsd.toFixed(4)}
GBP: £${dogePriceGbp.toFixed(4)}
📅 Updated: ${now}
    `.trim();

    await channel.send(message);

    console.log('Message sent successfully');
  } catch (err) {
    console.error('❌ Error posting prices:', err);
  } finally {
    client.destroy();
  }
});

client.login(token);
