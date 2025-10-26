// js/members.js
// Admin-Mitgliederverwaltung für Bullfrog Community

import { supabase } from './supabase.js';

// DOM-Elemente
const membersContainer = document.getElementById('membersContainer');
const infoBox = document.getElementById('infoBox');

// ------------------------------
// 🧭 Hilfsfunktionen
// ------------------------------

async function getCurrentUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) console.error('Profile load error:', error);
  return data;
}

async function loadMembers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, role, banned, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Load members error:', error);
    return [];
  }
  return data;
}

// ------------------------------
// ⚙️ Aktionen
// ------------------------------

async function changeRole(userId, newRole) {
  try {
    const { error } = await supabase.rpc('set_user_role', {
      target_id: userId,
      new_role: newRole
    });
    if (error) throw error;
    showMessage(`✅ Rolle geändert zu ${newRole}`);
    await renderMembers();
  } catch (err) {
    showMessage(`❌ Fehler beim Ändern der Rolle: ${err.message}`);
  }
}

async function blockUser(userId) {
  try {
    const { error } = await supabase.rpc('block_user', { target_id: userId });
    if (error) throw error;
    showMessage(`🚫 Nutzer gesperrt`);
    await renderMembers();
  } catch (err) {
    showMessage(`❌ Fehler beim Sperren: ${err.message}`);
  }
}

async function unblockUser(userId) {
  try {
    const { error } = await supabase.rpc('unblock_user', { target_id: userId });
    if (error) throw error;
    showMessage(`✅ Nutzer entsperrt`);
    await renderMembers();
  } catch (err) {
    showMessage(`❌ Fehler beim Entsperren: ${err.message}`);
  }
}

// ------------------------------
// 🖥️ Rendering im Dashboard
// ------------------------------

function showMessage(msg) {
  if (!infoBox) return;
  infoBox.textContent = msg;
  infoBox.classList.remove('hidden');
  setTimeout(() => infoBox.classList.add('hidden'), 4000);
}

async function renderMembers() {
  const members = await loadMembers();
  membersContainer.innerHTML = '';

  members.forEach(member => {
    const div = document.createElement('div');
    div.className = 'member-card';

    const bannedText = member.banned ? '🚫 Gesperrt' : '🟢 Aktiv';
    div.innerHTML = `
      <div class="member-info">
        <strong>${member.username}</strong><br>
        <small>Rolle: ${member.role}</small><br>
        <small>Status: ${bannedText}</small>
      </div>
      <div class="member-actions">
        <button class="btn-role" data-id="${member.id}" data-role="applicant">Anwärter</button>
        <button class="btn-role" data-id="${member.id}" data-role="member">Mitglied</button>
        <button class="btn-role" data-id="${member.id}" data-role="admin">Admin</button>
        <button class="btn-block" data-id="${member.id}">🚫 Sperren</button>
        <button class="btn-unblock" data-id="${member.id}">✅ Entsperren</button>
      </div>
    `;

    membersContainer.appendChild(div);
  });

  // Button-Events
  document.querySelectorAll('.btn-role').forEach(btn => {
    btn.addEventListener('click', () => changeRole(btn.dataset.id, btn.dataset.role));
  });

  document.querySelectorAll('.btn-block').forEach(btn => {
    btn.addEventListener('click', () => blockUser(btn.dataset.id));
  });

  document.querySelectorAll('.btn-unblock').forEach(btn => {
    btn.addEventListener('click', () => unblockUser(btn.dataset.id));
  });
}

// ------------------------------
// 🚀 Init
// ------------------------------

(async () => {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    showMessage('Nicht eingeloggt');
    return;
  }

  if (profile.role !== 'admin') {
    // Nur Admin darf Mitgliederverwaltung sehen
    showMessage('⚠️ Kein Zugriff – Adminrechte erforderlich');
    if (membersContainer) membersContainer.innerHTML = '<p>Zugriff verweigert</p>';
    return;
  }

  await renderMembers();
})();