require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes, ApplicationCommandOptionType, Application } = require('discord-api-types/v10'); // Import API v10 types
const { Client, GatewayIntentBits } = require('discord.js');

const commands = [
 
  {
    name: 'record',
    description: "Record voice of person"
  },
  {
    name: 'stop-recording',
    description: "Stop the recording"
  }
]

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
