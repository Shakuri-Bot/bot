const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const croxydb = require('../db-adapter');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('partner-yasak-list')
        .setDescription('Yasaklanmış sunucuları listeler.'),
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            const bannedGuilds = await croxydb.get('bannedGuilds') || [];
            const perPage = 10;
            let page = 1;

            const generateEmbed = (page) => {
                const start = (page - 1) * perPage;
                const end = start + perPage;
                const guilds = bannedGuilds.slice(start, end);

                const embed = new EmbedBuilder()
                    .setTitle('Yasaklanmış Sunucular')
                    .setDescription('Yasaklanan sunucuların listesi.')
                    .setImage('https://cdn.discordapp.com/attachments/1000712310987440248/1264156600374132746/6ee3eb3683b40cec.jpg?ex=669cd914&is=669b8794&hm=e3e17875f138e5e478bdbd27d7cb1ae5208225b2f8c1562a0d8038ea59091717&')
                    .setColor('#2222b5');

                guilds.forEach((guild, index) => {
                    embed.addFields({ name: `#${start + index + 1}`, value: `Sunucu Adı: ${guild.guildName}\nID: ${guild.guildId}\nSebep: ${guild.reason}` });
                });

                embed.setFooter({ text: `Sayfa ${page}/${Math.ceil(bannedGuilds.length / perPage)}` });

                return embed;
            };

            const generateButtons = (page) => {
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('prev_page')
                            .setLabel('◀️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === 1),
                        new ButtonBuilder()
                            .setCustomId('next_page')
                            .setLabel('▶️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === Math.ceil(bannedGuilds.length / perPage))
                    );
                return row;
            };

            await interaction.editReply({ embeds: [generateEmbed(page)], components: [generateButtons(page)] });

            const filter = i => ['prev_page', 'next_page'].includes(i.customId) && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'prev_page') {
                    page--;
                } else if (i.customId === 'next_page') {
                    page++;
                }
                await i.update({ embeds: [generateEmbed(page)], components: [generateButtons(page)] });
            });
        } catch (error) {
            console.error('Komut çalıştırılırken hata oluştu:', error);
            await interaction.editReply({ content: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
        }
    }
};
