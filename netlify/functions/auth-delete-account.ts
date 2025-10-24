import type { Context } from "@netlify/functions";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) cookies[name] = value;
  });
  
  return cookies;
}

export default async (request: Request, context: Context) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/settings?error=Configuration error' }
    });
  }

  const cookies = parseCookies(request.headers.get('cookie'));
  const accessToken = cookies['sb-access-token'];

  if (!accessToken) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/login' }
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/login' }
    });
  }

  const formData = await request.formData();
  const confirm_email = formData.get('confirm_email') as string;

  if (confirm_email !== user.email) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/settings?error=Email confirmation does not match' }
    });
  }

  await supabase.from('orders').delete().eq('user_id', user.id);
  await supabase.from('messages').delete().eq('user_id', user.id);
  await supabase.from('rewards').delete().eq('user_id', user.id);

  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': `/settings?error=${encodeURIComponent(deleteError.message)}` }
    });
  }

  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/login?success=Your account has been deleted',
      'Set-Cookie': [
        `sb-access-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
        `sb-refresh-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
      ].join(', ')
    }
  });
};
