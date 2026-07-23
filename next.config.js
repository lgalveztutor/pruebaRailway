/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // La web publica (export estatico actual) se sirve tal cual en "/".
      // Asi NO rompemos la web existente: queda byte a byte igual.
      { source: '/', destination: '/site/home.html' },
    ];
  },
};

module.exports = nextConfig;
