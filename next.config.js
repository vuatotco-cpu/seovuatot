/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'supabase.co', 'images.unsplash.com', 'oaidalleapiprodscus.blob.core.windows.net'],
  },
  experimental: {
    serverComponentsExternalPackages: [
      '@anthropic-ai/sdk',
      '@google/generative-ai',
      'openai',
      'puppeteer',
      'puppeteer-core',
    ],
  },
}

module.exports = nextConfig
