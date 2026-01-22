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
});
