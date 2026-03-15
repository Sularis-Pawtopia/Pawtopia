import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json({ success: false, error: 'Missing path' }, { status: 400 });
  }

  const { data, error } = await supabase.storage
    .from('verification-documents')
    .createSignedUrl(path, 60 * 15);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to sign document URL' },
      { status: 400 }
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
