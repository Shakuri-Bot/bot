const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('link-al')
        .setDescription('Belirtilen sunucunun davet linkini alır.')
        .addStringOption(option =>
            option.setName('sunucu-id')
                .setDescription('Davet linki alınacak sunucunun ID\'si')
                .setRequired(true)),
    async execute(interaction) {
        if (!config.sahip.includes(interaction.user.id)) {
            return interaction.reply({ content: 'Bu komutu kullanma yetkiniz yok.', ephemeral: true });
        }

        const guildId = interaction.options.getString('sunucu-id');
        const guild = interaction.client.guilds.cache.get(guildId);

        if (!guild) {
            return interaction.reply({ content: 'Geçerli bir sunucu ID\'si girin.', ephemeral: true });
        }

        try {
            const invite = await guild.invites.create(guild.systemChannel || guild.channels.cache.filter(c => c.type === 'GUILD_TEXT').first(), {
                maxAge: 0, // Never expires
                maxUses: 0 // Unlimited uses
            });

            return interaction.reply(`Sunucu davet linki: ${invite.url}`);
        } catch (error) {
            console.error('Davet linki oluşturulurken bir hata oluştu:', error);
            return interaction.reply({ content: 'Davet linki oluşturulurken bir hata oluştu.', ephemeral: true });
        }
    },
};