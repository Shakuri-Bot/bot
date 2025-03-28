const { SlashCommandBuilder } = require('discord.js');
const croxydb = require('../db-adapter');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('partner-yasak-kaldir')
        .setDescription('Bir sunucunun partnerlik yasağını kaldırır.')
        .addStringOption(option => 
            option.setName('sunucuid')
                .setDescription('Yasağı kaldırılacak sunucunun ID\'si')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            if (!interaction.member.permissions.has('ADMINISTRATOR')) {
                return interaction.editReply({ content: 'Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız.', ephemeral: true });
            }

            const guildId = interaction.options.getString('sunucuid');
            let bannedGuilds = await croxydb.get('bannedGuilds') || [];
            const guildIndex = bannedGuilds.findIndex(g => g.guildId === guildId);

            if (guildIndex !== -1) {
                bannedGuilds.splice(guildIndex, 1);
                await croxydb.set('bannedGuilds', bannedGuilds);
                await interaction.editReply(`Sunucu ${guildId} partnerlik yasağından kaldırıldı.`);
            } else {
                await interaction.editReply(`Sunucu ${guildId} zaten yasaklanmamış.`);
            }
        } catch (error) {
            console.error('Komut çalıştırılırken hata oluştu:', error);
            await interaction.editReply({ content: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
        }
    }
};
