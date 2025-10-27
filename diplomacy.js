import { supabase } from './supabase.js';

async function loadDiplomacy() {
  const { data, error } = await supabase
    .from('diplomacy')
    .select('alliance_name, relation, created_at');
  if (error) return console.error(error);

  const table = document.getElementById('diplomacyTable');
  table.innerHTML = data.map(d => `
    <tr>
      <td>${d.alliance_name}</td>
      <td>${d.relation}</td>
      <td>${new Date(d.created_at).toLocaleDateString()}</td>
    </tr>
  `).join('');
}

document.addEventListener('DOMContentLoaded', loadDiplomacy);