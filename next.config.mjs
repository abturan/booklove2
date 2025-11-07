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
  // public/uploads altına yazıyoruz (dev/prod file system farkları için daha sonra S3'e geçilebilir)
}
export default nextConfig
