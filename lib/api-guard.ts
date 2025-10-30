import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function getAccessToken(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : undefined;
  return token;
}

export async function requireUser(req: Request) {
  const accessToken = getAccessToken(req);
  if (!accessToken) {
    return { user: null, errorResponse: NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 }) };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    return { user: null, errorResponse: NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 }) };
  }
  return { user, supabase } as const;
}
