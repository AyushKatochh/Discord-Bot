require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const { handleReminderCommand, handleReminderSubmission } = require("./reminder/reminder-handler");
const { handleSnoozeButton } = require("./Interactions/snooze-select");

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.GuildMembers,
  ],
});


client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    const { commandName } = interaction;

    if (commandName === 'reminder') {
      await handleReminderCommand(interaction);
    }
  }

  if (interaction.isModalSubmit()) {
    await handleReminderSubmission(client, interaction);
  }

  if (interaction.isButton()) {
    await handleSnoozeButton(interaction);
  }
});

client.login(process.env.TOKEN);
