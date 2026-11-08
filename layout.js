export const metadata = { title: 'MALUVA-MD Pairing', description: 'Premium Pairing Code Generator' }

export default function RootLayout({ children }) {
  return (
    <html lang="sw">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: 'linear-gradient(160deg,#1a1033,#0b0b1a)', color: '#e9e9f5', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  )
}
