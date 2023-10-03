const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


async function sendReminder(reminder, interaction, client) {
  const user = client.users.cache.get(reminder.userId);

  if (user) {
    const currentTimeInMilliseconds = Date.now();

    // Convert Date.now() to Unix timestamp (seconds since epoch)
    const unixTimestamp = Math.floor(currentTimeInMilliseconds / 1000);

    const reminderMessage = `**Reminder:**\nTitle: ${reminder.title}\nDescription: ${reminder.description}\nTime: ${new Date(reminder.reminderTime).toLocaleString()}`;

    const sentMessage = await user.send(reminderMessage);

    try {
      const createdReminder = await prisma.reminder.create({
        data: {
          author: interaction.user.id,
          channel_Id: interaction.channel.id,
          title: reminder.title,
          description: reminder.description,
          reminder_Time: new Date(reminder.reminderTime),
          created_at: unixTimestamp,
          updated_at: unixTimestamp,
          message_id: sentMessage.id, // Store the message ID
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
};
