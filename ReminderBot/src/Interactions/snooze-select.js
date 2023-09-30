const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function handleSnoozeButton(interaction) {
  try {
    if (interaction.customId.startsWith('snooze_')) {
      const snoozeTime = parseInt(interaction.customId.split('_')[1]);
      
      // snooze button logic 
      await interaction.deferUpdate();
      await interaction.followUp(`Your reminder is snoozed for ${snoozeTime} minutes.`);

      setTimeout(async () => {
        const originalMessage = await interaction.channel.messages.fetch(interaction.message.id);

        await interaction.followUp({
          content: `Original Reminder: ${originalMessage.content}`,
        });

        try {
          // Assuming the reminder ID stored in the database
          const reminderId = parseInt(interaction.id); // Convert the ID to an integer

          const updatedReminder = await prisma.reminder.update({
            where: {
              id: reminderId,
            },
            data: {
              updated_at: Date.now(),
            },
          });

          console.log(`Database updated_at field for Reminder ID ${reminderId} is now ${updatedReminder.updated_at}`);
        } catch (error) {
          console.error('Error updating the "updated_at" field in the database:', error);
        }
      }, snoozeTime * 60 * 1000); // Convert minutes to milliseconds
    }
  } catch (error) {
    console.error('Error handling snooze button interaction:', error);
    await interaction.followUp('An error occurred while processing your snooze request.');
  }
}

module.exports = {
  handleSnoozeButton,
};
