const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { parseClosingTimeInput, scheduleReminderCheck } = require("../time-parser/time-parser");

async function handleReminderCommand(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('reminderModal')
    .setTitle('Set a Reminder')

  const titleInput = new TextInputBuilder()
    .setCustomId('titleInput')
    .setLabel('Title')
    .setStyle(TextInputStyle.Short);

  const descriptionInput = new TextInputBuilder()
    .setCustomId('descriptionInput')
    .setLabel('Description')
    .setStyle(TextInputStyle.Paragraph);

  const timeInput = new TextInputBuilder()
    .setCustomId('timeInput')
    .setLabel('Time (e.g., 2:00 PM)')
    .setStyle(TextInputStyle.Short);

  const firstActionRow = new ActionRowBuilder().addComponents(titleInput)
  const secondActionRow = new ActionRowBuilder().addComponents(descriptionInput);
  const thirdActionRow = new ActionRowBuilder().addComponents(timeInput)

  modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

  await interaction.showModal(modal);
}

async function handleReminderSubmission(client, interaction) {
  if (interaction.customId === 'reminderModal') {
    const title = interaction.fields.getTextInputValue('titleInput');
    const description = interaction.fields.getTextInputValue('descriptionInput');
    const timeInput = interaction.fields.getTextInputValue('timeInput');

    try {
      const closingTimeInSeconds = parseClosingTimeInput(timeInput);

      if (!isNaN(closingTimeInSeconds) && closingTimeInSeconds > 0) {
        const currentTime = Date.now();
        const closingTimestamp = currentTime + closingTimeInSeconds * 1000;

        const reminder = {
          userId: interaction.user.id,
          channelId: interaction.channel.id,
          title,
          description,
          reminderTime: new Date(closingTimestamp),
        };

        await scheduleReminderCheck(reminder, interaction, client);

        const closingTimeString = new Date(closingTimestamp).toLocaleTimeString();
        const reminderMessage = `Reminder set. I will remind you at ${closingTimeString}.`;

        const reminderSentMessage = await interaction.reply(reminderMessage);

        setTimeout(async () => {

          const snoozeRow = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('snooze_5')
                .setLabel('Snooze 5m')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId('snooze_15')
                .setLabel('Snooze 15m')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId('snooze_25')
                .setLabel('Snooze 25m')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId('snooze_35')
                .setLabel('Snooze 35m')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId('snooze_45')
                .setLabel('Snooze 45m')
                .setStyle(ButtonStyle.Primary),
            );
        
          await reminderSentMessage.edit({
            content: 'Snooze options:',
            components: [snoozeRow],
          });
        
          try {
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
        }, closingTimeInSeconds * 1000);
      } else {
        await interaction.reply('Invalid time format. Please use a valid format (e.g., 2:00 PM).');
      }
    } catch (error) {
      console.error('Error handling modal submission:', error);
      await interaction.reply('An error occurred while processing your request.');
    }
  }
}

module.exports = {
  handleReminderCommand,
  handleReminderSubmission,
};
