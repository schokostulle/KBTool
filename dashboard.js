import { supabase, getCurrentUser } from './supabase.js';

async function loadNews() {
  const { data, error } = await supabase
    .from('news')
    .select('id, title, content, author_name, created_at')
    .order('created_at', { ascending: false });
  if (error) return console.error(error);

  const list = document.getElementById('newsList');
  list.innerHTML = data.map(n => `
    <div class="news-item">
      <h3>${n.title}</h3>
      <p>${n.content}</p>
      <small>von ${n.author_name || 'unbekannt'} – ${new Date(n.created_at).toLocaleString()}</small>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', loadNews);