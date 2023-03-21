import * as dotenv from "dotenv";

dotenv.config();

if (
  !process.env.SECRET_KEY ||
  !process.env.FETCH_PROXY_STRING ||
  !process.env.INVENTORY_PROXY_STRING
) {
  throw new Error("Bad .env");
}

export const SECRET_KEY = process.env.SECRET_KEY;
export const FETCH_PROXY_STRING = process.env.FETCH_PROXY_STRING;
export const INVENTORY_PROXY_STRING = process.env.INVENTORY_PROXY_STRING;
