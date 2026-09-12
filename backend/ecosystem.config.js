/**
 * PM2 process manager config for AUTOHAUS backend.
 * Запуск (первый раз):    pm2 start ecosystem.config.js && pm2 save
 * Перезапуск (после git pull или правки .env):
 *                         pm2 restart autohaus-backend --update-env
 *
 * Логи:                   pm2 logs autohaus-backend --lines 40 --nostream
 */
module.exports = {
  apps: [
    {
      name: "autohaus-backend",
      cwd: "/home/autohaus/app/backend",
      script: "venv/bin/uvicorn",
      args: "server:app --host 127.0.0.1 --port 8001 --workers 2",
      interpreter: "none",
      env_file: "/home/autohaus/app/backend/.env",
      watch: false,
      autorestart: true,
      max_restarts: 10,
      error_file: "/home/autohaus/.pm2/logs/autohaus-error.log",
      out_file: "/home/autohaus/.pm2/logs/autohaus-out.log"
    }
  ]
};
