module.exports = {
  apps: [
    {
      name: 'sanadi-pro',
      script: 'dist/index.js',
      instances: 'max', // أو رقم محدد مثل 2
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_file: './.env',
      env_production: {
        NODE_ENV: 'production'
      },
      // إعدادات المراقبة والتسجيل
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      // إعادة التشغيل التلقائي
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      // استخدام الذاكرة
      max_memory_restart: '1G',
    }
  ],

  deploy: {
    production: {
      user: 'root',
      host: '147.93.59.185',
      ref: 'origin/main',
      repo: 'YOUR_GIT_REPOSITORY_URL',
      path: '/var/www/sanadi.pro',
      'post-deploy': 'npm install && node build-production.js && pm2 reload ecosystem.config.js --env production'
    }
  }
};