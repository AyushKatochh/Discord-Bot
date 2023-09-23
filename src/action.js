const { Client, IntentsBitField } = require('discord.js');
const { OpusEncoder } = require('@discordjs/opus');
const { joinVoiceChannel } = require('@discordjs/voice');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildVoiceStates
    ]
});

const voiceChannelUserCounts = new Map();

function checkAndJoinVoiceChannel(channel) {
    if (!channel) {
        console.log('Invalid channel object.');
        return;
    }

    const userCount = channel.members.size;
    if (userCount >= 2 && !voiceChannelUserCounts.has(channel.id)) {
        try {
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator
            });

            voiceChannelUserCounts.set(channel.id, userCount);
            console.log(`Joined the voice channel: ${channel.name}`);

            // Send recording started message to a text channel
            const textChannel = channel.guild.channels.cache.find(channel => channel.type === 'GUILD_TEXT');
            if (textChannel) {
                textChannel.send(`Started recording in ${channel.name}.`);
            }

            // Start recording logic here
            const receiver = connection.receiver;

            const userId = client.user.id;

            const audioStream = receiver.subscribe(userId);

            audioStream.on('data', (data) => {
                // Process and save the audio data
                // Adjust this part based on your recording requirements
                // ...
            });

            audioStream.on('end', () => {
                console.log('Recording ended.');
            });
        } catch (error) {
            console.error(error);
        }
    }
}

const animate = async (page) => {
    await wait(500);
    await page.evaluate(() => { window.scrollBy({ top: 500, left: 0, behavior: 'smooth' }); });
    await wait(500);
    await page.evaluate(() => { window.scrollBy({ top: 1000, left: 0, behavior: 'smooth' }); });
    await wait(1000);
};

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}


module.exports = {
    // Export functions or variables here if needed
    checkAndJoinVoiceChannel,
    animate,
    wait,
};