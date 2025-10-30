import { NextResponse } from 'next/server';
import { exportParticipantsToSheets } from '@/lib/google-sheets';
import { rateLimit, getClientKey } from '@/lib/rate-limit';
import { requireUser } from '@/lib/api-guard';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  try {
    // Rate limit: 5 requests per minute per client
    const key = getClientKey(request);
    const rl = rateLimit(`export:participants:${key}`, 5, 60_000);
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': Math.ceil((rl.resetAt - Date.now())/1000).toString() } });
    }

    // Auth guard
    const { user, supabase, errorResponse } = await requireUser(request);
    if (!user) return errorResponse!;

    // Fetch participants data
    const { data: participants, error: fetchError } = await supabase
      .from('participants')
      .select('*')
      .order('name', { ascending: true });

    if (fetchError) {
      console.error('Error fetching participants:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch participants data' },
        { status: 500 }
      );
    }

    // Transform data untuk export
    const exportData = participants.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email || '',
      phone: p.whatsapp || '',
      address: p.address || '',
      birth_date: p.birth_date || '',
      registration_date: p.created_at || new Date().toISOString(),
      status: p.status || 'active'
    }));

    // Export to Google Sheets
    const result = await exportParticipantsToSheets(exportData);

    return NextResponse.json({
      success: true,
      message: `Berhasil export ${result.rowCount} peserta ke Google Sheets`,
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
