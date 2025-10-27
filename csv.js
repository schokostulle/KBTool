import { supabase, getCurrentUser } from './supabase.js';

document.getElementById('csvUpload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function () {
    const rows = reader.result.split('\n').map(r => r.split(';'));
    const data = rows.map(r => ({
      oz: r[0],
      ig: r[1],
      i: r[2],
      island_name: r[3],
      player_id: r[4],
      player_name: r[5],
      alliance_id: r[6],
      alliance_name: r[8],
      points: r[9]
    }));

    const { error } = await supabase.from('targets').upsert(data, { onConflict: 'id' });
    if (error) return alert('Fehler beim CSV-Upload: ' + error.message);
    alert('CSV erfolgreich hochgeladen.');
  };
  reader.readAsText(file, 'utf-8');
});