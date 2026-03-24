const runtimeCaching = require("next-pwa/cache");

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching,
  fallbacks: {
    document: "/_offline"
  }
});

module.exports = withPWA({
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  }
});

