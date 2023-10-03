const chrono = require('chrono-node');
const { parse, addDays, startOfDay, startOfWeek, addWeeks } = require('date-fns');
const { sendReminder } = require("../reminder/send-reminder");

function parseClosingTimeInput(input) {
  if (!input) {
    return 0;
  }

  // Try using chrono-node to parse the input
  const parsedTime = chrono.parseDate(input);

  if (parsedTime) {
    const currentTime = Date.now();
    const timeDifferenceInSeconds = Math.max(0, parsedTime - currentTime) / 1000;
    return timeDifferenceInSeconds;
  }

  // Regular expressions for various date and time formats
  const timeRegex = /(\d{1,2}):(\d{2})\s?(am|pm)/i;
  const dayRegex = /^(sun|Sun|mon|Mon|t(ues|hurs)|(T(ues|hurs))|Fri|fri)(day|\.)?$|wed(\.|nesday)?$|Wed(\.|nesday)?$|Sat(\.|urday)?$|sat(\.|urday)?$|t((ue?)|(hu?r?))\.?$|T((ue?)|(hu?r?))\.?$/;

  const nextWeekRegex = /^next\s*week/i;
  const tomorrowRegex = /^tomorrow/i;

  // Try matching the input with different regular expressions
  const timeMatch = input.match(timeRegex);
  const dayMatch = input.match(dayRegex);
  const nextWeekMatch = input.match(nextWeekRegex);
  const tomorrowMatch = input.match(tomorrowRegex);

  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3]?.toLowerCase(); // Use optional chaining to handle potential undefined

    if (period === 'pm' && hours !== 12) {
      // return nothing
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }

    const currentTime = new Date();
    const closingTime = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), hours, minutes, 0);

    const timeDifferenceInSeconds = Math.max(0, closingTime - currentTime) / 1000;

    return timeDifferenceInSeconds;
  } else if (dayMatch) {
    // Handle day formats (Monday, Tuesday, etc.)
    const dayIndex = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(dayMatch[1]?.toLowerCase()); // Use optional chaining
    const targetDay = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), dayIndex);
    const timeDifferenceInSeconds = Math.max(0, targetDay - Date.now()) / 1000;

    return timeDifferenceInSeconds;
  } else if (nextWeekMatch) {
    // Handle "Next Week" format
    const nextWeekStart = startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
    const timeDifferenceInSeconds = Math.max(0, nextWeekStart - Date.now()) / 1000;

    return timeDifferenceInSeconds;
  } else if (tomorrowMatch) {
    // Handle "Tomorrow" format
    const tomorrowStart = startOfDay(addDays(new Date(), 1));
    const timeDifferenceInSeconds = Math.max(0, tomorrowStart - Date.now()) / 1000;

    return timeDifferenceInSeconds;
  }

  return 0;
}

async function scheduleReminderCheck(reminder, interaction, client) {
  const currentTime = Date.now();
  const timeDifference = reminder.reminderTime - currentTime;

  if (timeDifference <= 0) {
    sendReminder(reminder, interaction, client); // Pass the client instance to sendReminder
  } else {
    setTimeout(() => {
      sendReminder(reminder, interaction, client); // Pass the client instance to sendReminder
    }, timeDifference);
  }
}

module.exports = {
  parseClosingTimeInput,
  scheduleReminderCheck,
};
