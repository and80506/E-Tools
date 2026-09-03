module.exports = {
  port: 8080,
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
  },
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  },
  optimizeDeps: {
    exclude: ['better-sqlite3', 'express', 'cors', 'dotenv', 'axios']
  }
}
