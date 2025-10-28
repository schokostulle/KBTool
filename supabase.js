// supabase.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://xgdybrinpypeppdswheb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo"; // <- deinen Public anon key einsetzen

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
  },
});

// --- Auth Helpers ---
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.warn("getCurrentUser:", error.message);
    return null;
  }
  return data?.user || null;
}

export async function logout(evOrUrl = 'index.html') {
  // Falls als Event-Handler aufgerufen: Event stoppen und Default-URL nutzen
  if (evOrUrl && typeof evOrUrl === 'object' && 'preventDefault' in evOrUrl) {
    evOrUrl.preventDefault?.();
    evOrUrl = 'index.html';
  }
  const redirect = typeof evOrUrl === 'string' ? evOrUrl : 'index.html';

  const { error } = await supabase.auth.signOut();
  if (error) console.error("Logout-Fehler:", error.message);

  location.assign(redirect);
}

// --- Auto-Logout bei Inaktivität ---
let _autoLogout = {
  enabled: false,
  timer: null,
  ms: 30 * 60 * 1000, // Standard: 30 Minuten
  listenersAdded: false,
};

// Aktivität tab-übergreifend synchronisieren
const ACTIVITY_KEY = "bf_activity_ping";
function broadcastActivity() {
  try {
    localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
  } catch {}
}

function scheduleLogout() {
  clearTimeout(_autoLogout.timer);
  _autoLogout.timer = setTimeout(async () => {
    // Optional: kurze Info in der Konsole
    console.warn("Auto-Logout wegen Inaktivität");
    await logout("index.html?reason=timeout");
  }, _autoLogout.ms);
}

function resetInactivityTimer() {
  if (!_autoLogout.enabled) return;
  scheduleLogout();
  broadcastActivity();
}

function attachActivityListeners() {
  if (_autoLogout.listenersAdded) return;
  _autoLogout.listenersAdded = true;

  const reset = () => resetInactivityTimer();

  // Benutzeraktionen, die als „aktiv“ zählen:
  ["mousemove", "keydown", "click", "touchstart", "scroll", "wheel"].forEach((evt) =>
    window.addEventListener(evt, reset, { passive: true })
  );

  // Wenn Tab wieder sichtbar -> auch als Aktivität werten
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") reset();
  });

  // Aktivität aus anderen Tabs empfangen
  window.addEventListener("storage", (e) => {
    if (e.key === ACTIVITY_KEY) {
      scheduleLogout();
    }
  });
}

/**
 * Auto-Logout einschalten (z. B. 30 Minuten)
 * @param {number} minutes  Minutenzahl bis Logout
 */
export function enableAutoLogout(minutes = 30) {
  _autoLogout.ms = Math.max(1, minutes) * 60 * 1000;
  _autoLogout.enabled = true;
  attachActivityListeners();
  scheduleLogout();
}

/** Auto-Logout ausschalten (z. B. für Login/Index-Seite) */
export function disableAutoLogout() {
  _autoLogout.enabled = false;
  clearTimeout(_autoLogout.timer);
}