import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans, Inter } from 'next/font/google'
import './globals.css'

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'MEDrecord Researcher App',
  description: 'An example application for healthcare researchers to explore agent-driven eHealth workflows. Built on the MEDrecord platform.',
  keywords: ['eHealth', 'FHIR', 'healthcare', 'agents', 'MEDrecord', 'research'],
}

export const viewport: Viewport = {
  themeColor: '#2C5F9B',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${ibmPlexSans.variable} ${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
