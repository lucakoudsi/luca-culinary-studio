import { createClient } from '@supabase/supabase-js';

// Next.js patcht global fetch() und cached Requests standardweise (auch in
// Route Handlern), ueber warme Vercel-Lambdas hinweg persistent. Ohne diesen
// Override liefert der Admin-Client eingefrorene Snapshots statt frischer
// DB-Reads, sobald ein Fetch einmal gecacht wurde.
function noStoreFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { ...init, cache: 'no-store' });
}

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { fetch: noStoreFetch },
    }
  );
}
