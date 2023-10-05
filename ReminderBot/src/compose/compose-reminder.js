// compose-handler.js
const { parseClosingTimeInput} = require("../time-parser/time-parser");
const {sendReminder} = require("../reminder/send-reminder");

async function handleComposeInput(interaction) {
    try {
      const text = interaction.options.getString('text');
      const timeInput = interaction.options.getString('time');
  
      const closingTimeInSeconds = parseClosingTimeInput(timeInput);
  
      if (!isNaN(closingTimeInSeconds) && closingTimeInSeconds > 0) {
        const currentTime = Date.now();
        const closingTimestamp = currentTime + closingTimeInSeconds * 1000;
  
        const reminder = {
          userId: interaction.user.id,
          channelId: interaction.channel.id,
          title: 'Compose Reminder', // You can customize the title as needed
          description: text,
          reminderTime: new Date(closingTimestamp),
        };
  
        // Reply instantly that the reminder is set
        await interaction.reply(`Reminder set. I will remind you on ${reminder.reminderTime}.`);
  
        // Schedule the reminder check
        setTimeout(async () => {
          try {
            // Delete the reminder text in the channel
            await interaction.deleteReply();
  
            // Send the reminder message to the user's DM
            await sendReminder(reminder, interaction, interaction.client);
          } catch (deleteError) {
            console.error('Error deleting interaction reply:', deleteError);
          }
        }, closingTimeInSeconds * 1000);
      } else {
        await interaction.reply('Invalid time format. Please use a valid format (e.g., 2:00 PM).');
      }
    } catch (error) {
      console.error('Error handling compose reminder:', error);
      await interaction.reply('An error occurred while processing your request.');
    }
  }
  

module.exports = {
  handleComposeInput,
};
