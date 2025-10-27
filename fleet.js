import { supabase, getCurrentUser } from './supabase.js';

async function loadFleet() {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('fleet')
    .select('ship_type, amount, speed, position')
    .eq('user_id', user.id);
  if (error) return console.error(error);

  const list = document.getElementById('fleetTable');
  list.innerHTML = data.map(f => `
    <tr>
      <td>${f.ship_type}</td>
      <td>${f.amount}</td>
      <td>${f.speed}</td>
      <td>${f.position}</td>
    </tr>
  `).join('');
}

document.addEventListener('DOMContentLoaded', loadFleet);