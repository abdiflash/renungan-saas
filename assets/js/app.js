// ================= CONFIG ADMIN =================
const ACTIVE_TAHUN_AJARAN = "2025/2026";

// ================= DATA DUMMY =================
const renunganData = [
  {
    date: new Date().toISOString().split("T")[0],
    judul: "Renungan Hari Ini",
    ayat: "Mazmur 118:24",
    ayat_text: "Inilah hari yang dijadikan TUHAN...",
    isi: "Hari ini adalah anugerah Tuhan.",
    refleksi: "Bagaimana kamu akan menjalani hari ini bersama Tuhan?",
    audio_url: "",
    status: "published",
    tahun_ajaran: "2025/2026"
  }
];


// ================= UTIL =================
const today = new Date();
today.setHours(0,0,0,0);

let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

// ================= RENDER RENUNGAN =================
function renderRenungan(dateStr) {
  const item = getRenunganByDate(dateStr);

  if (!item) {
    document.getElementById("judul").innerText = "Renungan tidak tersedia";
    document.getElementById("isi").innerText =
      "Renungan belum dipublikasikan atau bukan bagian dari tahun ajaran aktif.";
    document.getElementById("ayat").innerText = "";
    document.getElementById("ayatText").innerText = "";
    document.getElementById("refleksi").innerText = "";
    return;
  }

  document.getElementById("renunganDate").innerText =
    new Date(dateStr).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

  document.getElementById("judul").innerText = item.judul;
  document.getElementById("ayat").innerText = item.ayat;
  document.getElementById("ayatText").innerText = item.ayat_text;
  document.getElementById("isi").innerText = item.isi;
  document.getElementById("refleksi").innerText = item.refleksi;
}


// ================= KALENDER =================
function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";

  const label = document.getElementById("monthLabel");
  const monthDate = new Date(currentYear, currentMonth);
  label.innerText = monthDate.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric"
  });

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
    grid.appendChild(document.createElement("div"));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    date.setHours(0,0,0,0);

    const btn = document.createElement("button");
    btn.innerText = day;

    const dateStr = date.toISOString().split("T")[0];

    if (date > today) {
      btn.innerText = "🔒" + day;
      btn.className = "locked";
      btn.disabled = true;
    } else {
      btn.className = date.getTime() === today.getTime()
        ? "today"
        : "past";

      btn.onclick = () => {
        const available = getRenunganByDate(dateStr);
        if (available) {
          renderRenungan(dateStr);
          toggleCalendar(false);
        }
      };

    }

    grid.appendChild(btn);
  }
}

// ================= UI =================
function toggleCalendar(show) {
  document.getElementById("calendar").classList.toggle("hidden", !show);
}

function getRenunganByDate(dateStr) {
  console.log("Cari tanggal:", dateStr);
  console.log("Data:", renunganData);

  return renunganData.find(r =>
    r.date === dateStr &&
    r.status === "published" &&
    r.tahun_ajaran === ACTIVE_TAHUN_AJARAN
  );
}

document.getElementById("openCalendar").onclick = () => {
  toggleCalendar(true);
  renderCalendar();
};

document.getElementById("closeCalendar").onclick = () => {
  toggleCalendar(false);
};

document.getElementById("prevMonth").onclick = () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
};

document.getElementById("nextMonth").onclick = () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
};

// ================= INIT =================
renderRenungan(today.toISOString().split("T")[0]);
