# Menfis Partner Bot - Supabase Sürümü

Bu proje, Discord sunucuları arasında partnerlik yapmayı kolaylaştıran bir Discord botudur. CroxyDB yerine Supabase veritabanı kullanır.

## Özellikler

- Partner sistemi (buton ile başvuru)
- Yetkili takip sistemi
- Sayaç sistemi
- Otomatik tepki sistemi
- Sunucu yasaklama sistemi
- İstatistik sistemi

## Kurulum

1. Supabase hesabı oluşturun ve yeni bir proje oluşturun
2. `.env.example` dosyasını `.env` olarak kopyalayın ve gerekli bilgileri doldurun
3. Bağımlılıkları yükleyin:
   ```
   npm install
   ```
4. Veritabanı tablolarını oluşturun ve verileri aktarın:
   ```
   node migrate.js
   ```
5. Botu çalıştırın:
   ```
   node index.js
   ```

## Supabase Kurulumu

1. [Supabase](https://supabase.com/) hesabı oluşturun
2. Yeni bir proje oluşturun
3. SQL Editor'de aşağıdaki fonksiyonu oluşturun:

```sql
CREATE OR REPLACE FUNCTION create_table_if_not_exists(
  table_name text,
  columns text
)
RETURNS void AS $$
BEGIN
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I (
      %s
    );
  ', table_name, columns);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

4. Proje URL'sini ve API anahtarını `.env` dosyasına ekleyin

## Veritabanı Yapısı

Supabase'de aşağıdaki tablolar oluşturulur:

- `partner_system`: Partner sistemi ayarları
- `partner_text`: Partner metinleri
- `partner_count`: Partner sayıları
- `partner_logs`: Partner logları
- `partner_timestamps`: Partner zaman damgaları
- `banned_guilds`: Yasaklı sunucular
- `partner_toggle`: Partner tepki ayarları
- `guild_data`: Sunucu verileri

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. 