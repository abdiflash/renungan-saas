// ===== KONFIGURASI =====
const SHEET_ID = '1ncjWQ9ZUAZXTppHcKKH5WrivrfINIrHnAO1BQOgp7EY';
const SHEET_NAME = 'renungan';
let audio = new Audio();

// ===== FETCH DATA DARI GOOGLE SHEET =====
async function fetchSheetData() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    const jsonText = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/)[1];
    const data = JSON.parse(jsonText);
    return data.table.rows.map(row => {
      const obj = {};
      data.table.cols.forEach((col, i) => obj[col.label] = row.c[i] ? row.c[i].v : '');
      return obj;
    });
  } catch(err) {
    console.error('Error fetch sheet:', err);
    return [];
  }
}

// ===== RENDER RENUNGAN =====
function renderRenungan(renungan) {
  const container = document.getElementById('renungan');
  if (!renungan) {
    container.innerHTML = `<p>Renungan tidak tersedia.</p>`;
    return;
  }
  container.innerHTML = `
    <h2>${renungan.Judul}</h2>
    <p>${renungan.Teks}</p>
    <button id="audioControl">▶️ Putar Audio</button>
  `;
  setupAudio(renungan.AudioURL);
}

// ===== AUDIO PLAYER =====
function setupAudio(url) {
  const btn = document.getElementById('audioControl');
  audio.src = url;
  audio.pause();
  btn.textContent = '▶️ Putar Audio';

  btn.onclick = () => {
    if (audio.paused) {
      audio.play().catch(err => console.warn('Audio error:', err));
      btn.textContent = '⏸️ Pause Audio';
    } else {
      audio.pause();
      btn.textContent = '▶️ Putar Audio';
    }
  };
}

// ===== RENDER KALENDER BULANAN =====
function renderCalendar(data) {
  const container = document.getElementById('calendar');
  container.innerHTML = '';

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  // Fill blank cells for starting day
  for(let i=0; i<firstDay.getDay(); i++){
    const emptyCell = document.createElement('div');
    container.appendChild(emptyCell);
  }

  for(let d=1; d<=lastDay.getDate(); d++){
    const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const cell = document.createElement('div');
    cell.classList.add('date-cell');
    cell.textContent = d;

    if(dateStr === today.toISOString().slice(0,10)){
      cell.classList.add('today');
    }

    const renungan = data.find(r => r.Tanggal === dateStr);
    if(renungan){
      cell.classList.add('has-renungan');
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = renungan.Judul;
      cell.appendChild(tooltip);
    }

    cell.onclick = () => {
      if(renungan){
        renderRenungan(renungan);
      }
    };

    container.appendChild(cell);
  }
}

// ===== INIT APP =====
async function initApp(){
  const data = await fetchSheetData();

  // Render renungan hari ini
  const today = new Date().toISOString().slice(0,10);
  const todayRenungan = data.find(r => r.Tanggal === today);
  renderRenungan(todayRenungan);

  // Render kalender
  renderCalendar(data);
}

// Jalankan
initApp();
