const fs = require('fs');
const path = require('path');
require('dotenv').config();
const supabase = require('./supabase');
const db = require('./database');

// Tablo adları
const TABLES = {
    PARTNER_SYSTEM: 'partner_system',
    PARTNER_TEXT: 'partner_text',
    PARTNER_COUNT: 'partner_count',
    PARTNER_LOGS: 'partner_logs',
    PARTNER_TIMESTAMPS: 'partner_timestamps',
    BANNED_GUILDS: 'banned_guilds',
    PARTNER_TOGGLE: 'partner_toggle',
    GUILD_DATA: 'guild_data'
};

/**
 * CroxyDB'den veri okuma
 * @returns {Object} - CroxyDB verileri
 */
function readCroxyDB() {
    try {
        const dbPath = path.join(__dirname, 'croxydb', 'croxydb.json');
        console.log('CroxyDB dosyası okunuyor:', dbPath);
        
        if (!fs.existsSync(dbPath)) {
            console.warn('CroxyDB dosyası bulunamadı:', dbPath);
            return {};
        }
        
        const data = fs.readFileSync(dbPath, 'utf8');
        const parsedData = JSON.parse(data);
        console.log('CroxyDB verileri başarıyla okundu.');
        return parsedData;
    } catch (error) {
        console.error('CroxyDB okuma hatası:', error);
        return {};
    }
}

/**
 * Supabase tablolarını oluşturma
 */
async function createTables() {
    try {
        console.log('Tablolar oluşturuluyor...');
        
        // Her tablo için doğrudan SQL ile tablo oluştur
        for (const table of Object.values(TABLES)) {
            console.log(`${table} tablosu oluşturuluyor...`);
            
            try {
                // Doğrudan SQL ile tablo oluştur
                const { error } = await supabase.rpc('create_table_if_not_exists', {
                    table_name: table,
                    columns: 'id serial primary key, key text unique not null, value jsonb, created_at timestamp with time zone default now(), updated_at timestamp with time zone default now()'
                });
                
                if (error) {
                    console.error(`RPC ile tablo oluşturma hatası (${table}):`, error);
                    
                    // RPC çalışmazsa doğrudan SQL ile deneyelim
                    console.log(`${table} tablosu doğrudan SQL ile oluşturuluyor...`);
                    
                    const { error: sqlError } = await supabase.sql(`
                        CREATE TABLE IF NOT EXISTS ${table} (
                            id serial primary key, 
                            key text unique not null, 
                            value jsonb, 
                            created_at timestamp with time zone default now(), 
                            updated_at timestamp with time zone default now()
                        )
                    `);
                    
                    if (sqlError) {
                        console.error(`SQL ile tablo oluşturma hatası (${table}):`, sqlError);
                        
                        // Son çare olarak REST API ile tablo oluştur
                        console.log(`${table} tablosu REST API ile oluşturuluyor...`);
                        
                        const { error: restError } = await supabase
                            .from(table)
                            .insert({ key: 'test_key', value: { test: true } });
                        
                        if (restError && restError.code !== '23505') {
                            console.error(`REST API ile tablo oluşturma hatası (${table}):`, restError);
                        } else {
                            console.log(`${table} tablosu başarıyla oluşturuldu (REST API).`);
                        }
                    } else {
                        console.log(`${table} tablosu başarıyla oluşturuldu (SQL).`);
                    }
                } else {
                    console.log(`${table} tablosu başarıyla oluşturuldu (RPC).`);
                }
            } catch (tableError) {
                console.error(`Tablo oluşturma işlemi sırasında hata (${table}):`, tableError);
            }
        }
    } catch (error) {
        console.error('Tablo oluşturma hatası:', error);
    }
}

/**
 * Veri aktarımı
 * @param {Object} data - CroxyDB verileri
 */
async function migrateData(data) {
    try {
        const keys = Object.keys(data);
        console.log(`Toplam ${keys.length} anahtar aktarılacak.`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const key of keys) {
            const value = data[key];
            let table = TABLES.GUILD_DATA; // Varsayılan tablo
            
            // Anahtar yapısına göre tablo seçimi
            if (key.startsWith('partnerSystem_')) {
                table = TABLES.PARTNER_SYSTEM;
            } else if (key.startsWith('partnerText_')) {
                table = TABLES.PARTNER_TEXT;
            } else if (key.startsWith('partnerCount_')) {
                table = TABLES.PARTNER_COUNT;
            } else if (key.startsWith('partnerLogs_')) {
                table = TABLES.PARTNER_LOGS;
            } else if (key.startsWith('partnerTimestamps_')) {
                table = TABLES.PARTNER_TIMESTAMPS;
            } else if (key === 'bannedGuilds') {
                table = TABLES.BANNED_GUILDS;
            } else if (key.startsWith('partnerToggle_')) {
                table = TABLES.PARTNER_TOGGLE;
            } else if (key.startsWith('guild_')) {
                table = TABLES.GUILD_DATA;
            }
            
            try {
                console.log(`Veri aktarılıyor: ${key} -> ${table}`);
                const success = await db.set(table, key, value);
                
                if (success) {
                    successCount++;
                    console.log(`✅ Veri aktarıldı: ${key} -> ${table}`);
                } else {
                    errorCount++;
                    console.error(`❌ Veri aktarım hatası: ${key}`);
                }
            } catch (error) {
                errorCount++;
                console.error(`❌ Veri aktarım hatası (${key}):`, error);
            }
        }
        
        console.log(`\nAktarım tamamlandı!`);
        console.log(`Başarılı: ${successCount}`);
        console.log(`Hatalı: ${errorCount}`);
        console.log(`Toplam: ${keys.length}`);
    } catch (error) {
        console.error('Veri aktarım hatası:', error);
    }
}

/**
 * Ana fonksiyon
 */
async function main() {
    console.log('CroxyDB -> Supabase veri aktarımı başlatılıyor...');
    
    // Supabase tablolarını oluştur
    await createTables();
    
    // CroxyDB verilerini oku
    const data = readCroxyDB();
    console.log('CroxyDB verileri okundu:', Object.keys(data).length, 'anahtar bulundu');
    
    // Veri aktarımını gerçekleştir
    await migrateData(data);
}

// Programı çalıştır
main().catch(error => {
    console.error('Program hatası:', error);
}); 