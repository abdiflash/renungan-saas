// ===== KONFIGURASI =====
const SHEET_ID = '1ncjWQ9ZUAZXTppHcKKH5WrivrfINIrHnAO1BQOgp7EY';
const SHEET_NAME = 'renungan';
let audio = new Audio();

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

    return data.table.rows.map(row => {
      const obj = {};
      data.table.cols.forEach((col, i) => {
        let val = row.c[i] ? row.c[i].v : '';
        obj[col.label] = typeof val === 'string' ? val.trim() : val; // trim otomatis
      });
      return obj;
    }).filter(r => r.status && r.status.toLowerCase() === 'published'); // hanya published
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
    audio.pause();
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
  audio.src = url ? url.trim() : ''; // trim otomatis
  audio.pause();
  btn.textContent = '▶️ Putar Audio';

  btn.onclick = () => {
    if (!audio.src) return alert('Audio belum tersedia!');
    if (audio.paused) {
      audio.play().catch(err => console.warn('Audio play error:', err));
      btn.textContent = '⏸️ Pause Audio';
    } else {
      audio.pause();
      btn.textContent = '▶️ Putar Audio';
    }
  };
}

// ===== RENDER KALENDER BULANAN =====
function renderCalendar(month = currentMonth, year = currentYear) {
  const container = document.getElementById('calendarGrid');
  const monthLabel = document.getElementById('monthLabel');
  container.innerHTML = '';

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date().toISOString().slice(0,10);

  // Label bulan
  const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  monthLabel.textContent = `${monthNames[month]} ${year}`;

  // Blank cells untuk awal bulan
  for(let i=0; i<firstDay.getDay(); i++){
    const empty = document.createElement('div');
    container.appendChild(empty);
  }

  // Tanggal
  for(let d=1; d<=lastDay.getDate(); d++){
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const cell = document.createElement('div');
    cell.classList.add('date-cell');
    cell.textContent = d;

    if(dateStr === today) cell.classList.add('today');

    // Cek renungan
    const renungan = sheetData.find(r => r.Tanggal === dateStr);
    if(renungan){
      cell.classList.add('has-renungan');
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = renungan.Judul;
      cell.appendChild(tooltip);
    }

    // Klik tanggal
    cell.onclick = () => {
      if(renungan) renderRenungan(renungan);
    };

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

// Jalankan
initApp();
