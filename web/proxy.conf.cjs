const target = process.env.RETROVAULT_API_URL || 'http://127.0.0.1:8000';
module.exports = { '/api/**': { target, secure: false, changeOrigin: true } };
