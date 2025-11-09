// === DYNAMISCHE NAVIGATION (Supabase-Version) ===

async function initNavigation() {
  // Session prüfen
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Fehler beim Abrufen der Session:", error);
    window.location.href = "index.html";
    return;
  }

  const session = data.session;
  if (!session) {
    // Kein Benutzer eingeloggt
    window.location.href = "index.html";
    return;
  }

  // Benutzerprofil laden
  const userId = session.user.id;
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username, role, status, deleted")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    console.error("Profil konnte nicht geladen werden:", profileError);
    window.location.href = "index.html";
    return;
  }

  if (profile.deleted || profile.status === "blocked") {
    alert("Dieses Konto ist deaktiviert oder blockiert.");
    await supabase.auth.signOut();
    window.location.href = "index.html";
    return;
  }

  // Menü-Struktur
  const navLinks = [
    { name: "🏠 Dashboard", url: "dashboard.html", role: "all" },
    { name: "👥 Member Verwaltung", url: "members.html", role: "admin" },
    { name: "📤 CSV Upload", url: "csv.html", role: "admin" },
    { name: "⚔️ Kampfberichte", url: "reports.html", role: "all" },
    { name: "🚢 Flottenberichte", url: "fleets.html", role: "all" },
    { name: "🤝 Diplomatie", url: "diplomacy.html", role: "admin" },
    { name: "🌍 Inselanalyse", url: "island-summary.html", role: "admin" },
    { name: "🏝️ Inselreservierungen", url: "islands.html", role: "all" },
    { name: "📊 Flottenauswertung", url: "analysis.html", role: "admin" },
    { name: "🕒 Angriffsrechner", url: "attackcalc.html", role: "all" },
    { name: "📰 News / Portal", url: "news.html", role: "admin" }
  ];

  // HTML-Container erzeugen
  const navContainer = document.createElement("nav");
  navContainer.className = "side-nav";

  // Rollenfarbe
  const roleColor = profile.role === "admin" ? "#ff6b6b" : "#4caf50";

  // Benutzeranzeige + Logout
  const userInfo = `
    <div class="user-info">
      <p><strong>${profile.username}</strong></p>
      <p style="font-size: 0.9em; color: ${roleColor};">${profile.role}</p>
      <button id="logoutBtn">Logout</button>
    </div>
  `;

  // Menüeinträge erzeugen
  let navItems = navLinks
    .filter(link => link.role === "all" || link.role === profile.role)
    .map(link => `<a href="${link.url}">${link.name}</a>`)
    .join("");

  // Zusammenbauen
  navContainer.innerHTML = `
    ${userInfo}
    <hr>
    <div class="nav-links">${navItems}</div>
  `;

  // In die Seite einfügen
  document.body.insertBefore(navContainer, document.body.firstChild);

  // Aktive Seite hervorheben
  const currentPage = window.location.pathname.split("/").pop();
  navContainer.querySelectorAll("a").forEach(a => {
    if (a.getAttribute("href") === currentPage) {
      a.classList.add("active");
    }
  });

  // Logout-Funktion
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "index.html";
  });
}

// Navigation initialisieren
initNavigation();