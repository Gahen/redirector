import { createClient } from "@supabase/supabase-js";

let browserClient: ReturnType<typeof createClient> | null = null;

export function getBrowserClient() {
  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storage: {
            getItem: (key) => {
              try {
                const match = document.cookie.match(
                  new RegExp("(?:^|;\\s*)" + key + "\\s*=\\s*([^;]+)"),
                );
                return match ? decodeURIComponent(match[1]) : null;
              } catch {
                return null;
              }
            },
            setItem: (key, value) => {
              try {
                document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=2592000; SameSite=Lax`;
              } catch {
                // ignore
              }
            },
            removeItem: (key) => {
              try {
                document.cookie = `${key}=; path=/; max-age=0`;
              } catch {
                // ignore
              }
            },
          },
        },
      },
    );
  }
  return browserClient;
}
