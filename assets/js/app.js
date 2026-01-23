/* ================= KONFIGURASI ================= */
const SHEET_ID = '1ncjWQ9ZUAZXTppHcKKH5WrivrfINIrHnAO1BQOgp7EY'; 
const SHEET_GID = '0'; // Pastikan '0' (Angka)

/* ================= STATE ================= */
let allRenungan = [];
let currentCalendarDate = new Date();
const today = new Date();
today.setHours(0,0,0,0);

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
    loadAcademicYear();
    fetchData();
});

/* ================= FETCH DATA ================= */
async function fetchData() {
    // Ambil kolom A-I
    const query = `SELECT A, B, C, D, E, F, G, H, I`; 
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&tq=${encodeURIComponent(query)}&gid=${SHEET_GID}`;

    try {
        const res = await fetch(url);
        const text = await res.text();
        const jsonText = text.substring(47).slice(0, -2);
        const json = JSON.parse(jsonText);

        console.log("Data Masuk:", json); // Cek Console untuk debug

        parseData(json.table.rows);
        
        // Cari renungan hari ini
        const todayStr = formatDateKey(today);
        const todayData = allRenungan.find(r => r.key === todayStr);

        document.getElementById('loader').classList.add('hidden');

        if (todayData) {
            renderRenungan(todayData);
        } else {
            // Jika tidak ada data hari ini, coba cari data terakhir yang statusnya published
            // Opsional: agar halaman tidak kosong melompong saat dev
            document.getElementById('emptyState').classList.remove('hidden');
        }

    } catch (error) {
        console.error(error);
        alert("Gagal memuat data: " + error.message);
    }
}

function parseData(rows) {
    allRenungan = rows.map(row => {
        // Helper aman ambil nilai (v) dan nilai terformat (f)
        const v = (i) => (row.c[i] ? row.c[i].v : '');
        const f = (i) => (row.c[i] ? row.c[i].f : ''); 
        
        let d = null;
        let rawDate = v(0); 

        // === LOGIKA PARSING "SAPU JAGAT" ===
        if (rawDate !== '' && rawDate !== null) {
            // 1. Jika data berupa ANGKA (Serial Number Excel/Google Sheet)
            if (typeof rawDate === 'number') {
                // Konversi Serial ke Date (Epoch Google Sheet dimulai 30 Des 1899)
                d = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
            }
            // 2. Jika data berupa String Format Google "Date(2026,0,23)"
            else if (typeof rawDate === 'string' && rawDate.includes('Date')) {
                const parts = rawDate.match(/Date\((\d+),(\d+),(\d+)\)/);
                if(parts) d = new Date(parts[1], parts[2], parts[3]);
            }
            // 3. Jika data berupa String Biasa "01-23-2026" atau "23/01/2026"
            else if (typeof rawDate === 'string') {
                // Bersihkan strip jadi garis miring
                const clean = rawDate.replace(/-/g, '/'); 
                if (clean.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
                    const p = clean.split('/');
                    const n1 = parseInt(p[0]);
                    const n2 = parseInt(p[1]);
                    const n3 = parseInt(p[2]);

                    // Deteksi Format (US vs Indo)
                    if (n1 > 12) d = new Date(n3, n2 - 1, n1); // Indo (23/1/2026)
                    else if (n2 > 12) d = new Date(n3, n1 - 1, n2); // US (1/23/2026)
                    else d = new Date(n3, n1 - 1, n2); // Default (1/23/2026)
                }
            }
        }

        // Validasi Status: Tambahkan .trim() untuk membuang spasi tidak sengaja
        const statusRaw = String(v(7)).toLowerCase().trim();

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
            status: statusRaw,
            tahunAjaran: v(8)
        };
    }).filter(item => item && item.status === 'published');
}

/* ================= RENDER LOGIC (TIDAK BERUBAH) ================= */
function renderRenungan(data) {
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('calendar').classList.add('hidden');
    document.getElementById('renungan').classList.remove('hidden');

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('displayDate').innerText = data.dateObj.toLocaleDateString('id-ID', options);
    document.getElementById('displayJudul').innerText = data.judul;
    document.getElementById('displayAyat').innerText = data.ayat;
    document.getElementById('displayAyatText').innerText = `"${data.ayatText}"`;
    document.getElementById('displayIsi').innerHTML = data.teks.replace(/\n/g, '<br>');
    document.getElementById('displayRefleksi').innerText = data.refleksi;

    setupAudioPlayer(data.audioUrl);
}

/* ================= LOGIKA AUDIO (UPDATE) ================= */

function setupAudioPlayer(urlRaw) {
    const player = document.getElementById('audioPlayer');
    const btn = document.getElementById('audioControl');
    const source = document.getElementById('audioSource');

    // 1. Reset Total Player setiap ganti renungan
    player.pause();
    player.currentTime = 0; // Reset waktu ke 0
    player.style.display = 'none';
    btn.innerHTML = '▶️ Putar Audio';
    btn.onclick = toggleAudio; // Re-bind event listener

    // 2. Validasi URL
    if (urlRaw && urlRaw.trim() !== "") {
        let finalUrl = urlRaw.trim();
        
        // Fitur Pintar: Kalau di Sheet cuma tulis nama file, otomatis tambah path
        // Contoh Sheet: "20260123-narasi.mp3" -> Script baca: "assets/audio/20260123-narasi.mp3"
        if (!finalUrl.startsWith('http')) {
            finalUrl = `assets/audio/${finalUrl}`;
        }
        
        // 3. Set Source & Load
        source.src = finalUrl;
        player.load(); // Wajib dipanggil setelah ganti src

        // Tampilkan tombol
        btn.style.display = 'inline-flex';
        btn.disabled = false;
        
        // Debugging: Cek apakah file benar-benar ada
        player.onerror = () => {
            console.error("Error memuat audio:", finalUrl);
            btn.innerHTML = '⚠️ Audio Error (404)';
            btn.disabled = true;
        };

    } else {
        // Jika kolom AudioURL kosong
        btn.style.display = 'none';
    }
}

// Fungsi Play/Pause yang Aman (Anti Error Promise)
async function toggleAudio() {
    const player = document.getElementById('audioPlayer');
    const btn = document.getElementById('audioControl');

    try {
        if (player.paused) {
            player.style.display = 'block'; // Munculkan player bar
            btn.innerHTML = '⏳ Loading...'; // Feedback visual
            
            // Tunggu sampai audio benar-benar play
            await player.play();
            
            // Jika sukses play
            btn.innerHTML = '⏸️ Pause Audio';
        } else {
            player.pause();
            btn.innerHTML = '▶️ Lanjutkan Audio';
        }
    } catch (err) {
        console.error("Gagal memutar audio:", err);
        // Kembalikan tombol ke kondisi awal jika gagal
        btn.innerHTML = '▶️ Putar Audio';
    }
}

function toggleAudio() {
    const player = document.getElementById('audioPlayer');
    const btn = document.getElementById('audioControl');
    if (player.paused) {
        player.style.display = 'block';
        player.play();
        btn.innerHTML = '⏸️ Pause Audio';
    } else {
        player.pause();
        btn.innerHTML = '▶️ Lanjutkan Audio';
    }
}

function showCalendarView() {
    document.getElementById('renungan').classList.add('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('calendar').classList.remove('hidden');
    renderCalendar();
}

function hideCalendarView() {
    if (document.getElementById('displayJudul').innerText === "") {
         document.getElementById('calendar').classList.add('hidden');
         document.getElementById('emptyState').classList.remove('hidden');
    } else {
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
    grid.innerHTML = ''; 

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    document.getElementById('calendarMonthLabel').innerText = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
        const empty = document.createElement('div');
        empty.className = 'date-cell empty';
        grid.appendChild(empty);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const dateCheck = new Date(year, month, i);
        dateCheck.setHours(0,0,0,0);
        const dateKey = formatDateKey(dateCheck);
        
        const cell = document.createElement('div');
        cell.className = 'date-cell';
        cell.innerText = i;

        if (dateKey === formatDateKey(today)) cell.classList.add('today');

        if (dateCheck > today) {
            cell.classList.add('locked');
            cell.title = "Belum tersedia";
            cell.onclick = () => alert("Renungan untuk tanggal ini belum dibuka.");
        } else {
            const dataRenungan = allRenungan.find(r => r.key === dateKey);
            if (dataRenungan) {
                cell.classList.add('available', 'has-renungan');
                const tooltip = document.createElement('span');
                tooltip.className = 'tooltip-text';
                tooltip.innerText = dataRenungan.judul;
                cell.appendChild(tooltip);
                cell.onclick = () => renderRenungan(dataRenungan);
            } else {
                cell.style.opacity = '0.5';
                cell.title = "Tidak ada renungan";
            }
        }
        grid.appendChild(cell);
    }
}

function formatDateKey(date) {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset*60*1000));
    return localDate.toISOString().split('T')[0];
}

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
