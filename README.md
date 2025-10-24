# ABBCo Loyalty Rewards Program

A customer loyalty rewards web application built with Astro, Supabase, and Netlify.

## Features

- **User Authentication**: Sign up and log in with email/password via Supabase Auth
- **Order Submission**: Submit Amazon or Shopify order numbers for verification
- **Progress Tracking**: Visual progress bar showing verified orders (5 needed for reward)
- **Messaging**: Contact ABBCo support directly through the app
- **Reward Claiming**: Claim free products once 5 verified orders are achieved
- **Account Management**: Change password and delete account (GDPR compliant)
- **Admin Dashboard**: Staff can verify/reject orders and manage rewards

## Tech Stack

- **Frontend**: Astro with Tailwind CSS
- **Database & Auth**: Supabase
- **Hosting**: Netlify (with Netlify Functions)
- **Styling**: Tailwind CSS with custom ABBCo brand colors

## Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Run the migration script in your Supabase SQL Editor:
   - Copy the contents of `supabase/migrations/20250101000000_init-loyalty.sql`
   - Execute it in the Supabase SQL Editor
3. Get your Supabase credentials:
   - Go to Project Settings > API
   - Copy the `URL` (Project URL)
   - Copy the `anon/public` key
   - Copy the `service_role` key (for admin functions)

### 2. Environment Variables

Set the following environment variables in Netlify:

```
SUPABASE_DATABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
ADMIN_EMAILS=admin@abbco.com,another-admin@abbco.com
```

### 3. Deploy to Netlify

1. Connect your repository to Netlify
2. Set the environment variables in Netlify Dashboard
3. Deploy!

## Database Schema

### Orders Table
- `id`: UUID (primary key)
- `user_id`: UUID (references auth.users)
- `order_number`: Text
- `source`: 'amazon' | 'shopify'
- `order_date`: Date
- `receipt_url`: Text (optional)
- `status`: 'pending' | 'verified' | 'rejected'
- `created_at`: Timestamp

### Messages Table
- `id`: UUID (primary key)
- `user_id`: UUID (references auth.users)
- `from_role`: 'user' | 'admin'
- `body`: Text
- `created_at`: Timestamp

### Rewards Table
- `id`: UUID (primary key)
- `user_id`: UUID (references auth.users)
- `status`: 'unclaimed' | 'claimed' | 'fulfilled'
- `claim_address`: Text (shipping address)
- `created_at`: Timestamp

## Pages

1. **/** - Redirects to login or dashboard
2. **/login** - Sign up / Login page
3. **/dashboard** - User dashboard with progress tracking
4. **/submit-order** - Submit new orders
5. **/messages** - Message support
6. **/claim-reward** - Claim free product (unlocked at 5 verified orders)
7. **/settings** - Account settings and delete account
8. **/admin** - Admin panel for managing orders and rewards

## Admin Access

To grant admin access, add the user's email to the `ADMIN_EMAILS` environment variable (comma-separated list).

## Brand Colors

- **Gold**: #D4AF37
- **Cream**: #FAF3E0
- **Charcoal**: #333333
- **Font**: Inter

## Astro Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |

## Local Development

1. Clone this repository, then run `npm install` in its root directory.

2. Install Netlify CLI:

```bash
npm install netlify-cli@latest -g
```

3. Link your local repository to the deployed Netlify site:

```bash
netlify link
```

4. Run the development server via Netlify CLI:

```bash
netlify dev
```

If your browser doesn't navigate to the site automatically, visit [localhost:8888](http://localhost:8888).

## Security

- All routes are protected with authentication
- Row-level security (RLS) policies ensure users can only access their own data
- Admin functions require service role key
- GDPR-compliant account deletion

## Support

If you get stuck along the way, get help in our [support forums](https://answers.netlify.com/).

## License

All rights reserved © ABBCo
