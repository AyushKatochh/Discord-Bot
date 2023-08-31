const { Client, IntentsBitField } = require('discord.js');
const ffmpeg = require('fluent-ffmpeg');
const concat = require('concat-stream');
const { Writable } = require('stream');
const fs = require('fs');
const path = require('path');
const { joinVoiceChannel } = require('@discordjs/voice');
require('dotenv').config();
const { createWriteStream, existsSync } = require("fs");
const { OpusEncoder } = require('@discordjs/opus'); // Import OpusEncoder
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildVoiceStates
    ]
});

let currentConnection = null;
let isRecording = false;
let outputStream = null;
let bufferedData = Buffer.alloc(0);

const createNewChunk = () => {
    const recordingsDir = './recordings';
    if (!existsSync(recordingsDir)) {
        require('fs').mkdirSync(recordingsDir); // Create the 'recordings' directory if it doesn't exist
    }
    const pathToFile = `${recordingsDir}/${Date.now()}.pcm`;
    return createWriteStream(pathToFile);
};


const encoder = new OpusEncoder(48000, 2); // Create the OpusEncoder instance
const frameSize = 20;

// Define a Map to keep track of voice channel user counts
const voiceChannelUserCounts = new Map();

// Function to check if the bot should join the voice channel
// Function to check if the bot should join the voice channel
function checkAndJoinVoiceChannel(channel) {
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

client.on('ready', () => {
    console.log(`${client.user.tag} is online`);
});


client.on('ready', () => {
    console.log(`${client.user.tag} is online`);
});

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
        checkAndJoinVoiceChannel(newChannel);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'record') {
        if (!currentConnection) {
            interaction.reply("The bot is not connected to a voice channel.");
            return;
        }

        if (isRecording) {
            interaction.reply("Already recording.");
            return;
        }

        isRecording = true;

        const receiver = currentConnection.receiver;
        const userId = interaction.user.id;

        outputStream = createNewChunk();

        const audioStream = receiver.subscribe(userId);

      // Audio data handling
    audioStream.on('data', (data) => {
        bufferedData = Buffer.concat([bufferedData, data]); // Append new data to the buffer

        // Check if the buffer size is a multiple of the frame size in bytes
        const frameSizeBytes = (encoder.sampleRate * frameSize * encoder.channels) / 1000;
        if (bufferedData.length >= frameSizeBytes) {
            // Calculate the number of complete frames in the buffer
            const numFrames = Math.floor(bufferedData.length / frameSizeBytes);

            for (let i = 0; i < numFrames; i++) {
                // Extract a frame-sized chunk of data
                const frame = bufferedData.slice(i * frameSizeBytes, (i + 1) * frameSizeBytes);

                // Encode the frame using the OpusEncoder
                const encodedChunk = encoder.encode(frame);

                // Write the encoded data to the output stream
                outputStream.write(encodedChunk);
            }

            // Remove the processed frames from the buffer
            bufferedData = bufferedData.slice(numFrames * frameSizeBytes);
        }
    });

    audioStream.on('end', () => {
        outputStream.end();
        isRecording = false;
    });

        interaction.reply("Started recording.");
    }

    if (commandName === 'stop-recording') {
        // ... (previous stop-recording code)

        if (outputStream) {
            outputStream.end();
            outputStream = null;
    
            interaction.reply("Recording stopped. Combining and converting to .mp3 and .wav...");
    
            const recordingsDir = './recordings';
            const outputMP3Path = './output.mp3'; // Specify the output path for the combined .mp3 file
            const outputWAVPath = './output.wav'; // Specify the output path for the combined .wav file
    
            // Read and combine all recorded .pcm files
            const combinedStreamMP3 = fs.createWriteStream(outputMP3Path);
            const combinedStreamWAV = fs.createWriteStream(outputWAVPath);
            const pcmFiles = fs.readdirSync(recordingsDir)
                .filter(filename => filename.endsWith('.pcm'))
                .map(filename => path.join(recordingsDir, filename));
    
            const combinedStream = concat(data => {
                combinedStreamMP3.write(data);
                combinedStreamWAV.write(data);
    
                console.log('Combining finished. Starting conversion to .mp3 and .wav...');
    
                // Convert the combined .pcm file to .mp3
                ffmpeg()
                    .input(outputMP3Path)
                    .inputFormat('s16le')
                    .audioCodec('libmp3lame')
                    .audioBitrate(192)
                    .on('end', () => {
                        console.log('Conversion to .mp3 finished');
                    })
                    .on('error', (err) => {
                        console.error('Error converting to .mp3:', err);
                    })
                    .save(outputMP3Path);
    
                // Convert the combined .pcm file to .wav
                ffmpeg()
                    .input(outputWAVPath)
                    .inputFormat('s16le')
                    .audioCodec('pcm_s16le')
                    .audioChannels(2)
                    .on('end', () => {
                        console.log('Conversion to .wav finished');
                    })
                    .on('error', (err) => {
                        console.error('Error converting to .wav:', err);
                    })
                    .save(outputWAVPath);
            });
    
            pcmFiles.forEach(pcmFile => {
                const pcmStream = fs.createReadStream(pcmFile);
                pcmStream.pipe(combinedStream, { end: false });
            });
    
            isRecording = false;
        } else {
            interaction.reply("No recording in progress.");
        }
        
    }

    

    // ... (other commands)
});

client.login(process.env.TOKEN);
