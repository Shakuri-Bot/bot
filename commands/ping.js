// commands/ping.js

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Botun pingini gösterir.'),
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            const initialEmbed = new EmbedBuilder()
                .setTitle('Ping')
                .setDescription('Hesaplanıyor...')
                .setColor('#2222b5');

            const sentMessage = await interaction.editReply({ embeds: [initialEmbed], fetchReply: true });

            const ping = sentMessage.createdTimestamp - interaction.createdTimestamp;
            const finalEmbed = new EmbedBuilder()
                .setTitle('Ping')
                .setDescription(`Ping: ${ping}ms`)
                .setColor('#2222b5');

            await interaction.editReply({ embeds: [finalEmbed] });
        } catch (error) {
            console.error('Komut çalıştırılırken hata oluştu:', error);
            await interaction.editReply({ content: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
        }
    }
};
