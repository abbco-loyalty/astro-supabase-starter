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
      headers: { 'Location': '/admin?error=Configuration error' }
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

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
  if (!adminEmails.includes(user.email || '')) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/dashboard?error=Unauthorized' }
    });
  }

  const formData = await request.formData();
  const order_id = formData.get('order_id') as string;

  if (!order_id) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/admin?error=Missing order ID' }
    });
  }

  const { error } = await supabase
    .from('orders')
    .update({ status: 'rejected' })
    .eq('id', order_id);

  if (error) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': `/admin?error=${encodeURIComponent(error.message)}` }
    });
  }

  return new Response(null, {
    status: 302,
    headers: { 'Location': '/admin?success=Order rejected!' }
  });
};
