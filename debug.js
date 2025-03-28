require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Çevre değişkenlerini kontrol et
console.log('Çevre değişkenleri kontrol ediliyor...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Mevcut' : 'Bulunamadı');
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'Mevcut (gizli)' : 'Bulunamadı');
console.log('TOKEN:', process.env.TOKEN ? 'Mevcut (gizli)' : 'Bulunamadı');

// Supabase bağlantısını test et
async function testSupabaseConnection() {
    console.log('\nSupabase bağlantısı test ediliyor...');
    
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            console.error('HATA: SUPABASE_URL veya SUPABASE_KEY çevre değişkenleri bulunamadı!');
            return false;
        }
        
        console.log('Supabase URL:', supabaseUrl);
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Bağlantıyı test et
        const { data, error } = await supabase.from('partner_system').select('*').limit(1);
        
        if (error) {
            if (error.code === '42P01') {
                console.log('Tablolar henüz oluşturulmamış. migrate.js çalıştırılmalı.');
                return false;
            } else {
                console.error('Supabase bağlantı hatası:', error);
                return false;
            }
        } else {
            console.log('Supabase bağlantısı başarılı!');
            return true;
        }
    } catch (err) {
        console.error('Supabase bağlantı testi sırasında hata:', err);
        return false;
    }
}

// Tabloları kontrol et
async function checkTables() {
    console.log('\nTablolar kontrol ediliyor...');
    
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            console.error('HATA: SUPABASE_URL veya SUPABASE_KEY çevre değişkenleri bulunamadı!');
            return;
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const tables = [
            'partner_system',
            'partner_text',
            'partner_count',
            'partner_logs',
            'partner_timestamps',
            'banned_guilds',
            'partner_toggle',
            'guild_data'
        ];
        
        for (const table of tables) {
            try {
                const { error } = await supabase.from(table).select('*').limit(1);
                
                if (error && error.code === '42P01') {
                    console.log(`❌ ${table} tablosu bulunamadı.`);
                } else {
                    console.log(`✅ ${table} tablosu mevcut.`);
                }
            } catch (err) {
                console.error(`${table} tablosu kontrol edilirken hata:`, err);
            }
        }
    } catch (err) {
        console.error('Tablo kontrolü sırasında hata:', err);
    }
}

// Ana fonksiyon
async function main() {
    console.log('Hata ayıklama başlatılıyor...');
    
    const connectionSuccess = await testSupabaseConnection();
    
    if (connectionSuccess) {
        await checkTables();
    }
    
    console.log('\nHata ayıklama tamamlandı.');
}

// Programı çalıştır
main().catch(error => {
    console.error('Program hatası:', error);
}); 