import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.SECRET_KEY) {
  throw new Error("No secret key setup in .env");
}

export const SECRET_KEY = process.env.SECRET_KEY;
