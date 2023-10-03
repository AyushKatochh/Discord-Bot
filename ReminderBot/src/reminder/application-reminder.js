// reminder-handler.js

async function handleReminder(interaction, delay) {
    const contextMessage = interaction.targetMessage;
  
    // Acknowledge that the reminder is set
    const acknowledgeMessage = await interaction.reply({
      content: `Reminder is set for ${delay / (60 * 60 * 1000)} hours. I will remind you when the time comes.`,
    });
  
    // Schedule the reminder
    setTimeout(async () => {
      try {
  
        // Fetch the context message to get the latest information
        const updatedContextMessage = await interaction.channel.messages.fetch(contextMessage.id);
  
        // Edit the original acknowledgment message with the reminder content
        await acknowledgeMessage.edit(`Reminder:\nTitle: ${updatedContextMessage.content}\nDescription: ${updatedContextMessage.content}\nTime: ${new Date().toLocaleString()}`);
      } catch (error) {
        console.error('Error sending reminder message:', error);
      }
    }, delay);
  }
  
  module.exports = {
    handleReminder,
  };
  