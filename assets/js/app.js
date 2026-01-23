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

/* ================= LOGIKA AUDIO (ANTI ERROR & DEBUGGER) ================= */

function setupAudioPlayer(urlRaw) {
    const player = document.getElementById('audioPlayer');
    const btn = document.getElementById('audioControl');
    const source = document.getElementById('audioSource');

    // Reset Player
    player.pause();
    player.currentTime = 0;
    player.style.display = 'none';
    btn.innerHTML = '▶️ Putar Audio';
    btn.onclick = toggleAudio; 
    
    // HAPUS LINK DEBUG LAMA (JIKA ADA)
    const oldLink = document.getElementById('debugLink');
    if(oldLink) oldLink.remove();

    if (urlRaw && urlRaw.trim() !== "") {
        let finalUrl = urlRaw.trim();
        
        // Auto-Path
        if (!finalUrl.startsWith('http')) {
            finalUrl = `assets/audio/${finalUrl}`;
        }
        
        // Set Source
        source.src = finalUrl;
        player.load(); 

        btn.style.display = 'inline-flex';
        btn.disabled = false;
        
        // === FITUR DEBUGGER ===
        // Kita buat link biru di bawah tombol agar Anda bisa klik manual
        const debugLink = document.createElement('a');
        debugLink.id = 'debugLink';
        debugLink.href = finalUrl;
        debugLink.target = '_blank'; // Buka di tab baru
        debugLink.innerText = `🔗 Cek File Audio: ${finalUrl}`;
        debugLink.style.display = 'block';
        debugLink.style.marginTop = '10px';
        debugLink.style.fontSize = '12px';
        debugLink.style.color = 'blue';
        debugLink.style.textDecoration = 'underline';
        
        // Masukkan link ke bawah tombol audio
        btn.parentNode.appendChild(debugLink);

    } else {
        btn.style.display = 'none';
    }
}

async function toggleAudio() {
    const player = document.getElementById('audioPlayer');
    const btn = document.getElementById('audioControl');

    // Mencegah error "AbortError" dengan mengunci tombol saat proses loading
    try {
        if (player.paused) {
            // === MAU PLAY ===
            btn.disabled = true; // KUNCI TOMBOL
            btn.innerHTML = '⏳ Memuat...'; 
            player.style.display = 'block';

            // Tunggu sampai benar-benar play
            await player.play();
            
            // Jika sukses:
            btn.innerHTML = '⏸️ Pause Audio';
            btn.disabled = false; // BUKA KUNCI
        } else {
            // === MAU PAUSE ===
            player.pause();
            btn.innerHTML = '▶️ Lanjutkan Audio';
        }
    } catch (err) {
        console.warn("Audio Playback Error:", err);
        
        // Jika errornya AbortError, biasanya aman diabaikan (karena user stop paksa)
        // Tapi tombol harus kita kembalikan
        btn.innerHTML = '▶️ Putar Audio';
        btn.disabled = false; 
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
