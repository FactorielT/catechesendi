// Démarrage permanent avec PM2 :  pm2 start ecosystem.config.js  puis  pm2 save
module.exports = { apps: [{ name: "catechesendi", script: "server.js", instances: 1, autorestart: true, max_memory_restart: "500M", env: { NODE_ENV: "production" } }] };
