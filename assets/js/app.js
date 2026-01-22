const ACTIVE_TAHUN_AJARAN = "2025/2026";
const SHEET_ID = "1ncjWQ9ZUAZXTppHcKKH5WrivrfINIrHnAO1BQOgp7EY";
const SHEET_NAME = "renungan";

const SHEET_API_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;


/* ======================
   UTIL: TANGGAL LOKAL
====================== */
function getLocalDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

let renunganData = [];

/* ======================
   FETCH DATA GSHEET
====================== */
async function loadRenunganData() {
  const res = await fetch(SHEET_API_URL);
  const text = await res.text();

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
    r.date === dateStr &&
    r.status === "published" &&
    r.tahun_ajaran === ACTIVE_TAHUN_AJARAN
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
    return;
  }

  document.getElementById("judul").textContent = r.judul;
  document.getElementById("ayat").textContent = r.ayat;
  document.getElementById("ayatText").textContent = r.ayat_text;
  document.getElementById("isi").textContent = r.isi;
  document.getElementById("refleksi").textContent = r.refleksi;
}

/* ======================
   KALENDER STATE
====================== */
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

/* ======================
   RENDER KALENDER
====================== */
function renderCalendar(month, year) {
  const grid = document.getElementById("calendarGrid");
  const label = document.getElementById("monthLabel");
  if (!grid || !label) return;

  grid.innerHTML = "";

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  label.textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "calendar-day empty";
    grid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day";
    cell.textContent = day;

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const isToday =
      day === todayDay &&
      month === todayMonth &&
      year === todayYear;

    const isFuture =
      new Date(year, month, day) >
      new Date(todayYear, todayMonth, todayDay);

    if (isFuture) {
      cell.classList.add("locked");
      cell.textContent = "🔒";
    } else {
      if (isToday) {
        cell.classList.add("today");
      }

      cell.addEventListener("click", () => {
        renderRenungan(dateStr);
        document.getElementById("calendar").classList.add("hidden");
        document.getElementById("renungan").classList.remove("hidden");
      });
    }

    grid.appendChild(cell);
  }
}

/* ======================
   NAVIGASI BULAN
====================== */
function setupCalendarNavigation() {
  document.getElementById("prevMonth")?.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar(currentMonth, currentYear);
  });

  document.getElementById("nextMonth")?.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar(currentMonth, currentYear);
  });
}

/* ======================
   TOGGLE KALENDER
====================== */
function setupCalendarToggle() {
  const openBtn = document.getElementById("openCalendar");
  const closeBtn = document.getElementById("closeCalendar");
  const calendar = document.getElementById("calendar");
  const renungan = document.getElementById("renungan");

  openBtn.onclick = () => {
    renungan.classList.add("hidden");
    calendar.classList.remove("hidden");
  };

  closeBtn.onclick = () => {
    calendar.classList.add("hidden");
    renungan.classList.remove("hidden");
  };
}

/* ======================
   INIT (PALING PENTING)
====================== */
document.addEventListener("DOMContentLoaded", async () => {
  await loadRenunganData();
  renderRenungan(getLocalDateString());
  renderCalendar(currentMonth, currentYear);
  setupCalendarNavigation();
  setupCalendarToggle();
});
