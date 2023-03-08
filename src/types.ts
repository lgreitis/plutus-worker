export interface Proxy {
  protocol: "http" | "https" | "socks4";
  ip: string;
  port: number;
  country: string;
  anonymity: string;
}

export interface OfficialPricePoolData {
  marketHashName: string;
}

export type SteamHistoryResult = [string, number, string];
