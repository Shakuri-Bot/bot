const { SlashCommandBuilder } = require('discord.js');
const croxydb = require('../db-adapter');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sayaç-partner-sil')
        .setDescription('Belirtilen yetkilinin partner sayısını azaltır.')
        .addUserOption(option => 
            option.setName('yetkili')
                .setDescription('Partner sayısı azaltılacak yetkili')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('sayı')
                .setDescription('Azaltılacak partner sayısı')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            if (!interaction.member.permissions.has('ADMINISTRATOR')) {
                return interaction.editReply({ content: 'Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız.', ephemeral: true });
            }

            const user = interaction.options.getUser('yetkili');
            const count = interaction.options.getInteger('sayı');
            const guildId = interaction.guild.id;
            
            const currentCount = await croxydb.get(`partnerCount_${guildId}_${user.id}`) || 0;
            const newCount = Math.max(currentCount - count, 0);
            
            await croxydb.set(`partnerCount_${guildId}_${user.id}`, newCount);

            await interaction.editReply(`${user.tag} kullanıcısının partner sayısı ${count} azaltıldı. Yeni toplam: ${newCount}`);
        } catch (error) {
            console.error('Komut çalıştırılırken hata oluştu:', error);
            await interaction.editReply({ content: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
        }
    }
};
