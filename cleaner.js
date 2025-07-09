const fs = require('fs');
const path = require('path');

// โฟลเดอร์เป้าหมาย
const uploadsDir = path.join(__dirname, 'uploads');
const zipsDir = path.join(__dirname, 'zips');
const outputDir = path.join(__dirname, 'output');

function deleteFilesInUploads() {
  if (!fs.existsSync(uploadsDir)) return;

  fs.readdir(uploadsDir, (err, files) => {
    if (err) return console.error('[Cleaner] อ่าน uploads ไม่ได้:', err);

    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) return;
        fs.unlink(filePath, err => {
          if (err) console.error(`[Cleaner] ลบ uploads ล้มเหลว: ${filePath}`);
          else console.log(`[Cleaner] 🗑️ ลบไฟล์ uploads: ${filePath}`);
        });
      });
    });
  });
}

function deleteZipFilesInZips() {
  if (!fs.existsSync(zipsDir)) return;

  fs.readdir(zipsDir, (err, files) => {
    if (err) return console.error('[Cleaner] อ่าน zips ไม่ได้:', err);

    files.forEach(file => {
      if (file.endsWith('.zip')) {
        const filePath = path.join(zipsDir, file);
        fs.unlink(filePath, err => {
          if (err) console.error(`[Cleaner] ลบ .zip ล้มเหลว: ${filePath}`);
          else console.log(`[Cleaner] 🗑️ ลบไฟล์ .zip: ${filePath}`);
        });
      }
    });
  });
}

function deleteSubfoldersInOutput() {
  if (!fs.existsSync(outputDir)) return;

  fs.readdir(outputDir, (err, files) => {
    if (err) return console.error('[Cleaner] อ่าน output ไม่ได้:', err);

    files.forEach(name => {
      const fullPath = path.join(outputDir, name);
      fs.stat(fullPath, (err, stats) => {
        if (err || !stats.isDirectory()) return;
        fs.rm(fullPath, { recursive: true, force: true }, err => {
          if (err) console.error(`[Cleaner] ลบโฟลเดอร์ output ล้มเหลว: ${fullPath}`);
          else console.log(`[Cleaner] 🗑️ ลบโฟลเดอร์ output: ${fullPath}`);
        });
      });
    });
  });
}

// รวมทั้งหมด
function runCleaner() {
  deleteFilesInUploads();
  deleteZipFilesInZips();
  deleteSubfoldersInOutput();
}

// ทำทุก 10 นาที
setInterval(runCleaner, 30 * 60 * 1000);
runCleaner(); // เรียกทันทีตอนเริ่ม