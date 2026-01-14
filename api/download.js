import axios from 'axios';
import crypto from 'crypto';

// --- Kode Asli AmoyShare (Diadaptasi) ---
const config = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.amoyshare.com/',
        'Origin': 'https://www.amoyshare.com',
        'Priority': 'u=1, i'
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
        const key = `${dateStr}${constant}${randomVal}`;
        const hashInput = `${dateStr}${randomVal}${constant}`;
        
        const signature = crypto.createHash('md5').update(hashInput).digest('hex');

        return `${key}-${signature}`;
    },

    request: async (url, params = {}) => {
        try {
            const dynamicHeaders = {
                ...config.headers,
                'amoyshare': amoyshare.generateHeader()
            };

            const response = await axios.get(url, {
                params: params,
                headers: dynamicHeaders
            });

            return response.data;
        } catch (error) {
            throw error;
        }
    },

    download: async (videoUrl) => {
        const url = 'https://line.1010diy.com/web/free-mp3-finder/urlParse';
        const params = {
            url: videoUrl,
            phonydata: 'false'
        };
        return amoyshare.request(url, params);
    }
};

// --- Vercel Serverless Handler ---
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
        const result = await amoyshare.download(url);
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch data', details: error.message });
    }
}
