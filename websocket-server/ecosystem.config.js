module.exports = {
  apps: [{
    name: 'gaterlink-websocket',
    script: './dist/index.js',
    instances: 'max', // Use all available CPUs
    exec_mode: 'cluster', // Enable cluster mode for load balancing
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    merge_logs: true,
    
    // Auto-restart configuration
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Environment specific settings
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      LOG_LEVEL: 'info'
    },
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3001,
      LOG_LEVEL: 'debug'
    }
  }]
};