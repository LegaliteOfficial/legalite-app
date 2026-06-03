import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Providers } from './providers'

const euclid = localFont({
  src: [
    { path: '../public/fonts/euclid-circular-a/Euclid Circular A Light.ttf',          weight: '300', style: 'normal' },
    { path: '../public/fonts/euclid-circular-a/Euclid Circular A Light Italic.ttf',   weight: '300', style: 'italic' },
    { path: '../public/fonts/euclid-circular-a/Euclid Circular A Regular.ttf',        weight: '400', style: 'normal' },
    { path: '../public/fonts/euclid-circular-a/Euclid Circular A Italic.ttf',         weight: '400', style: 'italic' },
    { path: '../public/fonts/euclid-circular-a/Euclid Circular A Medium.ttf',         weight: '500', style: 'normal' },
    { path: '../public/fonts/euclid-circular-a/Euclid Circular A Medium Italic.ttf',  weight: '500', style: 'italic' },
    { path: '../public/fonts/euclid-circular-a/Euclid Circular A SemiBold.ttf',       weight: '600', style: 'normal' },
    { path: '../public/fonts/euclid-circular-a/Euclid Circular A SemiBold Italic.ttf',weight: '600', style: 'italic' },
    { path: '../public/fonts/euclid-circular-a/Euclid Circular A Bold.ttf',           weight: '700', style: 'normal' },
    { path: '../public/fonts/euclid-circular-a/Euclid Circular A Bold Italic.ttf',    weight: '700', style: 'italic' },
  ],
  variable: '--font-euclid',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'LegaLite — Ghana Legal Practice Management',
  description:
    "The digital operating system for Ghana's legal profession. AI-powered practice management built for Ghanaian lawyers.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={euclid.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
