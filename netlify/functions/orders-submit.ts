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

export default async (request: Request, _context: Context) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!supabaseUrl || !supabaseKey) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/submit-order?error=Configuration error' }
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
  const order_number = formData.get('order_number') as string;
  const source = formData.get('source') as string;
  const order_date = formData.get('order_date') as string;
  const receipt_url = formData.get('receipt_url') as string;

  if (!order_number || !source || !order_date) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/submit-order?error=Missing required fields' }
    });
  }

  const { error } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      order_number,
      source,
      order_date,
      receipt_url: receipt_url || null,
      status: 'pending'
    });

  if (error) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': `/submit-order?error=${encodeURIComponent(error.message)}` }
    });
  }

  return new Response(null, {
    status: 302,
    headers: { 'Location': '/submit-order?success=Order submitted successfully! We will review it soon.' }
  });
};
