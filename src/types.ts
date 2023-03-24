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

export interface InventoryFetchPoolData {
  userId: string;
  steamId: string;
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

export interface SteamApisItem {
  nameID: string;
  market_name: string;
  market_hash_name: string;
  border_color: string;
  image: string;
  prices: {
    latest: number;
    min: number;
    avg: number;
    max: number;
    median: number | null;
    safe: number;
    safe_ts: {
      last_24h: number;
      last_7d: number;
      last_30d: number;
      last_90d: number;
    };
    sold: {
      last_24h: number;
      last_7d: number;
      last_30d: number;
      last_90d: number;
      avg_daily_volume: number | null;
    };
    unstable: boolean;
    unstable_reason:
      | "NO_SALES_WEEK"
      | "NO_SALES_MONTH"
      | "NO_SALES_3PLUS_MONTHS"
      | "NO_SALES_OVERALL"
      | "LOW_SALES_WEEK"
      | "LOW_SALES_MONTH"
      | "LOW_SALES_3PLUS_MONTHS"
      | "LOW_SALES_OVERALL";
    first_seen: number;
  };
  updated_at: number;
}

export interface SteamApisResponse {
  appID: string;
  data: SteamApisItem[];
}
