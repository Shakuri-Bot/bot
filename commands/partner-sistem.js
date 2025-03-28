const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType } = require('discord.js');
const croxydb = require('../db-adapter');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('partner-sistem')
        .setDescription('Partner sistemini kurar.')
        .addChannelOption(option => 
            option.setName('buton-kanalı')
                .setDescription('Buton kanalı')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText))
        .addChannelOption(option => 
            option.setName('partner-kanalı')
                .setDescription('Partner kanalı')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText))
        .addRoleOption(option => 
            option.setName('yetkili-rol')
                .setDescription('Partner yetkili rolü')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ content: 'Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız.', ephemeral: true });
        }

        const buttonChannel = interaction.options.getChannel('buton-kanalı');
        const partnerChannel = interaction.options.getChannel('partner-kanalı');
        const adminRole = interaction.options.getRole('yetkili-rol');

        try {
            await await croxydb.set(`partnerSystem_${interaction.guild.id}`, {
                buttonChannelId: buttonChannel.id,
                partnerChannelId: partnerChannel.id,
                adminRoleId: adminRole.id
            });

            const embed = new EmbedBuilder()
                .setTitle('Partner Sistemi')
                .setDescription('<:5019nekomatasmile:1215982811723337748> Partner olmak için aşağıdaki butona tıklayın ve partner textinizi gönderin.')
                .setImage('https://cdn.discordapp.com/attachments/1000712310987440248/1264156600374132746/6ee3eb3683b40cec.jpg?ex=669cd914&is=669b8794&hm=e3e17875f138e5e478bdbd27d7cb1ae5208225b2f8c1562a0d8038ea59091717&')
                .setColor('#2222b5');

            const button = new ButtonBuilder()
                .setCustomId('partner_button')
                .setLabel('Partner Ol')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(button);

            await buttonChannel.send({ embeds: [embed], components: [row] });
            await interaction.reply('Partner sistemi başarıyla kuruldu!\n⛔ ÖNEMLİ : `/partner-text`AYARLAMAYI UNUTMAYIN!');
        } catch (error) {
            console.error('Partner sistem kurulumu sırasında hata:', error);
            await interaction.reply({ content: 'Partner sistemi kurulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
        }
    },
};