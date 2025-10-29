/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        domains: [
            'localhost',
            'picsum.photos',
            'images.unsplash.com',
            'cdn.sanity.io',
            'avatars.githubusercontent.com',
            'user-images.githubusercontent.com',
            'pub-bdf17925797240c49bc0f822c04770fd.r2.dev'
        ],
    }
}

module.exports = nextConfig
    