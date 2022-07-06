const config = require('./config.json');

const Discord = require('discord.js');
const client = new Discord.Client({
    intents: [
        Discord.IntentsBitField.Flags.GuildMessages,
        Discord.IntentsBitField.Flags.MessageContent,
        Discord.IntentsBitField.Flags.Guilds
    ]
});

const Database = require('easy-json-database');
const db = new Database();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

const embedColor = '#00BFFF';

client.on('interactionCreate', (interaction) => {

    if (interaction.isChatInputCommand()) {

        const buildSuccessEmbed = (content) => ({ embeds: [ new Discord.EmbedBuilder().setColor(embedColor).setDescription(content) ] });

        if (interaction.commandName === 'stats') {
            if (interaction.user.id !== config.ownerId) {
                return void interaction.reply(`❌ | You can't run this command (insufficient permissions).`);
            }
            const serverCount = client.guilds.cache.size;
            const subscriptionCount = db.all().filter((entry) => entry.key.endsWith('channelId')).length;
            const statsEmbed = new Discord.EmbedBuilder()
                .setColor(embedColor)
                .setTitle('Statistics 📊')
                .addFields([
                    { name: 'Servers', value: serverCount.toString() + ' servers are currently using the bot' },
                    { name: 'Subscriptions', value: subscriptionCount.toString() + ' servers configured a notifications channel' }
                ]);
            return void interaction.reply({
                embeds: [statsEmbed]
            });
        }

        if (!interaction.memberPermissions.has(Discord.PermissionsBitField.Flags.Administrator)) {
            return void interaction.reply(`❌ | You can't run this command (insufficient permissions).`)
        }

        if (interaction.commandName === 'notifications-chan') {
            const channel = interaction.options.getChannel('channel');
            db.set(`${config.guildId}_channelId`, channel.id);
            return void interaction.reply(buildSuccessEmbed(`✅ | EarlyLink selections will now be sent to <#${channel.id}>`));
        }

        if (interaction.commandName === 'notifications-role') {
            const role = interaction.options.getRole('role');
            db.set(`${config.guildId}_roleId`, role.id);
            return void interaction.reply(buildSuccessEmbed(`✅ | Notifications will include a mention for <@&${role.id}>`));
        }

    }

});

client.on('messageCreate', (message) => {
    console.log(message.content)
    if (message.author.bot && message.channelId === config.channelId) {
        if (message.content.startsWith('```')) {
            const json = JSON.parse(message.content.replace('```json', '').replace('```', ''));
            const [_, twitterUsername] = json.linkedTwitter.match(/twitter\.com\/([a-zA-Z_0-9]+)/);
            if (!twitterUsername) return;
            const notificationEmbed = new Discord.EmbedBuilder()
                .setTitle(`${twitterUsername} has been selected by EarlyLink 🚀`)
                .setURL(`https://twitter.com/${twitterUsername}`)
                .setImage(json.mediaUrl)
                .setColor(embedColor)
                .setFooter({
                    text: `This channel will continue receiving EarlyLink selections 🌟`
                });
            
            const databaseEntries = db.all();
            databaseEntries.forEach((databaseEntry) => {
                if (!databaseEntry.key.endsWith('channelId')) return;
                const channelId = databaseEntry.data;
                const channel = client.channels.cache.get(channelId);
                const roleId = db.get(`${channel.guildId}_roleId`);
                const earlyLinkRole = channel.guild.roles.cache.find((role) => role.name === 'EarlyLink Subscribers' || role.id === roleId);
                if (channel) {
                    channel.send({
                        content: earlyLinkRole ? `<@&${earlyLinkRole.id}>` : '',
                        embeds: [notificationEmbed]
                    });
                }
            });
        }
    }
});

client.login(config.token);
