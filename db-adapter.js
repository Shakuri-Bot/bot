const db = require('./database');

// Varsayılan tablo adı
const DEFAULT_TABLE = 'guild_data';

// Önbellek sistemi
const cache = {
    data: {},
    ttl: 60000, // 60 saniye
    lastCleanup: Date.now(),
    
    // Önbelleğe veri ekle
    set(key, value) {
        this.data[key] = {
            value,
            timestamp: Date.now()
        };
    },
    
    // Önbellekten veri al
    get(key) {
        const item = this.data[key];
        if (item && (Date.now() - item.timestamp) < this.ttl) {
            return item.value;
        }
        return null;
    },
    
    // Önbellekten veri sil
    delete(key) {
        delete this.data[key];
    },
    
    // Önbelleği temizle
    cleanup() {
        const now = Date.now();
        if (now - this.lastCleanup > 300000) { // 5 dakikada bir temizle
            this.lastCleanup = now;
            const keys = Object.keys(this.data);
            for (const key of keys) {
                if (now - this.data[key].timestamp > this.ttl) {
                    delete this.data[key];
                }
            }
        }
    }
};

// Anahtar yapısına göre tablo seçimi
function getTableForKey(key) {
    if (!key) return DEFAULT_TABLE;
    
    if (key.startsWith('partnerSystem_')) {
        return 'partner_system';
    } else if (key.startsWith('partnerText_')) {
        return 'partner_text';
    } else if (key.startsWith('partnerCount_')) {
        return 'partner_count';
    } else if (key.startsWith('partnerLogs_')) {
        return 'partner_logs';
    } else if (key.startsWith('partnerTimestamps_')) {
        return 'partner_timestamps';
    } else if (key === 'bannedGuilds') {
        return 'banned_guilds';
    } else if (key.startsWith('partnerToggle_')) {
        return 'partner_toggle';
    } else if (key.startsWith('guild_')) {
        return 'guild_data';
    }
    return DEFAULT_TABLE;
}

/**
 * CroxyDB ile uyumlu bir Supabase adaptörü
 */
const adapter = {
    /**
     * Veri okuma
     * @param {string} key - Anahtar
     * @returns {Promise<any>} - Veri
     */
    async get(key) {
        try {
            // Önbellekten kontrol et
            const cachedValue = cache.get(key);
            if (cachedValue !== null) {
                return cachedValue;
            }
            
            // Veritabanından oku
            const table = getTableForKey(key);
            const value = await db.get(table, key);
            
            // Önbelleğe ekle
            if (value !== null) {
                cache.set(key, value);
            }
            
            return value;
        } catch (error) {
            console.error(`Adaptör get hatası (${key}):`, error);
            return null;
        }
    },

    /**
     * Veri yazma
     * @param {string} key - Anahtar
     * @param {any} value - Değer
     * @returns {Promise<boolean>} - Başarılı mı?
     */
    async set(key, value) {
        try {
            // Önbelleği güncelle
            cache.set(key, value);
            
            // Veritabanına yaz
            const table = getTableForKey(key);
            return await db.set(table, key, value);
        } catch (error) {
            console.error(`Adaptör set hatası (${key}):`, error);
            return false;
        }
    },

    /**
     * Veri silme
     * @param {string} key - Anahtar
     * @returns {Promise<boolean>} - Başarılı mı?
     */
    async delete(key) {
        try {
            // Önbellekten sil
            cache.delete(key);
            
            // Veritabanından sil
            const table = getTableForKey(key);
            return await db.del(table, key);
        } catch (error) {
            console.error(`Adaptör delete hatası (${key}):`, error);
            return false;
        }
    },

    /**
     * Tüm anahtarları getir
     * @returns {Promise<string[]>} - Anahtarlar
     */
    async keys() {
        try {
            // Tüm tablolardan anahtarları getir
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
            
            const allKeys = [];
            for (const table of tables) {
                try {
                    const keys = await db.keys(table);
                    allKeys.push(...keys);
                } catch (error) {
                    console.error(`Tablo anahtarları getirme hatası (${table}):`, error);
                }
            }
            
            return allKeys;
        } catch (error) {
            console.error('Adaptör keys hatası:', error);
            return [];
        }
    },

    /**
     * Belirli bir prefix ile başlayan tüm anahtarları getir
     * @param {string} prefix - Prefix
     * @returns {Promise<string[]>} - Anahtarlar
     */
    async keysStartingWith(prefix) {
        try {
            // Prefix'e göre uygun tabloyu seç
            const table = getTableForKey(prefix);
            return await db.keysStartingWith(table, prefix);
        } catch (error) {
            console.error(`Adaptör keysStartingWith hatası (${prefix}):`, error);
            return [];
        }
    },

    /**
     * Veri var mı?
     * @param {string} key - Anahtar
     * @returns {Promise<boolean>} - Var mı?
     */
    async has(key) {
        try {
            // Önbellekten kontrol et
            const cachedValue = cache.get(key);
            if (cachedValue !== null) {
                return true;
            }
            
            // Veritabanından kontrol et
            const value = await this.get(key);
            return value !== null;
        } catch (error) {
            console.error(`Adaptör has hatası (${key}):`, error);
            return false;
        }
    },

    /**
     * Tüm verileri getir
     * @returns {Promise<Object>} - Tüm veriler
     */
    async all() {
        try {
            const keys = await this.keys();
            const result = {};
            
            for (const key of keys) {
                try {
                    result[key] = await this.get(key);
                } catch (error) {
                    console.error(`Veri getirme hatası (${key}):`, error);
                }
            }
            
            return result;
        } catch (error) {
            console.error('Adaptör all hatası:', error);
            return {};
        }
    }
};

// Düzenli aralıklarla önbelleği temizle
setInterval(() => {
    cache.cleanup();
}, 60000); // Her dakika

module.exports = adapter; 