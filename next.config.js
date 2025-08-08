module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['example.com'], // Add any domains you want to allow for images
  },
  env: {
    CUSTOM_API_URL: process.env.CUSTOM_API_URL, // Example of adding environment variables
  },
  
};