const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const croxydb = require('../db-adapter');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('partner-cooldown')
        .setDescription('Partner cooldown süresini ayarlar. Örnek: 2h, 30m veya 0 (kapatmak için)')
        .addStringOption(option => 
            option.setName('süre')
                .setDescription('Cooldown süresi (örn: 2h, 30m, 1h30m veya 0 kapatmak için)')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            const guildId = interaction.guild.id;
            const timeInput = interaction.options.getString('süre');
            
            // Süreyi milisaniyeye çevir
            let cooldownTime = 0;
            
            if (timeInput === '0') {
                // Cooldown'u kapat
                cooldownTime = 0;
            } else {
                // Saat ve dakika formatını işle
                const hourMatch = timeInput.match(/(\d+)h/);
                const minuteMatch = timeInput.match(/(\d+)m/);
                
                if (hourMatch) {
                    const hours = parseInt(hourMatch[1]);
                    cooldownTime += hours * 60 * 60 * 1000; // Saatleri milisaniyeye çevir
                }
                
                if (minuteMatch) {
                    const minutes = parseInt(minuteMatch[1]);
                    cooldownTime += minutes * 60 * 1000; // Dakikaları milisaniyeye çevir
                }
                
                if (cooldownTime === 0) {
                    return interaction.editReply({ 
                        content: 'Geçersiz süre formatı. Lütfen şu formatlardan birini kullanın: "2h" (2 saat), "30m" (30 dakika), "1h30m" (1 saat 30 dakika) veya "0" (cooldown\'u kapatmak için)', 
                        ephemeral: true 
                    });
                }
            }
            
            // Cooldown ayarlarını kaydet
            await croxydb.set(`partnerCooldown_${guildId}`, {
                time: cooldownTime,
                setBy: interaction.user.id,
                setAt: Date.now()
            });
            
            // Kullanıcı dostu süre metni oluştur
            let timeText = '';
            if (cooldownTime === 0) {
                timeText = 'kapalı';
            } else {
                const hours = Math.floor(cooldownTime / (1000 * 60 * 60));
                const minutes = Math.floor((cooldownTime % (1000 * 60 * 60)) / (1000 * 60));
                
                if (hours > 0) {
                    timeText += `${hours} saat `;
                }
                if (minutes > 0) {
                    timeText += `${minutes} dakika`;
                }
            }
            
            const embed = new EmbedBuilder()
                .setTitle('Partner Cooldown Ayarı')
                .setDescription(`Partner cooldown süresi ${timeText} olarak ayarlandı.`)
                .setColor(cooldownTime === 0 ? 'Green' : '#2222b5')
                .addFields(
                    { name: 'Ne İşe Yarar?', value: 'Bu ayar, aynı sunucu ile ne kadar süre aralıklarla partner yapılabileceğini belirler. Cooldown süresi dolmadan aynı sunucu ile tekrar partner yapılamaz.' }
                )
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Komut çalıştırılırken hata oluştu:', error);
            await interaction.editReply({ content: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
        }
    }
}; 