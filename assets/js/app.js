/* ======================
   KONFIGURASI
====================== */
const ACTIVE_TAHUN_AJARAN = "2025/2026";

// 🔴 GANTI DENGAN ID GOOGLE SHEET KAMU
const SHEET_ID = "1ncjWQ9ZUAZXTppHcKKH5WrivrfINIrHnAO1BQOgp7EY";
const SHEET_NAME = "renungan";

const SHEET_API_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

let renunganData = [];

/* ======================
   UTIL TANGGAL LOKAL
====================== */
function getLocalDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ======================
   LOAD DATA DARI SHEET
====================== */
async function loadRenunganData() {
  const res = await fetch(SHEET_API_URL);
  const text = await res.text();
  console.log("DATA GSHEET:", renunganData);
   
  const json = JSON.parse(
    text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1)
  );

  const headers = json.table.cols.map(c => c.label);

  renunganData = json.table.rows.map(r => {
    const obj = {};
    r.c.forEach((cell, i) => {
      obj[headers[i]] = cell ? cell.v : "";
    });
    return obj;
  });
}

/* ======================
   DATA ACCESS
====================== */
function getRenunganByDate(dateStr) {
  return renunganData.find(r =>
    String(r.date).trim() === dateStr &&
    String(r.status).trim().toLowerCase() === "published" &&
    String(r.tahun_ajaran).trim() === ACTIVE_TAHUN_AJARAN
  );
}


/* ======================
   RENDER RENUNGAN
====================== */
function renderRenungan(dateStr) {
  const r = getRenunganByDate(dateStr);

  document.getElementById("renunganDate").textContent = dateStr;

  if (!r) {
    document.getElementById("judul").textContent = "Renungan tidak tersedia";
    document.getElementById("ayat").textContent = "";
    document.getElementById("ayatText").textContent =
      "Renungan belum dipublikasikan atau bukan bagian dari tahun ajaran aktif.";
    document.getElementById("isi").textContent = "";
    document.getElementById("refleksi").textContent = "";

    // pastikan audio aman
    renderAudio(""); 
    return;
  }

  document.getElementById("judul").textContent = r.judul || "";
  document.getElementById("ayat").textContent = r.ayat || "";
  document.getElementById("ayatText").textContent = r.ayat_text || "";
  document.getElementById("isi").textContent = r.isi || "";
  document.getElementById("refleksi").textContent = r.refleksi || "";

  // 🔹 panggil audio dengan aman
  renderAudio(r.audio_url || "");
}


/* ======================
   KALENDER
====================== */
let currentDate = new Date();

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  const label = document.getElementById("monthLabel");
  grid.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"
  ];

  label.textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  for (let i = 0; i < firstDay; i++) {
    grid.appendChild(document.createElement("div"));
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day";
    cell.textContent = d;

    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

    const isFuture = new Date(year,month,d) > today;
    const isToday =
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();

    if (isFuture) {
      cell.classList.add("locked");
      cell.textContent = "🔒";
    } else {
      if (isToday) cell.classList.add("today");

      cell.onclick = () => {
        renderRenungan(dateStr);
        document.getElementById("calendar").classList.add("hidden");
        document.getElementById("renungan").classList.remove("hidden");
      };
    }

    grid.appendChild(cell);
  }
}
function renderAudio(audioUrl) {
  const btn = document.getElementById("audioBtn");
  const player = document.getElementById("audioPlayer");

  if (!audioUrl) {
    btn.classList.add("hidden");
    player.classList.add("hidden");
    player.src = "";
    return;
  }

  btn.classList.remove("hidden");

  btn.onclick = () => {
    player.src = audioUrl;
    player.classList.remove("hidden");
    player.play();
  };
}

/* ======================
   INIT
====================== */
document.addEventListener("DOMContentLoaded", async () => {
  await loadRenunganData();

  // render renungan hari ini
  const todayStr = getLocalDateString();
  renderRenungan(todayStr);

  // render kalender awal
  renderCalendar(currentMonth, currentYear);

  // buka kalender
  document.getElementById("openCalendar").onclick = () => {
    document.getElementById("renungan").classList.add("hidden");
    document.getElementById("calendar").classList.remove("hidden");
  };

  // tutup kalender
  document.getElementById("closeCalendar").onclick = () => {
    document.getElementById("calendar").classList.add("hidden");
    document.getElementById("renungan").classList.remove("hidden");
  };

  // bulan sebelumnya
  document.getElementById("prevMonth").onclick = () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar(currentMonth, currentYear);
  };

  // bulan berikutnya
  document.getElementById("nextMonth").onclick = () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar(currentMonth, currentYear);
  };
});
