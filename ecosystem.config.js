module.exports = {
  apps: [
    {
      name: "Main",
      script: "yarn start",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      merge_logs: true,
      output: "./logs/access.log",
      error: "./logs/error.log",
    },
    {
      name: "OPHW",
      script: "node dist/workers/officialPriceWorker.js",
      exec_mode: "fork",
      instances: 8,
      autorestart: true,
      watch: false,
      merge_logs: true,
      output: "./logs/OPHWaccess.log",
      error: "./logs/OPHWerror.log",
    },
    {
      name: "IW",
      script: "node dist/workers/inventoryWorker.js",
      exec_mode: "fork",
      instances: 2,
      autorestart: true,
      watch: false,
      merge_logs: true,
      output: "./logs/IWaccess.log",
      error: "./logs/IWerror.log",
    },
  ],
};
