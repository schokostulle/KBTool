import { supabase, getCurrentUser, logout } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const user = await getCurrentUser();
  if (!user) return (location.href = "index.html");

  const { data: member } = await supabase
    .from("members")
    .select("username, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (!member || member.role !== "admin") {
    document.body.innerHTML = `
      <main style="text-align:center; padding:3rem;">
        <h1>⚓ Kein Zugriff</h1>
        <p>Nur Administratoren dürfen CSV-Daten hochladen.</p>
        <button onclick="location.href='dashboard.html'" class="btn-back">Zurück</button>
      </main>`;
    return;
  }

  document.getElementById("userName").textContent = member.username;
  document.getElementById("userRole").textContent = member.role;

  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("logoutBtnTop").addEventListener("click", logout);

  const form = document.getElementById("csvUploadForm");
  const status = document.getElementById("uploadStatus");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById("csvFile");
    const file = fileInput.files[0];
    if (!file) return alert("Bitte eine CSV-Datei auswählen.");

    status.textContent = "⏳ Upload läuft...";

    try {
      // Dateiinhalt lesen
      const text = await file.text();

      // CSV parsen
      const rows = text
        .trim()
        .split("\n")
        .map((r) => r.split(";"));

      // Tabelle 'targets' leeren
      const { error: delError } = await supabase.from("targets").delete().neq("id", 0);
      if (delError) throw delError;

      // Neue Daten einfügen
      const insertData = rows.map((r) => ({
        oz: parseInt(r[0]) || null,
        ig: parseInt(r[1]) || null,
        i: parseInt(r[2]) || null,
        inselname: r[3] || null,
        spieler_id: parseInt(r[4]) || null,
        spielername: r[5] || null,
        allianz_id: parseInt(r[6]) || null,
        allianzkürzel: r[7] || null,
        allianzname: r[8] || null,
        punkte: parseInt(r[9]) || null,
      }));

      const { error: insertError } = await supabase.from("targets").insert(insertData);
      if (insertError) throw insertError;

      // Upload-Log speichern
      await supabase.from("uploads").insert({
        dateiname: file.name,
        uploader_id: user.id,
        timestamp: new Date(),
      });

      status.textContent = `✅ Upload erfolgreich: ${insertData.length} Datensätze importiert.`;
    } catch (err) {
      console.error("Uploadfehler:", err);
      status.textContent = "❌ Fehler beim Upload: " + err.message;
    }
  });
});