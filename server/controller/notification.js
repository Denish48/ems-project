const _ = require('lodash');
const moment = require('moment');
const Joi = require('joi');
const mongoose = require('mongoose');
const DeviceInfo = mongoose.model('DeviceInfo');
const EventUser = mongoose.model("event_user");
const Notification = mongoose.model("notifications");
const BulkMessages = mongoose.model("bulk_messages");
const Messages = mongoose.model("messages");
const Users = mongoose.model('users');
const Events = mongoose.model("events");
const PostCardTempletes = mongoose.model('postcard_templetes');
const EventSession = mongoose.model('event_sessions')

const eventController = require('./events');
const notificationService = require('../services/notificationService');
const configs = require("../configs");

exports.sendNotification = async (req, res, next) => {
  try {
    let usersToSendNotification, collapse_key, title, details;
    usersToSendNotification = [];
    collapse_key = 'event_detail'
    title = `New Event added in System`;
    details = {
      id: 'event_id',
      type: 'new_event'
    };
    await notificationService.sendNotification(usersToSendNotification,
      {
        notification: {
          title
        },
        data: {
          click_action: configs.click_action,
          collapse_key,
          details
        }
      }
    );
    return res.json({
      status: configs.success_status,
      message: 'Notification send successfully'
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: configs.error_status,
      message: configs.errMessage,
      error: error ? error : "",
    });
  }
}

exports.updateDeviceToken = async (req, res, next) => {
  try {
    const schema = Joi.object({
      org_id: Joi.string(),
      user_id: Joi.string(),
      device_type: Joi.string(),
      device_token: Joi.string()
    });
    const validationResult = await schema.validateAsync(req.body);
    const deviceTokenInfo = await DeviceInfo.findOneAndUpdate({ user_id: validationResult.user_id }, {
      $set: {
        device_type: validationResult.device_type,
        device_token: validationResult.device_token
      }
    }).exec()
    if (deviceTokenInfo) {
      return res.json({
        status: configs.error_status, message: "Token is updated successfully"
      });
    }
    const newDevice = new DeviceInfo({
      org_id: validationResult.org_id,
      user_id: validationResult.user_id,
      device_type: validationResult.device_type,
      device_token: validationResult.device_token
    });
    const data = await newDevice.save();
    if (data) {
      return res.json({
        status: configs.success_status,
        message: "Token is updated successfully"
      });
    }
  } catch (error) {
    console.log(error)
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }

}

exports.customNotification = async (req, res, next) => {
  try {

    const schema = Joi.object({
      org_id: Joi.string(),
      event_id: Joi.array().items(Joi.string()).required(),
      department_id: Joi.array().required(),
      user_id: Joi.string(),
      title: Joi.string().required(),
      message: Joi.string().required()
    })
    const validationResult = await schema.validateAsync(req.body);
    const queryEventUser = {};
    if (validationResult.event_id) {
      queryEventUser.event_id = { $in: validationResult.event_id };
    }
    const eventUserData = await EventUser.find(queryEventUser)
      .populate("event_id", "_id event_name")
      .populate("user_id", "_id department_id")
      .select('event_id user_id')
      .exec();

    if (!eventUserData || eventUserData.length === 0) {
      return res.json({ status: configs.error_status, message: 'No Event found', });
    }

    const queryUser = {};
    if (validationResult.department_id) {
      queryUser.department_id = { $in: validationResult.department_id };
    }

    const departmentUserData = await Users.find(queryUser)
      .populate('department_id', 'department_name')
      .select({ _id: 1, department_id: 1 })
      .exec();

    if (!departmentUserData || departmentUserData.length === 0) {
      return res.json({ status: configs.error_status, message: 'No Deparment found', });
    }

    let collapse_key = ''
    let title = `${validationResult.title}`;
    let body = `${validationResult.message}`
    let details = {
      screen: 'event',
      id: eventUserData?.length > 0 && eventUserData[0].event_id?._id ? eventUserData[0].event_id?._id : '',
    };
    let custom_field = {
      notfication: {
        title,
        body,
      },
      data: {
        click_action: configs.click_action,
        collapse_key,
        ...details,
      }
    }

    const newBulkMesaages = new BulkMessages({
      org_id: validationResult.org_id,
      createdBy: validationResult.user_id,
      event_id: eventUserData[0].event_id,
      department_id: validationResult.department_id,
      custom_field
    });
    const bulkMesaageData = await newBulkMesaages.save();

    let usersToSendNotification = await Promise.all(departmentUserData.map(async (item) => {
      const newCustomNotification = new Notification({
        org_id: validationResult.org_id,
        sender_user_id: validationResult.user_id,
        receiver_user_id: item._id,
        event_id: eventUserData[0].event_id,
        department_id: item.department_id,
        bulk_message_id: bulkMesaageData._id,
        custom_field: {
          notfication: {
            title,
            body,
          },
          data: {
            click_action: configs.click_action,
            collapse_key,
            ...details,
          }
        }
      });
      await newCustomNotification.save();
      return item._id;
    }));
    await notificationService.sendNotification(usersToSendNotification,
      {
        notification: {
          title,
          body
        },
        data: {
          click_action: configs.click_action,
          collapse_key,
          ...details,
        }
      }
    );
    return res.json({
      status: configs.success_status,
      message: 'Notification Send successfully'
    });
  } catch (error) {
    console.log(error)
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
}
exports.notificationList = async (req, res, next) => {
  try {
    const platform_enum = ["web-admin", "app-user"];
    const schema = Joi.object({
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(5000),
      search: Joi.string(),
      department_id: Joi.string(),
      user_id: Joi.string(),
      platform: Joi.string()
        .valid(...platform_enum)
        .default('app-user'),
    });
    const validationResult = await schema.validateAsync({ ...req.body, platform: req.headers.platform });
    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const orFilter = [
      {
        "custom_field.data.screen": "birthdate",

      }
    ];
    const andFilter = {};

    if (validationResult.search) {
      orFilter.push({
        "event_id.event_name": {
          $regex: validationResult.search,
          $options: "i",
        }
      })
    }

    if (validationResult.departments?.length > 0) {
      const departArr = validationResult.departments.map((item) =>
        mongoose.Types.ObjectId(item)
      );
      andFilter["departments"] = { $in: departArr };
    }

    if (validationResult.platform === "app-user" && req.user?._id) {
      orFilter.push({ "receiver_user_id": mongoose.Types.ObjectId(req.user._id) })
    }

    if (validationResult.user_id) {
      orFilter.push({ "receiver_user_id": mongoose.Types.ObjectId(validationResult.user_id) })
    }

    let queryDoc = [
      {
        $lookup: {
          from: "events",
          localField: "event_id",
          foreignField: "_id",
          as: "event",
        },
      },
      {
        $unwind: {
          path: "$event",
          preserveNullAndEmptyArrays: true
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "custom_field.data.id",
          foreignField: "_id",
          as: "user",
        }
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
        },
      },
      {
        $match: {
          receiver_user_id: mongoose.Types.ObjectId(validationResult.user_id),
          $or: orFilter
        },
      },
      {
        $project: {
          _id: 1,
          is_seen: 1,
          custom_field: 1,
          created_At: 1,
          event: [{
            _id: "$event._id",
            event_name: "$event.event_name",
            description: { $ifNull: ["$event.description", ""] },
            event_image: { $ifNull: ["$event.event_image", ""] },
            start_date: { $ifNull: ["$event.start_date", ""] },
            end_date: { $ifNull: ["$event.end_date", ""] },
            start_time: { $ifNull: ["$event.start_time", ""] },
            end_time: { $ifNull: ["$event.end_time", ""] },
            credit: { $ifNull: ["$event.credit", ""] },
            isAccept: { $ifNull: ["$eventsUser.isAccept", "pending"] },
          }],
          user: 1
        },
      },
    ];

    let queryCount = queryDoc;

    queryDoc = [...queryDoc, ...[{ $sort: { "created_At": -1 } }, { $skip: skip }, { $limit: limit }]];

    queryCount = [
      ...queryCount,
      ...[
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ],
    ];

    const result = await Notification.aggregate(queryDoc).sort({ _id: -1 }).exec();
    const totalNotification = await Notification.aggregate(queryCount).exec();
    const totalFilteredPage =
      totalNotification?.length > 0 && totalNotification[0].count
        ? Math.ceil(totalNotification[0].count / limit)
        : 0;
    if (result && result.length > 0) {
      return res.json({
        status: configs.success_status,
        result,
        metaData: {
          currentPage: pageNum,
          totalFilteredCount: totalNotification[0].count,
          totalFilteredPage,
        },
        message: "Request completed successfully",
      });
    } else {
      return res.json({
        status: configs.success_status,
        result: [],
        metaData: {
          currentPage: pageNum,
          totalFilteredCount: totalNotification.length > 0 && totalNotification[0].count ? totalNotification[0].count : 0,
          totalFilteredPage,
        },
        message: "No data found",
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({
      status: configs.error_status,
      message: configs.errMessage,
      error: error ? error : "",
    });
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const schema = Joi.object({
      message_id: Joi.string().required(),
    });
    const validationResult = await schema.validateAsync(req.body);
    const data = await BulkMessages.findByIdAndDelete(validationResult.message_id).exec();
    if (data) {
      return res.json({
        status: configs.success_status,
        data,
        message: "Notification deleted successfully",
      });
    } else {
      return res.json({
        status: configs.success_status,
        data,
        message: "Notification not found!",
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({
      status: configs.error_status,
      message: configs.errMessage,
      error: error ? error : "",
    });
  }
};

const isToday = (someDate) => {
  const today = new Date();
  return someDate.getDate() == today.getDate() &&
    someDate.getMonth() == today.getMonth() &&
    someDate.getFullYear() == today.getFullYear()
}

exports.eventNotificationSchedular = async () => {
  try {
    const now = moment().utc().toDate();

    let queryDoc = [
      {
        $lookup: {
          from: "events",
          localField: "event_id",
          foreignField: "_id",
          as: "event",
        },
      },
      {
        $unwind: {
          path: "$event",
        },
      },
      {
        $match: {
          $and: [
            { "event.start_date": { $gt: now } },
            {
              $or: [
                { "event.start_date": { $gt: now } },
                { "event.end_date": { $lt: now }, }
              ]
            },
            { isAccept: "accepted" }
          ],
        },
      },
      {
        $project: {
          event: {
            _id: "$event._id",
            event_name: { $ifNull: ["$event.event_name", ""] },
            start_date: { $ifNull: ["$event.start_date", ""] },
            start_time: { $ifNull: ["$event.start_time", ""] },
            event_notification_list: "$event.event_notification_list",
          },

          user_id: "$user_id",
          host_users: "$event.host_users",
        },
      },
    ];

    const data = await EventUser.aggregate(queryDoc).exec();;
    if (data && data.length > 0) {
      await Promise.all(data.map(async (mainItem, index) => {
        if (!mainItem.event.event_notification_list || mainItem.event.event_notification_list.length === 0) {
          return;
        }
        const start_date = new Date(mainItem.event.start_date);
        let event_start_time;
        if (!mainItem.event.allDay && mainItem.event.start_time) {
          event_start_time = new Date(mainItem.event.start_time);
          start_date.setHours(
            event_start_time.getHours(),
            event_start_time.getMinutes(),
            0, 0
          );
        } else {
          start_date.setHours(10, 0, 0, 0);
        }
        if (!isToday(start_date)) {
          return;
        }
        let current_date = new Date();
        current_date.setHours(current_date.getHours(), current_date.getMinutes(), current_date.getSeconds(), 0)
        await Promise.all(mainItem.event.event_notification_list.map(async (item) => {
          let dunationMs;
          if (item.duration_type === 'minutes') {
            dunationMs = Math.floor(Math.round(item.duration) * 60000);
          }
          if (item.duration_type === 'hours') {
            dunationMs = Math.floor(Math.round(item.duration) * (1000 * 60 * 60));
          }
          if (item.duration_type === 'days') {
            dunationMs = Math.floor(Math.round(item.duration) / (1000 * 60 * 60 * 24));
            start_date.setHours(10, 0, 0, 0);
          }
          const diffInTime = start_date.getTime() - current_date.getTime();
          if (dunationMs === diffInTime) {
            // Send FCM notification to user related this event
            let screen = 'event'
            let collapse_key = 'event_detail'
            let title = `${mainItem.event.event_name}`;
            let body = `Your event is in ${item.duration} ${item.duration_type}`
            let details = {
              screen: 'event',
              id: mainItem?.event._id ? mainItem?.event._id : '',
            };
            await notificationService.sendNotification([mainItem.user_id],
              {
                notification: {
                  title,
                  body
                },
                data: {
                  click_action: configs.click_action,
                  collapse_key,
                  screen,
                  ...details
                }
              }
            );
          }
        }));
      }));
    }
  }
  catch (error) {
    console.log(error);
  }
}

exports.eventCompleteSchedular = async () => {
  try {
    const now = moment().utc().toDate();

    let queryDoc = [
      {
        $lookup: {
          from: "users",
          localField: "host_users",
          foreignField: "_id",
          as: "host_users",
        },
      },
      {
        $unwind: {
          path: "$host_user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $and: [
            { status: { $ne: "cancel" } },
          ],
        },
      },
      {
        $project: {
          _id: "$_id",
          event_name: { $ifNull: ["$event_name", ""] },
          start_date: { $ifNull: ["$start_date", ""] },
          end_date: { $ifNull: ["$end_date", ""] },
          start_time: { $ifNull: ["$start_time", ""] },
          end_time: { $ifNull: ["$end_time", ""] },
          status: "$status",
          credit: "$credit",
          host_user: {
            _id: "$host_user._id",
            credits: "$host_user.credits"
          },
        },
      },
    ];

    const data = await Events.aggregate(queryDoc).exec();;
    if (data && data.length > 0) {
      //await eventController.eventComplete(data);
      await Promise.all(data.map(async (eventData) => {
        let event_dates = [];
        let current_date = moment();
        let start_date = moment(eventData.start_date);
        let end_date = moment(eventData.end_date);
        let event_start_time, event_end_time;
        if (!eventData.allDay && eventData.start_time && eventData.end_time) {
          event_start_time = moment(eventData.start_time);
          event_end_time = moment(eventData.end_time);
          start_date.set('hour', event_start_time.get('hour'));
          start_date.set('minute', event_start_time.get('minute'));
          start_date.set('second', 0);
          start_date.set('millisecond', 0);
          end_date.set('hour', event_end_time.get('hour'));
          end_date.set('minute', event_end_time.get('minute'));
          end_date.set('second', 0);
          end_date.set('millisecond', 0);
        } else {
          start_date.set('hour', 10);
          start_date.set('minute', 0);
          start_date.set('second', 0);
          start_date.set('millisecond', 0);
          end_date.set('hour', 19);
          end_date.set('minute', 0);
          end_date.set('second', 0);
          end_date.set('millisecond', 0);
        }

        if (eventData.isCustomDate && eventData.custom_dates?.length > 0 && Array.isArray(eventData.custom_dates)) {
          event_dates = eventData.custom_dates.map((item) => {
            let start = moment(item);
            let end = moment(item);
            if (!eventData.allDay && event_start_time && event_end_time) {
              start.set('hour', event_start_time.get('hour'));
              start.set('minute', event_start_time.get('minute'));
              start.set('second', 0);
              start.set('millisecond', 0);
              end.set('hour', event_end_time.get('hour'));
              end.set('minute', event_end_time.get('minute'));
              end.set('second', 0);
              end.set('millisecond', 0);
            } else {
              start.set('hour', 10);
              start.set('minute', 0);
              start.set('second', 0);
              start.set('millisecond', 0);
              end.set('hour', 19);
              end.set('minute', 0);
              end.set('second', 0);
              end.set('millisecond', 0);
            }
            return { start, end, }
          });
        } else {
          const diffInDays = end_date.diff(start_date, 'days');
          event_dates = [...Array(diffInDays ? diffInDays + 1 : 1)].map((_, index, array) => {
            if (index === 0) {
              const end = start_date.clone();
              end.set('date', start_date.get('date'));
              if (event_end_time) {
                end.set('hour', event_end_time.get('hour'));
                end.set('minute', event_end_time.get('minute'));
                end.set('second', 0);
                end.set('millisecond', 0);
              } else {
                end.set('hour', 19);
                end.set('minute', 0);
                end.set('second', 0);
                end.set('millisecond', 0);
              }
              return { start: start_date, end, };
            } else if (index === array.length - 1) {
              const start = start_date.clone();
              start.set('date', start_date.get('date') + index);
              return { start, end: end_date, };
            } else {
              const start = start_date.clone();
              start.set('date', start_date.get('date') + index);
              const end = start_date.clone();
              end.set('date', start_date.get('date') + index);
              if (event_end_time) {
                end.set('hour', event_end_time.get('hour'));
                end.set('minute', event_end_time.get('minute'));
                end.set('second', 0);
                end.set('millisecond', 0);
              } else {
                end.set('hour', 19);
                end.set('minute', 0);
                end.set('second', 0);
                end.set('millisecond', 0);
              }
              return { start, end, };
            }
          });
        }

        if (event_dates.length === 0) {
          return;
        }

        let status = 'upcoming';
        let checkUpcoming = event_dates.findIndex((item) => {
          return current_date < item.start;
        });
        if (checkUpcoming > -1) {
          status = 'upcoming';
        }

        let checkInprogress = event_dates.findIndex((item) => {
          return current_date > item.start && current_date < item.end;
        });
        if (checkInprogress > -1) {
          status = 'inprogress';
          let event_sessio = new EventSession({
            event_id: eventData._id
          })
          //console.log('event_session', event_sessio);
          await event_sessio.save()
        }

        let checkCompleted = current_date > event_dates[event_dates.length - 1].end;
        if (checkCompleted) {
          status = 'completed';
          await EventSession.updateOne({
            event_id: eventData._id,
          }, { $set: { event_status: 'completed' } }, { new: true }).exec()
          if (eventData.status !== 'completed' && eventData?.host_user?._id) {
            let credits = Math.round(eventData?.host_user?.credits);
            credits += 2;
            credits = credits < 0 ? 0 : credits;
            if (credits) {
              await Users.findByIdAndUpdate(
                eventData?.host_user?._id,
                {
                  $set: {
                    credits,
                  },
                },
                { new: true }
              ).exec();
            }
          }
        }

        await Events.findByIdAndUpdate(
          eventData._id,
          {
            $set: {
              status,
              event_dates
            },
          },
          { new: true }
        ).exec();
      }));
    }
  }
  catch (error) {
    console.log(error);
  }
}


exports.birthdayNotificationSchedular = async () => {
  try {
    const orFilter = {};
    const andFilter = {};
    const now = moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate()
    const nextDate = moment().set({ hour: 23, minute: 59, second: 59, millisecond: 59 }).toDate();

    let queryDoc = [
      {
        $match: {
          isDeleted: false,
          birthdate: { $exists: true },
        },
      },
      {
        $project: {
          _id: "$_id",
          full_name: { $concat: ["$first_name", " ", "$last_name"] },
          birthdate: 1,
          birthdate_new: {
            $dateFromParts: {
              'year': now.getFullYear(),
              'month': {
                $month: {
                  date: '$birthdate',
                },
              },
              'day': {
                $dayOfMonth: {
                  date: '$birthdate',
                }
              },
              'hour': 0,
              'minute': 0,
              'second': 0,
            }
          },
          user_img: { $ifNull: ["$user_img", ""] },
        },
      },
      {
        $match: {
          ...andFilter,
          $and: [
            {
              birthdate_new: { $gte: now, $lte: nextDate },
            },
          ],
          $or: [orFilter],
        },
      },
    ];

    let queryCount = queryDoc;

    queryDoc = [...queryDoc, ...[{ $sort: { birthdate_new: 1 } }]];

    queryCount = [
      ...queryCount,
      ...[
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ],
    ];

    const currentDayBirthdaydata = await Users.aggregate(queryDoc).exec();
    const totalUsers = await Users.find().exec();
    const templetedata = await PostCardTempletes.findOne({ templete_name: 'Birthday' }).sort({ _id: -1 });
    if (currentDayBirthdaydata && currentDayBirthdaydata.length > 0 && templetedata) {
      await Promise.all(currentDayBirthdaydata.map(async (bdUser) => {
        if (totalUsers && totalUsers.length > 0) {
          await Promise.all(totalUsers.map(async (user) => {
            let screen = 'birthdate'
            let collapse_key = 'birthdate_detail'
            let title = 'Birthday';
            let body = user._id.toString() == bdUser?._id.toString() ? 'Happy Birthday' : `Wish Happy Birthday to ${bdUser.full_name}`;
            let details = {
              screen: 'birthdate',
              id: bdUser?._id ? bdUser?._id : '',
              templete_id: templetedata._id
            };

            const newCustomNotification = new Notification({
              sender_user_id: currentDayBirthdaydata.user_id,
              receiver_user_id: user._id,
              templete_id: templetedata._id,
              is_seen: false,
              custom_field: {
                notfication: {
                  title,
                  body,
                },
                data: {
                  click_action: configs.click_action,
                  collapse_key,
                  ...details,
                }
              }
            });
            await newCustomNotification.save();

            // console.log('newCustomNotification', newCustomNotification );
            await notificationService.sendNotification([user],
              {
                notification: {
                  title,
                  body
                },
                data: {
                  click_action: configs.click_action,
                  collapse_key,
                  screen,
                  ...details
                }
              }
            );
          }));
        }
      }));
    }
  }
  catch (error) {
    console.log(error);
  }
}

exports.removeDeviceToken = async (req, res, next) => {
  try {
    const schema = Joi.object({
      org_id: Joi.string(),
      user_id: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);
    const deviceTokenInfo = await DeviceInfo.findOneAndDelete({ user_id: validationResult.user_id }).exec();
    if (deviceTokenInfo) {
      return res.json({
        status: configs.success_status, message: "Device token deleted successfully"
      });
    }
  } catch (error) {
    console.log(error)
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }

}

exports.checkNotificationStatus = async (req, res, next) => {
  try {
    const schema = Joi.object({
      _id: Joi.string().required(),
    });
    const validationResult = await schema.validateAsync(req.body);
    const checkNotificationStatus = await Notification.updateOne(
      { _id: validationResult._id },
      {
        $set: {
          is_seen: true,

        },
      }
    )

    return res.json({
      status: configs.success_status,
      is_seen: true,
      message: 'Request completed successfully'
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: configs.error_status,
      message: configs.errMessage,
      error: error ? error : ""
    });
  }
};

exports.deleteNotificationSchedular = async (req, res, next) => {
  try {
    const date = new Date();
    const datestring =
      date.getMonth() + "-" + (date.getDate()) + "-" + date.getFullYear();
    const data = await Notification.find().select({ created_At: 1 }).exec();
    const dateArray = [];
    const Idsofdeleted_At = [];
    data.map((item) => {
      dateArray.push(item);
    });
    // console.log("dateArray", dateArray);
    dateArray.map(async (item) => {
      let daydiff;
      let date2 = new Date(item.created_At);
      // console.log("date2", date2); 
      const datestring2 =
        date2.getMonth() +
        "-" +
        (date2.getDate() + 1) +
        "-" +
        date2.getFullYear();
      var d1 = new Date(date);
      var d2 = new Date(date2);

      var diff = d1.getTime() - d2.getTime();
      daydiff = diff / (1000 * 60 * 60 * 24);
       //console.log("daydiff", daydiff);
      if (daydiff > 2) {
        // const del = await Notification.deleteMany({ created_At: item });
        Idsofdeleted_At.push(item)
        console.log("deleted Sucessfully");
      } else {
        //  console.log("No Data");
      }

    });

    const resultFinalArrayID = Idsofdeleted_At.map(a => a.id);

    const del = await Notification.deleteMany({ _id: { $in: resultFinalArrayID } });
  } catch (error) {
    console.log(error);
  }
};

exports.deleteMessageSchedular = async (req, res, next) => {
  try {
    const date = new Date();
    const datestring =
      date.getMonth() + "-" + (date.getDate()) + "-" + date.getFullYear();
    const data = await Messages.find().select({ created_At: 1 }).exec();
    const dateArray = [];
    const Idsofcreated_At = [];
    data.map((item) => {
      dateArray.push(item);
      // Idsofdeleted_At.push(item.id);
    });
    // data=[{}]
    // console.log("dateArray", dateArray);
    // console.log("IdsofDeletedDate", IdsofDeletedDate);
    dateArray.map(async (item) => {
      let daydiff;
      let date2 = new Date(item.created_At);
      // console.log("date2", date2); 
      const datestring2 =
        date2.getMonth() +
        "-" +
        (date2.getDate() + 1) +
        "-" +
        date2.getFullYear();
      var d1 = new Date(date);
      var d2 = new Date(date2);

      var diff = d1.getTime() - d2.getTime();
      daydiff = diff / (1000 * 60 * 60 * 24);
      // console.log("daydiff", daydiff);
      if (daydiff > 2) {
        // const del = await Notification.deleteMany({ created_At: item });
        Idsofcreated_At.push(item)
      } else {
        //  console.log("No Data");
      }

    });

    const resultFinalArrayID = Idsofcreated_At.map(a => a.id);

    const del = await Messages.deleteMany({ _id: { $in: resultFinalArrayID } });
   // console.log('del', del);
  } catch (error) {
    console.log(error);
  }
};