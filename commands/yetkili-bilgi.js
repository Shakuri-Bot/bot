const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const croxydb = require('../db-adapter');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yetkili-bilgi')
        .setDescription('Belirtilen kullanıcının partner bilgilerini gösterir.')
        .addUserOption(option => 
            option.setName('kullanıcı')
                .setDescription('Bilgilerini görmek istediğiniz kullanıcıyı seçin')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            const user = interaction.options.getUser('kullanıcı');
            const guild = interaction.guild;
            const member = guild.members.cache.get(user.id);
            const guildId = interaction.guild.id;

            const totalPartnerCount = await croxydb.get(`partnerCount_${guildId}_${user.id}`) || 0;
            const partnerLogs = await croxydb.get(`partnerLogs_${guildId}_${user.id}`) || [];
            const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            const recentPartnerCount = partnerLogs.filter(log => log.timestamp > oneWeekAgo).length;

            const partnerAdminRoleId = await croxydb.get(`partnerAdminRole_${guildId}`);
            const isAdmin = member.roles.cache.has(partnerAdminRoleId);

            const embed = new EmbedBuilder()
                .setTitle('Partner Bilgisi')
                .setThumbnail('https://cdn.discordapp.com/attachments/1264517910030717082/1264856810226188360/pfp.jpg?ex=669f6533&is=669e13b3&hm=460f30fd74264f143bc0296e069a25f3b160afa429379d842ca123a76a87610b&')
                .setImage('https://cdn.discordapp.com/attachments/1000712310987440248/1264156600374132746/6ee3eb3683b40cec.jpg?ex=669ed354&is=669d81d4&hm=7f03ff42e85d340dfba3b229e24727a74e2697f95c5e1836ae146acde442c262&')
                .addFields(
                    { name: 'Yetkili', value: `<@${user.id}>`, inline: false },
                    { name: 'Toplam Verdiği Partner Sayısı', value: `${totalPartnerCount}`, inline: true },
                    { name: 'Son 1 Haftada Verdiği Partner Sayısı', value: `${recentPartnerCount}`, inline: true }
                )
                .setColor('#2222b5')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Komut çalıştırılırken hata oluştu:', error);
            await interaction.editReply({ content: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
        }
    }
};