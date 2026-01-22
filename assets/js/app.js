const ACTIVE_TAHUN_AJARAN = "2025/2026";

const SHEET_ID = "1ncjWQ9ZUAZXTppHcKKH5WrivrfINIrHnAO1BQOgp7EY";
const SHEET_NAME = "renungan";

const SHEET_API_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

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

let renunganData = [];

/* ======================
   LOAD DATA DARI GSHEET
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
   INIT
====================== */
document.addEventListener("DOMContentLoaded", async () => {
  await loadRenunganData();
  renderRenungan(getLocalDateString());
});
