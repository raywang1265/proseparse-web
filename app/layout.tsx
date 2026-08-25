import type { Metadata, Viewport } from 'next'
import { Inter, Source_Serif_4, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/lib/auth/context'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
})

const _geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'ProseParse · Writing Analysis Studio',
  description:
    'ProseParse gives novelists and editors deep, ML-powered analysis — tension, pacing, voice, exposition, and sensory detail, beautifully visualized alongside your manuscript.',
  generator: 'v0.app',
}

// The theme provider defaults to dark and does not follow the OS preference,
// so the browser chrome color is pinned to the dark sky rather than a
// prefers-color-scheme pair.
export const viewport: Viewport = {
  themeColor: '#080b16',
  colorScheme: 'dark light',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${sourceSerif.variable} ${_geistMono.variable} bg-sky`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
