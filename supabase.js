// supabase.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(
  "https://xgdybrinpypeppdswheb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo" // bitte hier deinen anon key aus Supabase → Settings → API einfügen
);

// einfache Hilfsfunktion für aktuelle Sitzung
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error) console.error("❌ Session error:", error.message);
  return data?.session?.user ?? null;
}