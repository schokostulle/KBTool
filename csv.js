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

  let allRows = [];        // Originaldaten
  let currentRows = [];    // Gefiltert + sortiert
  let sortState = { col: null, dir: 1 }; // 1=ASC, -1=DESC

  // ===== Bestehende Daten beim Laden anzeigen =====
  await loadAllTargets();

  // ===== Upload-Flow =====
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById("csvFile");
    const file = fileInput.files[0];
    if (!file) return alert("Bitte eine CSV-Datei auswählen.");

    statusEl.textContent = "⏳ Upload läuft...";
    try {
      const text = await file.text();
      const rows = text.trim().split("\n").map((r) => r.split(";"));

      // Alles löschen
      const { error: delErr } = await supabase.from("targets").delete().neq("id", 0);
      if (delErr) throw delErr;

      // In Batches einfügen (große CSVs vermeiden 1 großes Insert)
      const mapped = rows.map((r) => ({
        oz: toInt(r[0]), ig: toInt(r[1]), i: toInt(r[2]),
        inselname: safeText(r[3]),
        spieler_id: toInt(r[4]),
        spielername: safeText(r[5]),
        allianz_id: toInt(r[6]),
        allianzkürzel: safeText(r[7]),
        allianzname: safeText(r[8]),
        punkte: toInt(r[9]),
      }));

      const BATCH = 2000;
      for (let offset = 0; offset < mapped.length; offset += BATCH) {
        const chunk = mapped.slice(offset, offset + BATCH);
        const { error: insErr } = await supabase.from("targets").insert(chunk);
        if (insErr) throw insErr;
      }

      await supabase.from("uploads").insert({
        dateiname: file.name,
        uploader_id: user.id,
        timestamp: new Date(),
      });

      statusEl.textContent = `✅ Upload erfolgreich: ${mapped.length} Datensätze importiert.`;

      // Neu laden & rendern
      await loadAllTargets();
    } catch (err) {
      console.error(err);
      statusEl.textContent = "❌ Fehler beim Upload: " + (err.message || err);
    }
  });

  // ===== Filter =====
  filterInputs.forEach((inp) => {
    inp.addEventListener("input", applyFiltersAndRender);
  });
  clearBtn.addEventListener("click", () => {
    filterInputs.forEach((i) => (i.value = ""));
    applyFiltersAndRender();
  });

  // ===== Helpers =====
  function toInt(v) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  }
  function safeText(v) {
    return v === undefined ? null : String(v).trim();
  }

  async function loadAllTargets() {
    tableMeta.textContent = "📦 Lade Daten…";
    allRows = [];
    currentRows = [];

    // Gesamtanzahl holen (HEAD+count)
    const head = await supabase.from("targets").select("*", { count: "exact", head: true });
    if (head.error) {
      tableMeta.textContent = "❌ Konnte Anzahl nicht ermitteln.";
      console.error(head.error);
      return;
    }
    const total = head.count || 0;
    if (total === 0) {
      tableContainer.innerHTML = "<p>Keine Daten vorhanden.</p>";
      tableMeta.textContent = "0 Datensätze.";
      return;
    }

    // In Batches laden
    const BATCH = 2000;
    for (let from = 0; from < total; from += BATCH) {
      const to = Math.min(from + BATCH - 1, total - 1);
      const { data, error } = await supabase
        .from("targets")
        .select("oz,ig,i,inselname,spieler_id,spielername,allianz_id,allianzkürzel,allianzname,punkte,created_at,id")
        .order("id", { ascending: true })
        .range(from, to);

      if (error) {
        console.error(error);
        tableMeta.textContent = "❌ Fehler beim Laden.";
        return;
      }
      allRows.push(...data);
    }

    tableMeta.textContent = `📊 ${allRows.length} Datensätze geladen. Filter & Sortierung lokal.`;
    applyFiltersAndRender(true);
  }

  function applyFiltersAndRender(resetSort = false) {
    // 1) Filter anwenden (contains, case-insensitive)
    const filters = {};
    filterInputs.forEach((inp) => {
      const val = inp.value.trim().toLowerCase();
      if (val) filters[inp.dataset.col] = val;
    });

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

    // 2) Sortierung
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

    // Alle Zeilen rendern (excel-like, mit scrollbarem Container)
    for (const row of currentRows) {
      html += "<tr>";
      for (const c of COLUMNS) {
        html += `<td>${row[c] ?? ""}</td>`;
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