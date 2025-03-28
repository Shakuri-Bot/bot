const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase bağlantı bilgileri
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Bağlantı bilgilerini kontrol et
if (!supabaseUrl || !supabaseKey) {
    console.error('HATA: SUPABASE_URL veya SUPABASE_KEY çevre değişkenleri bulunamadı!');
    console.error('SUPABASE_URL:', supabaseUrl);
    console.error('SUPABASE_KEY:', supabaseKey ? 'Mevcut (gizli)' : 'Bulunamadı');
    process.exit(1);
}

// Supabase istemcisini oluştur
const supabase = createClient(supabaseUrl, supabaseKey);

// Bağlantıyı kontrol et
(async () => {
  try {
    console.log('Supabase bağlantısı kontrol ediliyor...');
    console.log('URL:', supabaseUrl);
    
    // Önce basit bir sorgu deneyelim
    const { data, error } = await supabase.from('partner_system').select('*').limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('Tablolar henüz oluşturulmamış. migrate.js çalıştırılmalı.');
      } else {
        console.error('Supabase bağlantı hatası:', error);
      }
    } else {
      console.log('Supabase bağlantısı başarılı!');
    }
  } catch (err) {
    console.error('Supabase bağlantı kontrolü sırasında hata:', err);
  }
})();

module.exports = supabase; 