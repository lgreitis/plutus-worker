module.exports = {
  apps: [
    {
      name: "Node",
      script: "yarn start",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      merge_logs: true,
      output: "./logs/access.log",
      error: "./logs/error.log",
    },
  ],
};
