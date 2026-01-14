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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url })
        });

        // Trik Debugging: Ambil text dulu, baru parse ke JSON
        const textData = await response.text();
        let data;

        try {
            data = JSON.parse(textData);
        } catch (e) {
            // Jika gagal parse JSON, berarti server mengirim error HTML/Text
            console.error("Server raw response:", textData);
            throw new Error("Respon server tidak valid. Cek Console untuk detail.");
        }

        if (!response.ok) {
            throw new Error(data.error || data.details || 'Gagal mengambil data.');
        }

        renderResult(data);

    } catch (error) {
        console.error(error);
        errorMsg.textContent = 'Error: ' + error.message;
    } finally {
        // Restore State
        btn.disabled = false;
        btnText.style.display = 'block';
        btnLoader.style.display = 'none';
    }
}

function renderResult(data) {
    const resultArea = document.getElementById('resultArea');
    
    // Normalisasi data (karena API AmoyShare strukturnya berubah-ubah)
    const title = data.title || data.desc || data.description || 'No Title';
    const thumbnail = data.thumbnail || data.cover || 'https://via.placeholder.com/150?text=No+Image';
    const source = data.type || data.source || 'Media';
    
    // Gabungkan video dan audio options
    let formats = [];
    if (Array.isArray(data.video)) formats = [...formats, ...data.video];
    if (Array.isArray(data.audio)) formats = [...formats, ...data.audio];

    let linksHtml = '';

    if (formats.length > 0) {
        formats.forEach(item => {
            const formatName = item.format_note || item.quality || item.ext || 'Download';
            const fileSize = item.size ? `(${item.size})` : '';
            linksHtml += `
                <a href="${item.url}" target="_blank" class="dl-btn">
                    <span>${formatName}</span>
                    <span class="size">${fileSize}</span>
                </a>
            `;
        });
    } else if (data.url) {
        // Fallback jika hanya ada single URL
        linksHtml = `
            <a href="${data.url}" target="_blank" class="dl-btn">
                <span>Download File</span>
                <span class="size">Direct</span>
            </a>
        `;
    } else {
        linksHtml = '<p style="text-align:center; color:#666; font-size: 0.9rem;">Link download tidak ditemukan.</p>';
    }

    const html = `
        <div class="result-card">
            <div class="video-info">
                <img src="${thumbnail}" alt="Thumbnail" class="thumb-img">
                <div class="meta">
                    <h3>${title}</h3>
                    <span>${source}</span>
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
