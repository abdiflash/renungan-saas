const ACTIVE_TAHUN_AJARAN = "2025/2026";

function getLocalDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

function getRenunganByDate(dateStr) {
  return renunganData.find(r =>
    r.date === dateStr &&
    r.status === "published" &&
    r.tahun_ajaran === ACTIVE_TAHUN_AJARAN
  );
}

function renderRenungan(dateStr) {
  const container = document.getElementById("renungan-content");
  const r = getRenunganByDate(dateStr);

  if (!r) {
    container.innerHTML = `
      <h2>Renungan tidak tersedia</h2>
      <p>Renungan belum dipublikasikan atau bukan bagian dari tahun ajaran aktif.</p>
    `;
    return;
  }

  container.innerHTML = `
    <h2>${r.judul}</h2>
    <p><strong>${r.ayat}</strong></p>
    <p>${r.ayat_text}</p>
    <p>${r.isi}</p>
    <p><em>${r.refleksi}</em></p>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const today = getLocalDateString();
  renderRenungan(today);
});
