/* ================= KONFIGURASI ================= */
// ID Spreadsheet Anda (Sudah Benar)
const SHEET_ID = '1ncjWQ9ZUAZXTppHcKKH5WrivrfINIrHnAO1BQOgp7EY'; 

// ⚠️ PENTING: GID harus ANGKA. Tab pertama selalu '0'.
// Jangan tulis nama sheet ('renungan') di sini.
const SHEET_GID = '0'; 

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
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        
        const text = await res.text();
        // Membersihkan wrapper JSON dari Google
        const jsonText = text.substring(47).slice(0, -2);
        const json = JSON.parse(jsonText);

        // --- DEBUGGER (HAPUS NANTI JIKA SUDAH JALAN) ---
        console.log("Data Mentah dari Google:", json);
        if (json.table.rows.length > 0) {
            const row1 = json.table.rows[0];
            const rawTgl = row1.c[0] ? row1.c[0].v : 'KOSONG';
            // Alert ini akan muncul memberitahu format asli di komputer Anda
            // alert(`🔍 DEBUG DATA:\nFormat Tanggal Baris 1: ${rawTgl}\nJika tanggal ini muncul, koneksi sukses!`);
        } else {
            alert("⚠️ Data Kosong! Sheet terbaca tapi tidak ada isinya.");
        }
        // ------------------------------------------------

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
        document.getElementById('loader').innerHTML = `⚠️ Gagal memuat data.<br>Error: ${error.message}<br><br>Pastikan ID Sheet Benar & Share = Anyone Viewer.`;
    }
}

function parseData(rows) {
    allRenungan = rows.map(row => {
        const v = (i) => (row.c[i] ? row.c[i].v : '');
        
        let d = null;
        const rawDate = v(0); // Ambil data kolom A

        if (rawDate) {
            // SKENARIO 1: Format Standar Google "Date(2026,0,23)"
            if (typeof rawDate === 'string' && rawDate.includes('Date')) {
                const parts = rawDate.match(/Date\((\d+),(\d+),(\d+)\)/);
                if(parts) d = new Date(parts[1], parts[2], parts[3]);
            } 
            // SKENARIO 2: Format String (01-23-2026 atau 23/01/2026)
            else if (typeof rawDate === 'string') {
                // Ubah semua tanda strip (-) jadi garis miring (/) agar seragam
                const cleanDate = rawDate.replace(/-/g, '/');
                
                // Pastikan formatnya angka/angka/angka
                if (cleanDate.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
                    const parts = cleanDate.split('/'); // [Angka1, Angka2, Tahun]
                    
                    const p0 = parseInt(parts[0]); // Angka Pertama
                    const p1 = parseInt(parts[1]); // Angka Kedua
                    const p2 = parseInt(parts[2]); // Tahun

                    // LOGIKA PINTAR:
                    // Jika Angka Kedua > 12 (misal 01/23/2026), maka Angka Kedua PASTI Hari.
                    // Maka formatnya: Bulan/Hari/Tahun (US Format)
                    if (p1 > 12) {
                        d = new Date(p2, p0 - 1, p1);
                    } 
                    // Jika Angka Pertama > 12 (misal 23/01/2026), maka Angka Pertama PASTI Hari.
                    // Maka formatnya: Hari/Bulan/Tahun (Indo Format)
                    else if (p0 > 12) {
                        d = new Date(p2, p1 - 1, p0);
                    } 
                    // Jika keduanya <= 12 (misal 01/02/2026), kita asumsi US Format (Bulan duluan)
                    // sesuai screenshot Sheet Anda (01-23-2026)
                    else {
                        d = new Date(p2, p0 - 1, p1);
                    }
                }
            }
        }
        
        // Validasi: Jika d bukan tanggal valid, skip
        if (!d || isNaN(d.getTime())) return null;

        return {
            key: formatDateKey(d),
            dateObj: d,
            judul: v(1),
            teks: v(2),
            refleksi: v(3),
            ayat: v(4),
            ayatText: v(5),
            audioUrl: v(6),
            status: String(v(7)).toLowerCase(),
            tahunAjaran: v(8)
        };
    }).filter(item => item && item.status === 'published');
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
