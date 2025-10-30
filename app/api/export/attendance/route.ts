import { NextResponse } from 'next/server';
import { exportAttendanceToSheets } from '@/lib/google-sheets';
import { rateLimit, getClientKey } from '@/lib/rate-limit';
import { requireUser } from '@/lib/api-guard';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  try {
    // Rate limit: 5 requests per minute per client
    const key = getClientKey(request);
    const rl = rateLimit(`export:attendance:${key}`, 5, 60_000);
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': Math.ceil((rl.resetAt - Date.now())/1000).toString() } });
    }

    // Auth guard
    const { user, supabase, errorResponse } = await requireUser(request);
    if (!user) return errorResponse!;

    // Fetch attendance data dengan join
    const { data: attendance, error: fetchError } = await supabase
      .from('attendance')
      .select(`
        id,
        date,
        status,
        reason,
        participants!attendance_participant_id_fkey (name),
        classes!attendance_class_id_fkey (
          name,
          teachers!classes_teacher_id_fkey (name)
        )
      `)
      .order('date', { ascending: false });

    if (fetchError) {
      console.error('Error fetching attendance:', fetchError);
      return NextResponse.json(
        { error: `Failed to fetch attendance data: ${fetchError.message}`, details: fetchError },
        { status: 500 }
      );
    }

    // Handle empty data
    if (!attendance || attendance.length === 0) {
      console.warn('No attendance data found');
      // Still export with empty data to create sheet
      const result = await exportAttendanceToSheets([]);
      const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
      const spreadsheetUrl = spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` : undefined;
      
      return NextResponse.json({
        success: true,
        message: 'Sheet "Absensi" siap. Belum ada data absensi.',
        rowCount: 0,
        spreadsheetUrl,
      });
    }

    // Deduplicate: Keep only latest record per participant per date
    const latestRecords = new Map<string, any>();
    for (const a of attendance) {
      // Fix: Ensure participants is an object with name property, not an array
      const participantName = a.participants ? (a.participants as {name?: string}).name || 'Unknown' : 'Unknown';
      const key = `${participantName}_${a.date}`;
      const existing = latestRecords.get(key);
      // Keep the record with latest ID (assuming newer records have larger IDs or timestamps)
      if (!existing || a.id > existing.id) {
        latestRecords.set(key, a);
      }
    }

    // Transform data untuk export
    const exportData = Array.from(latestRecords.values()).map((a: any) => {
      // Safely extract nested data
      const participantName = a.participants?.name || 'Unknown';
      const className = a.classes?.name || 'Unknown';
      const teacherName = a.classes?.teachers?.name || 'Unknown';
      
      return {
        id: a.id,
        participant_name: participantName,
        class_name: className,
        instructor_name: teacherName,
        date: a.date || '',
        status: a.status || 'hadir',
        notes: a.reason || '',
      };
    });

    // Export to Google Sheets
    const result = await exportAttendanceToSheets(exportData);
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const spreadsheetUrl = spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` : undefined;

    return NextResponse.json({
      success: true,
      message: `Berhasil export ${result.rowCount} data absensi ke Google Sheets`,
      rowCount: result.rowCount,
      spreadsheetUrl,
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export to Google Sheets' },
      { status: 500 }
    );
  }
}
