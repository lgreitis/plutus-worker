module.exports = {
  apps: [
    {
      name: "dev",
      script: "yarn start",
      exec_mode: "fork",
      instances: 4,
      autorestart: true,
      watch: false,
      merge_logs: true,
      output: "./logs/access.log",
      error: "./logs/error.log",
    },
  ],
};
