import { supabase, getCurrentUser, logout } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const user = await getCurrentUser();
  if (!user) return (location.href = "index.html");

  // Admin prüfen
  const { data: member, error: mErr } = await supabase
    .from("members")
    .select("username, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (mErr || !member || member.role !== "admin") {
    document.body.innerHTML = `
      <main style="text-align:center; padding:3rem;">
        <h1>⚓ Kein Zugriff</h1>
        <p>Nur Administratoren dürfen CSV-Daten verwalten.</p>
        <button onclick="location.href='dashboard.html'" class="btn-back">Zurück</button>
      </main>`;
    return;
  }

  document.getElementById("userName").textContent = member.username;
  document.getElementById("userRole").textContent = member.role;
  document.getElementById("logoutBtn")?.addEventListener("click", logout);

  const form = document.getElementById("csvUploadForm");
  const statusEl = document.getElementById("uploadStatus");
  const tableMeta = document.getElementById("tableMeta");
  const tableContainer = document.getElementById("csvTableContainer");
  const filterInputs = Array.from(document.querySelectorAll(".filter-input"));
  const clearBtn = document.getElementById("clearFilters");

  const COLUMNS = [
    "oz","ig","i","inselname","spieler_id","spielername",
    "allianz_id","allianzkürzel","allianzname","punkte"
  ];

  let allRows = [];        // Originaldaten (alle)
  let currentRows = [];    // Gefiltert + sortiert
  let sortState = { col: null, dir: 1 }; // 1=ASC, -1=DESC

  // === Bestehende Daten beim Laden anzeigen ===
  await loadAllTargets();

  // === Upload-Flow ===
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById("csvFile");
    const file = fileInput.files[0];
    if (!file) return alert("Bitte eine CSV-Datei auswählen.");

    statusEl.textContent = "⏳ Upload läuft…";
    tableContainer.innerHTML = "";

    try {
      const raw = await file.text();

      // Robustes CSV-Parsing (Semikolon-Delimiter, Quotes, CRLF)
      const parsed = parseCSVSemicolon(raw);

      // Map & sanitize (Quotes entfernen, Zahlen parsen)
      const mapped = parsed
        .filter(row => row.length >= 10) // nur vollständige Zeilen
        .map((r) => ({
          oz: toInt(unquote(r[0])),
          ig: toInt(unquote(r[1])),
          i: toInt(unquote(r[2])),
          inselname: cleanText(unquote(r[3])),
          spieler_id: toInt(unquote(r[4])),
          spielername: cleanText(unquote(r[5])),
          allianz_id: toInt(unquote(r[6])),
          allianzkürzel: cleanText(unquote(r[7])),
          allianzname: cleanText(unquote(r[8])),
          punkte: toInt(unquote(r[9])),
        }));

      // alles löschen (vollständiger Neuimport)
      const { error: delErr } = await supabase.from("targets").delete().neq("id", 0);
      if (delErr) throw delErr;

      // in Batches einfügen (Supabase-Limit: ~1000 Rows pro Request)
      const BATCH = 1000;
      for (let offset = 0; offset < mapped.length; offset += BATCH) {
        const chunk = mapped.slice(offset, offset + BATCH);
        const { error: insErr } = await supabase.from("targets").insert(chunk);
        if (insErr) throw insErr;
      }

      // Upload loggen
      await supabase.from("uploads").insert({
        dateiname: file.name,
        uploader_id: user.id,
        timestamp: new Date(),
      });

      statusEl.textContent = `✅ Upload erfolgreich: ${mapped.length} Datensätze importiert.`;

      // Neu laden & rendern (aus DB, nicht aus mapped → „Quelle der Wahrheit“)
      await loadAllTargets();
    } catch (err) {
      console.error(err);
      statusEl.textContent = "❌ Fehler beim Upload: " + (err.message || err);
      // Fallback: vorhandene anzeigen
      await loadAllTargets();
    }
  });

  // === Filter ===
  filterInputs.forEach((inp) => inp.addEventListener("input", applyFiltersAndRender));
  clearBtn.addEventListener("click", () => {
    filterInputs.forEach((i) => (i.value = ""));
    applyFiltersAndRender();
  });

  // ===== Helpers =====

  // CSV Parser für Semikolon, unterstützt "..." (mit ; oder , darin) & CRLF
  function parseCSVSemicolon(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];

      if (ch === '"') {
        if (inQuotes && s[i + 1] === '"') {
          field += '"'; // escaped quote
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (ch === ';' && !inQuotes) {
        row.push(field);
        field = "";
        continue;
      }

      if (ch === '\n' && !inQuotes) {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        continue;
      }

      field += ch;
    }
    // letztes Feld/Zeile
    if (field.length > 0 || inQuotes || row.length > 0) {
      row.push(field);
      rows.push(row);
    }

    // Leere/Whitespace-Zeilen filtern
    return rows.filter(r => r.some(cell => String(cell).trim() !== ""));
  }

  function unquote(v) {
    if (v == null) return "";
    let s = String(v).trim();
    if (s.startsWith('"') && s.endsWith('"')) {
      s = s.slice(1, -1);
    }
    return s.trim();
  }

  function cleanText(v) {
    if (v == null) return null;
    const s = String(v).trim();
    return s === "" ? null : s;
  }

  function toInt(v) {
    if (v == null) return null;
    const s = String(v).trim().replace(/\s+/g, ""); // "1 234" -> "1234"
    if (s === "" || s === "-") return null;
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
  }

  async function loadAllTargets() {
    tableMeta.textContent = "📦 Lade Daten…";
    allRows = [];
    currentRows = [];

    // In Batches laden, bis weniger als Batch zurückkommt
    const BATCH = 1000;
    let offset = 0;
    while (true) {
      const { data, error } = await supabase
        .from("targets")
        .select("oz,ig,i,inselname,spieler_id,spielername,allianz_id,allianzkürzel,allianzname,punkte,id")
        .order("id", { ascending: true })
        .range(offset, offset + BATCH - 1);

      if (error) {
        console.error("Ladefehler:", error);
        tableMeta.textContent = "❌ Fehler beim Laden.";
        return;
      }

      const chunk = data ?? [];
      allRows.push(...chunk);
      offset += BATCH;

      if (chunk.length < BATCH) break; // fertig
    }

    tableMeta.textContent = `📊 ${allRows.length} Datensätze geladen. Filter & Sortierung lokal.`;
    applyFiltersAndRender(true);
  }

  function applyFiltersAndRender(resetSort = false) {
    const filters = {};
    for (const inp of filterInputs) {
      const val = inp.value.trim().toLowerCase();
      if (val) filters[inp.dataset.col] = val;
    }

    currentRows = allRows.filter((row) => {
      for (const [col, needle] of Object.entries(filters)) {
        const v = row[col];
        if (v === null || v === undefined) return false;
        if (typeof v === "number") {
          if (!String(v).toLowerCase().includes(needle)) return false;
        } else {
          if (!String(v).toLowerCase().includes(needle)) return false;
        }
      }
      return true;
    });

    if (resetSort) sortState = { col: null, dir: 1 };
    if (sortState.col) {
      const { col, dir } = sortState;
      currentRows.sort((a, b) => {
        const va = a[col], vb = b[col];
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
        return String(va).localeCompare(String(vb), "de", { numeric: true }) * dir;
      });
    }

    renderTable();
  }

  function renderTable() {
    if (!currentRows.length) {
      tableContainer.innerHTML = "<p>Keine Daten nach Filter.</p>";
      return;
    }

    let html = `<table class="data-table excel-like"><thead><tr>`;
    COLUMNS.forEach((c) => {
      const active = sortState.col === c ? (sortState.dir === 1 ? " ▲" : " ▼") : "";
      html += `<th data-col="${c}" class="sortable">${c}${active}</th>`;
    });
    html += `</tr></thead><tbody>`;

    // Alle Zeilen rendern (scrollbarer Container per CSS)
    for (const row of currentRows) {
      html += "<tr>";
      for (const c of COLUMNS) {
        // 0 soll sichtbar sein!
        const v = row[c];
        html += `<td>${v === null || v === undefined ? "" : v}</td>`;
      }
      html += "</tr>";
    }

    html += "</tbody></table>";
    tableContainer.innerHTML = html;

    // Sortier-Events
    tableContainer.querySelectorAll("th.sortable").forEach((th) => {
      th.addEventListener("click", () => {
        const col = th.dataset.col;
        if (sortState.col === col) {
          sortState.dir = -sortState.dir;
        } else {
          sortState = { col, dir: 1 };
        }
        applyFiltersAndRender(false);
      });
    });
  }
});