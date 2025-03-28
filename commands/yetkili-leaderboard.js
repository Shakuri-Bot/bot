const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const croxydb = require('../db-adapter');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yetkili-leaderboard')
        .setDescription('Partner yapan yetkililerin sıralamasını gösterir.')
        .addStringOption(option => 
            option.setName('zaman')
                .setDescription('Sıralama zamanı')
                .setRequired(true)
                .addChoices(
                    { name: 'Tüm Zamanlar', value: 'all_time' },
                    { name: 'Haftalık', value: 'weekly' }
                )),
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            const timePeriod = interaction.options.getString('zaman');
            const guild = interaction.guild;
            const guildId = guild.id;
            
            let leaderboardData = [];
            const allUsers = guild.members.cache;

            for (const [id, member] of allUsers) {
                const totalPartners = await croxydb.get(`partnerCount_${guildId}_${member.id}`) || 0;
                const partnerLogs = await croxydb.get(`partnerLogs_${guildId}_${member.id}`) || [];
                const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                const recentPartners = partnerLogs.filter(log => log.timestamp > oneWeekAgo).length;

                if (timePeriod === 'all_time' && totalPartners > 0) {
                    leaderboardData.push({ member, count: totalPartners });
                } else if (timePeriod === 'weekly' && recentPartners > 0) {
                    leaderboardData.push({ member, count: recentPartners });
                }
            }

            leaderboardData.sort((a, b) => b.count - a.count);

            const pageSize = 10;
            let currentPage = 0;
            const totalPages = Math.ceil(leaderboardData.length / pageSize);

            const generateEmbed = (page) => {
                const embed = new EmbedBuilder()
                    .setTitle(timePeriod === 'all_time' ? 'Tüm Zamanların Partner Liderleri' : 'Haftalık Partner Liderleri')
                    .setColor('#2222b5');

                const start = page * pageSize;
                const end = Math.min(start + pageSize, leaderboardData.length);
                const pageData = leaderboardData.slice(start, end);

                if (pageData.length === 0) {
                    embed.setDescription('Hiçbir veri bulunamadı.');
                } else {
                    pageData.forEach((entry, index) => {
                        embed.addFields({ name: `${start + index + 1}. @${entry.member.user.tag}`, value: `partner sayısı : ${entry.count}`, inline: false });
                    });
                }

                embed.setFooter({ text: `Sayfa ${page + 1} / ${totalPages}` });
                return embed;
            };

            const generateActionRow = (page) => {
                const row = new ActionRowBuilder();
                const prevButton = new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('◀️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 0);
                
                const nextButton = new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('▶️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page >= totalPages - 1 || leaderboardData.length <= (page + 1) * pageSize);
                
                row.addComponents(prevButton, nextButton);
                return row;
            };

            const initialEmbed = generateEmbed(currentPage);
            const actionRow = generateActionRow(currentPage);

            const message = await interaction.editReply({ embeds: [initialEmbed], components: [actionRow] });

            const collector = message.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async (i) => {
                if (i.customId === 'prev') {
                    currentPage = Math.max(currentPage - 1, 0);
                } else if (i.customId === 'next') {
                    currentPage = Math.min(currentPage + 1, totalPages - 1);
                }

                const newEmbed = generateEmbed(currentPage);
                const newActionRow = generateActionRow(currentPage);

                await i.update({ embeds: [newEmbed], components: [newActionRow] });
            });

            collector.on('end', async () => {
                const finalEmbed = generateEmbed(currentPage);
                await message.edit({ embeds: [finalEmbed], components: [] });
            });
        } catch (error) {
            console.error('Komut çalıştırılırken hata oluştu:', error);
            await interaction.editReply({ content: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
        }
    }
};
