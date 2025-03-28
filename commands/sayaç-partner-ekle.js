const { SlashCommandBuilder } = require('discord.js');
const croxydb = require('../db-adapter');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sayaç-partner-ekle')
        .setDescription('Belirtilen yetkilinin partner sayısını artırır.')
        .addUserOption(option => 
            option.setName('yetkili')
                .setDescription('Partner sayısı artırılacak yetkili')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('sayı')
                .setDescription('Artırılacak partner sayısı')
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
            const newCount = currentCount + count;
            
            await croxydb.set(`partnerCount_${guildId}_${user.id}`, newCount);

            await interaction.editReply(`${user.tag} kullanıcısının partner sayısı ${count} artırıldı. Yeni toplam: ${newCount}`);
        } catch (error) {
            console.error('Komut çalıştırılırken hata oluştu:', error);
            await interaction.editReply({ content: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
        }
    }
};
