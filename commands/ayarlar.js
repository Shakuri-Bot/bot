const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const croxydb = require('../db-adapter');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ayarlar')
        .setDescription('Sunucudaki mevcut ayarları gösterir.'),
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            const guildId = interaction.guild.id;

            // Ayarları çek
            const partnerSystem = await await croxydb.get(`partnerSystem_${guildId}`);
            const partnerToggleValue = await await croxydb.get(`partnerToggle_${guildId}`);
            const partnerToggle = partnerToggleValue ? '<:parsher_a_on:1202167698658955326> açık' : '<:parsher_a_off:1202167696788308049> kapalı';
            
            const partnerTextValue = await await croxydb.get(`partnerText_${guildId}`);
            const partnerText = partnerTextValue || 'ayarlanmamış';
            
            const sayaçSistemi = await await croxydb.get(`partnerChannel_${guildId}`);
            const sayaçKanalı = sayaçSistemi ? `<#${sayaçSistemi}>` : 'ayarlanmamış';

            // Yasaklı sunucu kontrolü durumu
            const bannedServerCheckToggle = await await croxydb.get(`bannedServerCheckToggle_${guildId}`);
            const bannedServerCheck = bannedServerCheckToggle ? '<:parsher_a_on:1202167698658955326> açık' : '<:parsher_a_off:1202167696788308049> kapalı';

            // Partner cooldown durumu
            const partnerCooldown = await await croxydb.get(`partnerCooldown_${guildId}`);
            let cooldownText = 'ayarlanmamış';
            
            if (partnerCooldown && partnerCooldown.time > 0) {
                const hours = Math.floor(partnerCooldown.time / (1000 * 60 * 60));
                const minutes = Math.floor((partnerCooldown.time % (1000 * 60 * 60)) / (1000 * 60));
                
                cooldownText = '';
                if (hours > 0) {
                    cooldownText += `${hours} saat `;
                }
                if (minutes > 0) {
                    cooldownText += `${minutes} dakika`;
                }
            } else {
                cooldownText = 'kapalı';
            }

            // Partner sistemi ayarları
            const yetkiliRolü = partnerSystem?.adminRoleId ? `<@&${partnerSystem.adminRoleId}>` : 'ayarlanmamış';
            const partnerKanalı = partnerSystem?.partnerChannelId ? `<#${partnerSystem.partnerChannelId}>` : 'ayarlanmamış';
            const butonKanalı = partnerSystem?.buttonChannelId ? `<#${partnerSystem.buttonChannelId}>` : 'ayarlanmamış';

            // Sayaç sistemi
            const sayaçToggle = sayaçSistemi ? '<:parsher_a_on:1202167698658955326> açık' : '<:parsher_a_off:1202167696788308049> kapalı';

            const embed = new EmbedBuilder()
                .setTitle('Sunucu Ayarları')
                .setColor('#2222b5')
                .setImage('https://cdn.discordapp.com/attachments/1000712310987440248/1264156600374132746/6ee3eb3683b40cec.jpg?ex=66a21f14&is=66a0cd94&hm=a58c8e33acd963d270351ac1d5c6eafb02a73dc9b7293b36adcb5a0b006ad77f&')
                .addFields(
                    { name: 'Yetkili Rolü', value: yetkiliRolü, inline: true },
                    { name: 'Partner Kanalı', value: partnerKanalı, inline: true },
                    { name: 'Buton Kanalı', value: butonKanalı, inline: true },
                    { name: 'Partner Tepki', value: partnerToggle, inline: true },
                    { name: 'Sayaç Sistemi', value: sayaçToggle, inline: true },
                    { name: 'Sayaç Kanalı', value: sayaçKanalı, inline: true },
                    { name: 'Yasaklı Sunucu Kontrolü', value: bannedServerCheck, inline: true },
                    { name: 'Partner Cooldown', value: cooldownText, inline: true },
                    { name: 'Partner Texti', value: partnerText.toString().substring(0, 1024), inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed], ephemeral: false });
        } catch (error) {
            console.error('Ayarlar komutu çalıştırılırken hata oluştu:', error);
            await interaction.editReply({ content: 'Ayarlar gösterilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
        }
    },
};
