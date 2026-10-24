import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Brayan Auto Sales — Manager Portal',
  description: 'Manage listing inventory, new arrivals, specifications, and client inquiries.',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <head>
        <link rel="icon" href="/icon.png" />
      </head>
      <body className="min-h-full bg-[#0a0a0a] text-neutral-100 font-sans flex flex-col selection:bg-[#38d39f] selection:text-black">
        {/* Main Layout wrapper */}
        <div className="flex flex-col flex-1">
          {/* Top Header */}
          <header className="sticky top-0 z-40 w-full bg-[#0b0f17]/90 backdrop-blur-md border-b border-[#1e293b] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Brayan Auto Sales"
                className="h-10 w-auto object-contain"
              />
              <span className="text-[10px] bg-[#38d39f]/10 text-[#38d39f] border border-[#38d39f]/30 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider">
                Manager
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-neutral-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#38d39f] animate-pulse"></span>
                Synced
              </span>
            </div>
          </header>

          {/* Children Viewport */}
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
