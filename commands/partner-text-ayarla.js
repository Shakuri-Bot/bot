const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const croxydb = require('../db-adapter');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('partner-text-ayarla')
        .setDescription('Partner text ayarlama.'),
    async execute(interaction) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ content: 'Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız.', ephemeral: true });
        }

        const modal = new ModalBuilder()
            .setCustomId('partnerTextModal')
            .setTitle('Partner Text Ayarla');

        const input = new TextInputBuilder()
            .setCustomId('partnerTextInput')
            .setLabel('Partner Textinizi Girin')
            .setStyle(TextInputStyle.Paragraph);

        const row = new ActionRowBuilder().addComponents(input);

        modal.addComponents(row);

        await interaction.showModal(modal);
    },
    async handleModalSubmit(interaction) {
        const partnerText = interaction.fields.getTextInputValue('partnerTextInput');

        if (!partnerText.includes('discord.gg/')) {
            await interaction.reply('Partner textinizde sunucunuzun davet linki bulunmak zorundadır bu yüzden textiniz kaydedilmedi.');
            return;
        }

        const inviteRegex = /(https?:\/\/)?(www\.)?(discord\.gg|discord(app)?\.com\/invite)\/\S+/g;
        const match = partnerText.match(inviteRegex);

        if (!match) {
            await interaction.reply('Geçerli bir Discord davet linki bulunamadı.');
            return;
        }

        const inviteLink = match[0];
        const inviteCode = inviteLink.split('/').pop();

        try {
            const invite = await interaction.client.fetchInvite(inviteCode);
            if (invite.guild.id !== interaction.guild.id) {
                await interaction.reply('Lütfen partner textinizdeki sunucunun bu sunucu olduğundan emin olun.');
                return;
            }
        } catch (error) {
            await interaction.reply('Geçerli bir Discord davet linki bulunamadı.');
            return;
        }

        await croxydb.set(`partnerText_${interaction.guild.id}`, partnerText);
        await interaction.reply('Partner text başarıyla ayarlandı!');
    },
};
