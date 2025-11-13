//next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '16mb',
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: '**.vercel-storage.com' },   
      { protocol: 'https', hostname: 'blob.vercel-storage.com' }, 
    ]
  },
  experimental: {
    serverComponentsExternalPackages: ['heic-convert', 'libheif-js'],
  },
  webpack: (config, { isServer }) => {
    if (isServer && config?.output?.chunkFilename?.includes('chunks/')) {
      config.output.chunkFilename = config.output.chunkFilename.replace('chunks/', '')
    }
    config.externals = config.externals || []
    config.externals.push({ 'libheif-js': 'commonjs libheif-js' })
    return config
  },
  // public/uploads altına yazıyoruz (dev/prod file system farkları için daha sonra S3'e geçilebilir)
}
export default nextConfig
