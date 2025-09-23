/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GOOGLE_SHEETS_API_KEY: process.env.GOOGLE_SHEETS_API_KEY,
    GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID,
  },
}

module.exports = nextConfig
