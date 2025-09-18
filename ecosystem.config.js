module.exports = {
  apps: [{
    name: 'sanadi-app',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: 'postgres://sanad:yaserxp1992@127.0.0.1:5432/sanadi_db'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: 'postgres://sanad:yaserxp1992@127.0.0.1:5432/sanadi_db'
    }
  }]
}
