const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../db-adapter');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('db-test')
        .setDescription('Veritabanı bağlantısını test eder.'),
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            // Test verisi oluştur
            const testKey = `test_${interaction.guild.id}_${Date.now()}`;
            const testValue = {
                test: true,
                timestamp: Date.now(),
                user: interaction.user.id,
                guild: interaction.guild.id
            };
            
            // Veriyi kaydet
            console.log(`Test verisi kaydediliyor: ${testKey}`);
            const saveResult = await db.set(testKey, testValue);
            
            if (!saveResult) {
                throw new Error('Veri kaydedilemedi.');
            }
            
            // Veriyi oku
            console.log(`Test verisi okunuyor: ${testKey}`);
            const readValue = await db.get(testKey);
            
            if (!readValue) {
                throw new Error('Veri okunamadı.');
            }
            
            // Veriyi sil
            console.log(`Test verisi siliniyor: ${testKey}`);
            const deleteResult = await db.delete(testKey);
            
            if (!deleteResult) {
                throw new Error('Veri silinemedi.');
            }
            
            // Sonuç
            const embed = new EmbedBuilder()
                .setTitle('Veritabanı Testi')
                .setDescription('✅ Veritabanı bağlantısı başarılı!')
                .addFields(
                    { name: 'Yazma', value: '✅ Başarılı', inline: true },
                    { name: 'Okuma', value: '✅ Başarılı', inline: true },
                    { name: 'Silme', value: '✅ Başarılı', inline: true }
                )
                .setColor('Green')
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Veritabanı testi sırasında hata:', error);
            
            const embed = new EmbedBuilder()
                .setTitle('Veritabanı Testi')
                .setDescription('❌ Veritabanı bağlantısı başarısız!')
                .addFields(
                    { name: 'Hata', value: `\`\`\`${error.message}\`\`\`` }
                )
                .setColor('Red')
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        }
    },
}; 