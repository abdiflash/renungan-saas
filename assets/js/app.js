/* ================= KONFIGURASI ================= */
const SHEET_ID = '1ncjWQ9ZUAZXTppHcKKH5WrivrfINIrHnAO1BQOgp7EY'; 
const SHEET_GID = '0'; // Pastikan ini benar (Tab pertama = 0)

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

/* ================= FETCH & DEBUG ================= */
async function fetchData() {
    // Query ambil semua kolom A-I
    const query = `SELECT A, B, C, D, E, F, G, H, I`; 
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&tq=${encodeURIComponent(query)}&gid=${SHEET_GID}`;

    try {
        const res = await fetch(url);
        const text = await res.text();
        const jsonText = text.substring(47).slice(0, -2);
        const json = JSON.parse(jsonText);

        console.log("Full Data:", json); // Cek Console

        // === 🕵️‍♂️ DETEKTIF DATA (AKAN MUNCUL POPUP) ===
        if (json.table.rows.length > 0) {
            // Ambil baris pertama yang berisi data (index 0 atau 1)
            // Kita cek baris terakhir saja biar pasti bukan Header
            const sampleRow = json.table.rows[json.table.rows.length - 1]; 
            
            const rawTgl = sampleRow.c[0] ? sampleRow.c[0].v : 'NULL';
            const rawStatus = sampleRow.c[7] ? sampleRow.c[7].v : 'NULL';
            const tipeData = typeof rawTgl;

            // POPUP DIAGNOSA
            alert(
                `🕵️‍♂️ CEK DATA MASUK:\n\n` +
                `1. Tipe Data Tanggal: ${tipeData}\n` +
                `2. Isi Tanggal Mentah: ${rawTgl}\n` +
                `3. Status (Kolom H): ${rawStatus}\n\n` +
                `Foto/Catat pesan ini agar saya bisa perbaiki scriptnya!`
            );
        } else {
            alert("⚠️ Data Kosong! Sheet terbaca tapi tidak ada baris data.");
        }
        // ============================================

        parseData(json.table.rows);
        
        // Render
        const todayStr = formatDateKey(today);
        const todayData = allRenungan.find(r => r.key === todayStr);

        document.getElementById('loader').classList.add('hidden');
        if (todayData) {
            renderRenungan(todayData);
        } else {
            document.getElementById('emptyState').classList.remove('hidden');
        }

    } catch (error) {
        alert("❌ Error: " + error.message);
    }
}

function parseData(rows) {
    allRenungan = rows.map(row => {
        const v = (i) => (row.c[i] ? row.c[i].v : '');
        let d = null;
        let rawDate = v(0);

        // --- LOGIKA PARSING PENYELAMAT ---
        if (rawDate) {
            // Skenario A: Data berupa Angka Serial Excel (misal: 45314)
            if (typeof rawDate === 'number') {
                // Konversi Serial Number ke JS Date
                // Excel base date: Dec 30, 1899
                d = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
            }
            // Skenario B: Data berupa String "Date(yyyy,m,d)"
            else if (typeof rawDate === 'string' && rawDate.includes('Date')) {
                const parts = rawDate.match(/Date\((\d+),(\d+),(\d+)\)/);
                if(parts) d = new Date(parts[1], parts[2], parts[3]);
            } 
            // Skenario C: Data String "01-23-2026" atau "23/01/2026"
            else if (typeof rawDate === 'string') {
                const clean = rawDate.replace(/-/g, '/');
                if (clean.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
                    const p = clean.split('/');
                    const n1 = parseInt(p[0]);
                    const n2 = parseInt(p[1]);
                    const n3 = parseInt(p[2]);
                    
                    if (n1 > 12) d = new Date(n3, n2 - 1, n1); // Indo (23/1/2026)
                    else if (n2 > 12) d = new Date(n3, n1 - 1, n2); // US (1/23/2026)
                    else d = new Date(n3, n1 - 1, n2); // Default US
                }
            }
        }

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
            status: String(v(7)).toLowerCase().trim(), // Trim spasi jaga-jaga
            tahunAjaran: v(8)
        };
    }).filter(item => item && item.status === 'published');
}

/* ================= RENDER & UTILS (SAMA SEPERTI SEBELUMNYA) ================= */
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

function setupAudioPlayer(urlRaw) {
    const player = document.getElementById('audioPlayer');
    const btn = document.getElementById('audioControl');
    const source = document.getElementById('audioSource');

    player.pause();
    player.style.display = 'none';
    btn.innerHTML = '▶️ Putar Audio';

    if (urlRaw && urlRaw.trim() !== "") {
        let finalUrl = urlRaw.trim();
        if (!finalUrl.startsWith('http')) finalUrl = `assets/audio/${finalUrl}`;
        source.src = finalUrl;
        player.load();
        btn.style.display = 'inline-flex';
        btn.disabled = false;
    } else {
        btn.style.display = 'none';
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
