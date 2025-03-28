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
        
        // croxydb.get fonksiyonlarını await ile güncelle
        if (content.includes('croxydb.get(')) {
            content = content.replace(/croxydb\.get\(([^)]+)\)/g, 'await croxydb.get($1)');
            updatedCount++;
            console.log(`✅ ${file} dosyasında get işlemleri güncellendi.`);
        }
        
        // croxydb.set fonksiyonlarını await ile güncelle
        if (content.includes('croxydb.set(')) {
            content = content.replace(/croxydb\.set\(([^,]+),([^)]+)\)/g, 'await croxydb.set($1,$2)');
            updatedCount++;
            console.log(`✅ ${file} dosyasında set işlemleri güncellendi.`);
        }
        
        // croxydb.delete fonksiyonlarını await ile güncelle
        if (content.includes('croxydb.delete(')) {
            content = content.replace(/croxydb\.delete\(([^)]+)\)/g, 'await croxydb.delete($1)');
            updatedCount++;
            console.log(`✅ ${file} dosyasında delete işlemleri güncellendi.`);
        }
        
        // Hata yakalama ekle
        if (content.includes('async execute(interaction)') && !content.includes('try {')) {
            const executeIndex = content.indexOf('async execute(interaction)');
            if (executeIndex !== -1) {
                const openBraceIndex = content.indexOf('{', executeIndex);
                if (openBraceIndex !== -1) {
                    const insertPoint = openBraceIndex + 1;
                    const beforeInsert = content.substring(0, insertPoint);
                    const afterInsert = content.substring(insertPoint);
                    
                    // Defer reply ekle
                    let newContent = beforeInsert + '\n        await interaction.deferReply();\n        \n        try {' + afterInsert;
                    
                    // Son kapanış parantezini bul
                    const lastCloseBraceIndex = newContent.lastIndexOf('};');
                    if (lastCloseBraceIndex !== -1) {
                        const beforeLastBrace = newContent.substring(0, lastCloseBraceIndex);
                        const afterLastBrace = newContent.substring(lastCloseBraceIndex);
                        
                        // Catch bloğu ekle
                        newContent = beforeLastBrace + '        } catch (error) {\n            console.error(\'Komut çalıştırılırken hata oluştu:\', error);\n            await interaction.editReply({ content: \'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.\', ephemeral: true });\n        }' + afterLastBrace;
                        
                        // interaction.reply -> interaction.editReply olarak değiştir
                        newContent = newContent.replace(/interaction\.reply\(/g, 'interaction.editReply(');
                        
                        content = newContent;
                        console.log(`✅ ${file} dosyasına hata yakalama eklendi.`);
                    }
                }
            }
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