import { NextResponse } from 'next/server';
import { exportPaymentsToSheets } from '@/lib/google-sheets';
import { rateLimit, getClientKey } from '@/lib/rate-limit';
import { requireUser } from '@/lib/api-guard';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  try {
    // Rate limit: 5 requests per minute per client
    const key = getClientKey(request);
    const rl = rateLimit(`export:payments:${key}`, 5, 60_000);
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': Math.ceil((rl.resetAt - Date.now())/1000).toString() } });
    }

    // Auth guard
    const { user, supabase, errorResponse } = await requireUser(request);
    if (!user) return errorResponse!;

    // Fetch enrollments (berlangganan) data dengan join
    const { data: enrollments, error: fetchError } = await supabase
      .from('enrollments')
      .select(`
        id,
        start_date,
        due_date,
        status,
        participants (name),
        teachers (name),
        classes (name, type)
      `)
      .order('start_date', { ascending: false });

    if (fetchError) {
      console.error('Error fetching payments:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch payments data' },
        { status: 500 }
      );
    }

    // Transform data untuk export
    const exportData = enrollments.map((e: any) => ({
      id: e.id,
      participant_name: e.participants?.name || 'Unknown',
      teacher_name: e.teachers?.name || 'Unknown',
      class_name: e.classes?.name || 'Unknown',
      class_type: e.classes?.type || 'Unknown',
      start_date: e.start_date || '',
      due_date: e.due_date || '',
      status: e.status,
    }));

    // Export to Google Sheets
    const result = await exportPaymentsToSheets(exportData);

    return NextResponse.json({
      success: true,
      message: `Berhasil export ${result.rowCount} data pembayaran ke Google Sheets`,
      rowCount: result.rowCount,
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export to Google Sheets' },
      { status: 500 }
    );
  }
}
