const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kurallar')
        .setDescription('Belirtilen kanala kurallar embed mesajı gönderir.')
        .addChannelOption(option => 
            option.setName('kanal')
                .setDescription('Kuralların gönderileceği kanal')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            const userId = interaction.user.id;
            
            if (!config.sahip.includes(userId)) {
                return interaction.editReply({ content: 'Bu komutu kullanma yetkiniz yok.', ephemeral: true });
            }

            const channel = interaction.options.getChannel('kanal');

            const embed = new EmbedBuilder()
                .setTitle('Menfis\'e Hoş geldin!!! İşte karşınızda herkesin uyması gereken topluluk kurallarımız:')
                .setDescription(`
                ・Din, dil, ırk ayrımı yapmak yasaktır. Herhangi bir topluluğa nefret söyleminde bulunmak yasaktır. (LGBT gibi topluluklara hakaret etmek yasaktır.)

                ・Herhangi bir kanala nsfw şeyler atmak veya seslide ekran veya kamera açarken +18 şeyler açmak yasaktır. Gore (vahşet) içeren görüntüler de yasaktır.

                ・Şahsa yönelik ve abartılı şekilde ağır küfürler etmek yasaktır.

                ・Her türlü trade yasaktır. (Birilerine bir botu parayla yaptırmak tarzı şeyler de.)

                ・Birini tehdit etmek, gizli bilgilerini paylaşmak; rızası olmadan fotoğrafını, ismini, soyadını veyahut diğer kişisel bilgilerini paylaşmak yasaktır.

                ・Sohbet kanallarında toxiclik yapmak, insanları zorbalamak, millete karışıp boş yere laf atmak, kişisel kavgalarınızı sunucuya yansıtmak yasaktır. (Eğer toxiclik yaptığınız kişi yakın arkadaşınızsa ve rahatsız olmuyorsa sorun yok.)

                ・Ses kanallarında soundboard spamlamak, bass programları kullanmak, rahatsız edici sesler çıkarmak, earrape yasaktır.

                ・Reklamın her türlüsü yasaktır. (Dm'den veya text kanallarına atılan mesajlar olmak dahilinde sınırsız bana neden olur.)

                ・Dead meme kullanmak yasaktır. 31, sj, bruh, bane, napim gibi sözcükler kullanmak yasaktır. (İronisine bile olsa 31 esprisi yapmak yasaktır.)

                ・İntihar hakkında konuşmak yasaktır. (İntihar edeceğim vs.)

                ・Yetki dilenmek yasaktır. Gerektiğinde yetkili alımları yapılıyor, yetkili olmak istiyorsanız onlara katılabilirsiniz.

                ・Spam ve flood yasaktır.

                ・Medya kanalı harici text kanallarına aşırı fotoğraf atıp sohbeti kirletmek yasaktır.

                ・Biri size küfür veya hakaret ettiğinde karşılık vermeniz durumunda siz de ceza alırsınız, karşılık vermek yerine herhangi bir yetkiliyi etiketleyin.

                ・Spoiler vermek yasaktır. Eğer spoilerlı konuşacaksınız spoiler şeklinde yazmanız gereklidir.

                ・Yetkililerin işine karışmak yasaktır.

                ・Türkçe ve abartılmadıkça İngilizce hariç diğer dillerde konuşmak yasaktır.
                `)
                .setImage('https://cdn.discordapp.com/attachments/1080229146946453547/1265712208692908172/yelan_widget_1.jpg?ex=66a281da&is=66a1305a&hm=cba07fc2c0c71e220af9c6ecce42159e87c78841a55d056196727d06565c336d&')
                .setColor('#2120a5');

            await channel.send({ embeds: [embed] });
            await interaction.editReply({ content: 'Kurallar başarıyla gönderildi.', ephemeral: true });
        } catch (error) {
            console.error('Komut çalıştırılırken hata oluştu:', error);
            await interaction.editReply({ content: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
        }
    }
};
