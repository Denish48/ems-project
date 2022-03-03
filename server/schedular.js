const schedule = require('node-schedule');
const moment = require('moment');
const { eventNotificationSchedular, eventCompleteSchedular ,birthdayNotificationSchedular, deleteNotificationSchedular, deleteMessageSchedular} = require('./controller/notification');

schedule.scheduleJob(('* * * * *'), async () => {
    try {
        console.info('schedule started at', moment().toString(), moment.utc().valueOf());
        await eventNotificationSchedular();
        await eventCompleteSchedular();
        await deleteMessageSchedular()
        await deleteNotificationSchedular();
        console.info('schedule finished');
    } catch (error) {
        console.log('error in scheduled job every mintues status notification:', error);
    }
});

schedule.scheduleJob((process.env.DAILY_BIRTHDATE_CRON), async () => {
    try {
        console.info('schedule started at', moment().toString(), moment.utc().valueOf());
        await birthdayNotificationSchedular();
        console.info('schedule finished');
    } catch (error) {
        console.log('error in scheduled job every mintues status notification:', error);
    }
});

/**
 * 6 part cron rule
*    *    *    *    *    *
┬    ┬    ┬    ┬    ┬    ┬
│    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
│    │    │    │    └───── month (1 - 12)
│    │    │    └────────── day of month (1 - 31)
│    │    └─────────────── hour (0 - 23)
│    └──────────────────── minute (0 - 59)
└───────────────────────── second (0 - 59, OPTIONAL)
 */