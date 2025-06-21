module.exports = {
  apps: [
    {
      name: 'excelidraw-frontend',
      cwd: './apps/excelidraw-frontend',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3000,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'http-backend',
      cwd: './apps/http-backend',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 4000,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'ws-backend',
      cwd: './apps/ws-backend',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 4001,
        NODE_ENV: 'production'
      }
    }
  ]
};