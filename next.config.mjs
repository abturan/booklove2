/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' }
    ]
  },
  // public/uploads altına yazıyoruz (dev/prod file system farkları için daha sonra S3'e geçilebilir)
}
export default nextConfig
