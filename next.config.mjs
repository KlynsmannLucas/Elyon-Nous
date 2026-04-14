/** @type {import('next').NextConfig} */
const nextConfig = {
  // Necessário para o @react-pdf/renderer (usa canvas no server)
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  },
}

export default nextConfig
