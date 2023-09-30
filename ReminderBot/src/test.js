client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId === 'snooze_5') {
        await interaction.deferUpdate();

        setTimeout(async () => {
            const updatedRow = new MessageActionRow().addComponents();
            await interaction.message.edit({
                content: 'Message snoozed for 5 minutes',
                components: [updatedRow]
            })
        }, 300000)
    } else if (interaction.isCommand()) {
        const { commandName, options } = interaction;

        if (commandName === 'setreminder') {
          const title = options.getString('title');
          const description = options.getString('description');
          const closingTimeInput = options.getString('closing_time'); // Input for closing time
      
          // Parse the closing time input and calculate the closing timestamp
          const closingTimeInSeconds = parseClosingTimeInput(closingTimeInput);
      
          if (!isNaN(closingTimeInSeconds) && closingTimeInSeconds > 0) {
            // Calculate the timestamp for the closing time
            const currentTime = Date.now();
            const closingTimestamp = currentTime + closingTimeInSeconds * 1000;
      
            // Create a reminder object
            const reminder = {
              userId: interaction.user.id,
              channelId: interaction.channel.id,
              title,
              description,
              reminderTime: new Date(closingTimestamp), // Set reminder time to closing time
            };
      
            // Schedule a reminder check at the closing time
            scheduleReminderCheck(reminder, interaction);
      
            // Send the initial reminder message
            const closingTimeString = new Date(closingTimestamp).toLocaleTimeString();
            const reminderMessage = `Reminder set. I will remind you at ${closingTimeString}.`;
      
            // Send the reminder message and store it in a variable
            const reminderSentMessage = await interaction.reply(reminderMessage);
      
            // Now, after the reminder time has passed, send the snooze buttons
            setTimeout(async () => {
              // Add snooze options as buttons
              const snoozeRow = new ActionRowBuilder()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId('snooze_5')
                    .setLabel('Snooze 5m')
                    .setStyle(ButtonStyle.Primary),
                 
                );
      
              // Send the snooze buttons as a follow-up message to the reminder message
              await reminderSentMessage.edit({
                content: 'Snooze options:',
                components: [snoozeRow],
              });
            }, closingTimeInSeconds * 1000); // Wait for the reminder time to complete
          } else {
            await interaction.reply('Invalid closing time format. Please use a valid format (e.g., 2:00 PM).');
          }
        }
    }
  }
})