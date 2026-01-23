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
        const v = (i) => (row.c[i] ? row.c[i].v : '');
        
        let d = null;
        let rawDate = v(0); 

        // --- LOGIKA TANGGAL ---
        if (rawDate !== '' && rawDate !== null) {
            if (typeof rawDate === 'number') {
                d = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
            } else if (typeof rawDate === 'string' && rawDate.includes('Date')) {
                const parts = rawDate.match(/Date\((\d+),(\d+),(\d+)\)/);
                if(parts) d = new Date(parts[1], parts[2], parts[3]);
            } else if (typeof rawDate === 'string') {
                const clean = rawDate.replace(/-/g, '/'); 
                if (clean.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
                    const p = clean.split('/');
                    const n1 = parseInt(p[0]); const n2 = parseInt(p[1]); const n3 = parseInt(p[2]);
                    if (n1 > 12) d = new Date(n3, n2 - 1, n1);
                    else if (n2 > 12) d = new Date(n3, n1 - 1, n2);
                    else d = new Date(n3, n1 - 1, n2);
                }
            }
        }

        const statusRaw = String(v(8)).toLowerCase().trim();

        if (!d || isNaN(d.getTime())) return null;

        // --- LOGIKA AUDIO CERDAS (AUTO-DROPBOX FIXER V2) ---
        let finalAudio = v(6); // Ambil dari Kolom G
        
        // Cek apakah ini link Dropbox?
        if (finalAudio && typeof finalAudio === 'string' && finalAudio.includes('dropbox.com')) {
            // Hapus parameter dl=0 atau dl=1 jika ada
            finalAudio = finalAudio.replace(/dl=0/g, 'raw=1');
            finalAudio = finalAudio.replace(/dl=1/g, 'raw=1');
            
            // Jaga-jaga jika linknya bersih tanpa parameter dl, kita paksa tambah raw=1
            if (!finalAudio.includes('raw=1')) {
                // Cek separator, apakah sudah ada tanda tanya (?)
                if (finalAudio.includes('?')) {
                    finalAudio += '&raw=1';
                } else {
                    finalAudio += '?raw=1';
                }
            }
        }

        return {
            key: formatDateKey(d),
            dateObj: d,
            judul: v(1),
            ayat: v(2),
            ayatText: v(3),
            teks: v(4),
            refleksi: v(5),
            audioUrl: finalAudio, 
            tahunAjaran: v(7),
            status: statusRaw
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

    // Ambil tahun ajaran dari data yang sedang aktif
    onsole.log("Data yang sedang dirender:", data); // Tambahkan ini!
    
    // ... sisa kode render Anda ...
    const yearElement = document.getElementById('academicYear');
    if (yearElement) {
        yearElement.innerText = data.tahunAjaran || "Tahun tidak ditemukan";
    }
    
    setupAudioPlayer(data.audioUrl);
}

/* ================= LOGIKA AUDIO (EVENT DRIVEN - STABIL) ================= */

function setupAudioPlayer(urlRaw) {
    const player = document.getElementById('audioPlayer');
    const btn = document.getElementById('audioControl');
    const source = document.getElementById('audioSource');

    // 1. Reset Player ke kondisi bersih
    player.pause();
    player.currentTime = 0;
    player.style.display = 'none'; // Sembunyikan player native
    
    // Hapus link debug biru (sudah tidak perlu karena file sudah ketemu)
    const oldLink = document.getElementById('debugLink');
    if(oldLink) oldLink.remove();

    // 2. Validasi URL
    if (urlRaw && urlRaw.trim() !== "") {
        let finalUrl = urlRaw.trim();
        
        // Auto-Path
        if (!finalUrl.startsWith('http')) {
            finalUrl = `assets/audio/${finalUrl}`;
        }

        // 3. Pasang URL
        source.src = finalUrl;
        player.load(); // Wajib load ulang

        // 4. Reset Tampilan Tombol
        btn.innerHTML = '▶️ Putar Audio';
        btn.disabled = false;
        btn.style.display = 'inline-flex';
        btn.onclick = toggleAudio;

        // === EVENT LISTENER (RAHASIA AGAR TIDAK STUCK) ===
        // Biarkan player yang mengontrol tombol, bukan sebaliknya.
        
        // Saat audio mulai buffering/loading
        player.onwaiting = () => {
            btn.innerHTML = '⏳ Memuat...';
            btn.disabled = true;
        };

        // Saat audio siap/sedang berbunyi
        player.onplaying = () => {
            btn.innerHTML = '⏸️ Pause Audio';
            btn.disabled = false;
            player.style.display = 'block'; // Tampilkan bar player asli
        };

        // Saat audio dipause
        player.onpause = () => {
            btn.innerHTML = '▶️ Lanjutkan Audio';
            btn.disabled = false;
        };

        // Saat audio selesai (habis durasi)
        player.onended = () => {
            btn.innerHTML = '▶️ Putar Ulang';
            player.style.display = 'none';
        };

        // Saat error
        player.onerror = () => {
            console.error("Audio Error:", player.error);
            btn.innerHTML = '⚠️ Gagal Memuat';
            btn.disabled = true;
        };

    } else {
        btn.style.display = 'none';
    }
}

function toggleAudio() {
    const player = document.getElementById('audioPlayer');
    
    // Kita hanya memberi perintah, urusan UI diurus oleh Event Listener di atas
    if (player.paused) {
        // Coba play. Catch error jika browser memblokir (jarang terjadi di klik manual)
        player.play().catch(e => console.warn("Auto-play blocked:", e));
    } else {
        player.pause();
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
