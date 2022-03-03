const Joi = require("joi");
const _ = require('lodash');
const { generateCSV, generateXLSX } = require('../services/exportDataServices');
const moment = require('moment');
const mongoose = require("mongoose");
const Users = mongoose.model("users");
const Event = mongoose.model("events");
const Feedback = mongoose.model("feedbacks");
const BulkMessages = mongoose.model("bulk_messages");
const EventUser = mongoose.model("event_user");

const configs = require("../configs");

const multer = require('multer');
const path = require('path');
const mime = require('mime-types');
const fs = require("fs");

const uploadUserImageFilePath = 'uploads/user_images/';

var storageUserImageFiles = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadUserImageFilePath)
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
    cb(null, false); // else fails
  }
}
const uploadEventFile = multer({
  storage: storageUserImageFiles,
  fileFilter: fileFilter,
}).single('user_img')


exports.addAdminUser = async (req, res, next) => {
  uploadEventFile(req, res, async (data, err) => {
    if (err) {
      console.log(err);
      res.json({ status: configs.error_status, message: "Something went wrong while uploading files." });
    } else {
      try {
        let receivedBody = req.body;
        let user_img = req.file?.filename ? req.file.filename : null;
        receivedBody.user_img = user_img;
        const schema = Joi.object({
          org_id: Joi.string().required(),
          first_name: Joi.string().required(),
          last_name: Joi.string().required(),
          email: Joi.string().required(),
          password: Joi.string().required(),
          phone_number: Joi.string().required(),
          role_id: Joi.string().required(),
          user_img: Joi.string(),
          user_id: Joi.string().required(),
        });
        const validationResult = await schema.validateAsync(receivedBody);

        const isEmpPhone = await Users.findOne({ phone_number: validationResult.phone_number }).select('_id').exec();
        if (isEmpPhone) {
          return res.json({
            status: configs.error_status, message: "This Phone number is already Registered"
          });
        }

        const isEmpEmail = await Users.findOne({ email: validationResult.email }).select('_id').exec();
        if (isEmpEmail) {
          return res.json({
            status: configs.error_status, message: "This Email is already Registered"
          });
        }

        const newUser = new Users({
          org_id: validationResult.org_id,
          first_name: validationResult.first_name,
          last_name: validationResult.last_name,
          email: validationResult.email,
          password: validationResult.password,
          phone_number: validationResult.phone_number,
          user_img: validationResult.user_img,
          role_id: validationResult.role_id,
          createdBy: validationResult.user_id,
          updatedBy: validationResult.user_id,
        });

        const data = await newUser.save();
        if (data) {
          return res.json({
            status: configs.success_status,
            data,
            message: 'User Created Successfully'
          });
        }
      } catch (error) {
        return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
      }
    }
  })
}
exports.login = async (req, res, next) => {
  try {
    const schema = Joi.object({
      email: Joi.string().required(),
      password: Joi.string().required(),
    });
    const validationResult = await schema.validateAsync(req.body);
    const userData = await Users.findOne({
      email: validationResult.email,
    })
      .populate("role_id", "role_type")
      .populate("org_id", "_id org_name")
      .exec();
    if (!userData) {
      return res.json({
        status: configs.error_status,
        message: "Your email is invalid",
      });
    }
    if (userData.role_id.role_type !== "admin") {
      return res.status(401).json({
        status: configs.unauthorised_status,
        message: "You do not have access!",
      });
    }
    if (!userData.isActivate) {
      return res.json({
        status: configs.error_status,
        message: "Your Account is deactivated",
      });
    }
    userData.comparePassword(
      validationResult.password,
      function (error, isMatch) {
        if (error || !isMatch) {
          return res.json({
            status: configs.error_status,
            message: "Your email address or password is invalid",
          });
        }
        userData.password = undefined;
        const { _id, org_id, email, phone_number, first_name, last_name } =
          userData;
        const authData = {
          _id,
          org_id,
          email,
          phone_number,
          first_name,
          last_name,
        };
        const authToken = configs.createTokens(authData);
        return res.json({
          status: configs.success_status,
          data: userData,
          authToken,
          message: "Login successfull",
        });
      }
    );
  } catch (error) {
    console.log(error);
    return res.json({
      status: configs.error_status,
      message: configs.errMessage,
      error: error ? error : "",
    });
  }
};
exports.userById = async (req, res, next) => {
  try {
    const data = await Users.findOne({ _id: req.params.id })
      .populate("role_id", "role_type")
      .populate("org_id", "_id org_name")
      .select('org_id role_id user_img email phone_number first_name last_name')
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
        message: "User not found!",
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
exports.eventList = async (req, res, next) => {
  try {
    const status_enum = ['inprogress', 'completed', 'cancel', 'upcoming'];
    const schema = Joi.object({
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(10),
      search: Joi.string(),
      manual_users: Joi.array(),
      host_users: Joi.array(),
      departments: Joi.array(),
      designations: Joi.array(),
      event_types: Joi.array(),
      start_date: Joi.string(),
      end_date: Joi.string(),
      date_type: Joi.string(),
      status: Joi.string()
        .valid(...status_enum),
      isActive: Joi.boolean(),
    });
    const validationResult = await schema.validateAsync(req.body);

    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
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
          from: "departments",
          localField: "departments",
          foreignField: "_id",
          as: "departmentList",
        },
      },
      {
        $match: {
          ...andFilter,
          $or: [orFilter],
        },
      },
      {
        $project: {
          _id: "$_id",
          event_name: "$event_name",
          description: { $ifNull: ["$description", ""] },
          event_image: { $ifNull: ["$event_image", ""] },
          designation: { $ifNull: ["$designation", ""] },
          manual_users: { $ifNull: ["$manual_users", ""] },
          start_date: { $ifNull: ["$start_date", ""] },
          end_date: { $ifNull: ["$end_date", ""] },
          start_time: { $ifNull: ["$start_time", ""] },
          end_time: { $ifNull: ["$end_time", ""] },
          status: { $ifNull: ["$status", ""] },
          credit: { $ifNull: ["$credit", ""] },
          venue: { $ifNull: ["$venue", ""] },
          venue_url: { $ifNull: ["$venue_url", ""] },
          event_seats: { $ifNull: ["$event_seats", ""] },
          seats_booked: { $ifNull: ["$seats_booked", ""] },
          event_type: {
            _id: "$event_type._id",
            event_type: "$event_type.event_type",
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
    const data = await Event.aggregate(queryDoc).exec();
    const totalEvents = await Event.aggregate(queryCount).exec();
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
exports.upcomingEvents = async (req, res, next) => {
  try {
    const schema = Joi.object({
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(10),
      search: Joi.string(),
      departments: Joi.array(),
      host_users: Joi.array(),
      event_types: Joi.array(),
      start_date: Joi.string(),
      end_date: Joi.string(),
      date_type: Joi.string(),
      isActive: Joi.boolean(),
    });
    const validationResult = await schema.validateAsync(req.body);

    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const orFilter = {};
    const andFilter = {};
    const sort = { "_id": -1 };
    const now = moment().toDate();
    //now.setHours(0, 0, 0, 0);

    const filter = {};

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

    // if (typeof validationResult.status !== "undefined") {
    //   andFilter["status"] = validationResult.status;
    // }

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
          from: "departments",
          localField: "departments",
          foreignField: "_id",
          as: "departmentList",
        },
      },
      {
        $match: {
          "status": "upcoming",
          ...andFilter,
          $or: [filter],
        },
      },
      {
        $project: {
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
          event_type: {
            _id: "$event_type._id",
            event_type: "$event_type.event_type",
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
          }
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

    queryDoc = [
      ...queryDoc,
      ...[{ $sort: sort }, { $skip: skip }, { $limit: limit },],
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

    const data = await Event.aggregate(queryDoc).exec();

    const totalEvents = await Event.aggregate(queryCount).exec();
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
        data,
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
exports.previousEvents = async (req, res, next) => {
  try {
    const schema = Joi.object({
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(10),
      search: Joi.string(),
      host_users: Joi.array(),
      departments: Joi.array(),
      event_types: Joi.array(),
      start_date: Joi.string(),
      end_date: Joi.string(),
      date_type: Joi.string(),
      isActive: Joi.boolean(),
    });
    const validationResult = await schema.validateAsync(req.body);

    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const orFilter = {};
    const andFilter = {};
    const sort = { "_id": -1 };
    const now = moment().toDate();
    // now.setHours(0, 0, 0, 0);

    const filter = {};
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

    // if (typeof validationResult.status !== "undefined") {
    //   andFilter["status"] = validationResult.status;
    // }

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
          from: "departments",
          localField: "departments",
          foreignField: "_id",
          as: "departmentList",
        },
      },
      {
        $match: {
          "status": "completed",
          ...andFilter,
          //"end_date": { $lt: now },
          $or: [filter],
        },
      },
      {
        $project: {
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
          event_type: {
            _id: "$event_type._id",
            event_type: "$event_type.event_type",
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

    queryDoc = [
      ...queryDoc,
      ...[{ $sort: sort }, { $skip: skip }, { $limit: limit }],
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

    const data = await Event.aggregate(queryDoc).exec();

    const totalEvents = await Event.aggregate(queryCount).exec();
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
        data,
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
      pageLimit: Joi.number().default(10),
      search: Joi.string(),
      departments: Joi.array(),
      host_users: Joi.array(),
      event_types: Joi.array(),
      start_date: Joi.string(),
      end_date: Joi.string(),
      date_type: Joi.string(),
      isActive: Joi.boolean(),
    });
    const validationResult = await schema.validateAsync(req.body);

    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const orFilter = {};
    const andFilter = {};
    const sort = { "_id": -1 };
    const now = moment().toDate();

    const filter = {};
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

    // if (typeof validationResult.status !== "undefined") {
    //   andFilter["status"] = validationResult.status;
    // }

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
          from: "departments",
          localField: "departments",
          foreignField: "_id",
          as: "departmentList",
        },
      },
      {
        $match: {
          "status": "inprogress",
          ...andFilter,
          //{ "host_user_id": mongoose.Types.ObjectId(validationResult.user_id), },
          // { "end_date": { $gt: now }, },
          // { "event_dates.start": { $lt: now } },
          // { "event_dates.end": { $gt: now } },
          $or: [filter],
        },
      },
      {
        $project: {
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
          event_type: {
            _id: "$event_type._id",
            event_type: "$event_type.event_type",
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

    queryDoc = [
      ...queryDoc,
      ...[{ $sort: sort }, { $skip: skip }, { $limit: limit }],
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

    const data = await Event.aggregate(queryDoc).exec();
    const totalEvents = await Event.aggregate(queryCount).exec();
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
        data,
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
exports.event_calender = async (req, res, next) => {
  try {
    const data = await Event.find({ isActive: true })
      .select('event_name description venue start_date end_date start_time end_time custom_dates allDay isCustomDate priority')
      .exec();
    if (data) {
      return res.json({
        status: configs.success_status,
        data,
        message: "Events found successfully",
      });
    } else {
      return res.json({
        status: configs.success_status,
        data,
        message: "No Events not found!",
      });
    }
  } catch (error) {
    return res.json({
      status: configs.error_status,
      message: configs.errMessage,
      error: error ? error : "",
    });
  }
};
exports.editadminuserprofile = async (req, res, next) => {
  uploadEventFile(req, res, async (data, err) => {
    if (err) {
      console.log(err);
      res.json({ status: configs.error_status, message: "Something went wrong while uploading files." });
    } else {
      try {
        let receivedBody = req.body;
        let user_img = req.file?.filename ? req.file.filename : null;
        if (user_img) {
          receivedBody.user_img = user_img;
        }
        const schema = Joi.object({
          first_name: Joi.string().required(),
          last_name: Joi.string().required(),
          phone_number: Joi.string().required(),
          user_img: Joi.string(),
          user_id: Joi.string().required(),
        });
        const validationResult = await schema.validateAsync(req.body);

        const profile = {
          first_name: validationResult.first_name,
          last_name: validationResult.last_name,
          phone_number: validationResult.phone_number,
          updatedBy: validationResult.user_id,
          updated_At: configs.utcDefault(),
        };

        if (validationResult.user_img) {
          profile.user_img = validationResult.user_img;
          const userImageData = await Users.findById(req.params.id).select('user_img').exec();
          const filePath = userImageData?.user_img ? uploadUserImageFilePath + userImageData.user_img : '';
          if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
        const data = await Users.findByIdAndUpdate(
          req.params.id,
          { $set: profile },
          { new: true }
        ).exec();
        if (data) {
          return res.json({
            status: configs.success_status,
            data,
            message: "Profile Updated successfully",
          });
        } else {
          return res.json({
            status: configs.success_status,
            data,
            message: "User not found!",
          });
        }
      } catch (error) {
        return res.json({
          status: configs.error_status,
          message: configs.errMessage,
          error: error ? error : "",
        });
      }
    }
  });
};
exports.total_events_count = async (req, res, next) => {
  try {
    const data = await Event.countDocuments().exec();
    return res.json({
      status: configs.success_status,
      data,
      message: "Request completed successfully",
    });
  } catch (error) {
    return res.json({
      status: configs.error_status,
      message: configs.errMessage,
      error: error ? error : "",
    });
  }
};
exports.upcoming_events_count = async (req, res, next) => {
  try {
    const now = moment().toDate();
    //now.setHours(0, 0, 0, 0);
    const data = await Event.countDocuments({
      "status": "upcoming",
      // "event_dates.start": { $gt: now }
    }).exec();
    if (data && data.length > 0) {
      return res.json({
        status: configs.success_status,
        data,
        message: "Request completed successfully",
      });
    } else {
      return res.json({
        status: configs.success_status,
        data,
        message: "No data found",
      });
    }
  } catch (error) {
    return res.json({
      status: configs.error_status,
      message: configs.errMessage,
      error: error ? error : "",
    });
  }
};
exports.previous_events_count = async (req, res, next) => {
  try {
    const now = moment().toDate();
    //now.setHours(0, 0, 0, 0);
    const data = await Event.countDocuments({
      "status": "completed",
    }).exec();
    if (data && data.length > 0) {
      return res.json({
        status: configs.success_status,
        data,
        message: "Request completed successfully",
      });
    } else {
      return res.json({
        status: configs.success_status,
        data,
        message: "No data found",
      });
    }
  } catch (error) {
    return res.json({
      status: configs.error_status,
      message: configs.errMessage,
      error: error ? error : "",
    });
  }
};

exports.cancel_events_count = async (req, res, next) => {
  try {
    const data = await Event.countDocuments({
      status: "cancel"
    }).exec();
    if (data && data.length > 0) {
      return res.json({
        status: configs.success_status,
        data,
        message: "Request completed successfully",
      });
    } else {
      return res.json({
        status: configs.success_status,
        data,
        message: "No data found",
      });
    }
  } catch (error) {
    return res.json({
      status: configs.error_status,
      message: configs.errMessage,
      error: error ? error : "",
    });
  }
};

exports.completed_events_count = async (req, res, next) => {
  try {
    const now = moment().toDate();

    const data = await Event.countDocuments({
      status: "completed"
    }).exec();
    if (data && data.length > 0) {
      return res.json({
        status: configs.success_status,
        data,
        message: "Request completed successfully",
      });
    } else {
      return res.json({
        status: configs.success_status,
        data,
        message: "No data found",
      });
    }
  } catch (error) {
    return res.json({
      status: configs.error_status,
      message: configs.errMessage,
      error: error ? error : "",
    });
  }
};

exports.live_events_count = async (req, res, next) => {
  try {
    const now = moment().toDate();
    const data = await Event.countDocuments({
      status: "inprogress"
    }).exec();
    if (data && data.length > 0) {
      return res.json({
        status: configs.success_status,
        data,
        message: "Request completed successfully",
      });
    } else {
      return res.json({
        status: configs.success_status,
        data,
        message: "No data found",
      });
    }
  } catch (error) {
    return res.json({
      status: configs.error_status,
      message: configs.errMessage,
      error: error ? error : "",
    });
  }
};

exports.employeesrank = async (req, res, next) => {
  try {
    const pageNum = req.body.pageNum ? req.body.pageNum : 1;
    const limit = req.body.pageLimit ? req.body.pageLimit : 10;
    const skip = limit * (pageNum - 1);

    const query = { role_id: "60e68a875f40862222c64ecb" };

    const queryListUsers = Users.find(query)
      .select({ first_name: 1, last_name: 1, credits: 1, user_img: 1 })
      .sort({ credits: -1 });
    const qrCountUser = Users.find(query);

    if (limit) {
      queryListUsers.skip(skip).limit(limit);
    }
    const totalUsers = await qrCountUser.countDocuments().exec();
    const data = await queryListUsers.exec();
    const totalFilteredPage = Math.ceil(totalUsers / limit);
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
exports.employeesStatisfaction = async (req, res, next) => {
  try {
    const schema = Joi.object({
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(10),
      search: Joi.string(),
      event_type_id: Joi.string().required(),
    });

    const validationResult = await schema.validateAsync(req.body);

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
          "event.event_type_id": mongoose.Types.ObjectId(validationResult.event_type_id),
        }
      },
      {
        $project: {
          "event_id": "event._id",
          "event_type_id": "event.event_type_id",
          "answers": 1
        },
      },
    ]

    const data = await Feedback.aggregate(queryDoc).exec();
    if (data && data.length > 0) {
      let very_satisfied = 0;
      let satisfied = 0;
      let good = 0;
      let bad = 0;
      let very_bad = 0;
      data.forEach(item => {
        console.log(item);
        let answers;
        if (typeof item?.answers[0] === 'object') {
          answers = item?.answers[0];
        } else if (typeof item?.answers[0] === 'string') {
          answers = JSON.parse(item?.answers[0]);
        }
        if (answers['statisfaction-starRating-0']) {
          const rating = answers['statisfaction-starRating-0'];
          if (rating == 5) {
            very_satisfied++;
          }
          else if (rating == 4) {
            satisfied++;
          }
          else if (rating == 3) {
            good++;
          }
          else if (rating == 2) {
            bad++;
          }
          else if (rating == 1) {
            very_bad++;
          }
        }
      });
      let rating_pichart = {
        'very_satisfied': very_satisfied,
        'satisfied': satisfied,
        'good': good,
        'bad': bad,
        'very_bad': very_bad
      };

      return res.json({
        status: configs.success_status,
        data: { rating_pichart },
        message: "Request completed successfully",
      });
    } else {
      return res.json({
        status: configs.success_status,
        data: {},
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

exports.adminUserlist = async (req, res, next) => {
  try {
    const query = {
      role_id: {
        $nin: [
          mongoose.Types.ObjectId('60e689ca5f40862222c64ec5'),
          mongoose.Types.ObjectId('60e68a875f40862222c64ecb')
        ]
      }
    };
    if (req?.user?._id) {
      query._id = { $ne: req?.user?._id }
    }
    const data = await Users.find(query).populate('role_id').exec()
    if (data) {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Adminlist found successfully'
      });
    } else {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Adminuserlist not found!'
      });
    }
  } catch (error) {
    console.log(error)
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
}
exports.exportEvents = async (req, res, next) => {
  const schema = Joi.object({
    pageNum: Joi.number().default(1),
    pageLimit: Joi.number().default(10),
    search: Joi.string(),
    departments: Joi.array(),
    event_type_id: Joi.string(),
    start_date: Joi.string(),
    end_date: Joi.string(),
    isActive: Joi.boolean(),
    exportFileType: Joi.string().valid('csv', 'xlsx').insensitive().default('csv'),
  });
  const validationResult = await schema.validateAsync({ ...req.params, ...req.body });
  const orFilter = {};
  const andFilter = {};

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

  if (validationResult.event_type_id) {
    andFilter["event_type_id"] = mongoose.Types.ObjectId(
      validationResult.event_type_id
    );
  }

  if (validationResult.start_date) {
    const start_date = new Date(validationResult.start_date);
    start_date.setHours(0, 0, 0, 0);
    andFilter["start_date"] = { $gt: start_date };
  }

  if (validationResult.end_date) {
    const end_date = new Date(validationResult.end_date);
    end_date.setHours(23, 59, 59, 59);
    andFilter["start_date"] = { $lt: end_date };
  }

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
        localField: "host_user_id",
        foreignField: "_id",
        as: "host_user",
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
        ...andFilter,
        $or: [orFilter],
      },
    },
    {
      $project: {
        _id: "$_id",
        event_name: "$event_name",
        description: { $ifNull: ["$description", ""] },
        start_date: { $ifNull: ["$start_date", ""] },
        end_date: { $ifNull: ["$end_date", ""] },
        start_time: { $ifNull: ["$start_time", ""] },
        end_time: { $ifNull: ["$end_time", ""] },
        credit: { $ifNull: ["$credit", ""] },
        venue: { $ifNull: ["$venue", ""] },
        event_type: "$event_type.event_type",
        host_user: {
          _id: "$host_user._id",
          first_name: { $ifNull: ["$host_user.first_name", ""] },
          last_name: { $ifNull: ["$host_user.last_name", ""] },
          full_name: { $concat: ["$host_user.first_name", " ", "$host_user.last_name"] },

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

  const data = await Event.aggregate(queryDoc).exec();
  if (!data || data.length === 0) {
    return res.json({
      status: configs.success_status,
      data: null,
      message: "No data found",
    });
  }
  console.log("response", data);

  let result;
  let csvData = data.map(item => ({
    event_name: item.event_name,
    event_type: item.event_type,
    host_user: item.host_user.full_name,
    start_date: item.start_date,
    end_date: item.end_date,
    credit: item.credit,
    venue: item.venue,
    department_name: item.departments.length > 0 ? item.departments.map((department)=> department.department_name).join(',') : ''
  }));

   console.log("csvData",csvData);
  const csvFields = ["Event_name", "Event_Type", "Host_User", "Start_Date", "End_Date", "Venue", "Department_Name", "Credit"];
  const exportFileTypeLower = _.toLower(validationResult.exportFileType);

  if (exportFileTypeLower === 'csv') {
    result = await generateCSV(csvData, csvFields);
    return res.json({
      status: configs.success_status,
      data: result,
      message: "File uploaded successfully",
    });
  } else if (exportFileTypeLower === 'xlsx') {
    result = await generateXLSX(csvData);
    return res.json({
      status: configs.success_status,
      data: result,
      message: "File uploaded successfully",
    });
  } else {
    return res.json({
      status: configs.error_status,
      data: '',
      message: "Please provide csv file format to download",
    });
  }
};

exports.notificationList = async (req, res, next) => {
  try {
    const schema = Joi.object({
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(10),
      search: Joi.string(),
      department_id: Joi.string(),
      user_id: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);
    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const orFilter = {};
    const andFilter = {};

    if (validationResult.search) {
      orFilter["event_id.event_name"] = {
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

    if (validationResult.user_id) {
      andFilter["user_id"] = mongoose.Types.ObjectId(validationResult.user_id);
    }

    let queryDoc = [
      {
        $lookup: {
          from: "events",
          localField: "event_id",
          foreignField: "_id",
          as: "events",
        },
      },
      {
        $match: {
          $and: [andFilter]
        },
      },
      {
        $project: {
          custom_field: 1,
          events: {
            $cond: [{ $eq: ["$events", []] }, [null],
            {
              $map: {
                input: "$events",
                as: "event",
                in: {
                  event_id: "$$event._id",
                  event_name: "$$event.event_name",
                },
              },
            },
            ]
          },
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

    const result = await BulkMessages.aggregate(queryDoc).exec();
    const totalNotification = await BulkMessages.aggregate(queryCount).exec();
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
          from: "departments",
          localField: "event.departments",
          foreignField: "_id",
          as: "event.departments",
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
            start_date: { $ifNull: ["$event.start_date", ""] },
            end_date: { $ifNull: ["$event.end_date", ""] },
            start_time: { $ifNull: ["$event.start_time", ""] },
            end_time: { $ifNull: ["$event.end_time", ""] },
            credit: { $ifNull: ["$event.credit", ""] },
            event_type: {
              _id: "$event_type._id",
              event_type: "$event_type.event_type",
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
          totalFilteredCount: totalEvents[0].count,
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