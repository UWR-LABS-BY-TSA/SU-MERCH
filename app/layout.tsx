import type { Metadata } from "next"
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
})
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
})

export const metadata: Metadata = {
  title: "Streamer University — The Campus Store",
  description:
    "Step inside the official Streamer University campus store. An immersive 3D walk through the torchlit hall — hoodies, tees, accessories.",
  icons: {
    // Smaller monogram for the browser tab; full crest for home-screen
    // install / bookmark (Apple / Android).
    icon: [
      { url: "/SU1.png", type: "image/png", sizes: "any" },
    ],
    shortcut: "/SU1.png",
    apple: [
      { url: "/SUCREST.PNG", type: "image/png", sizes: "512x512" },
    ],
  },
  openGraph: {
    title: "Streamer University — The Campus Store",
    description:
      "The official Streamer University campus store. Step inside the torchlit hall.",
    images: [
      {
        url: "/SUCREST.PNG",
        alt: "Streamer University crest",
      },
    ],
    type: "website",
    siteName: "Streamer University",
  },
  twitter: {
    card: "summary_large_image",
    title: "Streamer University — The Campus Store",
    description: "The official Streamer University campus store.",
    images: ["/SUCREST.PNG"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${cormorant.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
