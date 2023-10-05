const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function handleSnoozeButton(interaction) {
  try {
    if (interaction.customId === 'snooze') {
      const selectedSnoozeValue = interaction.values[0];
      const snoozeTime = parseInt(selectedSnoozeValue);

      // snooze button logic 
      await interaction.deferUpdate();
      await interaction.user.send(`Your reminder is snoozed for ${snoozeTime} seconds.`);

      setTimeout(async () => {
        const originalMessage = await interaction.channel.messages.fetch(interaction.message.id);

        await interaction.user.send({
          content: `Reminder: ${originalMessage.content}`,
        });

        try {

         await prisma.reminder.update({
            where: {
              id: originalMessage,
            },
            data: {
              updated_at: Date.now(),
            },
          });

          console.log(`Database updated_at field for Reminder ID`);
        } catch (error) {
          console.error('Error updating the "updated_at" field in the database:', error);
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
