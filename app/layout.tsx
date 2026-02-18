import type { Metadata, Viewport } from "next"
import { Inter, Noto_Sans_KR } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto",
})

export const metadata: Metadata = {
  title: "DeliveryCut AI - 배달 대신 10분 한 끼",
  description: "냉장고 재료로 배달을 대체할 한 끼를 AI가 추천해드립니다",
}

/*
  ✅ viewport를 metadata와 분리 (Next.js 15 필수)
  ✅ viewportFit: "cover" → 아이폰 노치/홈바 safe area 대응 핵심
*/
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      {/* ✅ inter.className + notoSansKR.variable 둘 다 적용 */}
      <body className={`${inter.className} ${notoSansKR.variable}`}>
        {children}
      </body>
    </html>
  )
}