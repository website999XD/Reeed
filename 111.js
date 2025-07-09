const https = require('https');

const url = 'https://c2102ab3-53f7-4432-ad58-21af24438bae-00-3li04orqz18il.pike.replit.dev/';

function pingURL(targetUrl) {
  https.get(targetUrl, (res) => {
    console.log(`[${new Date().toLocaleTimeString()}] Status Code: ${res.statusCode}`);
    if (res.statusCode === 200) {
      console.log('Ping สำเร็จ (Online)');
    } else {
      console.log('Ping เจอปัญหา: สถานะไม่ปกติ');
    }
  }).on('error', (e) => {
    console.error(`[${new Date().toLocaleTimeString()}] Error ping:`, e.message);
  });
}

// เรียก ping ครั้งแรกทันที
pingURL(url);

// ตั้งเวลา ping ทุก 60 วินาที (1 นาที)
setInterval(() => {
  pingURL(url);
}, 30000);