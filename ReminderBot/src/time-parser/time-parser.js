// Import necessary libraries
const chrono = require('chrono-node');
const { addDays, startOfDay, startOfWeek, addWeeks } = require('date-fns');
const { sendReminder } = require("../reminder/send-reminder");

// Function to parse the closing time input
function parseClosingTimeInput(input) {
  // If input is empty, return 0 (no time difference)
  if (!input) {
    return 0;
  }

  // Try using chrono-node to parse the input
  const parsedTime = chrono.parseDate(input);

  // If chrono successfully parses the input, calculate time difference
  if (parsedTime) {
    const currentTime = Date.now();
    const timeDifferenceInSeconds = Math.max(0, parsedTime - currentTime) / 1000;
    return timeDifferenceInSeconds;
  }

  // Define regular expressions for various date and time formats
  const timeRegex = /(\d{1,2}):(\d{2})\s?(am|pm)/i;
  const dayRegex = /^(sun|mon|t(ues|hurs)|(T(ues|hurs))|Fri|fri)(day|\.)?$|wed(\.|nesday)?$|Wed(\.|nesday)?$|Sat(\.|urday)?$|sat(\.|urday)?$|t((ue?)|(hu?r?))\.?$|T((ue?)|(hu?r?))\.?$/;
  const nextWeekRegex = /^next\s*week/i;
  const tomorrowRegex = /^tomorrow/i;
  const specificDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/; // Date format: MM/DD/YYYY

  // Try matching the input with different regular expressions
  const timeMatch = input.match(timeRegex);
  const dayMatch = input.match(dayRegex);
  const nextWeekMatch = input.match(nextWeekRegex);
  const tomorrowMatch = input.match(tomorrowRegex);
  const specificDateMatch = input.match(specificDateRegex);

  if (timeMatch) {
    // Extract hours, minutes, and period (am/pm)
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toLowerCase();

    // Adjust hours for PM
    if (period === 'pm' && hours < 12) {
      hours += 12;
    }

    // Create a new Date object for today with the specified time
    const today = startOfDay(new Date());
    const closingTime = new Date(today);
    closingTime.setHours(hours, minutes, 0, 0);

    const timeDifferenceInSeconds = Math.max(0, closingTime - Date.now()) / 1000;
    return timeDifferenceInSeconds;
  } else if (dayMatch) {
    // Determine the day of the week based on the input
    const dayOfWeek = getDayOfWeek(dayMatch[0].toLowerCase());

    if (dayOfWeek !== -1) {
      // Calculate time until next occurrence of the specified day
      const nextDay = startOfWeek(addWeeks(new Date(), 1));
      const targetDay = addDays(nextDay, dayOfWeek);
      const timeDifferenceInSeconds = Math.max(0, targetDay - Date.now()) / 1000;
      return timeDifferenceInSeconds;
    }
  } else if (nextWeekMatch) {
    // Calculate time until the next week
    const nextWeek = addWeeks(new Date(), 1);
    const timeDifferenceInSeconds = Math.max(0, nextWeek - Date.now()) / 1000;
    return timeDifferenceInSeconds;
  } else if (tomorrowMatch) {
    // Calculate time until tomorrow
    const tomorrow = addDays(new Date(), 1);
    const timeDifferenceInSeconds = Math.max(0, tomorrow - Date.now()) / 1000;
    return timeDifferenceInSeconds;
  } else if (specificDateMatch) {
    const month = parseInt(specificDateMatch[1]);
    const day = parseInt(specificDateMatch[2]);
    const year = parseInt(specificDateMatch[3]);

    // Set time to 11:00 AM
    const specificDate = new Date(year, month - 1, day, 11, 0, 0);

    const reminderTime = new Date(specificDate);

    const timeDifferenceInSeconds = Math.max(0, reminderTime - Date.now()) / 1000;

    return timeDifferenceInSeconds;
}

  // If no match, return 0 (no time difference)
  return 0;
}

// Function to get the day of the week index
function getDayOfWeek(day) {
  const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const index = daysOfWeek.indexOf(day);
  return index;
}

// Function to schedule a reminder check
async function scheduleReminderCheck(reminder, interaction, client) {
  const currentTime = Date.now();
  const timeDifference = reminder.reminderTime - currentTime;

  if (timeDifference <= 0) {
    sendReminder(reminder, interaction, client);
  } else {
    setTimeout(() => {
      sendReminder(reminder, interaction, client);
    }, timeDifference);
  }
}

// Export functions for external use
module.exports = {
  parseClosingTimeInput,
  scheduleReminderCheck,
};
