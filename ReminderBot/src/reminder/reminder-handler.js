const { PrismaClient } = require("@prisma/client");
const { ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle,ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { parseClosingTimeInput, scheduleReminderCheck } = require("../time-parser/time-parser");

const prisma = new PrismaClient();

async function handleReminderCommand(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('reminderModal')
    .setTitle('Set a Reminder');

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

  const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
  const secondActionRow = new ActionRowBuilder().addComponents(descriptionInput);
  const thirdActionRow = new ActionRowBuilder().addComponents(timeInput);

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

        // Send the initial reminder message to the channel
       await interaction.reply({ content: `Reminder set. I will remind you on ${reminder.reminderTime}`,
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('resetTimer')
                .setLabel('Reset Timer')
                .setStyle(ButtonStyle.Primary),
             
            ),
          ],
        });

        // Schedule the reminder check as before
        await scheduleReminderCheck(reminder, interaction, client);

        // Automatically delete the reminder message in the channel after the closing time
        setTimeout(async () => {
          await interaction.deleteReply();

          // Send the reminder message with snooze options to the user's DM
          const dmChannel = await interaction.user.createDM();
          const snoozeRow = new StringSelectMenuBuilder()
            .setCustomId("snooze")
            .setPlaceholder("Snooze according to your time")
            .addOptions(
              new StringSelectMenuOptionBuilder()
                .setLabel('Snooze 1m')
                .setValue('60'), // 1 minute in seconds
              new StringSelectMenuOptionBuilder()
                .setLabel('Snooze 15m')
                .setValue('900'), // 15 minutes in seconds
              new StringSelectMenuOptionBuilder()
                .setLabel('Snooze 25m')
                .setValue('1500'), // 25 minutes in seconds
              new StringSelectMenuOptionBuilder()
                .setLabel('Snooze 35m')
                .setValue('2100'), // 35 minutes in seconds
              new StringSelectMenuOptionBuilder()
                .setLabel('Snooze 45m')
                .setValue('2700'), // 45 minutes in seconds
            );

          const row = new ActionRowBuilder().addComponents(snoozeRow);

          await dmChannel.send({
            content: 'Snooze options: ',
            components: [row],
          });

          // Add another setTimeout for the reminder message after snooze time
          let snoozeTimeInSeconds;

          const filter = (interaction) => {
            return interaction.customId === 'snooze' && interaction.isStringSelectMenu();
          };

          const collector = dmChannel.createMessageComponentCollector({ filter, time: 60000 });

          collector.on('collect', (interaction) => {
            // Assuming the values are in seconds
            snoozeTimeInSeconds = parseInt(interaction.values[0]);
            collector.stop();
          });

          collector.on('end', (collected, reason) => {
            if (reason === 'time') {
            }

            // Continue with the reminder message after snooze time
            setTimeout(async () => {
              await dmChannel.send(`Reminder:\n Title: ${title} \nDescription: ${description} \nTime: ${new Date(closingTimestamp).toLocaleTimeString()}.`);
            }, snoozeTimeInSeconds * 1000);
          });

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
