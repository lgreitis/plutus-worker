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

export interface HttpResult {
  data: string;
  statusCode?: number;
}

export interface SteamInventoryResult {
  assets: SteamAsset[];
  descriptions: SteamDescription[];
  more_items: number;
  last_assetid: string;
  total_inventory_count: number;
  success: number;
  rwgrsn: number;
}
export interface SteamAsset {
  appid: number;
  contextid: string;
  assetid: string;
  classid: string;
  instanceid: string;
  amount: string;
}

export interface SteamDescription {
  appid: number;
  classid: string;
  instanceid: string;
  currency: number;
  market_hash_name: string;
}
