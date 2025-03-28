const supabase = require('./supabase');

/**
 * Veri okuma işlemi
 * @param {string} table - Tablo adı
 * @param {string} key - Anahtar
 * @returns {Promise<any>} - Veri
 */
async function get(table, key) {
    try {
        const { data, error } = await supabase
            .from(table)
            .select('value')
            .eq('key', key)
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
            console.error(`Veri okuma hatası (${table}/${key}):`, error);
            return null;
        }
        
        return data ? data.value : null;
    } catch (error) {
        console.error(`Veri okuma hatası (${table}/${key}):`, error);
        return null;
    }
}

/**
 * Veri yazma işlemi
 * @param {string} table - Tablo adı
 * @param {string} key - Anahtar
 * @param {any} value - Değer
 * @returns {Promise<boolean>} - Başarılı mı?
 */
async function set(table, key, value) {
    try {
        // Önce veriyi kontrol et
        const { data, error: selectError } = await supabase
            .from(table)
            .select('id')
            .eq('key', key)
            .maybeSingle();
        
        if (selectError && selectError.code !== 'PGRST116') {
            console.error(`Veri kontrol hatası (${table}/${key}):`, selectError);
            return false;
        }
        
        if (data) {
            // Veri varsa güncelle
            const { error } = await supabase
                .from(table)
                .update({ value, updated_at: new Date() })
                .eq('key', key);
            
            if (error) {
                console.error(`Veri güncelleme hatası (${table}/${key}):`, error);
                return false;
            }
        } else {
            // Veri yoksa ekle
            const { error } = await supabase
                .from(table)
                .insert({ key, value, created_at: new Date(), updated_at: new Date() });
            
            if (error) {
                console.error(`Veri ekleme hatası (${table}/${key}):`, error);
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error(`Veri yazma hatası (${table}/${key}):`, error);
        return false;
    }
}

/**
 * Veri silme işlemi
 * @param {string} table - Tablo adı
 * @param {string} key - Anahtar
 * @returns {Promise<boolean>} - Başarılı mı?
 */
async function del(table, key) {
    try {
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('key', key);
        
        if (error) {
            console.error(`Veri silme hatası (${table}/${key}):`, error);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error(`Veri silme hatası (${table}/${key}):`, error);
        return false;
    }
}

/**
 * Tüm anahtarları getir
 * @param {string} table - Tablo adı
 * @returns {Promise<string[]>} - Anahtarlar
 */
async function keys(table) {
    try {
        const { data, error } = await supabase
            .from(table)
            .select('key');
        
        if (error) {
            console.error(`Anahtarları getirme hatası (${table}):`, error);
            return [];
        }
        
        return data ? data.map(item => item.key) : [];
    } catch (error) {
        console.error(`Anahtarları getirme hatası (${table}):`, error);
        return [];
    }
}

/**
 * Belirli bir prefix ile başlayan tüm anahtarları getir
 * @param {string} table - Tablo adı
 * @param {string} prefix - Prefix
 * @returns {Promise<string[]>} - Anahtarlar
 */
async function keysStartingWith(table, prefix) {
    try {
        const { data, error } = await supabase
            .from(table)
            .select('key')
            .ilike('key', `${prefix}%`);
        
        if (error) {
            console.error(`Prefix ile anahtarları getirme hatası (${table}/${prefix}):`, error);
            return [];
        }
        
        return data ? data.map(item => item.key) : [];
    } catch (error) {
        console.error(`Prefix ile anahtarları getirme hatası (${table}/${prefix}):`, error);
        return [];
    }
}

module.exports = {
    get,
    set,
    del,
    keys,
    keysStartingWith
}; 