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
    {
      name: "SAHW",
      script: "node dist/workers/apiPriceWorker.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      merge_logs: true,
      output: "./logs/SAHWaccess.log",
      error: "./logs/SAHWerror.log",
    },
    {
      name: "EPW",
      script: "node dist/workers/exchangePriceWorker.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      merge_logs: true,
      output: "./logs/EPWaccess.log",
      error: "./logs/EPWerror.log",
    },
    {
      name: "DB",
      script: "node dist/workers/discordBot.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      merge_logs: true,
      output: "./logs/DBaccess.log",
      error: "./logs/DBerror.log",
    },
    {
      name: "MAIL",
      script: "node dist/workers/mailWorker.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      merge_logs: true,
      output: "./logs/MAILaccess.log",
      error: "./logs/MAILerror.log",
    },
  ],
};
