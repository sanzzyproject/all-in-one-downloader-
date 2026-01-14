import axios from 'axios';
import crypto from 'crypto';

// --- Konfigurasi Header Penyamaran ---
const config = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Referer': 'https://www.amoyshare.com/',
        'Origin': 'https://www.amoyshare.com',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    }
};

const amoyshare = {
    generateHeader: () => {
        const date = new Date();
        const yyyy = date.getFullYear();
        let mm = date.getMonth() + 1;
        let dd = date.getDate();

        mm = mm > 9 ? mm : "0" + mm;
        dd = dd > 9 ? dd : "0" + dd;

        const dateStr = `${yyyy}${mm}${dd}`;
        const constant = "786638952";
        const randomVal = 1000 + Math.round(8999 * Math.random());
        
        // Logic hash sesuai original
        const key = `${dateStr}${constant}${randomVal}`;
        const hashInput = `${dateStr}${randomVal}${constant}`;
        const signature = crypto.createHash('md5').update(hashInput).digest('hex');

        return `${key}-${signature}`;
    },

    download: async (videoUrl) => {
        const endpoint = 'https://line.1010diy.com/web/free-mp3-finder/urlParse';
        
        try {
            const dynamicHeaders = {
                ...config.headers,
                'amoyshare': amoyshare.generateHeader()
            };

            const response = await axios.get(endpoint, {
                params: {
                    url: videoUrl,
                    phonydata: 'false'
                },
                headers: dynamicHeaders,
                timeout: 10000 // Tambahkan timeout agar tidak menggantung
            });

            return response.data;
        } catch (error) {
            console.error("AmoyShare Error:", error.message);
            throw error;
        }
    }
};

// --- Vercel Serverless Handler ---
export default async function handler(req, res) {
    // Enable CORS untuk semua request
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Parse body (pastikan aman meskipun req.body undefined)
    const { url } = req.body || {};

    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
        const result = await amoyshare.download(url);
        
        // Cek apakah API AmoyShare mengembalikan error logic
        if (!result || result.error) {
             return res.status(400).json({ error: 'Gagal mendapatkan data dari sumber.', raw: result });
        }

        return res.status(200).json(result);

    } catch (error) {
        // Tangkap error server dan kembalikan JSON, bukan Text HTML
        console.error(error);
        return res.status(500).json({ 
            error: 'Terjadi kesalahan pada server.', 
            details: error.message 
        });
    }
}
