import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/api/supabaseClient'

const root = ReactDOM.createRoot(document.getElementById('root'))

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Clear message instead of a blank page when the Vercel / .env.local settings are missing.
  root.render(
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560, margin: '15vh auto', padding: 24, lineHeight: 1.5 }}>
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>Setup needed</h1>
      <p>
        The app is missing <code>VITE_SUPABASE_URL</code> and/or <code>VITE_SUPABASE_ANON_KEY</code>.
        Add them in Vercel (Project Settings → Environment Variables) or in <code>.env.local</code>, then build again.
      </p>
    </div>
  )
} else {
  root.render(<App />)
}
