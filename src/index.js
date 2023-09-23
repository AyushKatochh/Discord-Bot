const { Client, IntentsBitField } = require('discord.js');
require('dotenv').config();
const { joinVoiceChannel } = require('@discordjs/voice');
// Import functions from action.js and record.js
const { checkAndJoinVoiceChannel, animate, wait } = require('./action');
const { setupScreenRecording } = require('./record');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildVoiceStates
    ]
});

client.on('ready', () => {
    console.log(`${client.user.tag} is online`);
});

const voiceChannelUserCounts = new Map();

client.on('voiceStateUpdate', (oldState, newState) => {
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    if (oldChannel && oldChannel.id !== newChannel?.id) {
        // User left a channel, update user count
        const oldUserCount = oldChannel.members.size;
        if (voiceChannelUserCounts.has(oldChannel.id)) {
            voiceChannelUserCounts.set(oldChannel.id, oldUserCount);
        }
    }

    if (newChannel) {
        // Use the checkAndJoinVoiceChannel function from action.js
        checkAndJoinVoiceChannel(newChannel);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'screen-record') {
        // Example: Start screen recording
        await setupScreenRecording();
        interaction.reply('Screen recording completed.');
    }

    // Handle other commands and interactions

});

client.login(process.env.TOKEN);
