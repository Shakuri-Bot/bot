const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('id-sorgu')
        .setDescription('Belirtilen sunucu davet linkinin sunucu ID\'sini gösterir.')
        .addStringOption(option =>
            option.setName('sunucu-linki')
                .setDescription('Sunucu davet linkini girin')
                .setRequired(true)),
    async execute(interaction) {
        const inviteLink = interaction.options.getString('sunucu-linki');
        const inviteRegex = /(https?:\/\/)?(www\.)?(discord\.gg|discord(app)?\.com\/invite)\/\S+/g;


        if (!inviteRegex.test(inviteLink)) {
            return interaction.reply({ content: 'Geçerli bir Discord davet linki girin.', ephemeral: true });
        }

        const inviteCode = inviteLink.split('/').pop();

        try {
            const invite = await interaction.client.fetchInvite(inviteCode);
            const guildId = invite.guild.id;

            await interaction.reply(`Bu davet linkinin ait olduğu sunucunun ID'si: \`${guildId}\``);
        } catch (error) {
            console.error('Davet linki sorgulanırken bir hata oluştu:', error);
            await interaction.reply({ content: 'Geçerli bir Discord davet linki girin.', ephemeral: true });
        }
    },
};