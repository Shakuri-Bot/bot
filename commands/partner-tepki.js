const { SlashCommandBuilder } = require('discord.js');
const croxydb = require('../db-adapter');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('partner-tepki')
        .setDescription('Partner sistemi için açık/kapalı ayarı yapar.')
        .addStringOption(option =>
            option.setName('durum')
                .setDescription('Partner sistemini açmak veya kapatmak için kullanın.')
                .setRequired(true)
                .addChoices(
                    { name: 'açık', value: 'true' },
                    { name: 'kapalı', value: 'false' }
                )),
    async execute(interaction) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ content: 'Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız.', ephemeral: true });
        }

        const durum = interaction.options.getString('durum');

        try {
            if (durum === 'true') {
                await croxydb.set(`partnerToggle_${interaction.guild.id}`, true);
                return interaction.reply(`Partner sistemi durumu başarıyla açık olarak ayarlandı.`);
            } else {
                await croxydb.delete(`partnerToggle_${interaction.guild.id}`);
                return interaction.reply(`Partner sistemi durumu başarıyla kapalı olarak ayarlandı.`);
            }
        } catch (error) {
            console.error('Error toggling partner system:', error);
            return interaction.reply({ content: 'Bu komutu çalıştırırken bir hata oluştu!', ephemeral: true });
        }
    },
};
