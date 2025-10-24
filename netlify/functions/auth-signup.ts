import type { Context } from "@netlify/functions";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export default async (request: Request, context: Context) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!supabaseUrl || !supabaseKey) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/login?error=Configuration error' }
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': `/login?error=${encodeURIComponent(error.message)}` }
    });
  }

  if (data.session) {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/dashboard',
        'Set-Cookie': [
          `sb-access-token=${data.session.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
          `sb-refresh-token=${data.session.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`
        ].join(', ')
      }
    });
  }

  return new Response(null, {
    status: 302,
    headers: { 'Location': '/login?error=Please check your email to confirm your account' }
  });
};
