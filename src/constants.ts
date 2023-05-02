import * as dotenv from "dotenv";

dotenv.config();

if (
  !process.env.SECRET_KEY ||
  !process.env.FETCH_PROXY_STRING ||
  !process.env.INVENTORY_PROXY_STRING ||
  !process.env.APIS_KEY ||
  !process.env.OPEN_EXCHANGE_RATES_APP_ID ||
  !process.env.DISCORD_TOKEN ||
  !process.env.DISCORD_APPLICATION_ID ||
  !process.env.SENDGRID_API_KEY
) {
  throw new Error("Bad .env");
}

export const SECRET_KEY = process.env.SECRET_KEY;
export const FETCH_PROXY_STRING = process.env.FETCH_PROXY_STRING;
export const INVENTORY_PROXY_STRING = process.env.INVENTORY_PROXY_STRING;
export const APIS_KEY = process.env.APIS_KEY;
export const OPEN_EXCHANGE_RATES_APP_ID =
  process.env.OPEN_EXCHANGE_RATES_APP_ID;
export const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
export const DISCORD_APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
