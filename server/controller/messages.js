const moment = require('moment');
const Joi = require('joi');
const mongoose = require('mongoose');
const Messages = mongoose.model("messages");
const Conversions = mongoose.model("conversions");
const Users = mongoose.model('users');
const configs = require("../configs");
const MessageUser = mongoose.model('message_user');
const Notification = mongoose.model("notifications");
const { sendNotification } = require('../services/notificationService');

exports.addMessage = async (req, res, next) => {
  try {

    const schema = Joi.object({
      org_id: Joi.string(),
      user_id: Joi.string(),
      receiver_user_id: Joi.string(),
      message: Joi.string(),
      message_type: Joi.string(),
    })

    const validationResult = await schema.validateAsync(req.body);

    const newConversion = new Conversions({
      org_id: validationResult.org_id,
      createdBy: validationResult.user_id,
      message_type: validationResult.message_type,
      message: validationResult.message
    });
    const mesaageData = await newConversion.save();

    const newMessage = new Messages({
      org_id: validationResult.org_id,
      sender_user_id: validationResult.user_id,
      receiver_user_id: validationResult.receiver_user_id,
      message_id: mesaageData._id,
      message_type: validationResult.message_type,
      message: validationResult.message
    });

    const data = await newMessage.save();

    const userData = await Users.findOne({
      _id: validationResult.receiver_user_id,
      isDeleted: false
    }).exec();

    const userData1 = await Users.findOne({
      _id: validationResult.user_id,
      isDeleted: false
    }).exec();
    if (userData) {
      let screen = 'message'
      let collapse_key = 'chat_detail'
      let title = `New Message from ${userData1.first_name} ${userData1.last_name}`;
      let body = `${data.message_type === 'text'? data.message: data.message_type.charAt(0).toUpperCase() + data.message_type.slice(1) }`;
      let details = {
        screen: 'message',
        id: data?._id ? data?._id : '',
        sender_user_id: userData1?._id ? userData1?._id: ''
      };

      const checkMessageUser = await MessageUser.exists({
        message_id: data._id,
        user_id: userData._id,
      });
      if (!checkMessageUser) {
        const new_message_user = new MessageUser({
          org_id: data.org_id,
          message_id: data._id,
          user_id: userData._id,
          createdBy: validationResult.user_id,
          updatedBy: validationResult.user_id,
        });
        await new_message_user.save();

        // const newCustomNotification = new Notification({
        //   org_id: validationResult.org_id,
        //   sender_user_id: validationResult.user_id,
        //   receiver_user_id: userData._id,
        //   message_id: data._id,
        //   custom_field: {
        //     notfication: {
        //       title,
        //       body,
        //     },
        //     data: {
        //       click_action: configs.click_action,
        //       collapse_key,
        //       ...details,
        //     }
        //   }
        // });
        // console.log('newCustomNotification', newCustomNotification);
        //await newCustomNotification.save();
        await sendNotification([userData._id],
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
    }

    return res.json({
      status: configs.success_status,
      data,
      message: 'Message Send successfully'
    });
  } catch (error) {
    console.log(error)
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
}
exports.MessageConversion = async (req, res, next) => {
  try {
    const schema = Joi.object({
      sender_user_id: Joi.string().required(),
      receiver_user_id: Joi.string().required(),
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(5000),
      search: Joi.string(),

    });

    const validationResult = await schema.validateAsync(req.body);

    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const sort = { _id: -1 };

    let queryDoc = [
      {
        $lookup: {
          from: 'users',
          localField: 'sender_user_id',
          foreignField: '_id',
          as: "sender_user"
        }
      },
      {
        $unwind: {
          path: "$sender_user",
          preserveNullAndEmptyArrays: true,
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'receiver_user_id',
          foreignField: '_id',
          as: "receiver_user"
        }
      },
      {
        $unwind: {
          path: "$receiver_user",
          preserveNullAndEmptyArrays: true,
        }
      },
      {
        $lookup: {
          from: "departments",
          localField: "sender_user.department_id",
          foreignField: "_id",
          as: "sender_user.department",
        },
      },
      {
        $unwind: {
          path: "$sender_user.department",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "receiver_user.department_id",
          foreignField: "_id",
          as: "receiver_user.department",
        },
      },
      {
        $unwind: {
          path: "$receiver_user.department",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $or: [
            {
              $and: [
                {
                  sender_user_id: mongoose.Types.ObjectId(validationResult.sender_user_id),
                },
                {
                  receiver_user_id: mongoose.Types.ObjectId(validationResult.receiver_user_id),
                },
              ]
            },
            {
              $and: [
                {
                  sender_user_id: mongoose.Types.ObjectId(validationResult.receiver_user_id),
                },
                {
                  receiver_user_id: mongoose.Types.ObjectId(validationResult.sender_user_id),
                },
              ]
            }
          ],
        },
      },
      {
        $project: {
          _id: "$_id",
          message: { $ifNull: ["$message", ""] },
          message_type: { $ifNull: ["$message_type", ""] },
          sender_user_id: { $ifNull: ["$sender_user_id", ""] },
          receiver_user_id: { $ifNull: ["$receiver_user_id", ""] },
          created_At: { $ifNull: ["$created_At", ""] },
          is_seen: { $ifNull: ["$is_seen", false] }
        },
      },
      {
        $sort: {
          _id: -1
        }
      }
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

    const data = await Messages.aggregate(queryDoc).exec();

    const totalEvents = await Messages.aggregate(queryCount).exec();
    const totalFilteredPage =
      totalEvents?.length > 0 && totalEvents[0].count
        ? Math.ceil(totalEvents[0].count / limit)
        : 0;

    if (data && data.length > 0) {
      res.json({
        status: configs.success_status,
        data,
        metaData: {
          currentPage: pageNum,
          totalFilteredCount: totalEvents[0].count,
          totalFilteredPage,
        },
        message: "Request completed successfully",
      });

      const checkMessage = await Messages.updateMany({
        _id: { $in: data.map(item => item._id) }
      }, {
        $set: {
          is_seen: true
        }
      }).exec();
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

exports.messageUsers = async (req, res, next) => {
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
      filter["message"] = {
        $regex: validationResult.search,
        $options: "i",
      };
    }

    const user_id = mongoose.Types.ObjectId(validationResult.user_id)

    let queryDoc = [
      {
        $lookup: {
          from: 'users',
          localField: 'sender_user_id',
          foreignField: '_id',
          as: "sender_user"
        }
      },
      {
        $unwind: {
          path: "$sender_user",
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'receiver_user_id',
          foreignField: '_id',
          as: "receiver_user"
        }
      },
      {
        $unwind: {
          path: "$receiver_user",
        }
      },
      {
        $lookup: {
          from: "departments",
          localField: "sender_user.department_id",
          foreignField: "_id",
          as: "sender_user.department",
        },
      },
      {
        $unwind: {
          path: "$sender_user.department",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "receiver_user.department_id",
          foreignField: "_id",
          as: "receiver_user.department",
        },
      },
      {
        $unwind: {
          path: "$receiver_user.department",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $or: [
            {
              sender_user_id: user_id,
            },
            {
              receiver_user_id: user_id,
            },
          ],
        },
      },
      {
        $project: {
          message: {
            _id: "$_id",
            message: { $ifNull: ["$message", ""] },
            message_type: { $ifNull: ["$message_type", ""] },
            sender_user_id: { $ifNull: ["$sender_user_id", ""] },
            receiver_user_id: { $ifNull: ["$receiver_user_id", ""] },
            created_At: { $ifNull: ["$created_At", ""] },
            is_seen: { $ifNull: ["$is_seen", false] }
          },
          sender_user: {
            _id: "$sender_user._id",
            full_name: { $concat: ["$sender_user.first_name", " ", "$sender_user.last_name"] },
            user_img: { $ifNull: ["$sender_user.user_img", ""] },
            department: { $ifNull: ["$sender_user.department.department_name", ""] }
          },
          receiver_user: {
            _id: "$receiver_user._id",
            full_name: { $concat: ["$receiver_user.first_name", " ", "$receiver_user.last_name"] },
            user_img: { $ifNull: ["$receiver_user.user_img", ""] },
            department: { $ifNull: ["$receiver_user.department.department_name", ""] }
          },
          senderToReceiver: [
            "$sender_user_id",
            "$receiver_user_id",
          ],
        },
      },
      {
        $unwind: "$senderToReceiver"
      },
      {
        $sort: {
          "senderToReceiver": 1
        }
      },
      {
        $group: {
          _id: "$_id",
          "senderToReceiver": {
            $push: "$senderToReceiver"
          },
          "sender_user": {
            "$first": "$sender_user"
          },
          "receiver_user": {
            "$first": "$receiver_user"
          },
          "message": {
            "$first": "$message"
          },
        }
      },
      {
        "$sort": {
          "message._id": -1,
          "message.created_At": -1
        }
      },
      {
        "$group": {
          "_id": "$senderToReceiver",
          "sender_user": {
            "$first": "$sender_user"
          },
          "receiver_user": {
            "$first": "$receiver_user"
          },
          "message": {
            "$first": "$message"
          },
        }
      },
      {
        $project: {
          _id: 0,
          message: 1,
          user: {
            $switch: {
              branches: [
                { case: { $eq: ["$sender_user._id", user_id] }, then: "$receiver_user" },
                { case: { $eq: ["$receiver_user._id", user_id] }, then: "$sender_user" },
              ]
            }
          }
        }
      },
      {
        "$sort": {
          "message._id": -1,
          "message.created_At": -1
        }
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

    const data = await Messages.aggregate(queryDoc).exec();
    const totalEvents = await Messages.aggregate(queryCount).exec();
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

exports.userList = async (req, res, next) => {
  try {
    const schema = Joi.object({
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(5000),
      search: Joi.string(),
      department_id: Joi.array(),
      designation_id: Joi.array(),
      isActivate: Joi.boolean(),
      role_id: Joi.string().default('60e68a875f40862222c64ecb'),
      event_types: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);
    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const orFilter = {};
    const andFilter = {};
    const andEventTypeFilter_1 = {};
    const andEventTypeFilter_2 = {};

    if (validationResult.search) {
      orFilter["full_name"] = {
        $regex: validationResult.search,
        $options: "i",
      };
    }
    if (typeof validationResult.isActivate !== "undefined") {
      andFilter["isDeleted"] = !validationResult.isActivate;
    }

    let queryDoc = [
      {
        $lookup: {
          from: "departments",
          localField: "department_id",
          foreignField: "_id",
          as: "department",
        },
      },
      {
        $unwind: {
          path: "$department",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "designations",
          localField: "designation_id",
          foreignField: "_id",
          as: "designation",
        },
      },
      {
        $unwind: {
          path: "$designation",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          role_id: mongoose.Types.ObjectId(validationResult.role_id),
          ...andEventTypeFilter_1,
        },
      },
      {
        $project: {
          _id: "$_id",
          full_name: { $concat: ["$first_name", " ", "$last_name"] },
          user_img: { $ifNull: ["$user_img", ""] },
          department: { department_name: { $ifNull: ["$department.department_name", ""] } },
          designation: { designation_name: { $ifNull: ["$designation.designation_name", ""] } },
        },
      },
      {
        $match: {
          ...andFilter,
          $or: [orFilter],
        },
      },
    ];

    let queryCount = queryDoc;

    queryDoc = [...queryDoc, ...[{ $skip: skip }, { $limit: limit }]];

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
    const data = await Users.aggregate(queryDoc).exec();
    const totalUsers = await Users.aggregate(queryCount).exec();
    const totalFilteredPage =
      totalUsers?.length > 0 && totalUsers[0].count
        ? Math.ceil(totalUsers[0].count / limit)
        : 0;
    if (data && data.length > 0) {
      return res.json({
        status: configs.success_status,
        data,
        metaData: {
          currentPage: pageNum,
          totalFilteredCount: totalUsers[0].count,
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

exports.deleteMessage = async (req, res, next) => {
  try {
    const schema = Joi.object({
      isDeleted: Joi.string().required(),
    });
    const validationResult = await schema.validateAsync(req.body);

    const message = {
      isDeleted: validationResult.isDeleted,
    };
    const data = await Messages.findByIdAndUpdate(req.params.id, { $set: message }, { new: true }).exec();
    if (data) {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Message Deleted successfully'
      });
    } else {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Message not found!'
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
};

exports.harddeleteSchedular = async (req, res, next) => {
  try {
    const date = new Date();
    const datestring =
      date.getMonth() + "-" + (date.getDate() + 1) + "-" + date.getFullYear();
    const data = await Messages.find().select({ deleted_At: 1 }).exec();
    const dateArray = [];
    const Idsofdeleted_At = [];
    data.map((item) => {
      dateArray.push(item.deleted_At);
      Idsofdeleted_At.push(item.id);
    });
    // console.log("dateArray", dateArray);
    // console.log("IdsofDeletedDate", IdsofDeletedDate);
    var daydiff;
    dateArray.map(async (item) => {
      let date2 = new Date(item);
      // console.log("date2", date2); 
      const datestring2 =
        date2.getMonth() +
        "-" +
        (date2.getDate() + 1) +
        "-" +
        date2.getFullYear();
      var d1 = new Date(datestring);
      var d2 = new Date(datestring2);

      var diff = d1.getTime() - d2.getTime();
      daydiff = diff / (1000 * 60 * 60 * 24);
      // console.log("daydiff", daydiff);
      if (daydiff >= 30) {
        const del = await Messages.deleteMany({ isDeleted: item });
        // console.log("deleted Sucessfully");
      } else {
        // console.log("No Data");
      }

    });
  } catch (error) {
    console.log(error);
  }
};

exports.ChangestatusSchedular = async (req, res, next) => {
  try {
    const date = new Date();
    const datestring =
      date.getMonth() + "-" + (date.getDate() + 1) + "-" + date.getFullYear();
    const data = await Messages.find().select({ created_At: 1 }).exec();
    // console.log("datadata",data);
    const dateArray = [];
    const Idsofcreated_At = [];
    data.map((item) => {
      dateArray.push(item.created_At);
      Idsofcreated_At.push(item.id);
    });
    // console.log("dateArray", dateArray);
    // console.log("IdsoflastloginDate", IdsoflastloginDate);
    var daydiff;
    dateArray.map(async (item) => {
      let date2 = new Date(item);
      //   console.log("date2", date2);
      const datestring2 =
        date2.getMonth() +
        "-" +
        (date2.getDate() + 1) +
        "-" +
        date2.getFullYear();
      var d1 = new Date(datestring);
      var d2 = new Date(datestring2);

      var diff = d1.getTime() - d2.getTime();
      daydiff = diff / (1000 * 60 * 60 * 24);
      //   console.log("daydiff", daydiff);
      if (daydiff >= 30) {
        //   console.log('item',item);
        const data = await Messages.updateMany(
          { created_At: item },
          { $set: { deleted_At: new Date() } }
        );
        // console.log("datadatadata",data);
        // console.log("User Inactive Sucessfully");
      } else {
        // console.log("No Data");
      }
    });
  } catch (error) {
    console.log(error);
  }
};

