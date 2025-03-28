const fs = require('fs');
const path = require('path');

// Komutlar dizini
const commandsDir = path.join(__dirname, 'commands');

// Tüm komut dosyalarını al
const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

let updatedCount = 0;
let errorCount = 0;

// Her komut dosyasını güncelle
for (const file of commandFiles) {
    const filePath = path.join(commandsDir, file);
    
    try {
        // Dosya içeriğini oku
        let content = fs.readFileSync(filePath, 'utf8');
        
        // croxydb import ifadesini değiştir
        if (content.includes("require('croxydb')")) {
            content = content.replace("require('croxydb')", "require('../db-adapter')");
            updatedCount++;
            console.log(`✅ ${file} dosyası güncellendi.`);
        } else if (content.includes('require("croxydb")')) {
            content = content.replace('require("croxydb")', 'require("../db-adapter")');
            updatedCount++;
            console.log(`✅ ${file} dosyası güncellendi.`);
        } else {
            console.log(`ℹ️ ${file} dosyasında croxydb import ifadesi bulunamadı.`);
        }
        
        // Dosyayı kaydet
        fs.writeFileSync(filePath, content, 'utf8');
    } catch (error) {
        errorCount++;
        console.error(`❌ ${file} dosyası güncellenirken hata oluştu:`, error);
    }
}

console.log('\nGüncelleme tamamlandı!');
console.log(`Güncellenen dosya sayısı: ${updatedCount}`);
console.log(`Hatalı dosya sayısı: ${errorCount}`);
console.log(`Toplam dosya sayısı: ${commandFiles.length}`); 