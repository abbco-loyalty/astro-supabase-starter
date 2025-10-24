import type { Context } from "@netlify/functions";

export default async (request: Request, context: Context) => {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/login',
      'Set-Cookie': [
        `sb-access-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
        `sb-refresh-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
      ].join(', ')
    }
  });
};
