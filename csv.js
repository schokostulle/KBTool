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

  document.getElementById("logoutBtn")?.addEventListener("click", logout);

  const form = document.getElementById("csvUploadForm");
  const status = document.getElementById("uploadStatus");
  const tableContainer = document.getElementById("csvTableContainer");

  // === Neu: bestehende Targets beim Laden anzeigen ===
  await showExistingTargets();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById("csvFile");
    const file = fileInput.files[0];
    if (!file) return alert("Bitte eine CSV-Datei auswählen.");

    status.textContent = "⏳ Upload läuft...";
    tableContainer.innerHTML = "";

    try {
      // Datei lesen
      const text = await file.text();
      const rows = text
        .trim()
        .split("\n")
        .map((r) => r.split(";"));

      // Bestehende Daten in targets löschen (vollständiger Neuimport)
      const { error: delError } = await supabase.from("targets").delete().neq("id", 0);
      if (delError) throw delError;

      // Neue Daten vorbereiten
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

      // Neu: Tabelle mit neu importierten Daten anzeigen (erste 50)
      renderTable(insertData, tableContainer, { limit: 50, title: "Vorschau (neu importiert)" });
    } catch (err) {
      console.error("Uploadfehler:", err);
      status.textContent = "❌ Fehler beim Upload: " + (err.message || err);
      // Fallback: vorhandene Targets anzeigen, damit die Seite nicht „leer“ bleibt
      await showExistingTargets();
    }
  });

  // ===== Helpers =====
  async function showExistingTargets() {
    const status = document.getElementById("uploadStatus");
    const tableContainer = document.getElementById("csvTableContainer");

    status.textContent = "📦 Lade bestehende Daten...";
    tableContainer.innerHTML = "";

    // Gesamtanzahl holen (HEAD-Select mit Count)
    const { count, error: countError } = await supabase
      .from("targets")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error(countError.message);
      status.textContent = "❌ Konnte bestehende Daten nicht laden.";
      return;
    }

    // Erste 50 Zeilen laden (nach created_at oder id sortieren)
    const { data, error } = await supabase
      .from("targets")
      .select("oz, ig, i, inselname, spieler_id, spielername, allianz_id, allianzkürzel, allianzname, punkte, created_at, id")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error(error.message);
      status.textContent = "❌ Konnte bestehende Daten nicht laden.";
      return;
    }

    status.innerHTML = count && count > 0
      ? `ℹ️ Aktuell gespeicherte Datensätze: <strong>${count}</strong>. Unten siehst du die ersten 50 Zeilen.`
      : "ℹ️ Keine Daten vorhanden. Bitte eine CSV-Datei hochladen.";

    if (data && data.length) {
      renderTable(data, tableContainer, { limit: 50, title: "Vorschau (bestehende Daten)" });
    }
  }

  function renderTable(data, container, { limit = 50, title = "Vorschau" } = {}) {
    if (!data || !data.length) {
      container.innerHTML = "<p>Keine Daten verfügbar.</p>";
      return;
    }

    const headers = [
      "oz","ig","i","inselname","spieler_id","spielername",
      "allianz_id","allianzkürzel","allianzname","punkte"
    ];

    let html = `<h3>${title}</h3>`;
    html += `<table class="data-table"><thead><tr>`;
    headers.forEach((h) => (html += `<th>${h}</th>`));
    html += `</tr></thead><tbody>`;

    data.slice(0, limit).forEach((row) => {
      html += "<tr>";
      headers.forEach((h) => (html += `<td>${row[h] ?? ""}</td>`));
      html += "</tr>";
    });

    html += "</tbody></table>";
    html += `<p><i>Nur erste ${Math.min(limit, data.length)} Zeilen angezeigt.</i></p>`;
    container.innerHTML = html;
  }
});