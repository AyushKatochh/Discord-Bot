require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes, ApplicationCommandOptionType, Application } = require('discord-api-types/v10'); // Import API v10 types

const commands = [
  {
    name: 'setreminder',
    description: 'Set a reminder',
    type: 1, // 1 for SUB_COMMAND, 2 for SUB_COMMAND_GROUP (slash command subcommand)
    options: [
      {
        name: 'title',
        description: 'The title of the reminder',
        type: 3, // String type
        required: true,
      },
      {
        name: 'description',
        description: 'The description of the reminder',
        type: 3, // String type
        required: true,
      },
      {
        name: 'closing_time',
        description: 'The closing time for the reminder',
        type: 3, // String type
        required: false, // Closing time is optional
      },
    ],
  },
  {
    name: 'reminder',
    description: 'modal to set up reminder'
  },
  {
    name: "Remind-in-1-hour",
    type: 3
  },
  {
    name: "Remind-in-2-hours",
    type: 3
  }
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');

    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {
      body: commands,
    });

    console.log('Slash commands were registered successfully');
  } catch (error) {
    console.log(`There was an error ${error}`);
  }
})();
