module.exports = {
  port: 8080,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  },
  optimizeDeps: {
    exclude: ['better-sqlite3', 'express', 'cors']
  }
}
