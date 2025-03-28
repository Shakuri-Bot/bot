const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, StringSelectMenuBuilder } = require('discord.js');
const croxydb = require('../db-adapter');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kurulum')
        .setDescription('Botun kurulumunu adım adım yapar.')
        .addChannelOption(option =>
            option.setName('buton-kanalı')
                .setDescription('Partner olmak isteyenlerin butona tıklayacağı kanal')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText))
        .addChannelOption(option =>
            option.setName('partner-kanalı')
                .setDescription('Partner mesajlarının gönderileceği kanal')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText))
        .addRoleOption(option =>
            option.setName('yetkili-rol')
                .setDescription('Partner işlemlerini yönetecek yetkili rolü')
                .setRequired(true)),
    
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            console.log(`[KURULUM] ${interaction.user.tag} (${interaction.user.id}) kullanıcısı kurulum komutunu başlattı.`);
            
            // Yönetici yetkisi kontrolü
            if (!interaction.member.permissions.has('Administrator')) {
                console.log(`[KURULUM] ${interaction.user.tag} yönetici yetkisine sahip değil, komut reddedildi.`);
                return interaction.editReply({ content: 'Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız.', ephemeral: true });
            }
            
            // Parametreleri al
            const buttonChannel = interaction.options.getChannel('buton-kanalı');
            const partnerChannel = interaction.options.getChannel('partner-kanalı');
            const adminRole = interaction.options.getRole('yetkili-rol');
            
            console.log(`[KURULUM] Parametreler alındı: Buton Kanalı: ${buttonChannel.name} (${buttonChannel.id}), Partner Kanalı: ${partnerChannel.name} (${partnerChannel.id}), Yetkili Rolü: ${adminRole.name} (${adminRole.id})`);
            
            // Kanal ve rol izinlerini kontrol et
            try {
                // Buton kanalına mesaj gönderme izni kontrolü
                const botMember = interaction.guild.members.cache.get(interaction.client.user.id);
                if (!buttonChannel.permissionsFor(botMember).has('SendMessages')) {
                    console.log(`[KURULUM] Bot, buton kanalına mesaj gönderme iznine sahip değil.`);
                    return interaction.editReply({ content: `Buton kanalına mesaj gönderme iznim yok. Lütfen ${buttonChannel} kanalında izinlerimi kontrol edin.`, ephemeral: true });
                }
                
                // Partner kanalına mesaj gönderme izni kontrolü
                if (!partnerChannel.permissionsFor(botMember).has('SendMessages')) {
                    console.log(`[KURULUM] Bot, partner kanalına mesaj gönderme iznine sahip değil.`);
                    return interaction.editReply({ content: `Partner kanalına mesaj gönderme iznim yok. Lütfen ${partnerChannel} kanalında izinlerimi kontrol edin.`, ephemeral: true });
                }
            } catch (error) {
                console.error(`[KURULUM] İzin kontrolü sırasında hata: ${error}`);
                return interaction.editReply({ content: 'Kanal izinleri kontrol edilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
            }
            
            // Adım 1: Temel ayarları kaydet
            try {
                await croxydb.set(`partnerSystem_${interaction.guild.id}`, {
                    buttonChannelId: buttonChannel.id,
                    partnerChannelId: partnerChannel.id,
                    adminRoleId: adminRole.id,
                    setupDate: Date.now(),
                    setupBy: interaction.user.id
                });
                console.log(`[KURULUM] Adım 1: Temel ayarlar veritabanına kaydedildi.`);
            } catch (error) {
                console.error(`[KURULUM] Temel ayarlar kaydedilirken hata: ${error}`);
                return interaction.editReply({ content: 'Temel ayarlar kaydedilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
            }
            
            // Partner butonunu oluştur ve gönder
            try {
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
                console.log(`[KURULUM] Partner butonu ${buttonChannel.name} kanalına gönderildi.`);
            } catch (error) {
                console.error(`[KURULUM] Partner butonu gönderilirken hata: ${error}`);
                return interaction.editReply({ content: 'Partner butonu gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
            }
            
            // Adım 2: Partner Text ayarlama
            const step2Embed = new EmbedBuilder()
                .setTitle('2. adım: Partner Text')
                .setImage('https://cdn.discordapp.com/attachments/1000712310987440248/1264156600374132746/6ee3eb3683b40cec.jpg?ex=66a2c7d4&is=66a17654&hm=5d8b1eb638c72bb594a9d4ef06435f31e2e6314ff05cbba583b3854e677ecdce&')
                .setDescription(`
                    ・ Buraya girdiğiniz metin, bot ile partner yapıldığında karşı tarafa gönderilecek partner textinizdir.

                    ・ Partner textinizde bir sunucu daveti bulunmalıdır.

                    ・ Partner textinizde ki sunucu, bu sunucu olmalıdır.

                    ・ Partner textiniz en fazla 4000 harf olmalıdır.

                    ・ Partner textinizi isterseniz daha sonra "/partner-text-ayarla" komutu ile değiştirebilirsiniz.
                    
                    ・ Eğer Troll bir text girerseniz yetkililerimiz datalarınızı silip sizi bottan yasaklayabilirler.
                `)
                .setColor('#2222b5');

            const partnerTextButton = new ButtonBuilder()
                .setCustomId('partner_text_button')
                .setLabel('Partner Text Ayarla')
                .setStyle(ButtonStyle.Primary);

            const skipButton = new ButtonBuilder()
                .setCustomId('skip_partner_text')
                .setLabel('Bu Adımı Atla')
                .setStyle(ButtonStyle.Secondary);

            const row2 = new ActionRowBuilder().addComponents(partnerTextButton);

            const step2Message = await interaction.editReply({ embeds: [step2Embed], components: [row2] });
            console.log(`[KURULUM] Adım 2: Partner Text ayarlama ekranı gösterildi.`);
            
            // Adım 2 için buton kolektörü
            const filter = i => i.user.id === interaction.user.id;
            const step2Collector = interaction.channel.createMessageComponentCollector({ 
                filter, 
                time: 300000, // 5 dakika
                max: 1 // Sadece bir etkileşim
            });
            
            step2Collector.on('collect', async i => {
                try {
                    if (i.customId === 'partner_text_button') {
                        console.log(`[KURULUM] ${interaction.user.tag} Partner Text Ayarla butonuna tıkladı.`);
                        
                        // Modal oluştur
                        const modal = new ModalBuilder()
                            .setCustomId('partner_text_modal')
                            .setTitle('Partner Text Ayarla');

                        const textInput = new TextInputBuilder()
                            .setCustomId('partner_text_input')
                            .setLabel('Partner Textinizi Girin')
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder('Partner textinizi buraya yazın. Discord davet linki içermelidir.')
                            .setRequired(true)
                            .setMaxLength(4000);

                        const modalRow = new ActionRowBuilder().addComponents(textInput);
                        modal.addComponents(modalRow);

                        await i.showModal(modal);
                        console.log(`[KURULUM] Partner Text modalı gösterildi.`);
                        
                        // Modal yanıtını bekle
                        try {
                            const modalSubmit = await i.awaitModalSubmit({
                                filter: mi => mi.user.id === interaction.user.id && mi.customId === 'partner_text_modal',
                                time: 300000 // 5 dakika
                            });
                            
                            const partnerText = modalSubmit.fields.getTextInputValue('partner_text_input');
                            console.log(`[KURULUM] Partner Text modalı gönderildi. Text uzunluğu: ${partnerText.length}`);
                            
                            // Partner text doğrulama
                            if (!partnerText.includes('discord.gg/') && !partnerText.includes('discord.com/invite/')) {
                                console.log(`[KURULUM] Partner text davet linki içermiyor.`);
                                await modalSubmit.reply({ content: 'Partner textinizde sunucunuzun davet linki bulunmak zorundadır. Lütfen tekrar deneyin.', ephemeral: true });
                                
                                // Butonları tekrar göster
                                await interaction.editReply({ embeds: [step2Embed], components: [row2] });
                                
                                // Yeni bir kolektör oluştur
                                const newStep2Collector = interaction.channel.createMessageComponentCollector({ 
                                    filter, 
                                    time: 300000,
                                    max: 1
                                });
                                
                                newStep2Collector.on('collect', async newI => {
                                    if (newI.customId === 'partner_text_button') {
                                        // Aynı işlemi tekrarla
                                        await newI.showModal(modal);
                                    }
                                });
                                
                                return;
                            }
                            
                            // Davet linkini çıkar ve kontrol et
                            const inviteRegex = /(https?:\/\/)?(www\.)?(discord\.gg|discord(app)?\.com\/invite)\/\S+/g;
                            const matches = partnerText.match(inviteRegex);
                            
                            if (!matches || matches.length === 0) {
                                console.log(`[KURULUM] Geçerli davet linki bulunamadı.`);
                                await modalSubmit.reply({ content: 'Geçerli bir Discord davet linki bulunamadı. Lütfen tekrar deneyin.', ephemeral: true });
                                
                                // Butonları tekrar göster
                                await interaction.editReply({ embeds: [step2Embed], components: [row2] });
                                
                                // Yeni bir kolektör oluştur
                                const newStep2Collector = interaction.channel.createMessageComponentCollector({ 
                                    filter, 
                                    time: 300000,
                                    max: 1
                                });
                                
                                newStep2Collector.on('collect', async newI => {
                                    if (newI.customId === 'partner_text_button') {
                                        // Aynı işlemi tekrarla
                                        await newI.showModal(modal);
                                    }
                                });
                                
                                return;
                            }
                            
                            const inviteLink = matches[0];
                            const inviteCode = inviteLink.split('/').pop();
                            
                            try {
                                const invite = await interaction.client.fetchInvite(inviteCode);
                                
                                if (invite.guild.id !== interaction.guild.id) {
                                    console.log(`[KURULUM] Davet linki başka bir sunucuya ait: ${invite.guild.name} (${invite.guild.id})`);
                                    await modalSubmit.reply({ content: 'Partner textinizdeki davet linki bu sunucuya ait değil. Lütfen bu sunucunun davet linkini içeren bir partner texti girin.', ephemeral: true });
                                    
                                    // Butonları tekrar göster
                                    await interaction.editReply({ embeds: [step2Embed], components: [row2] });
                                    
                                    // Yeni bir kolektör oluştur
                                    const newStep2Collector = interaction.channel.createMessageComponentCollector({ 
                                        filter, 
                                        time: 300000,
                                        max: 1
                                    });
                                    
                                    newStep2Collector.on('collect', async newI => {
                                        if (newI.customId === 'partner_text_button') {
                                            // Aynı işlemi tekrarla
                                            await newI.showModal(modal);
                                        }
                                    });
                                    
                                    return;
                                }
                                
                                // Partner texti kaydet
                                await croxydb.set(`partnerText_${interaction.guild.id}`, partnerText);
                                console.log(`[KURULUM] Partner text başarıyla kaydedildi.`);
                                
                                await modalSubmit.reply({ content: 'Partner textiniz başarıyla kaydedildi!', ephemeral: true });
                                
                                // Adım 3'e geç
                                await goToStep3(modalSubmit);
                                
                            } catch (error) {
                                console.error(`[KURULUM] Davet linki kontrol edilirken hata: ${error}`);
                                
                                // Hata türüne göre farklı mesajlar göster
                                let errorMessage = 'Davet linki kontrol edilirken bir hata oluştu. Lütfen geçerli bir davet linki içeren partner texti girin.';
                                
                                // DiscordAPIError[10006]: Unknown Invite hatası için özel mesaj
                                if (error.code === 10006) {
                                    errorMessage = 'Girdiğiniz davet linki geçersiz veya süresi dolmuş. Lütfen geçerli ve aktif bir davet linki içeren partner texti girin.';
                                }
                                
                                try {
                                    await modalSubmit.reply({ content: errorMessage, ephemeral: true });
                                } catch (replyError) {
                                    // Eğer reply zaten yapılmışsa, followUp kullan
                                    try {
                                        await modalSubmit.followUp({ content: errorMessage, ephemeral: true });
                                    } catch (followUpError) {
                                        console.error(`[KURULUM] Hata mesajı gönderilemedi: ${followUpError}`);
                                    }
                                }
                                
                                // Butonları tekrar göster
                                try {
                                    await interaction.editReply({ embeds: [step2Embed], components: [row2] });
                                    
                                    // Yeni bir kolektör oluştur
                                    const newStep2Collector = interaction.channel.createMessageComponentCollector({ 
                                        filter, 
                                        time: 300000,
                                        max: 1
                                    });
                                    
                                    newStep2Collector.on('collect', async newI => {
                                        if (newI.customId === 'partner_text_button') {
                                            // Aynı işlemi tekrarla
                                            await newI.showModal(modal);
                                        }
                                    });
                                } catch (editError) {
                                    console.error(`[KURULUM] Butonlar tekrar gösterilirken hata: ${editError}`);
                                }
                                
                                return;
                            }
                            
                        } catch (error) {
                            console.error(`[KURULUM] Modal yanıtı beklenirken hata: ${error}`);
                            await interaction.followUp({ content: 'Partner text ayarlanırken bir hata oluştu veya zaman aşımına uğradı. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
                            return;
                        }
                        
                    } else if (i.customId === 'skip_partner_text') {
                        console.log(`[KURULUM] ${interaction.user.tag} Partner Text adımını atladı.`);
                        await i.deferUpdate();
                        await goToStep3(i);
                    }
                } catch (error) {
                    console.error(`[KURULUM] Adım 2 işlenirken hata: ${error}`);
                    await interaction.followUp({ content: 'İşlem sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
                }
            });
            
            step2Collector.on('end', async (collected, reason) => {
                if (reason === 'time' && collected.size === 0) {
                    console.log(`[KURULUM] Adım 2 zaman aşımına uğradı.`);
                    await interaction.followUp({ content: 'Partner text ayarlama işlemi zaman aşımına uğradı. Kurulumu tamamlamak için lütfen komutu tekrar çalıştırın.', ephemeral: true });
                }
            });
            
            // Adım 3: Partner Tepki Ayarlama
            async function goToStep3(i) {
                try {
                    console.log(`[KURULUM] Adım 3: Partner Tepki ayarlama ekranına geçiliyor.`);
                    
                    const step3Embed = new EmbedBuilder()
                        .setTitle('3. adım: Partner Tepki')
                        .setImage('https://cdn.discordapp.com/attachments/1000712310987440248/1264156600374132746/6ee3eb3683b40cec.jpg?ex=66a2c7d4&is=66a17654&hm=5d8b1eb638c72bb594a9d4ef06435f31e2e6314ff05cbba583b3854e677ecdce&')
                        .setDescription(`
                            ・ Partner tepki, botun sohbet kanallarına yazılan "partner dm", "partner gelebilir mi" gibi mesajlara yanıt verip etkileşim başlatmasıdır. bunu isteğe bağlı açabilir ve kapatabilirsiniz.

                            ・ Eğer sonra bu ayarı değiştirmek isterseniz "/partner-tepki" komutunu kullanabilirsiniz.
                        `)
                        .setColor('#2222b5');

                    const openButton = new ButtonBuilder()
                        .setCustomId('open_partner_toggle')
                        .setLabel('Açık')
                        .setStyle(ButtonStyle.Success);

                    const closeButton = new ButtonBuilder()
                        .setCustomId('close_partner_toggle')
                        .setLabel('Kapalı')
                        .setStyle(ButtonStyle.Danger);

                    const row3 = new ActionRowBuilder().addComponents(openButton, closeButton);
                    
                    // Mesajı güncelle
                    if (i.message) {
                        await i.message.edit({ embeds: [step3Embed], components: [row3] });
                    } else {
                        await interaction.editReply({ embeds: [step3Embed], components: [row3] });
                    }
                    
                    console.log(`[KURULUM] Adım 3: Partner Tepki ayarlama ekranı gösterildi.`);
                    
                    // Adım 3 için buton kolektörü
                    const step3Collector = interaction.channel.createMessageComponentCollector({ 
                        filter: i => i.user.id === interaction.user.id, 
                        time: 300000,
                        max: 1
                    });
                    
                    step3Collector.on('collect', async i => {
                        try {
                            if (i.customId === 'open_partner_toggle') {
                                console.log(`[KURULUM] ${interaction.user.tag} Partner Tepki'yi açık olarak ayarladı.`);
                                await croxydb.set(`partnerToggle_${interaction.guild.id}`, true);
                                await i.deferUpdate();
                            } else if (i.customId === 'close_partner_toggle') {
                                console.log(`[KURULUM] ${interaction.user.tag} Partner Tepki'yi kapalı olarak ayarladı.`);
                                await croxydb.set(`partnerToggle_${interaction.guild.id}`, false);
                                await i.deferUpdate();
                            }
                            
                            // Adım 4'e geç
                            await goToStep4(i);
                            
                        } catch (error) {
                            console.error(`[KURULUM] Adım 3 işlenirken hata: ${error}`);
                            await interaction.followUp({ content: 'İşlem sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
                        }
                    });
                    
                    step3Collector.on('end', async (collected, reason) => {
                        if (reason === 'time' && collected.size === 0) {
                            console.log(`[KURULUM] Adım 3 zaman aşımına uğradı.`);
                            await interaction.followUp({ content: 'Partner tepki ayarlama işlemi zaman aşımına uğradı. Kurulumu tamamlamak için lütfen komutu tekrar çalıştırın.', ephemeral: true });
                        }
                    });
                    
                } catch (error) {
                    console.error(`[KURULUM] Adım 3'e geçilirken hata: ${error}`);
                    await interaction.followUp({ content: 'İşlem sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
                }
            }
            
            // Adım 4: Sayaç Sistemi Ayarlama
            async function goToStep4(i) {
                try {
                    console.log(`[KURULUM] Adım 4: Sayaç Sistemi ayarlama ekranına geçiliyor.`);
                    
                    const step4Embed = new EmbedBuilder()
                        .setTitle('4. adım: Sayaç Sistemi')
                        .setImage('https://cdn.discordapp.com/attachments/1000712310987440248/1264156600374132746/6ee3eb3683b40cec.jpg?ex=66a2c7d4&is=66a17654&hm=5d8b1eb638c72bb594a9d4ef06435f31e2e6314ff05cbba583b3854e677ecdce&')
                        .setDescription(`
                            ・ Sayaç sistemi, yetkililerin yapacakları manuel partnerliklerin sayımını yapar.

                            ・ "/yetkili-leaderboard" komutu ile yetkililerinizin haftalık ve ya toplam istetistiklerini görebilirsiniz.

                            ・ "/yetkili-bilgi" komutu ile belirtilen yetkilinizin son bir haftada kaç rol verdiği ve toplamda kaç rol verdiği gibi bilgilerine erişebilirsiniz.
                        `)
                        .setColor('#2222b5');
                    
                    // Sunucudaki metin kanallarını al
                    const textChannels = interaction.guild.channels.cache
                        .filter(channel => channel.type === ChannelType.GuildText)
                        .map(channel => {
                            return {
                                label: channel.name.length > 25 ? channel.name.substring(0, 22) + '...' : channel.name,
                                value: channel.id,
                                description: `Kanal ID: ${channel.id}`
                            };
                        });
                    
                    // Kanal sayısı kontrolü
                    if (textChannels.length === 0) {
                        console.log(`[KURULUM] Sunucuda metin kanalı bulunamadı.`);
                        await interaction.followUp({ content: 'Sunucuda metin kanalı bulunamadı. Lütfen en az bir metin kanalı oluşturun ve tekrar deneyin.', ephemeral: true });
                        return;
                    }
                    
                    // Select menu oluştur
                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId('partner_counter_channel')
                        .setPlaceholder('Sayaç kanalını seçin')
                        .addOptions(textChannels.slice(0, 25)); // Discord 25 seçenek sınırı
                    
                    const skipButton = new ButtonBuilder()
                        .setCustomId('skip_counter_setup')
                        .setLabel('Bu Adımı Atla')
                        .setStyle(ButtonStyle.Secondary);
                    
                    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
                    const buttonRow = new ActionRowBuilder().addComponents(skipButton);
                    
                    // Mesajı güncelle
                    if (i.message) {
                        await i.message.edit({ embeds: [step4Embed], components: [selectRow, buttonRow] });
                    } else {
                        await interaction.editReply({ embeds: [step4Embed], components: [selectRow, buttonRow] });
                    }
                    
                    console.log(`[KURULUM] Adım 4: Sayaç Sistemi ayarlama ekranı gösterildi.`);
                    
                    // Adım 4 için select menu kolektörü
                    const step4Collector = interaction.channel.createMessageComponentCollector({ 
                        filter: i => i.user.id === interaction.user.id, 
                        time: 300000,
                        max: 1
                    });
                    
                    step4Collector.on('collect', async i => {
                        try {
                            if (i.customId === 'partner_counter_channel') {
                                const selectedChannelId = i.values[0];
                                const selectedChannel = interaction.guild.channels.cache.get(selectedChannelId);
                                
                                console.log(`[KURULUM] ${interaction.user.tag} sayaç kanalını ${selectedChannel.name} (${selectedChannelId}) olarak ayarladı.`);
                                
                                // Sayaç kanalını kaydet
                                try {
                                    await croxydb.set(`partnerChannel_${interaction.guild.id}`, selectedChannelId);
                                    console.log(`[KURULUM] Sayaç kanalı veritabanına kaydedildi: ${selectedChannelId}`);
                                } catch (dbError) {
                                    console.error(`[KURULUM] Sayaç kanalı kaydedilirken hata: ${dbError}`);
                                    await i.reply({ content: 'Sayaç kanalı kaydedilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
                                    return;
                                }
                                
                                // Kurulumu tamamla
                                await completeSetup(i, selectedChannelId);
                            } else if (i.customId === 'skip_counter_setup') {
                                console.log(`[KURULUM] ${interaction.user.tag} sayaç kanalı ayarlama adımını atladı.`);
                                await i.deferUpdate();
                                
                                // Kurulumu sayaç kanalı olmadan tamamla
                                await completeSetup(i, null);
                            }
                        } catch (error) {
                            console.error(`[KURULUM] Adım 4 işlenirken hata: ${error}`);
                            try {
                                await i.update({ content: 'İşlem sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.', components: [] });
                            } catch (replyError) {
                                await interaction.followUp({ content: 'İşlem sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
                            }
                        }
                    });
                    
                    step4Collector.on('end', async (collected, reason) => {
                        if (reason === 'time' && collected.size === 0) {
                            console.log(`[KURULUM] Adım 4 zaman aşımına uğradı.`);
                            await interaction.followUp({ content: 'Sayaç sistemi ayarlama işlemi zaman aşımına uğradı. Kurulumu tamamlamak için lütfen komutu tekrar çalıştırın.', ephemeral: true });
                        }
                    });
                    
                } catch (error) {
                    console.error(`[KURULUM] Adım 4'e geçilirken hata: ${error}`);
                    await interaction.followUp({ content: 'İşlem sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
                }
            }
            
            // Kurulumu tamamlama fonksiyonu
            async function completeSetup(i, selectedChannelId) {
                try {
                    const partnerToggleValue = await croxydb.get(`partnerToggle_${interaction.guild.id}`);
                    
                    const successEmbed = new EmbedBuilder()
                        .setTitle('Kurulum Tamamlandı!')
                        .setDescription(`
                            Partner sistemi başarıyla kuruldu! Aşağıdaki ayarlar yapılandırıldı:
                            
                            ・ **Buton Kanalı:** <#${buttonChannel.id}>
                            ・ **Partner Kanalı:** <#${partnerChannel.id}>
                            ・ **Yetkili Rolü:** <@&${adminRole.id}>
                            ・ **Partner Tepki:** ${partnerToggleValue ? '✅ Açık' : '❌ Kapalı'}
                            ${selectedChannelId ? `・ **Sayaç Kanalı:** <#${selectedChannelId}>` : '・ **Sayaç Kanalı:** Ayarlanmadı'}
                            
                            Ayarları değiştirmek için ilgili komutları kullanabilirsiniz:
                            ・ \`/partner-text-ayarla\` - Partner textini değiştirmek için
                            ・ \`/partner-tepki\` - Partner tepki ayarını değiştirmek için
                            ・ \`/sayaç-sistemi\` - Sayaç kanalını değiştirmek için
                            ・ \`/partner-sistem-sıfırla\` - Tüm ayarları sıfırlamak için
                        `)
                        .setColor('Green')
                        .setImage('https://cdn.discordapp.com/attachments/1000712310987440248/1264156600374132746/6ee3eb3683b40cec.jpg?ex=66a2c7d4&is=66a17654&hm=5d8b1eb638c72bb594a9d4ef06435f31e2e6314ff05cbba583b3854e677ecdce&')
                        .setTimestamp();
                    
                    await i.update({ embeds: [successEmbed], components: [] });
                    console.log(`[KURULUM] Kurulum başarıyla tamamlandı!`);
                } catch (embedError) {
                    console.error(`[KURULUM] Başarı mesajı gönderilirken hata: ${embedError}`);
                    await i.update({ content: 'Kurulum başarıyla tamamlandı, ancak özet bilgisi gösterilirken bir hata oluştu.', components: [] });
                }
            }
            
        } catch (error) {
            console.error(`[KURULUM] Genel hata: ${error}`);
            await interaction.editReply({ content: 'Kurulum sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
        }
    }
};
