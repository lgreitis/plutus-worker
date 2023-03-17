import { exec } from "node:child_process";
import { Proxy } from "src/types";

const fetcherCommand =
  "cd ~/ballyregan && poetry run ballyregan get -o json -l 10";

class ProxyRotationHandler {
  private currentCount: number;
  private proxyList: Proxy[];
  private currentProxy?: Proxy;

  constructor() {
    this.currentCount = 0;
    this.proxyList = [];
  }

  private async fetchProxyList(): Promise<Proxy[]> {
    return new Promise((resolve, reject) => {
      exec(fetcherCommand, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        if (stderr) {
          reject(stderr);
          return;
        }

        resolve(
          JSON.parse(
            stdout
              .toString()
              .replace(/'/g, '"')
              .replace(/"Cote D"Ivoire"/g, `"Cote D'Ivoire"`)
          )
        );
      });
    });
  }

  private shouldFetchProxies(): boolean {
    return this.currentCount >= this.proxyList.length;
  }

  private async getProxies() {
    this.proxyList = await this.fetchProxyList();
    this.currentCount = 0;
  }

  async getNewProxy(): Promise<Proxy> {
    if (this.shouldFetchProxies()) {
      await this.getProxies();
    }
    this.currentProxy = this.proxyList[this.currentCount++];
    return this.currentProxy;
  }

  async getCurrentProxy(): Promise<Proxy> {
    return this.currentProxy || this.getNewProxy();
  }

  clearProxies() {
    this.proxyList = [];
  }
}

export default ProxyRotationHandler;
