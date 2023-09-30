const { Client, IntentsBitField } = require('discord.js');
const { PrismaClient } = require("@prisma/client");

const client = new Client({
    intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMessages,
      IntentsBitField.Flags.GuildVoiceStates,
      IntentsBitField.Flags.GuildMembers,
    ],
  });

  const prisma = new PrismaClient();

  async function sendReminder(reminder, interaction, client) {
    const user = client.users.cache.get(reminder.userId);
  
    if (user) {
      const currentTime = new Date().toLocaleString();
      let reminderMessage = `**Reminder:**\nTitle: ${reminder.title}\nDescription: ${reminder.description}\nTime: ${currentTime}`;
  
      user.send(reminderMessage);
      interaction.channel.send(`<@${user.id}>, here's your reminder:\n${reminderMessage}`);
  
      try {
        const currentTimeInMilliseconds = Date.now();
        const createdReminder = await prisma.reminder.create({
          data: {
            author: interaction.user.id,
            channel_Id: interaction.channel.id,
            title: reminder.title,
            description: reminder.description,
            reminder_Time: new Date(reminder.reminderTime),
            created_at: currentTimeInMilliseconds,
            updated_at: currentTimeInMilliseconds,
          },
        });
  
        console.log(`Reminder successfully sent and logged in the database with ID: ${createdReminder.id}`);
      } catch (error) {
        console.error('Error saving reminder to the database:', error);
      }
    }
  }
module.exports = {
    sendReminder
}