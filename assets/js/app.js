const ACTIVE_TAHUN_AJARAN = "2025/2026";

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

/* ======================
   DATA (DUMMY / NANTI DARI GSHEET)
====================== */
const renunganData = [
  {
    date: getLocalDateString(),
    judul: "RENUNGAN TEST FINAL",
    ayat: "Mazmur 118:24",
    ayat_text: "Inilah hari yang dijadikan TUHAN...",
    isi: "JIKA INI MUNCUL, MAKA SEMUA MASALAH SELESAI.",
    refleksi: "Apakah kamu percaya Tuhan menyertaimu?",
    audio_url: "",
    status: "published",
    tahun_ajaran: "2025/2026"
  }
];

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
  const todayStr = getLocalDateString();

  // padding sebelum tanggal 1
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

    if (dateStr > todayStr) {
      cell.classList.add("locked");
      cell.textContent = "🔒";
    } else {
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
  const calendarSection = document.getElementById("calendar");
  const renunganSection = document.getElementById("renungan");

  if (!openBtn || !closeBtn) return;

  openBtn.addEventListener("click", () => {
    renunganSection.classList.add("hidden");
    calendarSection.classList.remove("hidden");
  });

  closeBtn.addEventListener("click", () => {
    calendarSection.classList.add("hidden");
    renunganSection.classList.remove("hidden");
  });
}

/* ======================
   INIT
====================== */
document.addEventListener("DOMContentLoaded", () => {
  renderRenungan(getLocalDateString());
  setupCalendarToggle();
  setupCalendarNavigation();
  renderCalendar(currentMonth, currentYear);
});
