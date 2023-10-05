require('dotenv/config');

const {Client, IntentsBitField, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType} = require("discord.js");

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
})

client.on('ready', () => console.log(`${client.user.username} is online `));

client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    const firstButton = new ButtonBuilder()
    .setLabel('First')
    .setStyle
})

client.login(process.env.TOKEN);