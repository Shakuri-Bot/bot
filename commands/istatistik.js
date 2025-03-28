const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { version } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('istatistik')
        .setDescription('Botun istatistiklerini gösterir.'),
    async execute(interaction) {
        const { client } = interaction;
        const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const memoryUsage = (os.totalmem() - os.freemem()) / (1024 * 1024);
        const commandFiles = fs.readdirSync(path.join(__dirname)).filter(file => file.endsWith('.js'));
        
        const embed = new EmbedBuilder()
            .setTitle('Bot İstatistikleri')
            .setThumbnail('https://cdn.discordapp.com/avatars/1264865635633205341/f32d31020f3ae1b0df50509786ad9098.png?size=1024')
            .setImage('https://cdn.discordapp.com/attachments/1000712310987440248/1264156600374132746/6ee3eb3683b40cec.jpg?ex=669cd914&is=669b8794&hm=e3e17875f138e5e478bdbd27d7cb1ae5208225b2f8c1562a0d8038ea59091717&')
            .setColor('#2222b5')
            .setDescription(`
            <:yelanwoaww:1265658923352854672>・ **${client.guilds.cache.size}** sunucudayım.

            <:ohh_yelan:1265658701327372308>・ Kullanıcı sayım **${totalMembers}**.
            
            <:yelanomg:1265658961437265920>・ Yapımcım [@parsher](https://discord.com/users/689447667465453599).

            <:yelan_kusuyo:1265658572608376853>・ Komut sayısı **${commandFiles.length}**

            <:yelancozy:1265658823771820122>・ Discord.js sürümü **${version}**.
            
            <:sip_yelan:1265658175768494203>・ Pingim **${client.ws.ping}ms**.

            <:yelan_tatlis:1265658255976435752>・ Bellek kullanımı **${(process.memoryUsage().heapUsed / 1024 / 512).toFixed(2)}MB**.`)
            .setTimestamp();

        const deleteButton = new ButtonBuilder()
            .setCustomId('delete')
            .setLabel('🗑️ Sil')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(deleteButton);

        await interaction.reply({ embeds: [embed], components: [row] });

        const filter = i => i.customId === 'delete' && i.user.id === interaction.user.id;

        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'delete') {
                try {
                    await i.message.delete();
                } catch (error) {
                    if (error.code === 50001) { // Missing Access
                        await i.reply({ content: 'Bu mesajı silmek için yetkim yok.', ephemeral: true });
                    } else {
                        console.error(error);
                        await i.reply({ content: 'Bir hata oluştu. Lütfen tekrar deneyin.', ephemeral: true });
                    }
                }
            }
        });

        collector.on('end', collected => {
            if (!collected.size) {
                interaction.editReply({ content: 'Zaman aşımına uğradı.', components: [] });
            }
        });
    },
};
