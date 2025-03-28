const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Komut listelerini global olarak tanımlayalım, her çağrıda yeniden oluşturulmasın
const otoPartnerCommands = [
    { name: '/kurulum', description: 'Botun sistemlerini kurar', inline: true },
    { name: '/partner-sistem', description: 'Oto-Partner sistemini kurar', inline: true },
    { name: '/partner-sistem-sıfırla', description: 'Sunucu verilerini sıfırlar', inline: true },
    { name: '/partner-text-ayarla', description: 'Partner text ayarlar', inline: true },
    { name: '/partner-tepki', description: '"Partner DM" gibi metinlere tepki vermesini ayarlar.', inline: true },
    { name: '/partner-cooldown', description: 'Partner cooldown süresini ayarlar (örn: 2h, 30m)', inline: true },
    { name: '/ayarlar', description: 'Sunucunuzun tüm partnerlik ayarlarını gösterir.', inline: true },
];

const sayaçPartnerCommands = [
    { name: '/sayaç-sistemi', description: 'Sayaç kanalını ayarlar', inline: true },
    { name: '/sayaç-partner-ekle', description: 'Sayaç partner ekler', inline: true },
    { name: '/sayaç-partner-sil', description: 'Sayaç partner siler', inline: true },
    { name: '/yetkili-bilgi', description: 'Yetkilinin partner bilgilerini gösterir', inline: true },
    { name: '/yetkili-leaderboard', description: 'Yetkilinin partner sıralamasını gösterir', inline: true },
];

const partnerBanCommands = [
    { name: '/partner-yasakla', description: 'Belirtilen sunucuyu (ID ve ya davet linki) partnerlikten yasaklar.', inline: true },
    { name: '/partner-yasak-kaldır', description: 'Belirtilen sunucunun partnerlik yasağını kaldırır.', inline: true },
    { name: '/partner-yasak-list', description: 'Partnerlikten yasaklanan sunucların listesini gösterir.', inline: true },
    { name: '/id-sorgu', description: 'Belirtilen davet linkinin sunucu ID\'sini gösterir.', inline: true },
    { name: '/yasaklı-sunucu-kontrol', description: 'Yasaklı sunucu kontrolünü açar veya kapatır.', inline: true },
];

const otherCommands = [
    { name: '/ping', description: 'Botun gecikme süresini gösterir', inline: true },
    { name: '/istatistik', description: 'Botun istatistiklerini gösterir', inline: true },
];

// Önceden oluşturulmuş menü seçenekleri
const menuOptions = [
    {
        label: 'Ana Sayfa',
        value: 'main_page',
        emoji: '<:yelanomg:1265658961437265920>',
    },
    {
        label: 'Oto Partner Komutları',
        value: 'oto_partner',
        emoji: '<:sip_yelan:1265658175768494203>',
    },
    {
        label: 'Sayaç Komutları',
        value: 'sayaç_partner',
        emoji: '<:yelancozy:1265658823771820122>',
    },
    {
        label: 'Partner Yasaklama Komutları',
        value: 'partner_ban',
        emoji: '<:ohh_yelan:1265658701327372308>',
    },
    {
        label: 'Diğer Komutlar',
        value: 'other_commands',
        emoji: '<:yelanwoaww:1265658923352854672>',
    },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yardım')
        .setDescription('Yardım komutu.'),
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            // Ana embed'i oluştur
            const embed = new EmbedBuilder()
                .setTitle('Yardım Menüsü')
                .setColor('#2222b5')
                .setDescription('<a:meraba:1115379617075826758> Botun mevcut tüm komutları ve açıklamaları için bir kategori seçin:\n\n\n                   **<:yelanonkalp:1183865712373145710> En Çok Kullanılan Komutlar :**\n')
                .addFields(
                    { name: '/kurulum :', value: `Botun sistemlerini kurar.`, inline: true },
                    { name: '/ayarlar :', value: `Sunucunuzun tüm partnerlik ayarlarını gösterir.`, inline: true },
                    { name: '/partner-sistem :', value: `Oto-Partner sistemini ayarlar.`, inline: true },
                    { name: '/partner-text-ayarla :', value: `Partner textinizi ayarlar.`, inline: true },
                    { name: '/sayaç-kanal :', value: `Kanal sayaç sistemi için kanal belirler.`, inline: true },
                    { name: '/partner-tepki :', value: `Botun "Partner DM" gibi mesajlara tepki vermesini açar/kapar.`, inline: true },
                )
                .setImage('https://cdn.discordapp.com/attachments/1000712310987440248/1264156600374132746/6ee3eb3683b40cec.jpg?ex=669cd914&is=669b8794&hm=e3e17875f138e5e478bdbd27d7cb1ae5208225b2f8c1562a0d8038ea59091717&')
                .setFooter({
                    text: `Komutu kullanan: ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                });

            // Kategori seçim menüsü
            const categorySelectMenu = new StringSelectMenuBuilder()
                .setCustomId('select-category')
                .setPlaceholder('Bir kategori seçin')
                .addOptions(menuOptions);

            // Silme butonu
            const deleteButton = new ButtonBuilder()
                .setCustomId('delete')
                .setLabel('🗑️ Sil')
                .setStyle(ButtonStyle.Danger);

            const categorySelectRow = new ActionRowBuilder().addComponents(categorySelectMenu);
            const deleteButtonRow = new ActionRowBuilder().addComponents(deleteButton);

            // Yanıtı gönder
            const message = await interaction.editReply({ 
                embeds: [embed], 
                components: [categorySelectRow, deleteButtonRow], 
                ephemeral: false 
            });

            // Kategori embedlerini önceden hazırla
            const categoryEmbeds = {
                main_page: embed,
                oto_partner: createCategoryEmbed('Oto Partner Komutları', 'Oto Partner', otoPartnerCommands, interaction),
                sayaç_partner: createCategoryEmbed('Sayaç Komutları', 'Sayaç', sayaçPartnerCommands, interaction),
                partner_ban: createCategoryEmbed('Partner Yasaklama Komutları', 'Partner Yasaklama', partnerBanCommands, interaction),
                other_commands: createCategoryEmbed('Diğer Komutlar', 'Diğer', otherCommands, interaction)
            };

            // Collector oluştur
            const filter = i => (i.customId === 'select-category' || i.customId === 'delete') && i.user.id === interaction.user.id;
            const collector = message.createMessageComponentCollector({ filter, time: 60000 });

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
                    return;
                }

                // Seçilen kategorinin embed'ini göster
                const selectedCategory = i.values[0];
                const selectedEmbed = categoryEmbeds[selectedCategory];

                try {
                    await i.update({ 
                        embeds: [selectedEmbed], 
                        components: [categorySelectRow, deleteButtonRow] 
                    });
                } catch (error) {
                    if (error.code === 50001) { // Missing Access
                        await i.reply({ content: 'Bu komutu uygulamak için gerekli yetkim yok.', ephemeral: true });
                    } else {
                        console.error(error);
                        await i.reply({ content: 'Bir hata oluştu. Lütfen tekrar deneyin.', ephemeral: true });
                    }
                }
            });

            collector.on('end', collected => {
                if (!collected.size) {
                    interaction.editReply({ content: 'Zaman aşımına uğradı.', components: [] }).catch(() => {});
                }
            });
        } catch (error) {
            console.error('Yardım komutu çalıştırılırken hata oluştu:', error);
            await interaction.editReply({ content: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
        }
    },
};

// Kategori embed'i oluşturma fonksiyonu
function createCategoryEmbed(title, description, commands, interaction) {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor('#2222b5')
        .setThumbnail('https://cdn.discordapp.com/avatars/1264865635633205341/f32d31020f3ae1b0df50509786ad9098.png?size=1024')
        .setImage('https://cdn.discordapp.com/attachments/1000712310987440248/1264156600374132746/6ee3eb3683b40cec.jpg?ex=669cd914&is=669b8794&hm=e3e17875f138e5e478bdbd27d7cb1ae5208225b2f8c1562a0d8038ea59091717&')
        .setDescription(`${description} kategorisindeki komutlar:`)
        .setFooter({
            text: `Komutu kullanan: ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        });

    commands.forEach(cmd => {
        embed.addFields({ name: cmd.name, value: cmd.description || 'Açıklama yok', inline: false });
    });

    return embed;
}