const fs = require('fs');
const path = require('path');

// index.js dosya yolu
const indexPath = path.join(__dirname, 'index.js');

try {
    // Dosya içeriğini oku
    let content = fs.readFileSync(indexPath, 'utf8');
    
    // croxydb.get fonksiyonlarını await ile güncelle
    if (content.includes('croxydb.get(')) {
        content = content.replace(/croxydb\.get\(([^)]+)\)/g, 'await croxydb.get($1)');
        console.log('✅ index.js dosyasında get işlemleri güncellendi.');
    }
    
    // croxydb.set fonksiyonlarını await ile güncelle
    if (content.includes('croxydb.set(')) {
        content = content.replace(/croxydb\.set\(([^,]+),([^)]+)\)/g, 'await croxydb.set($1,$2)');
        console.log('✅ index.js dosyasında set işlemleri güncellendi.');
    }
    
    // croxydb.delete fonksiyonlarını await ile güncelle
    if (content.includes('croxydb.delete(')) {
        content = content.replace(/croxydb\.delete\(([^)]+)\)/g, 'await croxydb.delete($1)');
        console.log('✅ index.js dosyasında delete işlemleri güncellendi.');
    }
    
    // Asenkron fonksiyonları güncelle
    content = content.replace(/client\.on\('guildCreate', async guild => {/g, 'client.on(\'guildCreate\', async guild => {');
    content = content.replace(/client\.on\('guildDelete', async guild => {/g, 'client.on(\'guildDelete\', async guild => {');
    content = content.replace(/client\.on\('interactionCreate', async interaction => {/g, 'client.on(\'interactionCreate\', async interaction => {');
    content = content.replace(/client\.on\('messageCreate', async message => {/g, 'client.on(\'messageCreate\', async message => {');
    
    // Asenkron olmayan fonksiyonları asenkron yap
    content = content.replace(/client\.on\('guildCreate', guild => {/g, 'client.on(\'guildCreate\', async guild => {');
    content = content.replace(/client\.on\('guildDelete', guild => {/g, 'client.on(\'guildDelete\', async guild => {');
    content = content.replace(/client\.on\('interactionCreate', interaction => {/g, 'client.on(\'interactionCreate\', async interaction => {');
    content = content.replace(/client\.on\('messageCreate', message => {/g, 'client.on(\'messageCreate\', async message => {');
    
    // Dosyayı kaydet
    fs.writeFileSync(indexPath, content, 'utf8');
    console.log('✅ index.js dosyası başarıyla güncellendi.');
} catch (error) {
    console.error('❌ index.js dosyası güncellenirken hata oluştu:', error);
} 