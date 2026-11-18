// PM2 process definition: keeps the app running, restarts it if it crashes,
// and (after `pm2 startup` in setup-server.sh) starts it again after a reboot.
const path = require("path");

const base = path.resolve(__dirname, "..", ".."); // folder that holds app/, releases/, current
const envFile = process.env.APP_ENV_FILE || path.join(base, ".env.production");

module.exports = {
  apps: [
    {
      name: "a2000",
      cwd: path.join(base, "current"),
      script: "server.js",
      node_args: `--env-file=${envFile}`,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "127.0.0.1", // only reachable through Nginx
      },
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "700M",
      time: true,
    },
  ],
};
