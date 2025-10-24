import type { Context } from "@netlify/functions";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

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

  if (!supabaseUrl || !supabaseKey) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/messages?error=Configuration error' }
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

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/login' }
    });
  }

  const formData = await request.formData();
  const body = formData.get('body') as string;

  if (!body || body.trim().length === 0) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/messages?error=Message cannot be empty' }
    });
  }

  const { error } = await supabase
    .from('messages')
    .insert({
      user_id: user.id,
      from_role: 'user',
      body: body.trim()
    });

  if (error) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': `/messages?error=${encodeURIComponent(error.message)}` }
    });
  }

  return new Response(null, {
    status: 302,
    headers: { 'Location': '/messages?success=Message sent successfully!' }
  });
};
