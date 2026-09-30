// PM2 process file for production (see install.md, section 8).
// Start:  pm2 start ecosystem.config.cjs
// Reload: pm2 reload ecosystem.config.cjs --update-env
module.exports = {
  apps: [
    {
      name: "dsmtest",
      // cwd matters: Next.js loads .env from here and src/lib/storage.ts
      // resolves ./storage relative to process.cwd()
      cwd: __dirname,
      // run the Next.js binary directly (not via npm) so PM2 manages the real
      // node process and signals/restarts reach it
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000 -H 127.0.0.1",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      restart_delay: 5000,
      max_memory_restart: "1G",
      time: true,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
