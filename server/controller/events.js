const mongoose = require("mongoose");
const Joi = require("joi");
const configs = require("../configs");
const moment = require('moment');

const Events = mongoose.model("events");
const EventUser = mongoose.model("event_user");
const Users = mongoose.model("users");
const Notification = mongoose.model("notifications");
const Host = mongoose.model('host');
const EventForms = mongoose.model('event_forms');
const EventAttendances = mongoose.model("event_attendances");
const Feedback = mongoose.model('feedbacks');
const BulkMessages = mongoose.model("bulk_messages");
const Designation = mongoose.model("designations");
const EventSession = mongoose.model("event_sessions")


const multer = require('multer');
const path = require('path');
const mime = require('mime-types');
const fs = require("fs");
const _ = require("lodash");
const { sendNotification } = require('../services/notificationService');
const uploadEventImageFilePath = 'uploads/event_images/';

const storageEventImageFiles = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadEventImageFilePath)
  },
  filename: function (req, file, cb) {
    const mimetype = file.mimetype;
    const fileExtension = mime.extension(mimetype);
    const fname = `${file.fieldname}-${Date.now()}.${fileExtension}`
    cb(null, fname);
  }
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) { // check file type to be png, jpeg, or jpg
    cb(null, true);
  } else {
    cb('Please provide valid format', false); // else fails
  }
}
const uploadEventFile = multer({
  storage: storageEventImageFiles,
  fileFilter: fileFilter,
}).fields([
  {
    name: 'event_image',
    maxCount: 3
  },
])

exports.addEvent = async (req, res, next) => {
  uploadEventFile(req, res, async (data, err) => {
    if (err) {
      res.json({ status: configs.error_status, message: "Something went wrong while uploading files." });
    } else {
      try {
        let receivedBody = req.body;
        let event_image = req.files?.event_image?.length > 0 ? req.files.event_image : [];
        if (event_image?.length > 0) {
          event_image = event_image.map((item) => item.filename ? item.filename : '')
          receivedBody.event_image = event_image;
        }
        if (receivedBody.departments?.length > 0 && receivedBody.departments[0]) {
          receivedBody.departments = receivedBody.departments[0].split(",")
        } else {
          receivedBody.departments = []
        }
        if (receivedBody.designation?.length > 0 && receivedBody.designation[0]) {
          receivedBody.designation = receivedBody.designation[0].split(",")
        } else {
          receivedBody.designation = []
        }
        if (receivedBody.manual_users?.length > 0 && receivedBody.manual_users[0]) {
          receivedBody.manual_users = receivedBody.manual_users[0].split(",")
        } else {
          receivedBody.manual_users = []
        }
        if (receivedBody.host_users?.length > 0 && receivedBody.host_users[0]) {
          receivedBody.host_users = receivedBody.host_users[0].split(",")
        } else {
          receivedBody.host_users = []
        }
        if (receivedBody.remove_event_images?.length > 0) {
          receivedBody.remove_event_images = receivedBody.remove_event_images[0].split(",")
        }
        if (receivedBody.custom_dates?.length > 0 && receivedBody.custom_dates[0]) {
          receivedBody.custom_dates = receivedBody.custom_dates[0].split(",")
        } else {
          receivedBody.custom_dates = []
        }

        const schema = Joi.object({
          org_id: Joi.string().required(),
          event_name: Joi.string().required(),
          host_users: Joi.any(),
          host_user_id: Joi.any(),
          event_type_id: Joi.string().required(),
          departments: Joi.array(),
          event_image: Joi.array().items(Joi.string().required()).min(1).required(),
          manual_users: Joi.array(),
          description: Joi.string(),
          designation: Joi.array(),
          event_seats: Joi.number().min(0),
          remaing_seats: Joi.number(),
          start_date: Joi.string().required(),
          end_date: Joi.string().required(),
          custom_dates: Joi.array(),
          isCustomDate: Joi.boolean(),
          start_time: Joi.string(),
          end_time: Joi.string(),
          allDay: Joi.boolean(),
          credit: Joi.number().required(),
          venue: Joi.string().required(),
          venue_url: Joi.string().optional().allow(null, '').default(''),
          user_id: Joi.string().required(),
        });
        const validationResult = await schema.validateAsync(receivedBody);

        const new_event = new Events({
          org_id: validationResult.org_id,
          event_name: validationResult.event_name,
          host_users: req.body.host_users,
          //  host_users: req.body.host_user_id,
          event_type_id: validationResult.event_type_id,
          departments: validationResult.departments,
          event_image: validationResult.event_image,
          manual_users: validationResult.manual_users,
          description: validationResult.description,
          designation: validationResult.designation,
          event_seats: validationResult.event_seats,
          remaing_seats: validationResult.remaing_seats,
          start_date: validationResult.start_date,
          end_date: validationResult.end_date,
          custom_dates: validationResult.custom_dates,
          isCustomDate: validationResult.isCustomDate,
          start_time: validationResult.start_time,
          end_time: validationResult.end_time,
          allDay: validationResult.allDay,
          credit: validationResult.credit,
          venue: validationResult.venue,
          venue_url: validationResult.venue_url,
          createdBy: validationResult.user_id,
          updatedBy: validationResult.user_id,
        });
        const data = await new_event.save();
        if (data) {
          let orFilter = [];
          let andFilter = [
            {_id:{$nin:validationResult.host_users}},
            { isDeleted: false }
          ];

          if (validationResult.departments?.length) {
            const departArr = validationResult.departments.map((item) =>
              mongoose.Types.ObjectId(item));
            orFilter.push({ 'department_id': { $in: departArr } });
          }
          if (validationResult.designation?.length) {
            const designationArr = validationResult.designation.map((item) =>
              mongoose.Types.ObjectId(item));
            andFilter.push({ 'designation_id': { $in: designationArr } });
          }
          if (validationResult.manual_users?.length) {
            const m_user = validationResult.manual_users.map((item) =>
              mongoose.Types.ObjectId(item));
            orFilter.push({ '_id': { $in: m_user } });
          }
          const emp_list = await Users.find({
            $and: [
              ...andFilter
            ],
            $or: [
              ...orFilter
            ],
          }).exec();
          // Send FCM notification to user related this event
          let screen = 'event'
          let collapse_key = 'event_detail'
          let title = `${data.event_name}`;
          let body = `New Event Added`;
          let details = {
            screen: 'event',
            id: data?._id ? data?._id : '',
          };

          await Promise.all(emp_list.map(async (item) => {
            const checkEventUser = await EventUser.exists({
              event_id: data._id,
              user_id: item._id,
            });
            if (!checkEventUser) {
              const new_event_user = new EventUser({
                org_id: data.org_id,
                event_id: data._id,
                user_id: item._id,
                createdBy: validationResult.user_id,
                updatedBy: validationResult.user_id,
              });
              await new_event_user.save();
              const newCustomNotification = new Notification({
                org_id: validationResult.org_id,
                sender_user_id: validationResult.user_id,
                receiver_user_id: item._id,
                event_id: data._id,
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
              await sendNotification([item._id],
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
          if (data.host_users) {
            const newCustomNotification = new Notification({
              org_id: validationResult.org_id,
              sender_user_id: validationResult.user_id,
              receiver_user_id: data.host_users,
              event_id: data._id,
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
            for (const host of data.host_users) {
              await sendNotification([host],
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
            
            const checkHostUser = await Host.exists({
              user_id: { $in: data.host_users },
            });
            if (!checkHostUser) {
              const new_host = new Host({
                org_id: data.org_id,
                user_id: data.host_users,
                createdBy: data.createdBy,
                updatedBy: data.createdBy,
              });
              await new_host.save();
            }
          }
          eventComplete(data);
          //console.log('evemtComplete', eventComplete(data));
          generateEventForm(data);

          return res.json({
            status: configs.success_status,
            data,
            message: "Event created successfully",
          });
        } else {
          return res.json({
            status: configs.error_status,
            message: configs.errMessage,
          });
        }
      } catch (error) {
        console.log('error', error);
        return res.json({
          status: configs.error_status,
          message: configs.errMessage,
          error: error ? error : "",
        });
      }
    }
  })
};

const generateEventForm = async (eventData) => {
  const event_forms = new EventForms({
    org_id: eventData.org_id,
    questions: configs.ElevateDefaultForm,
    event_id: eventData._id,
    createdBy: eventData.createdBy,
    updatedBy: eventData.createdBy,
  });

  const data = await event_forms.save();
  if (data) {
    const eventFormInfo = await Events.findOneAndUpdate({ _id: eventData._id }, {
      $set: {
        event_form_id: data._id,
      }
    }).exec();
    if (eventFormInfo) {
      // console.log('eventFormInfo', eventFormInfo);
    }
  }
}

const getAdminEventById = async (req, res, next) => {
  const data = await Events.findById(req.params.id)
    .populate("manual_users", "first_name last_name")
    .populate("designations", "designation_name")
    .populate("departments", "department_name")
    .populate("event_type_id", "event_type")
    .populate("host_users", "first_name last_name")
    .exec();
  if (data) {
    return res.json({
      status: configs.success_status,
      data,
      message: "Request completed successfully",
    });
  } else {
    return res.json({
      status: configs.success_status,
      data,
      message: "Event not found!",
    });
  }
};

const getEventById = async (req, res, next) => {
  const data = await Events.aggregate([
    {
      $lookup: {
        from: "eventtypes",
        localField: "event_type_id",
        foreignField: "_id",
        as: "event_type",
      },
    },
    {
      $unwind: {
        path: "$event_type",
        preserveNullAndEmptyArrays: true,
      },
    },
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
      $lookup: {
        from: "departments",
        localField: "departments",
        foreignField: "_id",
        as: "departmentList",
      },
    },
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.params.id),
      },
    },
    {
      $project: {
        event: {
          _id: "$_id",
          event_name: "$event_name",
          description: { $ifNull: ["$description", ""] },
          event_image: { $ifNull: ["$event_image", ""] },
          start_date: { $ifNull: ["$start_date", ""] },
          end_date: { $ifNull: ["$end_date", ""] },
          start_time: { $ifNull: ["$start_time", ""] },
          end_time: { $ifNull: ["$end_time", ""] },
          credit: { $ifNull: ["$credit", ""] },
          venue: { $ifNull: ["$venue", ""] },
          venue_url: { $ifNull: ["$venue_url", ""] },
          event_form_id: { $ifNull: ["$event_form_id", ""] },
          isAccept: { $ifNull: ["$isAccept", "pending"] },
          event_type: {
            _id: "$event_type._id",
            event_type: "$event_type.event_type",
          },
          event_dates: "$event_dates",
        },
        departments: {
          $ifNull: [
            {
              $map: {
                input: "$departmentList",
                as: "department",
                in: {
                  _id: "$$department._id",
                  department_name: "$$department.department_name",
                },
              },
            },
            [],
          ],
        },
        host_users: {
          $ifNull: [
            {
              $map: {
                input: "$host_users",
                as: "host_user",
                in: {
                  _id: "$$host_user._id",
                  first_name: "$$host_user.first_name",
                  last_name: "$$host_user.last_name",
                  user_img: "$$host_user.user_img",
                },
              },
            },
            [],
          ],
        },
      },
    },
    { $limit: 1 },
  ]).exec();
  if (data?.length > 0) {
    const eventUser = await EventUser.find({
      event_id: mongoose.Types.ObjectId(req.params.id),
      //isAccept: "accepted",
      user_id: { $ne: mongoose.Types.ObjectId(req.user._id) },
    }).populate("user_id", "first_name last_name user_img").exec();
    const checkUser = await EventUser.findOne({
      event_id: mongoose.Types.ObjectId(req.params.id),
      user_id: mongoose.Types.ObjectId(req.user._id),
    }).select('_id isAccept').exec();
    const result = data[0];
    result.users_list = eventUser?.length > 0 ?
      eventUser.map(item => (
        console.log(item),
        {
          _id: item.user_id?._id,
          first_name: item.user_id?.first_name ? item.user_id?.first_name : '',
          last_name: item.user_id?.last_name ? item.user_id?.last_name : '',
          user_img: item.user_id?.user_img ? item.user_id?.user_img : '',
          isAccept: item?.isAccept ? item?.isAccept : ''
        }
      )) : [];
    result.isAccept = typeof checkUser?.isAccept === 'string' ? checkUser.isAccept : 'pending';

    return res.json({
      status: configs.success_status,
      data: result,
      message: "Request completed successfully",
    });
  } else {
    return res.json({
      status: configs.success_status,
      data,
      message: "Event not found!",
    });
  }
};

exports.eventById = async (req, res, next) => {
  try {
    const platform_enum = ["web-admin", "app-user"];
    const schema = Joi.object({
      platform: Joi.string()
        .valid(...platform_enum)
        .required(),
    }).unknown(true);
    const validationResult = await schema.validateAsync(req.headers);

    if (validationResult.platform === "app-user") {
      getEventById(req, res, next);
    } else {
      getAdminEventById(req, res, next);
    }
  } catch (error) {
    return res.json({
      status: configs.error_status,
      message: configs.errMessage,
      error: error ? error : "",
    });
  }
};

exports.editEvent = async (req, res, next) => {
  uploadEventFile(req, res, async (data, err) => {
    if (err) {
      res.json({ status: configs.error_status, message: "Something went wrong while uploading files." });
    } else {
      try {
        let receivedBody = req.body;
        let event_image = req.files?.event_image?.length > 0 ? req.files.event_image : [];
        if (event_image?.length > 0) {
          event_image = event_image.map((item) => item.filename ? item.filename : '')
          receivedBody.event_image = event_image;
        }
        if (receivedBody.departments?.length > 0 && receivedBody.departments[0]) {
          receivedBody.departments = receivedBody.departments[0].split(",")
        } else {
          receivedBody.departments = []
        }
        if (receivedBody.designation?.length > 0 && receivedBody.designation[0]) {
          receivedBody.designation = receivedBody.designation[0].split(",")
        } else {
          receivedBody.designation = []
        }
        if (receivedBody.manual_users?.length > 0 && receivedBody.manual_users[0]) {
          receivedBody.manual_users = receivedBody.manual_users[0].split(",")
        } else {
          receivedBody.manual_users = []
        }
        if (receivedBody.host_users?.length > 0 && receivedBody.host_users[0]) {
          receivedBody.host_users = receivedBody.host_users[0].split(",")
        } else {
          receivedBody.host_users = []
        }
        if (receivedBody.remove_event_images?.length > 0) {
          receivedBody.remove_event_images = receivedBody.remove_event_images[0].split(",")
        }
        if (receivedBody.custom_dates?.length > 0 && receivedBody.custom_dates[0]) {
          receivedBody.custom_dates = receivedBody.custom_dates[0].split(",")
        } else {
          receivedBody.custom_dates = []
        }
        const schema = Joi.object({
          event_name: Joi.string().required(),
          host_users: Joi.any(),
          host_user_id: Joi.any(),
          event_type_id: Joi.string().required(),
          departments: Joi.array(),
          designation: Joi.array(),
          event_image: Joi.array().items(Joi.string()),
          remove_event_images: Joi.array().items(Joi.string()),
          manual_users: Joi.array(),
          event_seats: Joi.number().min(0),
          remaing_seats: Joi.number(),
          start_date: Joi.string().required(),
          end_date: Joi.string().required(),
          custom_dates: Joi.array(),
          isCustomDate: Joi.boolean(),
          start_time: Joi.string(),
          end_time: Joi.string(),
          allDay: Joi.boolean(),
          credit: Joi.number().required(),
          venue: Joi.string().required(),
          venue_url: Joi.string().optional().allow(null, '').default(''),
          user_id: Joi.string().required(),
          description: Joi.string(),
        });
        const validationResult = await schema.validateAsync(receivedBody);
        const new_event = {
          event_name: validationResult.event_name,
          host_users: req.body.host_users,
          event_type_id: validationResult.event_type_id,
          departments: validationResult.departments,
          designation: validationResult.designation,
          event_seats: validationResult.event_seats,
          remaing_seats: validationResult.remaing_seats,
          manual_users: validationResult.manual_users,
          start_date: validationResult.start_date,
          end_date: validationResult.end_date,
          custom_dates: validationResult.custom_dates,
          isCustomDate: validationResult.isCustomDate,
          start_time: validationResult.start_time,
          end_time: validationResult.end_time,
          allDay: validationResult.allDay,
          credit: validationResult.credit,
          venue: validationResult.venue,
          venue_url: validationResult.venue_url,
          updatedBy: validationResult.user_id,
          updated_At: configs.utcDefault(),
          description: validationResult.description,
        };
        const userImageData = await Events.findById(req.params.id).select('event_image host_user_id').exec();
        let event_img_arr = userImageData.event_image;
        if (validationResult.event_image?.length > 0) {
          event_img_arr = [
            ...event_img_arr,
            ...validationResult.event_image
          ]
        }
        if (validationResult.remove_event_images?.length > 0 && userImageData.event_image?.length > 0) {
          for (const iterator of validationResult.remove_event_images) {
            const index = event_img_arr.findIndex((item) => item === iterator);
            const filePath = event_img_arr[index] !== -1 ? uploadEventImageFilePath + event_img_arr[index] : '';
            if (filePath && fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
            event_img_arr.splice(index, 1);
          }
        }
        new_event.event_image = event_img_arr;
        // const deletes = await EventUser.deleteMany({ event_id: req.params.id })
        const data = await Events.findByIdAndUpdate(
          req.params.id,
          { $set: new_event },
          { new: true }
        ).exec();
        if (data) {
          let orFilter = [];
          let andFilter = [
            {_id:{$nin:validationResult.host_users}},
            { isDeleted: false }
          ];

          if (validationResult.departments?.length) {
            const departArr = validationResult.departments.map((item) =>
              mongoose.Types.ObjectId(item));
            orFilter.push({ 'department_id': { $in: departArr } });
          }
          if (validationResult.designation?.length) {
            const designationArr = validationResult.designation.map((item) =>
              mongoose.Types.ObjectId(item));
            andFilter.push({ 'designation_id': { $in: designationArr } });
          }
          if (validationResult.manual_users?.length) {
            const m_user = validationResult.manual_users.map((item) =>
              mongoose.Types.ObjectId(item));
            orFilter.push({ '_id': { $in: m_user } });
          }
          // if (validationResult.host_users?.length) {
          //   const h_user = validationResult.host_users.map((item) =>
          //     mongoose.Types.ObjectId(item));
          //   orFilter.push({ 'host_users': { $in: h_user } });
          // }

          const emp_list = await Users.find({
            $and: [
              ...andFilter
            ],
            $or: [
              ...orFilter
            ],
          }).exec()
          // Send FCM notification to user related this event
          let screen = 'event'
          let collapse_key = 'event_detail'
          let title = `${data.event_name}`;
          let body = `Event Updated `;
          let details = {
            screen: 'event',
            id: data?._id ? data?._id : '',
          };

          await Promise.all(emp_list.map(async (item) => {
            const checkEventUser = await EventUser.exists({
              event_id: data._id,
              user_id: item._id,
            });
            // const checkEventUser1 = await EventUser.deleteMany({
            //   "department_id": item.department_id,
            // }).exec()
            // console.log('user', checkEventUser1);
            if (!checkEventUser) {
              const new_event_user = new EventUser({
                org_id: data.org_id,
                event_id: data._id,
                user_id: item._id,
                createdBy: validationResult.user_id,
                updatedBy: validationResult.user_id,
              });
              await new_event_user.save();
            }
            // const del = await EventUser.deleteMany({
            //   user_id: { $in: req.body.host_users }
            // });
            const newCustomNotification = new Notification({
              org_id: validationResult.org_id,
              sender_user_id: validationResult.user_id,
              receiver_user_id: item._id,
              event_id: data._id,
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
            await sendNotification([item._id],
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

          if (data.host_users) {
            const newCustomNotification = new Notification({
              org_id: validationResult.org_id,
              sender_user_id: validationResult.user_id,
              receiver_user_id: data.host_users,
              event_id: data._id,
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
            for (const host of data.host_users) {
              await sendNotification([host],
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
            const hostUserCount = await Events.countDocuments({
              host_user_id: userImageData.host_user_id
            }).exec();

            if (hostUserCount <= 1 && userImageData.host_user_id) {
              await Host.deleteOne({
                user_id: userImageData.host_user_id
              });
            }
            const checkHostUser = await Host.exists({
              user_id: { $in: data.host_users },
            });
            if (!checkHostUser) {
              const new_host = new Host({
                org_id: data.org_id,
                user_id: data.host_users,
                createdBy: data.createdBy,
                updatedBy: data.createdBy,
              });
              await new_host.save();
            }
          }

          eventComplete(data)
          console.log('eventdata', eventComplete(data));

          return res.json({
            status: configs.success_status,
            data,
            message: "Event updated successfully",
          });
        } else {
          return res.json({
            status: configs.success_status,
            data,
            message: "Event not found!",
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
    }
  })
};

const eventComplete = async (eventData) => {
  try {
    let event_dates = [];
    let current_date = moment()
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
        let start = moment(item)
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
    }

    let checkCompleted = current_date > event_dates[event_dates.length - 1].end;
    if (checkCompleted) {
      status = 'completed';
      console.log(eventData.status);
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
  }
  catch (error) {
    console.log(error);
  }
}

exports.eventComplete = async (eventdata) => {
  try {
    eventComplete(eventdata)
  } catch (error) {
    console.log(error)
  }
}

exports.deleteEvent = async (req, res, next) => {
  try {
    const schema = Joi.object({
      user_id: Joi.string().required(),
    });
    await schema.validateAsync(req.body);
    const eventData = await Events.findById(req.params.id).select('_id credit event_image host_user_id').exec();
    if (!eventData) {
      return res.json({
        status: configs.success_status,
        data: {
          isDeleted: false
        },
        message: "Event not found!",
      });
    }

    if (eventData.host_user_id) {
      const userData = await Users.findById(eventData.host_user_id).exec();
      let credits = Math.round(userData?.credits);
      credits -= 2;
      userData.credits = credits < 0 ? 0 : credits;
      userData.save();
    }

    const event_attendees_list = await EventAttendances.find({
      event_id: req.params.id,
    }).populate('user_id', 'credits').select('user_id').exec();
    if (event_attendees_list?.length > 0) {
      await Promise.all((event_attendees_list.map(async (item) => {
        if (item.user_id?._id) {
          let event_credit = Math.round(eventData?.credit);
          let credits = Math.round(item?.user_id?.credits);
          credits -= event_credit;
          credits = credits < 0 ? 0 : credits;
          await Users.updateOne({ _id: item.user_id._id }, { $set: { credits } });
          item.remove();
        }
      })));
    }

    await EventUser.deleteMany({
      event_id: req.params.id
    }).exec();
    await Feedback.deleteMany({
      event_id: req.params.id
    }).exec();
    await EventForms.deleteMany({
      event_id: req.params.id
    }).exec();
    await Notification.deleteMany({
      event_id: req.params.id
    }).exec();
    await BulkMessages.deleteMany({
      event_id: req.params.id
    }).exec();

    const checkHostUser = await Events.countDocuments({
      host_user_id: eventData.host_user_id
    }).exec();

    if (checkHostUser <= 1) {
      await Host.deleteOne({
        user_id: eventData.host_user_id
      });
    }

    if (eventData.event_image?.length > 0) {
      for (const iterator of eventData.event_image) {
        const filePath = uploadEventImageFilePath + iterator;
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
    await eventData.remove();

    return res.json({
      status: configs.success_status,
      data: {
        isDeleted: true
      },
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: configs.error_status,
      data: {
        isDeleted: false
      },
      message: configs.errMessage,
      error: error ? error : "",
    });
  }
};

exports.myEvents = async (req, res, next) => {
  try {
    const schema = Joi.object({
      user_id: Joi.string().required(),
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(5000),
      search: Joi.string(),

    });
    const now = moment().toDate();
    const validationResult = await schema.validateAsync(req.body);

    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const sort = { _id: -1 };

    const filter = {};
    if (validationResult.search) {
      filter["event.event_name"] = {
        $regex: validationResult.search,
        $options: "i",
      };
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
        },
      },
      {
        $lookup: {
          from: "eventtypes",
          localField: "event.event_type_id",
          foreignField: "_id",
          as: "event.event_type",
        },
      },
      {
        $unwind: {
          path: "$event.event_type",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "event.host_users",
          foreignField: "_id",
          as: "event.host_users",
        },
      },
      {
        $unwind: {
          path: "$event.host_user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "event.departments",
          foreignField: "_id",
          as: "event.departments",
        },
      },
      {
        $match: {
          user_id: mongoose.Types.ObjectId(validationResult.user_id),
          "event.status": "completed",
          $or: [filter],
        },
      },
      {
        $project: {
          event: {
            _id: "$event._id",
            event_name: "$event.event_name",
            description: { $ifNull: ["$event.description", ""] },
            event_image: { $ifNull: ["$event.event_image", ""] },
            start_date: { $ifNull: ["$event.start_date", ""] },
            end_date: { $ifNull: ["$event.end_date", ""] },
            start_time: { $ifNull: ["$event.start_time", ""] },
            end_time: { $ifNull: ["$event.end_time", ""] },
            credit: { $ifNull: ["$event.credit", ""] },
            venue: { $ifNull: ["$event.venue", ""] },
            venue_url: { $ifNull: ["$venue_url", ""] },
            event_dates: {
              $filter: {
                input: "$event.event_dates",
                as: "item",
                cond: {
                  $and: [
                    {
                      $lt: [
                        "$$item.end", now
                      ]
                    },
                  ]
                }
              }
            },
          },
          departments: {
            $ifNull: [
              {
                $map: {
                  input: "$event.departments",
                  as: "department",
                  in: {
                    _id: "$$department._id",
                    department_name: "$$department.department_name",
                  },
                },
              },
              [],
            ],
          },
          host_users: {
            $ifNull: [
              {
                $map: {
                  input: "$event.host_users",
                  as: "host_user",
                  in: {
                    _id: "$$host_user._id",
                    first_name: "$$host_user.first_name",
                    last_name: "$$host_user.last_name",
                    user_img: "$$host_user.user_img",
                  },
                },
              },
              [],
            ],
          },
        },
      },
    ];

    let queryCount = queryDoc;

    queryDoc = [
      ...queryDoc,
      ...[{ $skip: skip }, { $limit: limit }, { $sort: sort }],
    ];

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

    const data = await EventUser.aggregate(queryDoc).exec();

    const totalEvents = await EventUser.aggregate(queryCount).exec();
    const totalFilteredPage =
      totalEvents?.length > 0 && totalEvents[0].count
        ? Math.ceil(totalEvents[0].count / limit)
        : 0;

    if (data && data.length > 0) {
      return res.json({
        status: configs.success_status,
        data,
        metaData: {
          currentPage: pageNum,
          totalFilteredCount: totalEvents[0].count,
          totalFilteredPage,
        },
        message: "Request completed successfully",
      });
    } else {
      return res.json({
        status: configs.success_status,
        data: [],
        metaData: {
          currentPage: 1,
          totalFilteredCount: 0,
          totalFilteredPage: 0,
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
// exports.upcomingEvents = async (req, res, next) => {
//   try {
//     const schema = Joi.object({
//       user_id: Joi.string().required(),
//       pageNum: Joi.number().default(1),
//       pageLimit: Joi.number().default(5000),
//       search: Joi.string(),
//     });
//     const validationResult = await schema.validateAsync(req.body);

//     const pageNum = validationResult.pageNum;
//     const limit = validationResult.pageLimit;
//     const skip = limit * (pageNum - 1);
//     const sort = { "event._id": -1 };
//     const now = moment().toDate();

//     const filter = {};
//     if (validationResult.search) {
//       filter["event.event_name"] = {
//         $regex: validationResult.search,
//         $options: "i",
//       };
//     }

//     let queryDoc = [
//       {
//         $lookup: {
//           from: "events",
//           localField: "event_id",
//           foreignField: "_id",
//           as: "event",
//         },
//       },
//       {
//         $unwind: {
//           path: "$event",
//         },
//       },
//       {
//         $lookup: {
//           from: "eventtypes",
//           localField: "event.event_type_id",
//           foreignField: "_id",
//           as: "event.event_type",
//         },
//       },
//       {
//         $unwind: {
//           path: "$event.event_type",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "event.host_users",
//           foreignField: "_id",
//           as: "event.host_users",
//         },
//       },
//       {
//         $unwind: {
//           path: "$event.host_user",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $lookup: {
//           from: "departments",
//           localField: "event.departments",
//           foreignField: "_id",
//           as: "event.departments",
//         },
//       },
//       {
//         $match: {
//           $and: [
//             { user_id: mongoose.Types.ObjectId(validationResult.user_id), },
//             { "event.status": "upcoming" },
//           ],
//           $or: [filter],
//         },
//       },
//       {
//         $project: {
//           user_id: { $ifNull: ["$user_id", ""] },
//           event: {
//             _id: "$event._id",
//             event_name: "$event.event_name",
//             description: { $ifNull: ["$event.description", ""] },
//             event_image: { $ifNull: ["$event.event_image", ""] },
//             start_date: { $ifNull: ["$event.start_date", ""] },
//             end_date: { $ifNull: ["$event.end_date", ""] },
//             start_time: { $ifNull: ["$event.start_time", ""] },
//             end_time: { $ifNull: ["$event.end_time", ""] },
//             credit: { $ifNull: ["$event.credit", ""] },
//             venue_url: { $ifNull: ["$event.venue_url", ""] },
//             venue: { $ifNull: ["$event.venue", ""] },
//             isAccept: { $ifNull: ["$isAccept", "pending"] },
//             event_dates: {
//               $filter: {
//                 input: "$event.event_dates",
//                 as: "item",
//                 cond: {
//                   $and: [
//                     {
//                       $gt: [
//                         "$$item.start", now
//                       ]
//                     },
//                   ]
//                 }
//               }
//             },
//           },
//           departments: {
//             $ifNull: [
//               {
//                 $map: {
//                   input: "$event.departments",
//                   as: "department",
//                   in: {
//                     _id: "$$department._id",
//                     department_name: "$$department.department_name",
//                   },
//                 },
//               },
//               [],
//             ],
//           },
//           host_users: {
//             $ifNull: [
//               {
//                 $map: {
//                   input: "$event.host_users",
//                   as: "host_user",
//                   in: {
//                     _id: "$$host_user._id",
//                     first_name: "$$host_user.first_name",
//                     last_name: "$$host_user.last_name",
//                     user_img: "$$host_user.user_img",
//                   },
//                 },
//               },
//               [],
//             ],  
//           },
//         },
//       },
//     ];

//     let queryCount = queryDoc;

//     queryDoc = [
//       ...queryDoc,
//       ...[{ $sort: {start_date: -1} }, { $skip: skip }, { $limit: limit }],
//     ];

//     queryCount = [
//       ...queryCount,
//       ...[
//         {
//           $group: {
//             _id: null,
//             count: { $sum: 1 },
//           },
//         },
//       ],
//     ];

//     const data = await EventUser.aggregate(queryDoc).exec();
//     const totalEvents = await EventUser.aggregate(queryCount).exec();
//     const totalFilteredPage =
//       totalEvents?.length > 0 && totalEvents[0].count
//         ? Math.ceil(totalEvents[0].count / limit)
//         : 0;
//     if (data && data.length > 0) {
//       return res.json({
//         status: configs.success_status,
//         data,
//         metaData: {
//           currentPage: pageNum,
//           totalFilteredCount: totalEvents[0].count,
//           totalFilteredPage,
//         },
//         message: "Request completed successfully",
//       });
//     } else {
//       return res.json({
//         status: configs.success_status,
//         data,
//         metaData: {
//           currentPage: 1,
//           totalFilteredCount: 0,
//           totalFilteredPage: 0,
//         },
//         message: "No data found",
//       });
//     }
//   } catch (error) {
//     console.log(error);
//     return res.json({
//       status: configs.error_status,
//       message: configs.errMessage,
//       error: error ? error : "",
//     });
//   }
// };
exports.upcomingEvents = async (req, res, next) => {
  try {
    const schema = Joi.object({
      pageNum: Joi.number().default(1),
      user_id: Joi.string(),
      pageLimit: Joi.number().default(10),
      search: Joi.string(),
      date_type: Joi.string(),
      isActive: Joi.boolean(),
    });
    const validationResult = await schema.validateAsync(req.body);

    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const now = moment().toDate();
    const orFilter = {};
    const andFilter = {};
    const sort = { "_id": -1 };

    if (validationResult.search) {
      orFilter["event_name"] = {
        $regex: validationResult.search,
        $options: "i",
      };
    }

    if (validationResult.departments?.length > 0) {
      const departArr = validationResult.departments.map((item) =>
        mongoose.Types.ObjectId(item)
      );
      andFilter["departments"] = { $in: departArr };
    }

    if (validationResult.event_types) {
      const eventTypeArr = validationResult.event_types.map((item) =>
        mongoose.Types.ObjectId(item)
      );
      andFilter["event_type_id"] = { $in: eventTypeArr };
    }

    if (validationResult.date_type === 'previous_month') {
      const start_date = moment().subtract(1, 'months').startOf('month').toDate();
      const end_date = moment().subtract(1, 'months').endOf('month').toDate();
      andFilter["start_date"] = {
        $gt: start_date,
        $lt: end_date,
      };
    } else if (validationResult.date_type === 'current_month') {
      const start_date = moment().startOf('month').toDate();
      const end_date = moment().endOf('month').toDate();
      andFilter["start_date"] = {
        $gt: start_date,
        $lt: end_date,
      };
    } else if (validationResult.date_type === 'previous_quarter') {
      const start_date = moment().subtract(1, 'quarter').startOf('quarter').toDate();
      const end_date = moment().subtract(1, 'quarter').endOf('quarter').toDate();
      andFilter["start_date"] = {
        $gt: start_date,
        $lt: end_date,
      };
    } else if (validationResult.date_type === 'current_quarter') {
      const start_date = moment().startOf('quarter').toDate();
      const end_date = moment().endOf('quarter').toDate();
      andFilter["start_date"] = {
        $gt: start_date,
        $lt: end_date,
      };
    } else {
      if (validationResult.start_date && validationResult.end_date) {
        const start_date = new Date(validationResult.start_date);
        start_date.setHours(0, 0, 0, 0);
        const end_date = new Date(validationResult.end_date);
        end_date.setHours(23, 59, 59, 59);
        andFilter["start_date"] = {
          $gt: start_date,
          $lt: end_date,
        };
      }
    }

    if (typeof validationResult.status !== "undefined") {
      andFilter["status"] = validationResult.status;
    }

    if (typeof validationResult.isActive !== "undefined") {
      andFilter["isActive"] = validationResult.isActive;
    }

    let queryDoc = [
      {
        $lookup: {
          from: "eventtypes",
          localField: "event_type_id",
          foreignField: "_id",
          as: "event_type",
        },
      },
      {
        $unwind: {
          path: "$event_type",
          preserveNullAndEmptyArrays: true,
        },
      },
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
        $lookup: {
          from: "event_users",
          localField: "_id",
          foreignField: "event_id",
          as: "event_user",
        },
      },
      {
        $unwind: {
          path: "$event_user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "departments",
          foreignField: "_id",
          as: "departmentList",
        },
      },
      {
        $match: {
          "event_user.user_id": mongoose.Types.ObjectId(validationResult.user_id),
          "status": "upcoming",
        },
      },
      {
        $project: {
          user_id: { $ifNull: ["$event_user.user_id", ""] },
          event: {
            _id: "$_id",
            event_name: "$event_name",
            description: { $ifNull: ["$description", ""] },
            event_image: { $ifNull: ["$event_image", ""] },
            start_date: { $ifNull: ["$start_date", ""] },
            end_date: { $ifNull: ["$end_date", ""] },
            start_time: { $ifNull: ["$start_time", ""] },
            end_time: { $ifNull: ["$end_time", ""] },
            credit: { $ifNull: ["$credit", ""] },
            venue_url: { $ifNull: ["$venue_url", ""] },
            venue: { $ifNull: ["$venue", ""] },
            isAccept: { $ifNull: ["$event_user.isAccept", "pending"] },
            event_dates: {
              $filter: {
                input: "$event_dates",
                as: "item",
                cond: {
                  $and: [
                    {
                      $gt: [
                        "$$item.start", now
                      ]
                    },
                  ]
                }
              }
            },
          },
          host_users: {
            $ifNull: [
              {
                $map: {
                  input: "$host_users",
                  as: "host_user",
                  in: {
                    _id: "$$host_user._id",
                    first_name: "$$host_user.first_name",
                    last_name: "$$host_user.last_name",
                    user_img: "$$host_user.user_img",
                  },
                },
              },
              [],
            ],
          },
          departments: {
            $ifNull: [
              {
                $map: {
                  input: "$departmentList",
                  as: "department",
                  in: {
                    _id: "$$department._id",
                    department_name: "$$department.department_name",
                  },
                },
              },
              [],
            ],
          },
        },
      },
      // {
      //   $match: {
      //     $and: [
      //       { "event_dates": { $ne: null } },
      //       { "event_dates": { $ne: [] } }
      //     ]
      //   }
      // }
    ];

    let queryCount = queryDoc;

    queryDoc = [...queryDoc, ...[{ $sort: sort }, { $skip: skip }, { $limit: limit }]];

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
    const data = await Events.aggregate(queryDoc).exec();
    const unidata = _.uniqBy(data, "event_name")
    const totalEvents = await Events.aggregate(queryCount).exec();
    const totalFilteredPage =
      totalEvents?.length > 0 && totalEvents[0].count
        ? Math.ceil(totalEvents[0].count / limit)
        : 0;
    if (data && data.length > 0) {
      return res.json({
        status: configs.success_status,
        data,
        metaData: {
          currentPage: pageNum,
          totalFilteredCount: totalEvents[0].count,
          totalFilteredPage,
        },
        message: "Request completed successfully",
      });
    } else {
      return res.json({
        status: configs.success_status,
        data: [],
        metaData: {
          currentPage: 1,
          totalFilteredCount: 0,
          totalFilteredPage: 0,
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
exports.liveEvents = async (req, res, next) => {
  try {
    const schema = Joi.object({
      pageNum: Joi.number().default(1),
      user_id: Joi.string(),
      pageLimit: Joi.number().default(10),
      search: Joi.string(),
      date_type: Joi.string(),
      isActive: Joi.boolean(),
    });
    const validationResult = await schema.validateAsync(req.body);

    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const now = moment().toDate();
    const orFilter = {};
    const andFilter = {};
    const sort = { "_id": -1 };

    if (validationResult.search) {
      orFilter["event_name"] = {
        $regex: validationResult.search,
        $options: "i",
      };
    }

    if (validationResult.departments?.length > 0) {
      const departArr = validationResult.departments.map((item) =>
        mongoose.Types.ObjectId(item)
      );
      andFilter["departments"] = { $in: departArr };
    }

    if (validationResult.event_types) {
      const eventTypeArr = validationResult.event_types.map((item) =>
        mongoose.Types.ObjectId(item)
      );
      andFilter["event_type_id"] = { $in: eventTypeArr };
    }

    if (validationResult.date_type === 'previous_month') {
      const start_date = moment().subtract(1, 'months').startOf('month').toDate();
      const end_date = moment().subtract(1, 'months').endOf('month').toDate();
      andFilter["start_date"] = {
        $gt: start_date,
        $lt: end_date,
      };
    } else if (validationResult.date_type === 'current_month') {
      const start_date = moment().startOf('month').toDate();
      const end_date = moment().endOf('month').toDate();
      andFilter["start_date"] = {
        $gt: start_date,
        $lt: end_date,
      };
    } else if (validationResult.date_type === 'previous_quarter') {
      const start_date = moment().subtract(1, 'quarter').startOf('quarter').toDate();
      const end_date = moment().subtract(1, 'quarter').endOf('quarter').toDate();
      andFilter["start_date"] = {
        $gt: start_date,
        $lt: end_date,
      };
    } else if (validationResult.date_type === 'current_quarter') {
      const start_date = moment().startOf('quarter').toDate();
      const end_date = moment().endOf('quarter').toDate();
      andFilter["start_date"] = {
        $gt: start_date,
        $lt: end_date,
      };
    } else {
      if (validationResult.start_date && validationResult.end_date) {
        const start_date = new Date(validationResult.start_date);
        start_date.setHours(0, 0, 0, 0);
        const end_date = new Date(validationResult.end_date);
        end_date.setHours(23, 59, 59, 59);
        andFilter["start_date"] = {
          $gt: start_date,
          $lt: end_date,
        };
      }
    }

    if (typeof validationResult.status !== "undefined") {
      andFilter["status"] = validationResult.status;
    }

    if (typeof validationResult.isActive !== "undefined") {
      andFilter["isActive"] = validationResult.isActive;
    }

    let queryDoc = [
      {
        $lookup: {
          from: "eventtypes",
          localField: "event_type_id",
          foreignField: "_id",
          as: "event_type",
        },
      },
      {
        $unwind: {
          path: "$event_type",
          preserveNullAndEmptyArrays: true,
        },
      },
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
        $lookup: {
          from: "event_users",
          localField: "_id",
          foreignField: "event_id",
          as: "event_user",
        },
      },
      {
        $unwind: {
          path: "$event_user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "departments",
          foreignField: "_id",
          as: "departmentList",
        },
      },
      {
        $match: {
          "event_user.user_id": mongoose.Types.ObjectId(validationResult.user_id),
          "status": "inprogress",
        },
      },
      {
        $project: {
          user_id: { $ifNull: ["$event_user.user_id", ""] },
          event: {
            _id: "$_id",
            event_name: "$event_name",
            description: { $ifNull: ["$description", ""] },
            event_image: { $ifNull: ["$event_image", ""] },
            start_date: { $ifNull: ["$start_date", ""] },
            end_date: { $ifNull: ["$end_date", ""] },
            start_time: { $ifNull: ["$start_time", ""] },
            end_time: { $ifNull: ["$end_time", ""] },
            credit: { $ifNull: ["$credit", ""] },
            venue_url: { $ifNull: ["$venue_url", ""] },
            venue: { $ifNull: ["$venue", ""] },
            isAccept: { $ifNull: ["$event_user.isAccept", "pending"] },
            event_dates: {
              $filter: {
                input: "$event_dates",
                as: "item",
                cond: {
                  $and: [
                    {
                      $lt: [
                        "$$item.start", now
                      ]
                    },
                    {
                      $gt: [
                        "$$item.end", now
                      ]
                    }
                  ]
                }
              }
            },
          },
          host_users: {
            $ifNull: [
              {
                $map: {
                  input: "$host_users",
                  as: "host_user",
                  in: {
                    _id: "$$host_user._id",
                    first_name: "$$host_user.first_name",
                    last_name: "$$host_user.last_name",
                    user_img: "$$host_user.user_img",
                  },
                },
              },
              [],
            ],
          },
          departments: {
            $ifNull: [
              {
                $map: {
                  input: "$departmentList",
                  as: "department",
                  in: {
                    _id: "$$department._id",
                    department_name: "$$department.department_name",
                  },
                },
              },
              [],
            ],
          },
        },
      },
    ];

    let queryCount = queryDoc;

    queryDoc = [...queryDoc, ...[{ $sort: sort }, { $skip: skip }, { $limit: limit }]];

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
    const data = await Events.aggregate(queryDoc).exec();
    const unidata = _.uniqBy(data, "event_name")
    const totalEvents = await Events.aggregate(queryCount).exec();
    const totalFilteredPage =
      totalEvents?.length > 0 && totalEvents[0].count
        ? Math.ceil(totalEvents[0].count / limit)
        : 0;
    if (data && data.length > 0) {
      return res.json({
        status: configs.success_status,
        data,
        metaData: {
          currentPage: pageNum,
          totalFilteredCount: totalEvents[0].count,
          totalFilteredPage,
        },
        message: "Request completed successfully",
      });
    } else {
      return res.json({
        status: configs.success_status,
        data: [],
        metaData: {
          currentPage: 1,
          totalFilteredCount: 0,
          totalFilteredPage: 0,
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
// exports.liveEvents = async (req, res, next) => {
//   try {
//     const schema = Joi.object({
//       user_id: Joi.string().required(),
//       pageNum: Joi.number().default(1),
//       pageLimit: Joi.number().default(5000),
//       search: Joi.string(),
//     });
//     const validationResult = await schema.validateAsync(req.body);

//     const pageNum = validationResult.pageNum;
//     const limit = validationResult.pageLimit;
//     const skip = limit * (pageNum - 1);
//     const sort = { "event._id": -1 };
//     const now = moment().toDate();

//     const filter = {};
//     if (validationResult.search) {
//       filter["event.event_name"] = {
//         $regex: validationResult.search,
//         $options: "i",
//       };
//     }

//     let queryDoc = [
//       {
//         $lookup: {
//           from: "events",
//           localField: "event_id",
//           foreignField: "_id",
//           as: "event",
//         },
//       },
//       {
//         $unwind: {
//           path: "$event",
//         },
//       },
//       {
//         $lookup: {
//           from: "eventtypes",
//           localField: "event.event_type_id",
//           foreignField: "_id",
//           as: "event.event_type",
//         },
//       },
//       {
//         $unwind: {
//           path: "$event.event_type",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "event.host_users",
//           foreignField: "_id",
//           as: "event.host_users",
//         },
//       },
//       {
//         $unwind: {
//           path: "$event.host_user",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $lookup: {
//           from: "departments",
//           localField: "event.departments",
//           foreignField: "_id",
//           as: "event.departments",
//         },
//       },
//       {
//         $match: {
//           $and: [
//             { user_id: mongoose.Types.ObjectId(validationResult.user_id) },
//             { "event.status": "inprogress" },
//           ],
//         },
//       },
//       {
//         $project: {
//           user_id: { $ifNull: ["$user_id", ""] },
//           event: {
//             _id: "$event._id",
//             event_name: "$event.event_name",
//             description: { $ifNull: ["$event.description", ""] },
//             event_image: { $ifNull: ["$event.event_image", ""] },
//             status: { $ifNull: ["$event.status", ""] },
//             start_date: { $ifNull: ["$event.start_date", ""] },
//             end_date: { $ifNull: ["$event.end_date", ""] },
//             start_time: { $ifNull: ["$event.start_time", ""] },
//             end_time: { $ifNull: ["$event.end_time", ""] },
//             credit: { $ifNull: ["$event.credit", ""] },
//             venue_url: { $ifNull: ["$event.venue_url", ""] },
//             venue: { $ifNull: ["$event.venue", ""] },
//             isAccept: { $ifNull: ["$isAccept", "pending"] },
//             event_dates: {
//               $filter: {
//                 input: "$event.event_dates",
//                 as: "item",
//                 cond: {
//                   $and: [
//                     {
//                       $gt: [
//                         "$$item.start", now
//                       ]
//                     },
//                   ]
//                 }
//               }
//             },
//           },
//           departments: {
//             $ifNull: [
//               {
//                 $map: {
//                   input: "$event.departments",
//                   as: "department",
//                   in: {
//                     _id: "$$department._id",
//                     department_name: "$$department.department_name",
//                   },
//                 },
//               },
//               [],
//             ],
//           },
//           host_users: {
//             $ifNull: [
//               {
//                 $map: {
//                   input: "$event.host_users",
//                   as: "host_user",
//                   in: {
//                     _id: "$$host_user._id",
//                     first_name: "$$host_user.first_name",
//                     last_name: "$$host_user.last_name",
//                     user_img: "$$host_user.user_img",
//                   },
//                 },
//               },
//               [],
//             ],
//           },
//         },
//       },
//       {
//         $match: {
//           $and: [
//             { "event_dates": { $ne: null } },
//             { "event_dates": { $ne: [] } }
//           ]
//         }
//       }
//     ];

//     let queryCount = queryDoc;

//     queryDoc = [
//       ...queryDoc,
//       ...[{ $sort: { start_date: -1 } }, { $skip: skip }, { $limit: limit }],
//     ];

//     queryCount = [
//       ...queryCount,
//       ...[
//         {
//           $group: {
//             _id: null,
//             count: { $sum: 1 },
//           },
//         },
//       ],
//     ];

//     const data = await EventUser.aggregate(queryDoc).exec();
//     const totalEvents = await EventUser.aggregate(queryCount).exec();
//     const totalFilteredPage =
//       totalEvents?.length > 0 && totalEvents[0].count
//         ? Math.ceil(totalEvents[0].count / limit)
//         : 0;
//     if (data && data.length > 0) {
//       return res.json({
//         status: configs.success_status,
//         data,
//         metaData: {
//           currentPage: pageNum,
//           totalFilteredCount: totalEvents[0].count,
//           totalFilteredPage,
//         },
//         message: "Request completed successfully",
//       });
//     } else {
//       return res.json({
//         status: configs.success_status,
//         data,
//         metaData: {
//           currentPage: 1,
//           totalFilteredCount: 0,
//           totalFilteredPage: 0,
//         },
//         message: "No data found",
//       });
//     }
//   } catch (error) {
//     console.log(error);
//     return res.json({
//       status: configs.error_status,
//       message: configs.errMessage,
//       error: error ? error : "",
//     });
//   }
// };
exports.previousEvents = async (req, res, next) => {
  try {
    const schema = Joi.object({
      pageNum: Joi.number().default(1),
      user_id: Joi.string(),
      pageLimit: Joi.number().default(10),
      search: Joi.string(),
      date_type: Joi.string(),
      isActive: Joi.boolean(),
    });
    const validationResult = await schema.validateAsync(req.body);

    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const now = moment().toDate();
    const orFilter = {};
    const andFilter = {};
    const sort = { "_id": -1 };

    if (validationResult.search) {
      orFilter["event_name"] = {
        $regex: validationResult.search,
        $options: "i",
      };
    }

    if (validationResult.departments?.length > 0) {
      const departArr = validationResult.departments.map((item) =>
        mongoose.Types.ObjectId(item)
      );
      andFilter["departments"] = { $in: departArr };
    }

    if (validationResult.event_types) {
      const eventTypeArr = validationResult.event_types.map((item) =>
        mongoose.Types.ObjectId(item)
      );
      andFilter["event_type_id"] = { $in: eventTypeArr };
    }

    if (validationResult.date_type === 'previous_month') {
      const start_date = moment().subtract(1, 'months').startOf('month').toDate();
      const end_date = moment().subtract(1, 'months').endOf('month').toDate();
      andFilter["start_date"] = {
        $gt: start_date,
        $lt: end_date,
      };
    } else if (validationResult.date_type === 'current_month') {
      const start_date = moment().startOf('month').toDate();
      const end_date = moment().endOf('month').toDate();
      andFilter["start_date"] = {
        $gt: start_date,
        $lt: end_date,
      };
    } else if (validationResult.date_type === 'previous_quarter') {
      const start_date = moment().subtract(1, 'quarter').startOf('quarter').toDate();
      const end_date = moment().subtract(1, 'quarter').endOf('quarter').toDate();
      andFilter["start_date"] = {
        $gt: start_date,
        $lt: end_date,
      };
    } else if (validationResult.date_type === 'current_quarter') {
      const start_date = moment().startOf('quarter').toDate();
      const end_date = moment().endOf('quarter').toDate();
      andFilter["start_date"] = {
        $gt: start_date,
        $lt: end_date,
      };
    } else {
      if (validationResult.start_date && validationResult.end_date) {
        const start_date = new Date(validationResult.start_date);
        start_date.setHours(0, 0, 0, 0);
        const end_date = new Date(validationResult.end_date);
        end_date.setHours(23, 59, 59, 59);
        andFilter["start_date"] = {
          $gt: start_date,
          $lt: end_date,
        };
      }
    }

    if (typeof validationResult.status !== "undefined") {
      andFilter["status"] = validationResult.status;
    }

    if (typeof validationResult.isActive !== "undefined") {
      andFilter["isActive"] = validationResult.isActive;
    }

    let queryDoc = [
      {
        $lookup: {
          from: "eventtypes",
          localField: "event_type_id",
          foreignField: "_id",
          as: "event_type",
        },
      },
      {
        $unwind: {
          path: "$event_type",
          preserveNullAndEmptyArrays: true,
        },
      },
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
        $lookup: {
          from: "event_users",
          localField: "_id",
          foreignField: "event_id",
          as: "event_user",
        },
      },
      {
        $unwind: {
          path: "$event_user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "departments",
          foreignField: "_id",
          as: "departmentList",
        },
      },
      {
        $match: {
          "event_user.user_id": mongoose.Types.ObjectId(validationResult.user_id),
          "status": "completed",
        },
      },
      {
        $project: {
          user_id: { $ifNull: ["$event_user.user_id", ""] },
          event: {
            _id: "$_id",
            event_name: "$event_name",
            description: { $ifNull: ["$description", ""] },
            event_image: { $ifNull: ["$event_image", ""] },
            start_date: { $ifNull: ["$start_date", ""] },
            end_date: { $ifNull: ["$end_date", ""] },
            start_time: { $ifNull: ["$start_time", ""] },
            end_time: { $ifNull: ["$end_time", ""] },
            credit: { $ifNull: ["$credit", ""] },
            venue_url: { $ifNull: ["$venue_url", ""] },
            venue: { $ifNull: ["$venue", ""] },
            isAccept: { $ifNull: ["$isAccept", "pending"] },
            event_dates: {
              $filter: {
                input: "$event_dates",
                as: "item",
                cond: {
                  $and: [
                    {
                      $lt: [
                        "$$item.end", now
                      ]
                    },
                  ]
                }
              }
            },
          },
          host_users: {
            $ifNull: [
              {
                $map: {
                  input: "$host_users",
                  as: "host_user",
                  in: {
                    _id: "$$host_user._id",
                    first_name: "$$host_user.first_name",
                    last_name: "$$host_user.last_name",
                    user_img: "$$host_user.user_img",
                  },
                },
              },
              [],
            ],
          },
          departments: {
            $ifNull: [
              {
                $map: {
                  input: "$departmentList",
                  as: "department",
                  in: {
                    _id: "$$department._id",
                    department_name: "$$department.department_name",
                  },
                },
              },
              [],
            ],
          },
        },
      },
    ];

    let queryCount = queryDoc;

    queryDoc = [...queryDoc, ...[{ $sort: sort }, { $skip: skip }, { $limit: limit }]];

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
    const data = await Events.aggregate(queryDoc).exec();
    console.log('data', data);
    const unidata = _.uniqBy(data, "event_name")
    const totalEvents = await Events.aggregate(queryCount).exec();
    const totalFilteredPage =
      totalEvents?.length > 0 && totalEvents[0].count
        ? Math.ceil(totalEvents[0].count / limit)
        : 0;
    if (data && data.length > 0) {
      return res.json({
        status: configs.success_status,
        data,
        metaData: {
          currentPage: pageNum,
          totalFilteredCount: totalEvents[0].count,
          totalFilteredPage,
        },
        message: "Request completed successfully",
      });
    } else {
      return res.json({
        status: configs.success_status,
        data: [],
        metaData: {
          currentPage: 1,
          totalFilteredCount: 0,
          totalFilteredPage: 0,
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
exports.eventAction = async (req, res, next) => {
  try {
    const event_action_enum = ["accepted", "deny"];
    const schema = Joi.object({
      user_id: Joi.string().required(),
      event_id: Joi.string().required(),
      event_action: Joi.string()
        .valid(...event_action_enum)
        .required(),
    }).unknown(true);

    const validationResult = await schema.validateAsync(req.body);

    const result = await EventUser.findOne({
      user_id: validationResult.user_id,
      event_id: validationResult.event_id,
    })
      .populate("event_id", "credit event_seats seats_booked")
      .populate("user_id", "credits")
      .exec();
    if (!result) {
      return res.send({
        status: configs.success_status,
        success: false,
        data: {
          isAccept: false,
          isSeatFull: false
        },
        message: "Event is not associated with you",
      });
    }
    if (
      !result.event_id ||
      !result.user_id ||
      typeof result.event_id.credit === undefined ||
      typeof result.user_id.credits === undefined
    ) {
      return res.send({
        status: configs.success_status,
        success: false,
        data: {
          isAccept: false,
          isSeatFull: false
        },
        message: "Unable to set event action",
      });
    }

    let event_credit = Math.round(result.event_id?.credit);
    let credits = Math.round(result.user_id?.credits);
    let seats_booked = Math.round(result.event_id?.seats_booked);
    if (validationResult.event_action === "accepted") {
      if (result.event_id.event_seats !== 0 && result.event_id.event_seats === result.event_id.seats_booked) {
        return res.send({
          status: configs.success_status,
          success: false,
          data: {
            isAccept: false,
            isSeatFull: true
          },
          message: "Event Seats Are Full!!",
        });
      }
      if (result.isAccept === "pending") {
        credits += event_credit;
        seats_booked = seats_booked + 1;
      } else if (result.isAccept === "deny") {
        credits += credits === 0 ? event_credit : event_credit * 2;
        seats_booked = seats_booked + 1;
      } else {
        return res.send({
          status: configs.success_status,
          success: true,
          data: {
            isAccept: true,
            isSeatFull: false
          },
          message: "You have already booked this seat",
        });
      }
    } else if (validationResult.event_action === "deny") {
      if (result.isAccept === "pending") {
        credits -= event_credit;
      } else if (result.isAccept === "accepted") {
        credits -= event_credit * 2;
        seats_booked = seats_booked - 1;
      }
    }
    credits = credits < 0 ? 0 : credits;
    seats_booked = seats_booked < 0 ? 0 : seats_booked;
    const updatedEventseat = await Events.findByIdAndUpdate(
      result.event_id,
      {
        $set: {
          seats_booked,
        },
      },
      { new: true }
    ).exec();

    const updatedUserEvent = await EventUser.findByIdAndUpdate(
      result._id,
      {
        $set: {
          isAccept: validationResult.event_action,
        },
      },
      { new: true }
    ).exec();
    if (!updatedUserEvent) {
      return res.send({
        status: configs.success_status,
        success: false,
        data: {
          isAccept: false,
          isSeatFull: false
        },
        message: "Unable to set event action",
      });
    }
    return res.send({
      status: configs.success_status,
      success: true,
      data: {
        isAccept: validationResult.event_action === "accepted" ? true : false,
        update_credits: credits,
        updatedEventseat: seats_booked,
        isSeatFull: false
      },
      message: "Event Action completed successfully",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: configs.error_status,
      message: configs.errMessage,
      error: error ? error : "",
    });
  }
};

exports.myScoreAllEvent = async (req, res) => {
  try {
    const schema = Joi.object({
      user_id: Joi.string().required(),
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(5000),
      search: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);

    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const sort = { _id: -1 };

    const filter = {};
    if (validationResult.search) {
      filter["event.event_name"] = {
        $regex: validationResult.search,
        $options: "i",
      };
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
        },
      },
      {
        $match: {
          user_id: mongoose.Types.ObjectId(validationResult.user_id),
          $or: [filter],
        },
      },
      {
        $project: {
          event: {
            _id: "$event._id",
            event_name: "$event.event_name",
            description: { $ifNull: ["$event.description", ""] },
            event_image: { $ifNull: ["$event.event_image", ""] },
            start_date: { $ifNull: ["$event.start_date", ""] },
            end_date: { $ifNull: ["$event.end_date", ""] },
            start_time: { $ifNull: ["$event.start_time", ""] },
            end_time: { $ifNull: ["$event.end_time", ""] },
            credit: { $ifNull: ["$event.credit", ""] },
            venue: { $ifNull: ["$event.venue", ""] },
            venue_url: { $ifNull: ["$venue_url", ""] },
            isAccept: { $ifNull: ["$isAccept", "pending"] },
            creditFlag: {
              $switch: {
                branches: [
                  { case: { $eq: ["$isAccept", "accepted"] }, then: 1 },
                  { case: { $eq: ["$isAccept", "deny"] }, then: -1 },
                ],
                default: 0,
              },
            },
          },
        },
      },
    ];

    let queryCount = queryDoc;

    queryDoc = [
      ...queryDoc,
      ...[{ $skip: skip }, { $limit: limit }, { $sort: sort }],
    ];

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

    const data = await EventUser.aggregate(queryDoc).exec();

    const totalEvents = await EventUser.aggregate(queryCount).exec();
    const totalFilteredPage =
      totalEvents?.length > 0 && totalEvents[0].count
        ? Math.ceil(totalEvents[0].count / limit)
        : 0;

    if (data && data.length > 0) {
      return res.json({
        status: configs.success_status,
        data,
        metaData: {
          currentPage: pageNum,
          totalFilteredPage,
        },
        message: "Request completed successfully",
      });
    } else {
      return res.json({
        status: configs.success_status,
        data: [],
        metaData: {
          currentPage: 1,
          totalFilteredCount: 0,
          totalFilteredPage: 0,
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

exports.myScoreAttendedEvent = async (req, res) => {
  try {
    const schema = Joi.object({
      user_id: Joi.string().required(),
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(5000),
      search: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);

    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const sort = { _id: -1 };

    const filter = {};
    if (validationResult.search) {
      filter["event.event_name"] = {
        $regex: validationResult.search,
        $options: "i",
      };
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
        },
      },
      {
        $match: {
          user_id: mongoose.Types.ObjectId(validationResult.user_id),
          isAccept: "accepted",
          $or: [filter],
        },
      },
      {
        $project: {
          event: {
            _id: "$event._id",
            event_name: "$event.event_name",
            description: { $ifNull: ["$event.description", ""] },
            event_image: { $ifNull: ["$event.event_image", ""] },
            start_date: { $ifNull: ["$event.start_date", ""] },
            end_date: { $ifNull: ["$event.end_date", ""] },
            start_time: { $ifNull: ["$event.start_time", ""] },
            end_time: { $ifNull: ["$event.end_time", ""] },
            credit: { $ifNull: ["$event.credit", ""] },
            venue: { $ifNull: ["$event.venue", ""] },
            venue_url: { $ifNull: ["$venue_url", ""] },
            isAccept: { $ifNull: ["$isAccept", "pending"] },
            creditFlag: {
              $switch: {
                branches: [
                  { case: { $eq: ["$isAccept", "accepted"] }, then: 1 },
                  { case: { $eq: ["$isAccept", "deny"] }, then: -1 },
                ],
                default: 0,
              },
            },
          },
        },
      },
    ];

    let queryCount = queryDoc;

    queryDoc = [
      ...queryDoc,
      ...[{ $skip: skip }, { $limit: limit }, { $sort: sort }],
    ];

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

    const data = await EventUser.aggregate(queryDoc).exec();

    const totalEvents = await EventUser.aggregate(queryCount).exec();
    const totalFilteredPage =
      totalEvents?.length > 0 && totalEvents[0].count
        ? Math.ceil(totalEvents[0].count / limit)
        : 0;

    if (data && data.length > 0) {
      return res.json({
        status: configs.success_status,
        data,
        metaData: {
          currentPage: pageNum,
          totalFilteredPage,
        },
        message: "Request completed successfully",
      });
    } else {
      return res.json({
        status: configs.success_status,
        data: [],
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

exports.myScoreNotAttendedEvent = async (req, res) => {
  try {
    const schema = Joi.object({
      user_id: Joi.string().required(),
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(5000),
      search: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);

    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const sort = { _id: -1 };

    const filter = {};
    if (validationResult.search) {
      filter["event.event_name"] = {
        $regex: validationResult.search,
        $options: "i",
      };
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
        },
      },
      {
        $match: {
          user_id: mongoose.Types.ObjectId(validationResult.user_id),
          isAccept: { $in: ["deny", "pending"] },
          $or: [filter],
        },
      },
      {
        $project: {
          event: {
            _id: "$event._id",
            event_name: "$event.event_name",
            description: { $ifNull: ["$event.description", ""] },
            event_image: { $ifNull: ["$event.event_image", ""] },
            start_date: { $ifNull: ["$event.start_date", ""] },
            end_date: { $ifNull: ["$event.end_date", ""] },
            start_time: { $ifNull: ["$event.start_time", ""] },
            end_time: { $ifNull: ["$event.end_time", ""] },
            credit: { $ifNull: ["$event.credit", ""] },
            venue: { $ifNull: ["$event.venue", ""] },
            venue_url: { $ifNull: ["$venue_url", ""] },
            isAccept: { $ifNull: ["$isAccept", "pending"] },
            creditFlag: {
              $switch: {
                branches: [
                  { case: { $eq: ["$isAccept", "accepted"] }, then: 1 },
                  { case: { $eq: ["$isAccept", "deny"] }, then: -1 },
                ],
                default: 0,
              },
            },
          },
        },
      },
    ];

    let queryCount = queryDoc;

    queryDoc = [
      ...queryDoc,
      ...[{ $skip: skip }, { $limit: limit }, { $sort: sort }],
    ];

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

    const data = await EventUser.aggregate(queryDoc).exec();
    const totalEvents = await EventUser.aggregate(queryCount).exec();
    const totalFilteredPage =
      totalEvents?.length > 0 && totalEvents[0].count
        ? Math.ceil(totalEvents[0].count / limit)
        : 0;

    if (data && data.length > 0) {
      return res.json({
        status: configs.success_status,
        data,
        metaData: {
          currentPage: pageNum,
          totalFilteredPage,
        },
        message: "Request completed successfully",
      });
    } else {
      return res.json({
        status: configs.success_status,
        data: [],
        metaData: {
          currentPage: 1,
          totalFilteredCount: 0,
          totalFilteredPage: 0,
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

exports.eventClone = async (req, res, next) => {
  try {
    const schema = Joi.object({
      user_id: Joi.string().required()
    })

    const validationResult = await schema.validateAsync(req.body);

    const data = await Events.findById(req.params.id).exec();
    data._id = mongoose.Types.ObjectId();
    data.isNew = true;

    data.seats_booked = 0;
    data.createdBy = validationResult.user_id;
    data.updatedBy = validationResult.user_id;
    delete data.created_At;
    delete data.updated_At;

    data.event_image = await Promise.all(data.event_image.map(async (item) => {
      // File at destination will be created or overwritten by default.
      const fileExtension = path.extname(item);
      const fname = `event_image-${Date.now()}${fileExtension}`;
      const originalFilePath = `${uploadEventImageFilePath}/${item}`;
      if (originalFilePath && fs.existsSync(originalFilePath)) {
        fs.copyFileSync(originalFilePath, `${uploadEventImageFilePath}${fname}`);
      }
      return fname;
    }));

    const new_event = await data.save();
    return res.json({
      status: configs.success_status,
      data: new_event,
      message: 'Request completed successfully'
    });
  } catch (error) {
    console.log(error)
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
}

exports.participateUsers = async (req, res, next) => {
  try {
    const schema = Joi.object({
      event_id: Joi.string().required(),
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(10),
      search: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);

    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const sort = { _id: -1 };

    const filter = {};
    if (validationResult.search) {
      filter["event.event_name"] = {
        $regex: validationResult.search,
        $options: "i",
      };
    }

    let queryDoc = [
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "participateUser",
        },
      },
      {
        $unwind: {
          path: "$participateUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "participateUser.department_id",
          foreignField: "_id",
          as: "department",
        },
      },
      {
        $match: {
          "event_id": mongoose.Types.ObjectId(validationResult.event_id),
          "isAccept": "accepted",
          "participateUser.isDeleted": false
        },
      },
      {
        $project: {
          participateUser: {
            _id: "$participateUser._id",
            first_name: "$participateUser.first_name",
            last_name: "$participateUser.last_name",
            user_img: {
              $ifNull: ["$participateUser.user_img", ""],
            },
          },
          department: "$department.department_name",
        },
      },
    ];

    let queryCount = queryDoc;

    queryDoc = [
      ...queryDoc,
      ...[{ $skip: skip }, { $limit: limit }, { $sort: sort }],
    ];

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

    const data = await EventUser.aggregate(queryDoc).exec();

    const totalEvents = await EventUser.aggregate(queryCount).exec();
    const totalFilteredPage =
      totalEvents?.length > 0 && totalEvents[0].count
        ? Math.ceil(totalEvents[0].count / limit)
        : 0;

    if (data && data.length > 0) {
      return res.json({
        status: configs.success_status,
        data,
        metaData: {
          currentPage: pageNum,
          totalFilteredCount: totalEvents[0].count,
          totalFilteredPage,
        },
        message: "Request completed successfully",
      });
    } else {
      return res.json({
        status: configs.success_status,
        data: [],
        metaData: {
          currentPage: 1,
          totalFilteredCount: 0,
          totalFilteredPage: 0,
        },
        message: "No data found",
      });
    }
  } catch (error) {
    console.log(error)
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
}

exports.eventDropdownList = async (req, res, next) => {
  try {
    const data = await Events.find()
      .select({ event_name: 1 })
      .exec();
    return res.json({
      status: configs.success_status,
      data,
      message: 'Request completed successfully'
    });
  } catch (error) {
    console.log(error)
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
};

exports.eventStatus = async (req, res, next) => {
  try {
    const status_enum = ["inprogress", "completed", "cancel"];
    const schema = Joi.object({
      event_id: Joi.string().required(),
      event_status: Joi.string()
        .valid(...status_enum)
        .required(),
    }).unknown(true);

    const validationResult = await schema.validateAsync(req.body);

    const result = await Events.findByIdAndUpdate(
      validationResult.event_id,
      {
        $set: {
          status: validationResult.event_status,
        },
      },
      { new: true }
    ).exec();
    if (!result) {
      return res.send({
        status: configs.success_status,
        success: false,
        data: {
          isCompleted: false,
        },
        message: "Event is not associated with you",
      });
    }

    if (result.status !== 'completed' && result?.host_user_id) {
      const userData = await Users.findById(result?.host_user_id).exec();
      let event_credit = Math.round(result?.credit);
      let credits = Math.round(userData?.credits);
      credits -= event_credit;
      credits += 2;
      userData.credits = credits < 0 ? 0 : credits;
      userData.save();
    }
    return res.send({
      status: configs.success_status,
      success: true,
      data: {
        isCompleted: validationResult.event_status === "completed" ? true : false,
      },
      message: "Event Action completed successfully",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: configs.error_status,
      message: configs.errMessage,
      error: error ? error : "",
    });
  }
};

exports.saveEventNotification = async (req, res, next) => {
  try {
    let receivedBody = req.body;

    const schema = Joi.object({
      event_notification_list: Joi.array(),
    });
    const validationResult = await schema.validateAsync(receivedBody);
    const new_event = {
      event_notification_list: validationResult.event_notification_list,
    };
    const data = await Events.findByIdAndUpdate(
      req.params.id,
      { $set: new_event },
      { new: true }
    ).exec();
    if (data) {
      return res.json({
        status: configs.success_status,
        data,
        message: "Event updated successfully",
      });
    } else {
      return res.json({
        status: configs.success_status,
        data,
        message: "Event not found!",
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

exports.designationDropdownList = async (req, res, next) => {
  try {
    const data = await Designation.find()
      .exec();
    return res.json({
      status: configs.success_status,
      data,
      message: 'Request completed successfully'
    });
  } catch (error) {
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
};

exports.totalUser = async (req, res, next) => {
  try {
    const schema = Joi.object({
      event_id: Joi.string().required(),
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(10),
      search: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);

    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const sort = { _id: -1 };

    const filter = {};
    if (validationResult.search) {
      filter["event.event_name"] = {
        $regex: validationResult.search,
        $options: "i",
      };
    }

    let queryDoc = [
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "totalUser",
        },
      },
      {
        $unwind: {
          path: "$totalUser",
          preserveNullAndEmptyArrays: true,
        },
      },
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
        $lookup: {
          from: "departments",
          localField: "totalUser.department_id",
          foreignField: "_id",
          as: "department",
        },
      },
      {
        $match: {
          "event_id": mongoose.Types.ObjectId(validationResult.event_id),
          "totalUser.isDeleted": false
        },
      },
      {
        $project: {
          totalUser: {
            _id: "$totalUser._id",
            first_name: "$totalUser.first_name",
            last_name: "$totalUser.last_name",
            user_img: {
              $ifNull: ["$totalUser.user_img", ""],
            },
          },
          isAccept: { $ifNull: ["$isAccept", "pending"] },
          department: "$department.department_name",
        },
      },
    ];

    let queryCount = queryDoc;

    queryDoc = [
      ...queryDoc,
      ...[{ $skip: skip }, { $limit: limit }, { $sort: sort }],
    ];

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

    const data = await EventUser.aggregate(queryDoc).exec();

    const totalEvents = await EventUser.aggregate(queryCount).exec();
    const totalFilteredPage =
      totalEvents?.length > 0 && totalEvents[0].count
        ? Math.ceil(totalEvents[0].count / limit)
        : 0;

    if (data && data.length > 0) {
      return res.json({
        status: configs.success_status,
        data,
        metaData: {
          currentPage: pageNum,
          totalFilteredCount: totalEvents[0].count,
          totalFilteredPage,
        },
        message: "Request completed successfully",
      });
    } else {
      return res.json({
        status: configs.success_status,
        data: [],
        metaData: {
          currentPage: 1,
          totalFilteredCount: 0,
          totalFilteredPage: 0,
        },
        message: "No data found",
      });
    }
  } catch (error) {
    console.log(error)
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
}