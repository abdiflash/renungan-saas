/* ================= KONFIGURASI ================= */
// Pastikan ID ini benar & Sheet sudah di-Share "Anyone with link -> Viewer"
const SHEET_ID = '1ncjWQ9ZUAZXTppHcKKH5WrivrfINIrHnAO1BQOgp7EY'; 
const SHEET_GID = '0'; // Biasanya '0' untuk tab pertama

/* ================= STATE APLIKASI ================= */
let allRenungan = [];
let currentCalendarDate = new Date();
const today = new Date();
today.setHours(0,0,0,0); // Reset jam agar perbandingan tanggal akurat

/* ================= INISIALISASI ================= */
document.addEventListener("DOMContentLoaded", () => {
    loadAcademicYear();
    fetchData();
});

/* ================= 1. FETCH & PARSE DATA ================= */
async function fetchData() {
    // Query mengambil kolom A sampai I
    const query = `SELECT A, B, C, D, E, F, G, H, I`; 
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&tq=${encodeURIComponent(query)}&gid=${SHEET_GID}`;

    try {
        const res = await fetch(url);
        const text = await res.text();
        // Membersihkan wrapper JSON dari Google
        const jsonText = text.substring(47).slice(0, -2);
        const json = JSON.parse(jsonText);

        parseData(json.table.rows);
        
        // --- LOGIKA TAMPILAN AWAL ---
        // Cari renungan hari ini
        const todayStr = formatDateKey(today);
        const todayData = allRenungan.find(r => r.key === todayStr);

        document.getElementById('loader').classList.add('hidden');

        if (todayData) {
            renderRenungan(todayData);
        } else {
            // Jika hari ini kosong, tampilkan Empty State
            document.getElementById('emptyState').classList.remove('hidden');
        }

    } catch (error) {
        console.error("Error Fetching:", error);
        document.getElementById('loader').innerHTML = "⚠️ Gagal memuat data.<br>Cek ID Sheet & Koneksi Internet.";
    }
}

function parseData(rows) {
    allRenungan = rows.map(row => {
        const v = (i) => (row.c[i] ? row.c[i].v : '');
        
        // Parsing Tanggal dengan aman (mengatasi format "Date(yyyy,m,d)" atau string)
        let d = null;
        if (row.c[0]) {
            if (typeof row.c[0].v === 'string' && row.c[0].v.includes('Date')) {
                const parts = row.c[0].v.match(/Date\((\d+),(\d+),(\d+)\)/);
                if(parts) d = new Date(parts[1], parts[2], parts[3]);
            } else {
                d = new Date(v(0));
            }
        }
        
        if (!d || isNaN(d)) return null;

        // PENTING: Urutan kolom harus sesuai Google Sheet Anda (A-H)
        return {
            key: formatDateKey(d),     // Format YYYY-MM-DD untuk pencarian
            dateObj: d,                // Objek Date asli
            judul: v(1),               // Col B
            teks: v(2),                // Col C
            refleksi: v(3),            // Col D
            ayat: v(4),                // Col E
            ayatText: v(5),            // Col F
            audioUrl: v(6),            // Col G
            status: String(v(7)).toLowerCase(), // Col H
            tahunAjaran: v(8)          // Col I
        };
    }).filter(item => item && item.status === 'published'); // Hanya ambil yang published
}

/* ================= 2. RENDER RENUNGAN UTAMA ================= */
function renderRenungan(data) {
    // Manajemen Tampilan (Hide Calendar/Empty, Show Renungan)
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('calendar').classList.add('hidden');
    document.getElementById('renungan').classList.remove('hidden');

    // Isi Konten Teks
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('displayDate').innerText = data.dateObj.toLocaleDateString('id-ID', options);
    document.getElementById('displayJudul').innerText = data.judul;
    document.getElementById('displayAyat').innerText = data.ayat;
    document.getElementById('displayAyatText').innerText = `"${data.ayatText}"`;
    document.getElementById('displayIsi').innerHTML = data.teks.replace(/\n/g, '<br>');
    document.getElementById('displayRefleksi').innerText = data.refleksi;

    // --- LOGIKA AUDIO CERDAS ---
    setupAudioPlayer(data.audioUrl);
}

function setupAudioPlayer(urlRaw) {
    const player = document.getElementById('audioPlayer');
    const btn = document.getElementById('audioControl');
    const source = document.getElementById('audioSource');

    // Reset Player
    player.pause();
    player.style.display = 'none';
    btn.innerHTML = '▶️ Putar Audio';

    if (urlRaw && urlRaw.trim() !== "") {
        let finalUrl = urlRaw.trim();
        
        // Cek apakah ini URL eksternal (http) atau file lokal
        if (!finalUrl.startsWith('http')) {
            // Jika cuma nama file (misal: "renungan-pagi.mp3"), tambahkan path assets
            finalUrl = `assets/audio/${finalUrl}`;
        }
        
        source.src = finalUrl;
        player.load(); // Reload source baru
        btn.style.display = 'inline-flex';
        btn.disabled = false;
    } else {
        // Jika tidak ada audio
        btn.style.display = 'none';
    }
}

// Fungsi Tombol Play/Pause
function toggleAudio() {
    const player = document.getElementById('audioPlayer');
    const btn = document.getElementById('audioControl');

    if (player.paused) {
        player.style.display = 'block'; // Tampilkan kontrol asli
        player.play();
        btn.innerHTML = '⏸️ Pause Audio';
    } else {
        player.pause();
        btn.innerHTML = '▶️ Lanjutkan Audio';
    }
}

/* ================= 3. LOGIKA KALENDER ================= */
function showCalendarView() {
    document.getElementById('renungan').classList.add('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('calendar').classList.remove('hidden');
    renderCalendar();
}

function hideCalendarView() {
    // Logika tombol "Tutup Kalender"
    if (document.getElementById('displayJudul').innerText === "") {
         // Kalau belum ada renungan yang dimuat, balik ke Empty State
         document.getElementById('calendar').classList.add('hidden');
         document.getElementById('emptyState').classList.remove('hidden');
    } else {
         // Balik ke renungan terakhir dilihat
         document.getElementById('calendar').classList.add('hidden');
         document.getElementById('renungan').classList.remove('hidden');
    }
}

function changeMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = ''; // Bersihkan grid lama

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Label Bulan
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    document.getElementById('calendarMonthLabel').innerText = `${monthNames[month]} ${year}`;

    // Hitung posisi tanggal 1
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Render Kotak Kosong (sebelum tanggal 1)
    for (let i = 0; i < firstDayIndex; i++) {
        const empty = document.createElement('div');
        empty.className = 'date-cell empty';
        grid.appendChild(empty);
    }

    // Render Tanggal 1 - 31
    for (let i = 1; i <= daysInMonth; i++) {
        const dateCheck = new Date(year, month, i);
        dateCheck.setHours(0,0,0,0);
        const dateKey = formatDateKey(dateCheck);
        
        const cell = document.createElement('div');
        cell.className = 'date-cell';
        cell.innerText = i;

        // Tandai Hari Ini
        if (dateKey === formatDateKey(today)) cell.classList.add('today');

        // LOGIKA PENGUNCIAN (LOCK)
        if (dateCheck > today) {
            // Masa Depan -> Terkunci
            cell.classList.add('locked');
            cell.title = "Belum tersedia";
            cell.onclick = () => alert("Renungan untuk tanggal ini belum dibuka.");
        } else {
            // Masa Lalu/Hari Ini -> Cek Data
            const dataRenungan = allRenungan.find(r => r.key === dateKey);

            if (dataRenungan) {
                cell.classList.add('available', 'has-renungan');
                
                // Tooltip Judul
                const tooltip = document.createElement('span');
                tooltip.className = 'tooltip-text';
                tooltip.innerText = dataRenungan.judul;
                cell.appendChild(tooltip);

                // Klik -> Buka Renungan
                cell.onclick = () => renderRenungan(dataRenungan);
            } else {
                // Tanggal lewat tapi data kosong
                cell.style.opacity = '0.5';
                cell.title = "Tidak ada renungan";
            }
        }
        grid.appendChild(cell);
    }
}

/* ================= UTILITIES & ADMIN ================= */

// Helper: Format Date ke String YYYY-MM-DD (Local Timezone safe)
function formatDateKey(date) {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset*60*1000));
    return localDate.toISOString().split('T')[0];
}

// Fitur Admin: Ubah Tahun Ajaran (Disimpan di Browser)
function loadAcademicYear() {
    const saved = localStorage.getItem('renungan_ta');
    if(saved) document.getElementById('academicYear').innerText = saved;
}

function editAcademicYear() {
    const current = document.getElementById('academicYear').innerText;
    const newVal = prompt("Ubah Tahun Ajaran:", current);
    if (newVal) {
        document.getElementById('academicYear').innerText = newVal;
        localStorage.setItem('renungan_ta', newVal);
    }
}
