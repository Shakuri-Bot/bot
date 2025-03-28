const { SlashCommandBuilder } = require('discord.js');
const croxydb = require('../db-adapter');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('partner-yasakla')
        .setDescription('Bir sunucuyu partnerlikten yasaklar.')
        .addStringOption(option => 
            option.setName('sunucu-adı')
                .setDescription('Yasaklanacak sunucunun adı')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('sunucu')
                .setDescription('Yasaklanacak sunucunun ID\'si veya davet linki')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('sebep')
                .setDescription('Yasaklanma sebebi')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ content: 'Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız.', ephemeral: true });
        }

        const guildName = interaction.options.getString('sunucu-adı');
        const guildInput = interaction.options.getString('sunucu');
        const reason = interaction.options.getString('sebep');

        const bannedGuilds = await croxydb.get('bannedGuilds') || [];
        const partnerLinkRegex = /(https?:\/\/)?(www\.)?(discord\.gg|discord(app)?\.com\/invite)\/\S+/g;

        let guildId;

        if (partnerLinkRegex.test(guildInput)) {
            const inviteCode = guildInput.split('/').pop();
            try {
                const invite = await interaction.client.fetchInvite(inviteCode);
                guildId = invite.guild.id;
            } catch (error) {
                console.error('Davet linki sorgulanırken bir hata oluştu:', error);
                return interaction.reply({ content: 'Geçerli bir Discord davet linki girin.', ephemeral: true });
            }
        } else {
            guildId = guildInput;
        }

        if (!bannedGuilds.some(g => g.guildId === guildId)) {
            bannedGuilds.push({ guildName, guildId, reason });
            await croxydb.set('bannedGuilds', bannedGuilds);
            await interaction.reply(`Sunucu ${guildName} (${guildId}) partnerlikten yasaklandı. Sebep: ${reason}`);
        } else {
            await interaction.reply(`Sunucu ${guildName} (${guildId}) zaten yasaklanmış.`);
        }
    },
};