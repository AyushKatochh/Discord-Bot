const { Client, IntentsBitField } = require('discord.js');
const ffmpeg = require('fluent-ffmpeg');
const concat = require('concat-stream');
const AWS = require('aws-sdk');
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { PrismaClient } = require('@prisma/client');

const fs = require('fs');
const path = require('path');
const { joinVoiceChannel } = require('@discordjs/voice');

require('dotenv').config();

const prisma = new PrismaClient();

const { createWriteStream, existsSync } = require("fs");
const { OpusEncoder } = require('@discordjs/opus'); // Import OpusEncoder

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildVoiceStates
    ]
});

const s3 = new AWS.S3({
    accessKeyId: process.env.KEY,
    secretAccessKey: process.env.SECRET_KEY,
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

outputStream = createNewChunk();

const encoder = new OpusEncoder(48000, 2); // Create the OpusEncoder instance
const frameSize = 20;

// Define a Map to keep track of voice channel user counts
const voiceChannelUserCounts = new Map();


// Function to check if the bot should join the voice channel or leave it
async function checkAndJoinVoiceChannel(channel) {
    // Filter out the bot from the user count
    const userCount = channel.members.filter(member => !member.user.bot).size;

    if (userCount >= 2 && !voiceChannelUserCounts.has(channel.id)) {
        // User count increased and bot is not in the channel, join and start recording
        try {
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });

            voiceChannelUserCounts.set(channel.id, userCount);
            console.log(`Joined the voice channel: ${channel.name}`);

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
                // After recording ends and file uploads, disconnect from the voice channel
                stopRecording();
                voiceChannelUserCounts.delete(channel.id);
                console.log(`Left the voice channel: ${channel.name}`);
            });

            // Start recording immediately after joining the channel
            startRecording(connection);
        } catch (error) {
            console.error(error);
        }
    } else if (userCount < 2 && voiceChannelUserCounts.has(channel.id)) {
        // User count decreased, stop recording and leave the channel
        stopRecording();
        voiceChannelUserCounts.delete(channel.id);
        console.log(`Left the voice channel: ${channel.name}`);
    }
}


// Function to upload a file to S3
async function uploadFileToS3(filePath, bucketName, key) {
    const fileContent = fs.readFileSync(filePath);

    const params = {
        Bucket: bucketName,
        Key: key,
        Body: fileContent,
        ContentType: 'audio/mpeg' // Set the content type appropriately
    };

    console.log('Before S3 upload');
    try {
        const data = await s3.upload(params).promise();
        console.log(`Uploaded to S3 successfully: ${data.Location}`);

        // Insert the S3 file path into the database using Prisma
        try {
            const createdAudio = await prisma.recordedAudio.create({
                data: {
                    filePath: data.Location
                }
            });
    
            // Log the created record to the console
            console.log('Audio file path successfully saved in Neon:', createdAudio);
        } catch (error) {
            console.error('Error creating audio record in Neon:', error);
        }

    } catch (error) {
        console.error('Error uploading to S3:', error);
    }
    console.log('After S3 upload');
}

// Function to stop recording
async function stopRecording(interaction) {
    if (!isRecording) {
        console.log('Not currently recording.');
        return;
    }

    if (outputStream) {
        outputStream.end();
        outputStream = null;

        console.log("Recording stopped. Combining and converting to .mp3 and .wav...");
        console.log("Recording Stopped");

        const outputMP3Path = path.join( 'output.mp3'); // Specify the output path for the combined .mp3 file
        const outputWAVPath = path.join( 'output.wav'); // Specify the output path for the combined .wav file

        // Rest of the code remains the same

        try {
            // Upload the combined audio file to S3
            await Promise.all([
                uploadFileToS3(outputMP3Path, 'YOUR_BUCKET_NAME', 'output.mp3'),
                uploadFileToS3(outputWAVPath, 'YOUR_BUCKET_NAME', 'output.wav')
            ]);
        } catch (error) {
            console.error('Error uploading to S3:', error);
        }

        if (interaction) {
            interaction.reply("Recording stopped. Combining and converting to .mp3 and .wav...");
        }
    } else {
        console.log("No recording in progress.");
        if (interaction) {
            interaction.reply("No recording in progress.");
        }
    }
}

// Function to start recording
function startRecording(connection) {
    if (isRecording) {
        console.log('Already recording.');
        return;
    }

    isRecording = true;

    const receiver = connection.receiver;
    const userId = client.user.id;

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
        stopRecording();
    });

    console.log('Started recording.');
}

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
        checkAndJoinVoiceChannel(oldChannel)
    }

    if (newChannel) {
        checkAndJoinVoiceChannel(newChannel);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    const { commandName } = interaction;

    if (commandName === 'showmodal') {
        const modal = new ModalBuilder()
            .setCustomId('myModal')
            .setTitle('Set meeting');

        // Add components to modal

        // Create the text input components
        const favoriteColorInput = new TextInputBuilder()
            .setCustomId('favoriteColorInput')
            // The label is the prompt the user sees for this input
            .setLabel("What's your favorite color?")
            // Short means only a single line of text
            .setStyle(TextInputStyle.Short);

        const hobbiesInput = new TextInputBuilder()
            .setCustomId('hobbiesInput')
            .setLabel("What's some of your favorite hobbies?")
            // Paragraph means multiple lines of text.
            .setStyle(TextInputStyle.Paragraph);

        // An action row only holds one text input,
        // so you need one action row per text input.
        const firstActionRow = new ActionRowBuilder().addComponents(favoriteColorInput);
        const secondActionRow = new ActionRowBuilder().addComponents(hobbiesInput);

        // Add inputs to the modal
        modal.addComponents(firstActionRow, secondActionRow);

        // Show the modal to the user
        await interaction.showModal(modal);
    }

    if (commandName === 'stop-recording') {
        stopRecording(interaction);
    }

    // ... (other commands)
});

client.login(process.env.TOKEN);

module.exports = {
    client
}
