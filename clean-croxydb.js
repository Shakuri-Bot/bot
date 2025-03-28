const fs = require('fs');
const path = require('path');

// CroxyDB dosya yolu
const dbPath = path.join(__dirname, 'croxydb', 'croxydb.json');

// Yedek oluştur
const backupPath = path.join(__dirname, 'croxydb', `croxydb_backup_${Date.now()}.json`);

try {
    // Dosya var mı kontrol et
    if (fs.existsSync(dbPath)) {
        // Yedek al
        fs.copyFileSync(dbPath, backupPath);
        console.log(`✅ Yedek oluşturuldu: ${backupPath}`);
        
        // Boş veritabanı oluştur
        fs.writeFileSync(dbPath, '{}', 'utf8');
        console.log(`✅ CroxyDB temizlendi: ${dbPath}`);
    } else {
        console.log(`❌ CroxyDB dosyası bulunamadı: ${dbPath}`);
    }
} catch (error) {
    console.error('❌ CroxyDB temizlenirken hata oluştu:', error);
} 