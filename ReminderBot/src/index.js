require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const { handleReminderCommand, handleReminderSubmission } = require("./reminder/reminder-handler");
const { handleSnoozeButton } = require("./Interactions/snooze-select");
const {handleReminder} = require("./reminder/application-reminder");

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

  if (interaction.isMessageContextMenuCommand()) {
    if (interaction.commandName === "Remind-in-1-hour") {
       await handleReminder(interaction, 1* 60 * 1000)
    }
    
    if (interaction.commandName === "Remind-in-2-hours") {
      await handleReminder(interaction, 2* 60* 60 * 1000)
    }
  }

  if (interaction.isModalSubmit()) {
    await handleReminderSubmission(client, interaction);
  }

  if (interaction.isStringSelectMenu()) {
    await handleSnoozeButton(interaction, reminder);
  }
});

client.login(process.env.TOKEN);
