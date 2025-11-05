import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ensureServerOnly } from '@/lib/server-only';

ensureServerOnly();

// Types untuk data yang akan di-export
export interface ParticipantExport {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  birth_date: string;
  registration_date: string;
  status: string;
}

export interface InstructorExport {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  status: string;
}

export interface AttendanceExport {
  id: string;
  participant_name: string;
  class_name: string;
  instructor_name: string;
  date: string;
  status: string;
  notes: string;
}

export interface PaymentExport {
  id: string;
  participant_name: string;
  teacher_name: string;
  class_name: string;
  class_type: string;
  start_date: string;
  due_date: string;
  status: string;
}

// Initialize Google Sheets client
let sheets: any = null;
// Cache to reduce API calls
let knownSheets: Set<string> = new Set();
let headerFormatted: Set<string> = new Set();

async function withRetry<T>(fn: () => Promise<T>, label: string, attempts = 3) {
  let lastErr: any;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const delay = 200 * i; // simple linear backoff
      if (i < attempts) await new Promise(r => setTimeout(r, delay));
    }
  }
  console.error(`[sheets][retry-failed] ${label}:`, lastErr);
  throw lastErr;
}

function getSheetsClient() {
  if (sheets) return sheets;

  try {
    // Baca credentials dari ENV JSON terlebih dahulu. Hanya fallback ke file jika PATH secara eksplisit diset.
    let credentials: any | null = null;
    const credentialsJson = process.env.GOOGLE_SHEETS_CREDENTIALS_JSON;
    const credentialsB64 = process.env.GOOGLE_SHEETS_CREDENTIALS_B64;
    const credentialsPathVar = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH;
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const privateKeyRaw = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    const projectId = process.env.GOOGLE_SHEETS_PROJECT_ID;

    if (credentialsJson && credentialsJson.trim().length > 0) {
      credentials = JSON.parse(credentialsJson);
    } else if (credentialsB64 && credentialsB64.trim().length > 0) {
      const decoded = Buffer.from(credentialsB64, 'base64').toString('utf8')
      credentials = JSON.parse(decoded)
    } else if (clientEmail && privateKeyRaw && clientEmail.trim().length > 0 && privateKeyRaw.trim().length > 0) {
      const privateKey = privateKeyRaw.replace(/\\n/g, '\n')
      credentials = {
        type: 'service_account',
        client_email: clientEmail,
        private_key: privateKey,
        project_id: projectId || undefined,
      }
    } else if (credentialsPathVar && credentialsPathVar.trim().length > 0) {
      const resolvedPath = join(process.cwd(), credentialsPathVar);
      credentials = JSON.parse(readFileSync(resolvedPath, 'utf-8'));
    } else {
      throw new Error('MISSING_SHEETS_ENV');
    }

    // Setup auth
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Initialize sheets API
    sheets = google.sheets({ version: 'v4', auth });
    return sheets;
  } catch (error: any) {
    console.error('Error initializing Google Sheets client:', error);

    // Better error messages
    if (error.message === 'MISSING_SHEETS_ENV') {
      throw new Error('Konfigurasi Google Sheets belum lengkap. Set salah satu: GOOGLE_SHEETS_CLIENT_EMAIL + GOOGLE_SHEETS_PRIVATE_KEY (disarankan), GOOGLE_SHEETS_CREDENTIALS_JSON, GOOGLE_SHEETS_CREDENTIALS_B64, atau GOOGLE_SHEETS_CREDENTIALS_PATH.');
    }
    if (error.code === 'ENOENT') {
      const p = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH || '(tidak diset)';
      throw new Error(`File kredensial tidak ditemukan pada path "${p}". Disarankan gunakan GOOGLE_SHEETS_CREDENTIALS_JSON di environment Netlify.`);
    }
    if (error.message?.includes('Unexpected end of JSON input') || error.message?.includes('JSON')) {
      throw new Error('Format kredensial tidak valid. Jika pakai GOOGLE_SHEETS_CREDENTIALS_JSON, pastikan JSON valid. Jika pakai GOOGLE_SHEETS_CREDENTIALS_B64, pastikan Base64 dari file JSON yang valid.');
    }
    if (!process.env.GOOGLE_SHEETS_CREDENTIALS_JSON && !process.env.GOOGLE_SHEETS_CREDENTIALS_B64 && !process.env.GOOGLE_SHEETS_CREDENTIALS_PATH && !(process.env.GOOGLE_SHEETS_CLIENT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY)) {
      throw new Error('Konfigurasi Google Sheets belum lengkap. Set salah satu: GOOGLE_SHEETS_CLIENT_EMAIL + GOOGLE_SHEETS_PRIVATE_KEY, GOOGLE_SHEETS_CREDENTIALS_JSON, GOOGLE_SHEETS_CREDENTIALS_B64, atau GOOGLE_SHEETS_CREDENTIALS_PATH');
    }

    throw new Error(`Gagal inisialisasi Google Sheets: ${error.message}`);
  }
}

// Helper function untuk clear & write data (optimized)
async function writeToSheet(
  sheetName: string,
  headers: string[],
  data: any[][]
) {
  const sheetsClient = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is not set in environment variables');
  }

  try {
    console.time(`[sheets] ensure-${sheetName}`);
    // 1) Ensure sheet exists and header formatted only once
    let sheetId = await getSheetId(sheetName);
    if (sheetId === 0 || !knownSheets.has(sheetName)) {
      // Try create sheet if not exists
      try {
        await withRetry(() => sheetsClient.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: { title: sheetName },
                },
              },
            ],
          },
        }), `addSheet:${sheetName}`);
        // refresh id after creating
        sheetId = await getSheetId(sheetName);
      } catch (e: any) {
        if (!e.message?.includes('already exists')) throw e;
        // if already exists, fetch id again
        sheetId = await getSheetId(sheetName);
      }
      knownSheets.add(sheetName);
    }

    // Write header only once (or if not recorded)
    if (!headerFormatted.has(sheetName)) {
      await withRetry(() => sheetsClient.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [headers] },
      }), `writeHeader:${sheetName}`);

      await withRetry(() => sheetsClient.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.6, blue: 0.86 },
                    textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)',
              },
            },
          ],
        },
      }), `formatHeader:${sheetName}`);
      headerFormatted.add(sheetName);
    }
    console.timeEnd(`[sheets] ensure-${sheetName}`);

    console.time(`[sheets] write-${sheetName}`);
    // 2) Clear only data rows (A2:Z)
    await withRetry(() => sheetsClient.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetName}!A2:Z`,
    }), `clear:${sheetName}`);

    // 3) Write data starting at A2 (if any)
    if (data.length > 0) {
      await withRetry(() => sheetsClient.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A2`,
        valueInputOption: 'RAW',
        requestBody: { values: data },
      }), `writeData:${sheetName}`);
    }
    console.timeEnd(`[sheets] write-${sheetName}`);

    return { success: true, rowCount: data.length };
  } catch (error) {
    console.error('Error writing to sheet:', error);
    throw error;
  }
}

// Helper untuk get sheet ID by name
async function getSheetId(sheetName: string): Promise<number> {
  const sheetsClient = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  const response = await sheetsClient.spreadsheets.get({
    spreadsheetId,
  });

  const sheet = response.data.sheets?.find(
    (s: any) => s.properties.title === sheetName
  );

  return sheet?.properties?.sheetId || 0;
}

// Export functions untuk setiap tipe data
export async function exportParticipantsToSheets(participants: ParticipantExport[]) {
  const headers = [
    'ID',
    'Nama',
    'Email',
    'Telepon',
    'Alamat',
    'Tanggal Lahir',
    'Tanggal Daftar',
    'Status',
  ];

  const data = participants.map((p) => [
    p.id,
    p.name,
    p.email,
    p.phone,
    p.address,
    p.birth_date,
    p.registration_date,
    p.status,
  ]);

  return await writeToSheet('Participants', headers, data);
}

export async function exportInstructorsToSheets(instructors: InstructorExport[]) {
  const headers = ['ID', 'Nama', 'Email', 'Telepon', 'Spesialisasi', 'Status'];

  const data = instructors.map((i) => [
    i.id,
    i.name,
    i.email,
    i.phone,
    i.specialization,
    i.status,
  ]);

  return await writeToSheet('Instructors', headers, data);
}

export async function exportAttendanceToSheets(attendance: AttendanceExport[]) {
  const headers = [
    'ID',
    'Nama Peserta',
    'Kelas',
    'Pengajar',
    'Tanggal',
    'Status',
    'Catatan',
  ];

  const data = attendance.map((a) => [
    a.id,
    a.participant_name,
    a.class_name,
    a.instructor_name,
    a.date,
    a.status,
    a.notes || '',
  ]);

  return await writeToSheet('Absensi', headers, data);
}

export async function exportPaymentsToSheets(payments: PaymentExport[]) {
  const headers = [
    'ID',
    'Nama Peserta',
    'Pengajar',
    'Kelas',
    'Tipe Kelas',
    'Tanggal Mulai',
    'Jatuh Tempo',
    'Status',
  ];

  const data = payments.map((p) => [
    p.id,
    p.participant_name,
    p.teacher_name,
    p.class_name,
    p.class_type,
    p.start_date,
    p.due_date,
    p.status,
  ]);

  return await writeToSheet('Berlangganan', headers, data);
}

// Test connection
export async function testSheetsConnection() {
  try {
    const sheetsClient = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const response = await sheetsClient.spreadsheets.get({
      spreadsheetId,
    });

    return {
      success: true,
      spreadsheetTitle: response.data.properties?.title,
      sheetsCount: response.data.sheets?.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
