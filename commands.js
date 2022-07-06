const config = require('./config.json');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
const { ApplicationCommandOptionType, ChannelType } = require('discord-api-types/v10');

const commands = [
    {
        name: 'notifications-chan',
        description: 'Choose the notification channel',
        options: [
            {
                name: "channel",
                description: "The channel to send notifications to",
                type: ApplicationCommandOptionType.Channel,
                channel_types: [ChannelType.GuildText],
                required: true
            }
        ]
    },
    {
        name: 'notifications-role',
        description: 'Choose the notification role',
        options: [
            {
                name: "role",
                description: "The role to send notifications to",
                type: ApplicationCommandOptionType.Role,
                required: true
            }
        ]
    },
    {
        name: 'stats',
        description: 'Get bot\'s statistics'
    }
];

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();