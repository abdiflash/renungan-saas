// ===== KONFIGURASI =====
const SHEET_ID = '1ncjWQ9ZUAZXTppHcKKH5WrivrfINIrHnAO1BQOgp7EY';
const SHEET_NAME = 'renungan';

// ===== STATE =====
let sheetData = [];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// ===== FETCH DATA DARI GOOGLE SHEET =====
async function fetchSheetData() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    const jsonText = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/)[1];
    const data = JSON.parse(jsonText);

    const todayStr = new Date().toISOString().slice(0,10);
    // Map & filter published + tanggal <= hari ini
    return data.table.rows.map(row => {
      const obj = {};
      data.table.cols.forEach((col, i) => {
        let val = row.c[i] ? row.c[i].v : '';
        obj[col.label] = typeof val === 'string' ? val.trim() : val;
      });
      return obj;
    }).filter(r => r.status && r.status.toLowerCase() === 'published' && r.Tanggal <= todayStr);
  } catch (err) {
    console.error('Error fetch sheet:', err);
    return [];
  }
}

// ===== RENDER RENUNGAN =====
function renderRenungan(renungan) {
  const judulEl = document.getElementById('judul');
  const ayatEl = document.getElementById('ayat');
  const ayatTextEl = document.getElementById('ayatText');
  const isiEl = document.getElementById('isi');
  const refleksiEl = document.getElementById('refleksi');
  const renunganDate = document.getElementById('renunganDate');

  if (!renungan) {
    judulEl.textContent = '';
    ayatEl.textContent = '';
    ayatTextEl.textContent = '';
    isiEl.textContent = 'Renungan tidak tersedia.';
    refleksiEl.textContent = '';
    renunganDate.textContent = '';
    hideAudioPlayer();
    return;
  }

  judulEl.textContent = renungan.Judul;
  ayatEl.textContent = renungan.Ayat || '';
  ayatTextEl.textContent = renungan.AyatText || '';
  isiEl.textContent = renungan.Teks || '';
  refleksiEl.textContent = renungan.Refleksi || '';
  renunganDate.textContent = renungan.Tanggal;

  setupAudio(renungan.AudioURL);
}

// ===== AUDIO PLAYER =====
function setupAudio(url) {
  const btn = document.getElementById('audioControl');

  // Jika player belum ada, buat
  let player = document.getElementById('audioPlayer');
  if (!player) {
    player = document.createElement('audio');
    player.id = 'audioPlayer';
    player.controls = true;
    player.style.display = 'none';
    document.getElementById('renungan').appendChild(player);
  }

  player.pause();
  player.src = '';
  player.style.display = 'none';
  btn.textContent = '▶️ Putar Audio';

  btn.onclick = () => {
    if (!url) return alert('Audio belum tersedia untuk tanggal ini!');

    if (player.src !== url) {
      player.src = url.trim();
      player.style.display = 'block';
      player.play().catch(err => console.warn('Audio play error:', err));
      btn.textContent = '⏸️ Pause Audio';
    } else {
      if (player.paused) {
        player.play().catch(err => console.warn('Audio play error:', err));
        btn.textContent = '⏸️ Pause Audio';
      } else {
        player.pause();
        btn.textContent = '▶️ Putar Audio';
      }
    }
  };
}

function hideAudioPlayer() {
  const player = document.getElementById('audioPlayer');
  if (player) {
    player.pause();
    player.style.display = 'none';
  }
}

// ===== RENDER KALENDER BULANAN =====
function renderCalendar(month = currentMonth, year = currentYear) {
  const container = document.getElementById('calendarGrid');
  const monthLabel = document.getElementById('monthLabel');
  container.innerHTML = '';

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const todayStr = new Date().toISOString().slice(0,10);

  const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  monthLabel.textContent = `${monthNames[month]} ${year}`;

  for(let i=0;i<firstDay.getDay();i++){ container.appendChild(document.createElement('div')); }

  for(let d=1; d<=lastDay.getDate(); d++){
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const cell = document.createElement('div');
    cell.classList.add('date-cell');
    cell.textContent = d;

    if(dateStr === todayStr) cell.classList.add('today');

    const renungan = sheetData.find(r => r.Tanggal === dateStr);

    if(dateStr > todayStr){
      cell.classList.add('locked');
      cell.onclick = () => alert('Renungan untuk tanggal ini belum tersedia.');
    } else if(renungan){
      cell.classList.add('has-renungan');
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = renungan.Judul;
      cell.appendChild(tooltip);
      cell.onclick = () => renderRenungan(renungan);
    }

    container.appendChild(cell);
  }
}

// ===== NAVIGASI BULAN =====
document.getElementById('prevMonth').onclick = () => {
  currentMonth--;
  if(currentMonth < 0){ currentMonth = 11; currentYear--; }
  renderCalendar(currentMonth, currentYear);
};

document.getElementById('nextMonth').onclick = () => {
  currentMonth++;
  if(currentMonth > 11){ currentMonth = 0; currentYear++; }
  renderCalendar(currentMonth, currentYear);
};

// ===== TOMBOL BUKA/TUTUP KALENDER =====
document.getElementById('openCalendar').onclick = () => {
  document.getElementById('calendar').classList.remove('hidden');
};
document.getElementById('closeCalendar').onclick = () => {
  document.getElementById('calendar').classList.add('hidden');
};

// ===== ADMIN EDIT TAHUN AJARAN =====
const yearElem = document.querySelector('.app-header strong');
yearElem.onclick = () => {
  const newYear = prompt('Masukkan Tahun Ajaran baru (misal 2025 / 2026):', yearElem.textContent);
  if(newYear) yearElem.textContent = newYear;
};

// ===== INIT APP =====
async function initApp() {
  sheetData = await fetchSheetData();

  // Render renungan hari ini
  const todayStr = new Date().toISOString().slice(0,10);
  const todayRenungan = sheetData.find(r => r.Tanggal === todayStr);
  renderRenungan(todayRenungan);

  // Render kalender bulan ini
  renderCalendar();
}

initApp();
