/** @type {import('next').NextConfig} */

// macOS Node.js는 --localstorage-file 플래그가 경로 없이 활성화되어
// Next.js 15.3 DevOverlay와 충돌 → dev 환경에서만 파일 경로 주입
if (process.env.NODE_ENV !== 'production' && process.platform === 'darwin') {
  const existing = process.env.NODE_OPTIONS || ''
  if (!existing.includes('--localstorage-file')) {
    process.env.NODE_OPTIONS = `${existing} --localstorage-file=/tmp/dc-localstorage.json`.trim()
  }
}

const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
  },

  reactStrictMode: true,

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ]
  },
}

module.exports = nextConfig