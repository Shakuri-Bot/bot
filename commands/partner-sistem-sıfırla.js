const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const croxydb = require('../db-adapter');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('partner-sistem-sıfırla')
        .setDescription('Partner sistemini sıfırlar.'),
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.editReply({ content: 'Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız.', ephemeral: true });
            }

            const guildId = interaction.guild.id;
            
            // Partner sistemi ile ilgili tüm verileri sil
            await croxydb.delete(`partnerSystem_${guildId}`);
            await croxydb.delete(`partnerText_${guildId}`);
            await croxydb.delete(`partnerTimestamps_${guildId}`);
            await croxydb.delete(`partnerChannel_${guildId}`);
            await croxydb.delete(`partnerToggle_${guildId}`);
            await croxydb.delete(`bannedServerCheckToggle_${guildId}`);
            await croxydb.delete(`partnerCooldown_${guildId}`);
            
            // Tüm kullanıcı verilerini sil
            const allUsers = interaction.guild.members.cache;
            for (const [id, member] of allUsers) {
                await croxydb.delete(`partnerCount_${guildId}_${member.id}`);
                await croxydb.delete(`partnerLogs_${guildId}_${member.id}`);
            }

            await interaction.editReply('Partner sistemi ve ilgili tüm veriler başarıyla sıfırlandı.');
        } catch (error) {
            console.error('Komut çalıştırılırken hata oluştu:', error);
            await interaction.editReply({ content: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
        }
    }
};
