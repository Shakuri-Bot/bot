const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ActivityType, ChannelType } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const { joinVoiceChannel } = require('@discordjs/voice');
const { CronJob } = require('cron');
require('dotenv').config();
const dbAdapter = require('./db-adapter');

// Çevre değişkenlerinden yapılandırma
const config = {
    token: process.env.TOKEN,
    joinChannel: process.env.JOIN_CHANNEL,
    kickChannel: process.env.KICK_CHANNEL,
    sesKanal: process.env.SES_KANAL
};

// Çevre değişkenlerini kontrol et
if (!config.token) {
    console.error('HATA: TOKEN çevre değişkeni bulunamadı!');
    process.exit(1);
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error('HATA: SUPABASE_URL veya SUPABASE_KEY çevre değişkenleri bulunamadı!');
    process.exit(1);
}

// croxydb yerine kendi adaptörümüzü kullanıyoruz
const croxydb = dbAdapter;

// Hata yakalama
process.on('unhandledRejection', (reason, promise) => {
    console.error('İşlenmemiş Promise Reddi:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Yakalanmamış İstisna:', error);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Channel]
});

client.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

client.once("ready", async () => {
    client.invites = new Collection();
    client.guilds.cache.forEach(async guild => {
        try {
            const invites = await guild.invites.fetch();
            client.invites.set(guild.id, invites);
        } catch (error) {
            if (error.code === 50013) {
                console.error(`Gerekli izinler eksik: ${guild.name} sunucusunda davetleri yönetme iznine sahip değilim.`);
            } else {
                console.error(`Davet linkleri çekilirken bir hata oluştu: ${error}`);
            }
        }
    });

    const rest = new REST({ version: '9' }).setToken(config.token);

    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: client.commands.map(cmd => cmd.data) }
        );
        console.log('Komutlar güncellendi!');
    } catch (error) {
        console.error('Komutlar güncellenirken hata oluştu:', error);
    }

    client.user.setPresence({
        activities: [{ name: "Partner botu" }],
    });

    let totalUsers = 0;
    client.guilds.cache.forEach((guild) => {
        totalUsers += guild.memberCount;
    });

    const voiceChannel = client.channels.cache.get(config.sesKanal);
    if (voiceChannel && voiceChannel.type === ChannelType.GuildVoice) {
        joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator
        });
        console.log('Bot has joined the voice channel!');
    } else {
        console.error('Voice channel not found or is not a voice channel.');
    }

    let activityIndex = 0;
    const activities = [
        { name: 'partner botu /yardım', type: ActivityType.Playing },
        { name: `kullanıcı sayım: ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)}`, type: ActivityType.Playing }
    ];

    setInterval(() => {
        client.user.setActivity(activities[activityIndex]);
        activityIndex = (activityIndex + 1) % activities.length;
    }, 10000);

    console.log(`Bot İsmi: ${client.user.tag}`);
    console.log(`Bot ID: ${client.user.id}`);
    console.log(`Toplam Kullanıcılar: ${totalUsers}`);
    console.log(`Toplam Komut: ${client.commands.size}`);

    // API'yi başlat
    const express = require('express');
    const rateLimit = require('express-rate-limit');
    const cors = require('cors');
    const app = express();

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100
    });

    app.use(cors());
    app.use(express.json());
    app.use(limiter);

    const apiKeyCheck = (req, res, next) => {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey || apiKey !== process.env.API_KEY) {
            return res.status(401).json({ error: 'Geçersiz API anahtarı' });
        }
        next();
    };

    app.get('/api/guilds', apiKeyCheck, async (req, res) => {
        try {
            const guilds = client.guilds.cache.map(guild => ({
                id: guild.id,
                name: guild.name,
                memberCount: guild.memberCount,
                icon: guild.iconURL(),
                owner: guild.ownerId,
                joinedAt: guild.joinedAt
            }));

            if (!guilds.length) {
                return res.status(404).json({ error: 'Hiç sunucu bulunamadı' });
            }

            res.json({ success: true, count: guilds.length, guilds });
        } catch (error) {
            console.error('Sunucu bilgileri alınırken hata:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    });

    app.get('/api/guilds/:guildId', apiKeyCheck, async (req, res) => {
        try {
            const guild = client.guilds.cache.get(req.params.guildId);
            
            if (!guild) {
                return res.status(404).json({ error: 'Sunucu bulunamadı' });
            }

            const guildData = {
                id: guild.id,
                name: guild.name,
                memberCount: guild.memberCount,
                icon: guild.iconURL(),
                owner: guild.ownerId,
                joinedAt: guild.joinedAt,
                channels: guild.channels.cache.size,
                roles: guild.roles.cache.size
            };

            res.json({ success: true, guild: guildData });
        } catch (error) {
            console.error('Sunucu detayları alınırken hata:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    });

    const PORT = 3001;
    app.listen(PORT, () => {
        console.log(`API ${PORT} portunda çalışıyor`);
    });
});

client.on('guildCreate', async guild => {
    const joinEmbed = new EmbedBuilder()
        .setTitle('<:parsher_a_join:1202167700525428757> Bot sunucuya eklendi!')
        .setDescription(`Sunucu ID: ${guild.id}\nSunucu İsmi: ${guild.name}\nKullanıcı Sayısı: ${guild.memberCount}`)
        .setColor('Green');

    const joinLogChannel = client.channels.cache.get(config.joinChannel);
    if (joinLogChannel) {
        joinLogChannel.send({ embeds: [joinEmbed] });
    }

    // Veritabanına sunucu bilgilerini kaydet
    await croxydb.set(`guild_${guild.id}`, {
        name: guild.name,
        memberCount: guild.memberCount
    });
});

client.on('guildDelete', async guild => {
    const kickEmbed = new EmbedBuilder()
        .setTitle('<:parsher_a_leave:1202167687522811955> Bot sunucudan atıldı!')
        .setDescription(`Sunucu ID: ${guild.id}\nSunucu İsmi: ${guild.name}\nKullanıcı Sayısı: ${guild.memberCount}`)
        .setColor('Red');

    const kickLogChannel = client.channels.cache.get(config.kickChannel);
    if (kickLogChannel) {
        kickLogChannel.send({ embeds: [kickEmbed] });
    }

    // Veritabanından sunucu bilgilerini sil
    await croxydb.delete(`guild_${guild.id}`);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            // Eğer interaction zaten yanıtlanmışsa followUp kullan
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ content: 'Bu komutu çalıştırırken bir hata oluştu!', ephemeral: true }).catch(() => {});
            } else {
                await interaction.reply({ content: 'Bu komutu çalıştırırken bir hata oluştu!', ephemeral: true }).catch(() => {});
            }
        }
    } else if (interaction.isButton() || interaction.isModalSubmit()) {
        try {
            if (interaction.isButton() && interaction.customId === 'partner_button') {
                // Eğer kullanıcı zaten DM işlemi yapıyorsa, tekrar işlem başlatma
                const activePartnerDMs = client.activePartnerDMs || new Set();
                if (activePartnerDMs.has(interaction.user.id)) {
                    await interaction.reply({ content: 'Zaten bir partner işlemi başlattınız. Lütfen DM kutunuzu kontrol edin.', ephemeral: true });
                    return;
                }
                
                // Kullanıcıyı aktif DM listesine ekle
                activePartnerDMs.add(interaction.user.id);
                client.activePartnerDMs = activePartnerDMs;
                
                await interaction.reply({ content: 'Lütfen partner textinizi DM olarak gönderin. Eğer iptal etmek isterseniz "iptal" yazın.', ephemeral: true });

                const filter = m => m.author.id === interaction.user.id;
                let dmChannel;

                try {
                    dmChannel = await interaction.user.createDM();
                    if (!dmChannel) {
                        throw new Error('DM kanalına erişilemiyor.');
                    }
                } catch (error) {
                    console.error('DM kanalı oluşturulurken hata oluştu:', error);
                    activePartnerDMs.delete(interaction.user.id);
                    return interaction.followUp({ content: 'DM mesajlarınızı alamıyorum. Lütfen DM\'lerinizi açın ve tekrar deneyin.', ephemeral: true }).catch(() => {});
                }

                const handlePartnerText = async () => {
                    try {
                        await dmChannel.send('Lütfen partner textinizi atın. Eğer iptal etmek isterseniz "iptal" yazın.');
                    } catch (error) {
                        console.error('DM mesajı gönderilirken hata oluştu:', error);
                        activePartnerDMs.delete(interaction.user.id);
                        return interaction.followUp({ content: 'DM mesajlarınızı alamıyorum. Lütfen DM\'lerinizi açın ve tekrar deneyin.', ephemeral: true }).catch(() => {});
                    }

                    try {
                        const collected = await dmChannel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
                        const partnerText = collected.first().content;

                        if (partnerText.toLowerCase() === 'iptal') {
                            await dmChannel.send('İşlem iptal edildi.');
                            activePartnerDMs.delete(interaction.user.id);
                            return true;
                        }

                        if (!partnerText.includes('discord.gg/')) {
                            await dmChannel.send('Lütfen içerisinde davet linki olan bir partner texti atın. Eğer iptal etmek isterseniz "iptal" yazın.');
                            activePartnerDMs.delete(interaction.user.id);
                            return false;
                        }

                        const partnerLink = partnerText.match(partnerLinkRegex)[0];
                        const bannedGuilds = await croxydb.get('bannedGuilds') || [];

                        try {
                            const inviteCode = partnerLink.split('/').pop();
                            
                            // Davet kodunu doğrula
                            if (!inviteCode || inviteCode.length < 2) {
                                await dmChannel.send('Geçersiz davet linki. Lütfen geçerli bir Discord davet linki içeren partner texti gönderin.');
                                activePartnerDMs.delete(interaction.user.id);
                                return false;
                            }
                            
                            // Davet bilgilerini al
                            let invite;
                            try {
                                invite = await client.fetchInvite(inviteCode);
                            } catch (inviteError) {
                                console.error('Davet linki işlenirken hata oluştu:', inviteError);
                                
                                if (inviteError.code === 10006) { // Unknown Invite
                                    await dmChannel.send('Davet linki geçersiz veya süresi dolmuş. Lütfen geçerli bir Discord davet linki içeren partner texti gönderin.');
                                } else {
                                    await dmChannel.send('Davet linki kontrol edilirken bir hata oluştu. Lütfen geçerli bir Discord davet linki içeren partner texti gönderin.');
                                }
                                
                                activePartnerDMs.delete(interaction.user.id);
                                return false;
                            }
                            
                            const guildId = invite.guild.id;

                            // Yeni eklenen kontrol
                            if (guildId === interaction.guild.id) {
                                await dmChannel.send('Bu attığın partner texti zaten bu sunucunun partner texti.');
                                activePartnerDMs.delete(interaction.user.id);
                                return true;
                            }

                            if (bannedGuilds.some(g => g.guildId === guildId)) {
                                await dmChannel.send('Bu sunucu yasaklanmıştır.');
                                activePartnerDMs.delete(interaction.user.id);
                                return true;
                            }

                            const partnerTimestamps = await croxydb.get(`partnerTimestamps_${interaction.guild.id}`) || {};

                            if (partnerTimestamps[partnerLink]) {
                                // Sunucuya özel cooldown süresini al
                                const cooldownSettings = await croxydb.get(`partnerCooldown_${interaction.guild.id}`);
                                let cooldownTime = 0; // Varsayılan olarak cooldown yok
                                
                                if (cooldownSettings) {
                                    cooldownTime = cooldownSettings.time;
                                }
                                
                                // Cooldown süresi varsa kontrol et
                                if (cooldownTime > 0 && (Date.now() - partnerTimestamps[partnerLink]) < cooldownTime) {
                                    // Kalan süreyi hesapla
                                    const remainingTime = cooldownTime - (Date.now() - partnerTimestamps[partnerLink]);
                                    const remainingHours = Math.floor(remainingTime / (1000 * 60 * 60));
                                    const remainingMinutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
                                    
                                    let timeMessage = '';
                                    if (remainingHours > 0) {
                                        timeMessage += `${remainingHours} saat `;
                                    }
                                    if (remainingMinutes > 0) {
                                        timeMessage += `${remainingMinutes} dakika`;
                                    }
                                    
                                    await dmChannel.send(`Bu sunucu ile partnerlik yapmak için ${timeMessage} beklemeniz gerekiyor.`);
                                    activePartnerDMs.delete(interaction.user.id);
                                    return true;
                                }
                            }

                            const partnerSystem = await croxydb.get(`partnerSystem_${interaction.guild.id}`);
                            const partnerChannelId = partnerSystem.partnerChannelId;
                            const partnerChannel = interaction.guild.channels.cache.get(partnerChannelId);
                            const adminRoleId = partnerSystem.adminRoleId;

                            if (!partnerChannel) {
                                await dmChannel.send('Partner kanalı bulunamadı.');
                                activePartnerDMs.delete(interaction.user.id);
                                return true;
                            }

                            const sanitizedText = partnerText.replace(/@everyone|@here/g, '');
                            const serverPartnerText = await croxydb.get(`partnerText_${interaction.guild.id}`);

                            await dmChannel.send(`Partner textiniz paylaşılmıştır, yetkililerimiz bir kaç dakika içerisinde sunucunuza giriş yapacaktır.\n\n${serverPartnerText}`);
                            
                            await partnerChannel.send(`${sanitizedText}\n<@&${adminRoleId}> | @${interaction.user.tag}`);
                            await dmChannel.send('Partner textinizi paylaştık! Yetkililerimiz bir kaç dakika içerisinde kontrol için gelecektir.');

                            partnerTimestamps[partnerLink] = Date.now();
                            await croxydb.set(`partnerTimestamps_${interaction.guild.id}`, partnerTimestamps);

                            activePartnerDMs.delete(interaction.user.id);
                            return true;
                        } catch (error) {
                            console.error('Davet linki işlenirken hata oluştu:', error);
                            await dmChannel.send('Geçersiz davet linki. Lütfen geçerli bir Discord davet linki içeren partner texti gönderin.');
                            activePartnerDMs.delete(interaction.user.id);
                            return false;
                        }
                    } catch (error) {
                        if (error.message === 'time') {
                            await dmChannel.send('60 saniye boyunca dönüş yapılmadığı için işlem sonlandırıldı.');
                        } else {
                            console.error('DM mesajı beklenirken hata oluştu:', error);
                            await dmChannel.send('Bir hata oluştu. İşlem sonlandırıldı.');
                        }
                        activePartnerDMs.delete(interaction.user.id);
                        return false;
                    }
                };

                await handlePartnerText();

            } else if (interaction.isModalSubmit() && interaction.customId === 'partnerTextModal') {
                const partnerTextCommand = require('./commands/partner-text-ayarla.js');
                await partnerTextCommand.handleModalSubmit(interaction);
            } else if (interaction.isButton() && interaction.customId === 'delete_help') {
                if (interaction.user.id === interaction.message.interaction.user.id) {
                    await interaction.message.delete().catch(() => {
                        interaction.reply({ content: 'Mesajı silmeye çalışırken bir hata oluştu.', ephemeral: true }).catch(() => {});
                    });
                } else {
                    await interaction.reply({ content: 'Bu butonu sadece komutu kullanan kişi kullanabilir.', ephemeral: true }).catch(() => {});
                }
            }
        } catch (error) {
            console.error('Interaction işlenirken hata oluştu:', error);
            // Eğer interaction zaten yanıtlanmışsa followUp kullan
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ content: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true }).catch(() => {});
            } else {
                await interaction.reply({ content: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true }).catch(() => {});
            }
        }
    }
});

// Sık kullanılan regex kalıplarını önceden derleyelim
const partnerLinkRegex = /(https?:\/\/)?(www\.)?(discord\.gg|discord(app)?\.com\/invite)\/\S+/g;
const partnerKeywords = [
    "partner dm",
    "partner yetkili dm",
    "partnerlik için",
    "partnerlik için gelmiştim",
    "partnere kim bakıyordu acaba",
    "partnere kim bakıyordu",
    "partnere kim bakıyor",
    "partnere kim bakıyo",
    "partner lazım",
    "partner lazim",
    "partner dm lütfen",
    "partner yetkilisi dm",
    "partner yetkilisi lütfen",
    "partner yetkilisi dm lütfen",
    "partner yetkilisi gel",
    "partnerlik için geldim",
    "partner gel",
    "partner yetkilisi gel",
    "partner yetkilisi lütfen dm",
    "partner dm gelebilirmi",
    "partner dm gelebilir mi",
    "partner yetkilisi dm gelebilir mi?",
    "Partner yetkilisi dm gelebilir mi? Kendisi yazsa daha iyi olur birden fazla sunucuya yazıyorum da",
    "partnerlik için",
    "partnerlik için geldim"
];

// Önceden oluşturulmuş embed ve butonlar
const partnerEmbed = new EmbedBuilder()
    .setTitle('Partnerlik Sistemi')
    .setDescription('Sunucumuzla partnerlik yapmak için aşağıdaki butona tıklamanız yeterli olacaktır. Sonrasında DM kutunuza bakmayı unutmayın!')
    .setColor('#2222b5');

const partnerButton = new ButtonBuilder()
    .setCustomId('partner_button')
    .setLabel('Partner Ol')
    .setStyle(ButtonStyle.Primary);

const partnerRow = new ActionRowBuilder().addComponents(partnerButton);

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    // Partner tepki sistemi
    const partnerToggle = await croxydb.get(`partnerToggle_${message.guild?.id}`);
    if (partnerToggle && message.guild && (message.content.toLowerCase().includes('partner') || message.content.toLowerCase().includes('p dm'))) {
        message.react('✅');
    }
    
    // Yasaklı sunucu kontrolü
    try {
        // Partner kanalı kontrolü
        const partnerSystem = await croxydb.get(`partnerSystem_${message.guild?.id}`);
        if (partnerSystem && message.channel.id === partnerSystem.partnerChannelId) {
            // Yasaklı sunucu kontrolü toggle
            const bannedServerCheckToggle = await croxydb.get(`bannedServerCheckToggle_${message.guild.id}`);
            if (bannedServerCheckToggle) {
                // Davet linki kontrolü
                const inviteRegex = /(https?:\/\/)?(www\.)?(discord\.gg|discord(app)?\.com\/invite)\/\S+/g;
                const matches = message.content.match(inviteRegex);
                
                if (matches && matches.length > 0) {
                    // Yasaklı sunucular listesini al
                    const bannedGuilds = await croxydb.get('bannedGuilds') || [];
                    
                    // Her davet linkini kontrol et
                    for (const inviteLink of matches) {
                        try {
                            const inviteCode = inviteLink.split('/').pop();
                            
                            // Davet kodunu doğrula
                            if (!inviteCode || inviteCode.length < 2) {
                                console.log(`[BANNED SERVER] Geçersiz davet kodu: ${inviteCode}`);
                                continue; // Geçersiz davet kodu, sonraki linke geç
                            }
                            
                            // Davet bilgilerini al
                            let invite;
                            try {
                                invite = await client.fetchInvite(inviteCode);
                            } catch (inviteError) {
                                console.error(`[BANNED SERVER] Davet linki kontrolü hatası:`, inviteError);
                                // Davet geçersiz olabilir, diğer davetleri kontrol etmeye devam et
                                continue;
                            }
                            
                            // Sunucu ID'si yasaklı mı kontrol et
                            const isBanned = bannedGuilds.some(guild => guild.guildId === invite.guild.id);
                            
                            if (isBanned) {
                                // Mesajı sil
                                await message.delete();
                                
                                // Kullanıcıya DM gönder
                                try {
                                    const bannedGuild = bannedGuilds.find(guild => guild.guildId === invite.guild.id);
                                    const dmEmbed = new EmbedBuilder()
                                        .setTitle('Yasaklı Sunucu Uyarısı')
                                        .setDescription(`Partner textinizde paylaştığınız **${invite.guild.name}** sunucusu yasaklı sunucular arasında yer aldığı için mesajınız silinmiştir.`)
                                        .addFields(
                                            { name: 'Yasaklanma Sebebi', value: bannedGuild.reason || 'Belirtilmemiş' }
                                        )
                                        .setColor('Red')
                                        .setTimestamp();
                                    
                                    await message.author.send({ embeds: [dmEmbed] });
                                    console.log(`[BANNED SERVER] ${message.author.tag} kullanıcısının yasaklı sunucu (${invite.guild.name}) daveti silindi.`);
                                } catch (dmError) {
                                    console.error(`[BANNED SERVER] DM gönderme hatası:`, dmError);
                                }
                                
                                // İşlemi sonlandır, mesaj zaten silindi
                                return;
                            }
                        } catch (inviteError) {
                            console.error(`[BANNED SERVER] Davet linki kontrolü hatası:`, inviteError);
                            // Davet geçersiz olabilir, diğer davetleri kontrol etmeye devam et
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error(`[BANNED SERVER] Genel hata:`, error);
    }
    
    // Partner sayaç sistemi
    if (!message.guild || !message.author || message.author.bot) {
        return; // Sunucu, mesaj yazarı yoksa veya mesaj bir bot tarafından gönderilmişse işlemi durdur
    }

    try {
        const partnerSystem = await croxydb.get(`partnerSystem_${message.guild.id}`);
        if (!partnerSystem) {
            return; // Partner sistemi ayarlanmamışsa işlemi durdur
        }

        const partnerRoleId = partnerSystem.adminRoleId;
        const partnerRole = message.guild.roles.cache.get(partnerRoleId);
        if (!partnerRole) {
            return; // Partner yetkili rolü bulunamamışsa işlemi durdur
        }

        // Mesaj zaten yanıtlanmış mı kontrol et
        if (message.reference || message._repliedTo) {
            return; // Mesaj zaten yanıtlanmışsa işlemi durdur
        }

        // Mesaj ID'lerini takip et
        const processedMessages = client.processedMessages || new Set();
        if (processedMessages.has(message.id)) {
            return; // Bu mesaj zaten işlenmişse işlemi durdur
        }
        processedMessages.add(message.id);
        client.processedMessages = processedMessages;

        // Set'in boyutunu kontrol et ve gerekirse temizle
        if (processedMessages.size > 1000) {
            // En eski 500 mesajı temizle
            const messagesToDelete = Array.from(processedMessages).slice(0, 500);
            messagesToDelete.forEach(id => processedMessages.delete(id));
        }

        // Partner sayaç işlemlerini takip et
        const partnerCountProcessed = client.partnerCountProcessed || new Set();
        
        const partnerToggle = await croxydb.get(`partnerToggle_${message.guild.id}`);
        if (partnerToggle && partnerKeywords.some(keyword => message.content.toLowerCase().includes(keyword.toLowerCase()))) {
            await message.reply({ embeds: [partnerEmbed], components: [partnerRow] }).catch(() => {});
            return; // İşlemi burada sonlandır
        }

        if (message.content.includes(`<@&${partnerRoleId}>`)) {
            await message.reply({ embeds: [partnerEmbed], components: [partnerRow] }).catch(() => {});
            return; // İşlemi burada sonlandır
        }

        const partnerChannelId = await croxydb.get(`partnerChannel_${message.guild.id}`);
        if (partnerChannelId && message.channel.id === partnerChannelId) {
            // Mesajdaki tüm davet linklerini bul
            const inviteLinks = message.content.match(partnerLinkRegex);
            
            if (inviteLinks && inviteLinks.length > 0) {
                // Her bir davet linki için işlem yap
                for (const inviteLink of inviteLinks) {
                    // Her davet linki için benzersiz bir kimlik oluştur
                    const partnerCountKey = `${message.id}_${inviteLink}`;
                    
                    // Bu partner sayaç işlemi daha önce yapılmış mı kontrol et
                    if (partnerCountProcessed.has(partnerCountKey)) {
                        continue; // Bu davet linki zaten işlenmiş, sonraki linke geç
                    }
                    
                    // Partner sayaç işlemini kaydet
                    partnerCountProcessed.add(partnerCountKey);
                    client.partnerCountProcessed = partnerCountProcessed;
                    
                    // Set'in boyutunu kontrol et ve gerekirse temizle
                    if (partnerCountProcessed.size > 1000) {
                        // En eski 500 işlemi temizle
                        const processesToDelete = Array.from(partnerCountProcessed).slice(0, 500);
                        processesToDelete.forEach(id => partnerCountProcessed.delete(id));
                    }
                    
                    const memberId = message.author.id;
                    const partnerCount = await croxydb.get(`partnerCount_${message.guild.id}_${memberId}`) || 0;
                    const newPartnerCount = partnerCount + 1;
                    await croxydb.set(`partnerCount_${message.guild.id}_${memberId}`, newPartnerCount);

                    // Partnerlik yapılan zamanı loglama
                    const partnerLogs = await croxydb.get(`partnerLogs_${message.guild.id}_${memberId}`) || [];
                    partnerLogs.push({ timestamp: Date.now(), link: inviteLink });
                    await croxydb.set(`partnerLogs_${message.guild.id}_${memberId}`, partnerLogs);

                    // Konsola log ekleyelim
                    console.log(`Partner sayaç: ${message.author.tag} (${memberId}) kullanıcısı için partner sayısı ${newPartnerCount} olarak güncellendi. Link: ${inviteLink}`);

                    const embed = new EmbedBuilder()
                        .setTitle('<a:meraba:1115379617075826758> Yeni Bir Partner Yapıldı!')
                        .setColor('#2222b5')
                        .setImage('https://cdn.discordapp.com/attachments/1000712310987440248/1264156600374132746/6ee3eb3683b40cec.jpg?ex=669ed354&is=669d81d4&hm=7f03ff42e85d340dfba3b229e24727a74e2697f95c5e1836ae146acde442c262&')
                        .addFields(
                            { name: '<:5019nekomatasmile:1215982811723337748> Partneri Yapan Yetkili', value: `<@${memberId}>`, inline: true },
                            { name: '<:3684140raphtalianom:1215982809773113445> Yetkilinin Partner Sayısı', value: `${newPartnerCount}`, inline: true },
                        )
                        .setTimestamp();

                    await message.channel.send({ embeds: [embed] }).catch(() => {});
                }
            }
        }
    } catch (error) {
        console.error('Mesaj işlenirken hata oluştu:', error);
    }
});

const resetWeeklyPartners = new CronJob('0 0 * * 1', async () => {
    try {
        const allKeys = await croxydb.keys();
        const partnerLogKeys = allKeys.filter(key => key.startsWith('partnerLogs_'));
        
        for (const key of partnerLogKeys) {
            await croxydb.set(key, []);
        }
        
        console.log('Haftalık partner sayıları sıfırlandı.');
    } catch (error) {
        console.error('Haftalık partner sayıları sıfırlanırken hata oluştu:', error);
    }
});

resetWeeklyPartners.start();

client.login(config.token);
