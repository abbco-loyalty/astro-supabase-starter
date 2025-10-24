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
      headers: { 'Location': '/claim-reward?error=Configuration error' }
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

  const { data: ordersData } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'verified');
  
  const verifiedCount = ordersData?.length || 0;

  if (verifiedCount < 5) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/claim-reward?error=You need 5 verified orders to claim a reward' }
    });
  }

  const { data: existingReward } = await supabase
    .from('rewards')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (existingReward) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/claim-reward?error=You have already claimed your reward' }
    });
  }

  const formData = await request.formData();
  const name = formData.get('name') as string;
  const address = formData.get('address') as string;
  const phone = formData.get('phone') as string;

  if (!name || !address || !phone) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/claim-reward?error=All fields are required' }
    });
  }

  const claimAddress = `${name}\n${address}\n${phone}`;

  const { error } = await supabase
    .from('rewards')
    .insert({
      user_id: user.id,
      status: 'claimed',
      claim_address: claimAddress
    });

  if (error) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': `/claim-reward?error=${encodeURIComponent(error.message)}` }
    });
  }

  return new Response(null, {
    status: 302,
    headers: { 'Location': '/claim-reward?success=Reward claimed successfully! We will process your order soon.' }
  });
};
