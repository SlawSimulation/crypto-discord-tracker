// post-message.js
import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const token = process.env.DISCORD_TOKEN;
const channelId = process.env.DISCORD_CHANNEL_ID;

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';

const tokens = {
  doge: 'dogecoin',
  shdw: 'genesysgo-shadow',
  yfi: 'yearn-finance',
  usdc: 'usd-coin',
};

async function fetchPrices(ids) {
  const url = `${COINGECKO_API}?ids=${ids}&vs_currencies=usd`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`CoinGecko API error: ${response.statusText}`);
  return response.json();
}

async function fetchUsdToGbpRate() {
  const response = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!response.ok) throw new Error(`Exchange API error: ${response.statusText}`);
  const data = await response.json();
  const gbpRate = data.rates?.GBP;
  if (!gbpRate) throw new Error('GBP rate not found');
  return gbpRate;
}

client.once('ready', async () => {
  try {
    console.log(`Logged in as ${client.user.tag}`);

    const ids = Object.values(tokens).join(',');
    const [pricesData, gbpRate] = await Promise.all([
      fetchPrices(ids),
      fetchUsdToGbpRate(),
    ]);

    const formatToken = (name, id) => {
      const usd = pricesData[id]?.usd;
      if (usd === undefined) throw new Error(`Price missing for ${name}`);
      const gbp = usd * gbpRate;
      return `📈 **${name} Price:**\nUSD: $${usd.toFixed(4)}\nGBP: £${gbp.toFixed(4)}\n`;
    };

    const message =
      `${formatToken('DOGE (Dogecoin)', tokens.doge)}\n` +
      `${formatToken('SHDW (Shadow Token)', tokens.shdw)}\n` +
      `${formatToken('YFI (yearn.finance)', tokens.yfi)}\n` +
      `${formatToken('USDC (Stablecoin)', tokens.usdc)}\n` +
      `-------------------------------------------------\n` +
      `📅 Updated: ${new Date().toUTCString()}`;

    const channel = await client.channels.fetch(channelId);
    if (!channel) throw new Error('Channel not found');

    await channel.send(message);
    console.log('✅ Message sent');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.destroy();
  }
});

client.login(token);
