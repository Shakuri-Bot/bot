const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const croxydb = require('../db-adapter');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yasaklı-sunucu-kontrol')
        .setDescription('Yasaklı sunucu kontrolünü açar veya kapatır.')
        .addStringOption(option => 
            option.setName('durum')
                .setDescription('Yasaklı sunucu kontrolünün durumu')
                .setRequired(true)
                .addChoices(
                    { name: 'Açık', value: 'açık' },
                    { name: 'Kapalı', value: 'kapalı' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            const guildId = interaction.guild.id;
            const status = interaction.options.getString('durum');
            
            // Durumu ayarla
            const newStatus = status === 'açık';
            await croxydb.set(`bannedServerCheckToggle_${guildId}`, newStatus);
            
            const embed = new EmbedBuilder()
                .setTitle('Yasaklı Sunucu Kontrolü')
                .setDescription(`Yasaklı sunucu kontrolü ${newStatus ? '<:parsher_a_on:1202167698658955326> açıldı' : '<:parsher_a_off:1202167696788308049> kapatıldı'}`)
                .setColor(newStatus ? 'Green' : 'Red')
                .addFields(
                    { name: 'Ne İşe Yarar?', value: 'Bu özellik açıkken, partner kanalına yasaklı sunucuların davet linkleri atıldığında otomatik olarak silinir ve kullanıcıya DM üzerinden bilgi verilir.' }
                )
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Komut çalıştırılırken hata oluştu:', error);
            await interaction.editReply({ content: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
        }
    }
}; 