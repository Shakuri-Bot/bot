const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const croxydb = require('../db-adapter');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sayaç-sistemi')
        .setDescription('Partner kanalını ayarla')
        .addChannelOption(option => 
            option.setName('kanal')
            .setDescription('Partner kanalı')
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            const channel = interaction.options.getChannel('kanal');
            const guildId = interaction.guild.id;

            await croxydb.set(`partnerChannel_${guildId}`, channel.id);

            const embed = new EmbedBuilder()
                .setTitle('Partner Kanalı Ayarlandı')
                .setDescription(`Partner kanalı başarıyla ayarlandı: ${channel}`)
                .setColor('Green');

            await interaction.editReply({ embeds: [embed], ephemeral: false });
        } catch (error) {
            console.error('Komut çalıştırılırken hata oluştu:', error);
            await interaction.editReply({ content: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
        }
    }
};
