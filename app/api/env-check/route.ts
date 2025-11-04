import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || null
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null

  const anonKey = key
    ? { exists: true, length: key.length, prefix: key.slice(0, 6), suffix: key.slice(-4) }
    : { exists: false, length: 0 }

  const supabaseUrlValid = !!url && /^https?:\/\/.+\.supabase\.co\/?$/.test(url)
  const projectRef = url ? url.replace(/^https?:\/\//, '').split('.')[0] : null

  const sheetsJson = process.env.GOOGLE_SHEETS_CREDENTIALS_JSON || ''
  const sheetsJsonExists = sheetsJson.trim().length > 0
  const sheetsPath = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH || null
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || null

  return NextResponse.json({
    supabaseUrl: url,
    supabaseUrlValid,
    projectRef,
    anonKey,
    sheets: {
      credsJson: { exists: sheetsJsonExists, length: sheetsJsonExists ? sheetsJson.length : 0 },
      credsPathVar: { exists: !!sheetsPath, value: sheetsPath },
      spreadsheetId: spreadsheetId
        ? { exists: true, length: spreadsheetId.length, prefix: spreadsheetId.slice(0, 4), suffix: spreadsheetId.slice(-4) }
        : { exists: false, length: 0 },
    },
    now: new Date().toISOString(),
  })
}
