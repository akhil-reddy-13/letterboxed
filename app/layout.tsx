import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Letter Boxed',
  description: 'NYT Letter Boxed game clone',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}