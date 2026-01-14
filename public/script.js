document.getElementById('downloadBtn').addEventListener('click', handleDownload);
document.getElementById('urlInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleDownload();
});

async function handleDownload() {
    const urlInput = document.getElementById('urlInput');
    const resultArea = document.getElementById('resultArea');
    const errorMsg = document.getElementById('errorMsg');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    const btn = document.getElementById('downloadBtn');

    const url = urlInput.value.trim();

    if (!url) {
        errorMsg.textContent = 'Silakan masukkan URL terlebih dahulu.';
        return;
    }

    // Reset UI
    errorMsg.textContent = '';
    resultArea.innerHTML = '';
    resultArea.classList.add('hidden');
    
    // Loading State
    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'block';

    try {
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: url })
        });

        const data = await response.json();

        if (!response.ok || !data) {
            throw new Error(data.error || 'Gagal mengambil data.');
        }

        renderResult(data);

    } catch (error) {
        errorMsg.textContent = 'Terjadi kesalahan: ' + error.message;
    } finally {
        // Restore State
        btn.disabled = false;
        btnText.style.display = 'block';
        btnLoader.style.display = 'none';
    }
}

function renderResult(data) {
    const resultArea = document.getElementById('resultArea');
    
    // Parsing data dari API Amoyshare biasanya agak dalam strukturnya
    // Kita cek struktur umum yang dikembalikan
    
    // Fallback title dan gambar jika API tidak memberikan detail jelas
    const title = data.title || data.description || 'Unknown Title';
    const thumbnail = data.thumbnail || 'https://via.placeholder.com/150?text=No+Image';
    
    // Ambil list format (Video/Audio)
    // Note: Struktur data amoyshare bisa bervariasi tergantung platform (TikTok/YT/dll)
    // Script ini mencoba mengakomodasi struktur umumnya.
    let linksHtml = '';

    // Cek jika ada property 'video' atau 'audio' atau list formats
    const formats = [...(data.video || []), ...(data.audio || [])];

    if (formats.length === 0 && data.url) {
        // Jika langsung mereturn URL tanpa list format
        linksHtml += `
            <a href="${data.url}" target="_blank" class="dl-btn">
                <span>Download File</span>
                <span class="size">Auto</span>
            </a>
        `;
    } else {
        formats.forEach(item => {
            linksHtml += `
                <a href="${item.url}" target="_blank" class="dl-btn">
                    <span>${item.format_note || item.ext || 'Download'} ${item.quality || ''}</span>
                    <span class="size">${item.size || ''}</span>
                </a>
            `;
        });
    }

    if (linksHtml === '') {
        // Jika struktur data berbeda, coba ambil raw url jika ada
        linksHtml = '<p style="text-align:center; color:#666;">Link download tidak ditemukan atau format tidak didukung.</p>';
    }

    const html = `
        <div class="result-card">
            <div class="video-info">
                <img src="${thumbnail}" alt="Thumbnail" class="thumb-img">
                <div class="meta">
                    <h3>${title}</h3>
                    <span>${data.source || 'Media'}</span>
                </div>
            </div>
            <div class="download-options">
                ${linksHtml}
            </div>
        </div>
    `;

    resultArea.innerHTML = html;
    resultArea.classList.remove('hidden');
}
