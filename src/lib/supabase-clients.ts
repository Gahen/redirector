import { createClient, SupabaseClient } from "@supabase/supabase-js";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

let anonClient: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

// Anon client: respects RLS. Used for reads (redirect + dedupe lookup).
export function getAnonClient(): SupabaseClient {
  if (!anonClient) {
    anonClient = createClient(
      requiredEnv("SUPABASE_URL"),
      requiredEnv("SUPABASE_ANON_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return anonClient;
}

// Service role client: bypasses RLS. Server-only. Used for inserts only.
export function getServiceClient(): SupabaseClient {
  if (!serviceClient) {
    serviceClient = createClient(
      requiredEnv("SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return serviceClient;
}

export type UrlRow = {
  code: string;
  url: string;
  created_at: string;
};
