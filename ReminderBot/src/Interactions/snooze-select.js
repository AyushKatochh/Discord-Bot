const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function handleSnoozeButton(interaction, reminder) {
  try {
    if (interaction.customId === 'snooze') {
      const selectedSnoozeValue = interaction.values[0];
      const snoozeTime = parseInt(selectedSnoozeValue);

      await interaction.deferUpdate();
      await interaction.user.send(`Your reminder is snoozed for ${snoozeTime} minutes.`);

      setTimeout(async () => {
        try {
          const reminderMessage = `**Reminder:**\nTitle: ${reminder.title}\nDescription: ${reminder.description}\nTime: ${new Date(reminder.reminderTime).toLocaleString()}`;
          await interaction.user.send({ content: reminderMessage });
        } catch (error) {
          console.error('Error handling snooze button interaction:', error);
        }
      }, snoozeTime * 60 * 1000); // Convert minutes to milliseconds
    }
  } catch (error) {
    console.error('Error handling snooze button interaction:', error);
    await interaction.user.send('An error occurred while processing your snooze request.');
  }
}

module.exports = {
  handleSnoozeButton,
};
