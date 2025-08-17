module.exports = {
  apps: [
    {
      name: 'italian-meme-discord-bot',
      script: 'index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/discord-bot-error.log',
      out_file: './logs/discord-bot-out.log',
      log_file: './logs/discord-bot-combined.log',
      time: true
    },
    {
      name: 'italian-meme-backend',
      script: 'backend-starter.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        BACKEND_PORT: 3001,
        PORT: 3001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'italian-meme-dashboard',
      script: 'dashboard/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        DASHBOARD_PORT: 3002,
        PORT: 3002
      },
      error_file: './logs/dashboard-error.log',
      out_file: './logs/dashboard-out.log',
      log_file: './logs/dashboard-combined.log',
      time: true
    }
  ],

  deploy: {
    production: {
      user: 'root',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/Phantasm0009/MemeX.git',
      path: '/var/www/italian-meme-exchange',
      'post-deploy': 'npm ci && pm2 reload ecosystem.config.cjs --env production'
    }
  }
};
