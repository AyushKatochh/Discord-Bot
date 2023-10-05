const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cancelScheduledReminder(userId) {
  try {
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        userId: userId, // Ensure userId is used correctly
        reminderTime: {
          gt: new Date(),
        },
      },
    });

    if (existingReminder) {
      // Delete the existing reminder from the database
      await prisma.reminder.delete({
        where: {
          id: existingReminder.id,
        },
      });

      console.log(`Cancelled existing reminder for user ${userId}`);
    }
  } catch (error) {
    console.error('Error cancelling scheduled reminder:', error);
  }
}

module.exports = {
  cancelScheduledReminder,
};
