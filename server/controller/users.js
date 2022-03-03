const _ = require('lodash');
const mongoose = require('mongoose');
const Joi = require('joi');
const moment = require('moment');
const configs = require('../configs');
const Users = mongoose.model('users');
const Events = mongoose.model('events');
const EventUser = mongoose.model("event_user");
const Messages = mongoose.model("messages");
const Notification = mongoose.model("notifications");
const { sendNotification } = require('../services/notificationService');
const { generateCSV, generateXLSX } = require('../services/exportDataServices');
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

exports.addEmployees = async (req, res, next) => {
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
          user_img: Joi.string().required(),
          email: Joi.string().required(),
          phone_number: Joi.string().required(),
          birthdate: Joi.string().required(),
          department_id: Joi.string().required(),
          designation_id: Joi.string().required(),
          user_id: Joi.string().required(),
          credits: Joi.string().default(0),
          penlity: Joi.string().default(0),
          role_id: Joi.string().default('60e68a875f40862222c64ecb')
        });

        const validationResult = await schema.validateAsync(receivedBody);

        const isEmpPhone = await Users.findOne({ phone_number: validationResult.phone_number }).select('_id').exec();
        if (isEmpPhone) {
          return res.json({
            status: configs.error_status, message: "Phone number is already registered"
          });
        }

        const isEmpEmail = await Users.findOne({ email: validationResult.email }).select('_id').exec();
        if (isEmpEmail) {
          return res.json({
            status: configs.error_status, message: "Email is already registered"
          });
        }
        let first_name = validationResult.first_name.toLowerCase()
        let last_name = validationResult.last_name.toLowerCase()
        const new_emp = new Users({
          org_id: validationResult.org_id,
          first_name: first_name.charAt(0).toUpperCase() + first_name.slice(1),
          last_name: last_name.charAt(0).toUpperCase() + last_name.slice(1),
          user_img: validationResult.user_img,
          email: validationResult.email,
          phone_number: validationResult.phone_number,
          department_id: validationResult.department_id,
          designation_id: validationResult.designation_id,
          birthdate: validationResult.birthdate,
          createdBy: validationResult.user_id,
          updatedBy: validationResult.user_id,
          credits: validationResult.credits,
          penlity: validationResult.penlity,
          role_id: validationResult.role_id,
        });

        const data = await new_emp.save();
        if (data) {
          res.json({
            status: configs.success_status,
            data,
            message: 'Employee added successfully'
          });
          bindUserUpcomingEvents(data, validationResult.user_id);
        }
      } catch (error) {
        console.log(error);
        return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
      }
    }
  })
}

const bindUserUpcomingEvents = async (user, createdBy) => {
  //const now = moment.tz(moment(), "Asia/Kolkata").toDate();
  let queryDoc = [
    {
      $match: {
        $and: [
          { "department_id": user.department_id },
          { "event.status": "upcoming" },
          // { "start_date": { $gt: now } },
          // {
          //   $or: [
          //     { "start_date": { $gte: now } },
          //     { "end_date": { $lte: now }, }
          //   ]
          // }
        ],
      },
    },
    {
      $project: {
        _id: 1,
        org_id: 1
      },
    },
  ];
  const eventList = await Events.aggregate(queryDoc).exec();
  return await Promise.all(eventList.map(async (item) => {
    const new_event_user = new EventUser({
      org_id: item.org_id,
      event_id: item._id,
      user_id: user._id,
      createdBy: createdBy,
      updatedBy: createdBy,
    });
    return await new_event_user.save();
  }));
}

exports.employeesList = async (req, res, next) => {
  try {
    const schema = Joi.object({
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(10),
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
    if (validationResult.department_id) {
      const departArr = validationResult.department_id.map((item) =>
        mongoose.Types.ObjectId(item)
      );
      andFilter["department._id"] = { $in: departArr };
    }
    if (typeof validationResult.isActivate !== "undefined") {
      andFilter["isDeleted"] = !validationResult.isActivate;
    }

    if (validationResult.event_types) {
      const eventType = mongoose.Types.ObjectId(validationResult.event_types);
      andEventTypeFilter_1["event_user_list.event.eventType._id"] = eventType;
      // andEventTypeFilter_2["event_user_list.event_user_item.event_type_item"] = { $ne: [] };
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
        "$lookup": {
          "from": "event_users",
          "let": { "userId": "$_id" },
          "pipeline": [
            { "$match": { "$expr": { "$eq": ["$user_id", "$$userId"] } } },
            {
              "$lookup": {
                "from": "events",
                "let": { "eventId": "$event_id" },
                "pipeline": [
                  { "$match": { "$expr": { "$eq": ["$_id", "$$eventId"] } } },
                  {
                    "$lookup": {
                      "from": "eventtypes",
                      "let": { "eventTypeId": "$event_type_id" },
                      "pipeline": [
                        {
                          "$match": {
                            "$expr": { "$eq": ["$_id", "$$eventTypeId"] }
                          }
                        }
                      ],
                      "as": "eventType"
                    }
                  }
                ],
                "as": "event"
              }
            }
          ],
          "as": "event_user_list"
        }
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
          first_name: { $ifNull: ["$first_name", ""] },
          last_name: { $ifNull: ["$last_name", ""] },
          phone_number: { $ifNull: ["$phone_number", ""] },
          email: { $ifNull: ["$email", ""] },
          birthdate: { $ifNull: ["$birthdate", ""] },
          credits: { $ifNull: ["$credits", ""] },
          user_img: { $ifNull: ["$user_img", ""] },
          isActivate: { $ifNull: ["$isActivate", false] },
          isDeleted: { $ifNull: ["$isDeleted", false] },
          // event_user_list: {
          //   $ifNull: [
          //     {
          //       $map: {
          //         input: "$event_user_list",
          //         as: "event_user_item",
          //         in: {
          //           _id: "$$event_user_item._id",
          //           event_user_item: {
          //             $map: {
          //               input: "$$event_user_item.event",
          //               as: "event_item",
          //               in: {
          //                 _id: "$$event_item._id",
          //                 event_name: "$$event_item.event_name",
          //                 event_type_item: {
          //                   $map: {
          //                     input: "$$event_item.eventType",
          //                     as: "event_type_item",
          //                     in: {
          //                       _id: "$$event_type_item._id",
          //                       event_type: "$$event_type_item.event_type",
          //                     },
          //                   },
          //                 }
          //               },
          //             }
          //           }
          //         },
          //       },
          //     },
          //     [],
          //   ],
          // },
          department: {
            _id: "$department_id",
            department_name: { $ifNull: ["$department.department_name", ""] },
          },
          designation: {
            _id: "$designation_id",
            designation_name: { $ifNull: ["$designation.designation_name", ""] },
          },
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

exports.employeesById = async (req, res, next) => {
  try {
    const data = await Users.findById(req.params.id)
      .populate("department_id", "_id department_name")
      .exec();
    if (data) {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Request completed successfully'
      });
    } else {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Employee not found!'
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
};



exports.employeesByIdForImage = async (req, res, next) => {
  try {
    const data = await Users.findById(req.params.id)
      .populate("department_id", "_id department_name")
      .exec();
    const imageBirthday = await configs.htmlContent(data)
    if (data) {
      return (
        res.set('Content-Type', 'text/html'),
        res.send(Buffer.from(imageBirthday)))
    } else {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Employee not found!'
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
};


exports.gettingbirthdaytemplete = async (req, res, next) => {
  try {
    const data = await Users.findById(req.params.id)
      .populate("department_id", "_id department_name")
      .exec();
    const imageBirthday = await configs.htmlContentforbirthday(data)
    if (data) {
      return (
        res.set('Content-Type', 'text/html'),
        res.send(Buffer.from(imageBirthday)))
    } else {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Employee not found!'
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
};


exports.editEmployee = async (req, res, next) => {
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
          user_img: Joi.string(),
          email: Joi.string().required(),
          phone_number: Joi.string().required(),
          department_id: Joi.string().required(),
          designation_id: Joi.string().required(),
          birthdate: Joi.string().required(),
          credits: Joi.string().default(0),
          penlity: Joi.string().default(0),
          user_id: Joi.string().required(),
        });
        const validationResult = await schema.validateAsync(receivedBody);
        let first_name = validationResult.first_name.toLowerCase()
        let last_name = validationResult.last_name.toLowerCase()
        const emp = {
          first_name: first_name.charAt(0).toUpperCase() + first_name.slice(1),
          last_name: last_name.charAt(0).toUpperCase() + last_name.slice(1),
          email: validationResult.email,
          phone_number: validationResult.phone_number,
          department_id: validationResult.department_id,
          designation_id: validationResult.designation_id,
          birthdate: validationResult.birthdate,
          updatedBy: validationResult.user_id,
          updated_At: configs.utcDefault(),
        };
        if (validationResult.user_img) {
          emp.user_img = validationResult.user_img;
          const userImageData = await Users.findById(req.params.id).select('user_img').exec();
          const filePath = userImageData?.user_img ? uploadUserImageFilePath + userImageData.user_img : '';
          if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
        const data = await Users.findByIdAndUpdate(req.params.id, { $set: emp }, { new: true }).exec();
        console.log('data', data);
        if (data) {
          return res.json({
            status: configs.success_status,
            data,
            message: 'Employee updated successfully'
          });
        } else {
          return res.json({
            status: configs.success_status,
            data,
            message: 'Employee not found!'
          });
        }
      } catch (error) {
        console.log(error);
        return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
      }
    }
  })
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const schema = Joi.object({
      user_id: Joi.string().required(),
    });
    await schema.validateAsync(req.body);
    const data = await Users.findByIdAndDelete(req.params.id).exec();
    if (data) {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Employee deleted successfully'
      });
    } else {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Employee not found!'
      });
    }
  } catch (error) {
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
};

exports.employeesDropdownList = async (req, res, next) => {
  try {
    const data = await Users.find({ role_id: '60e68a875f40862222c64ecb' })
      .select({ first_name: 1, last_name: 1 })
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

exports.myCreditPoints = async (req, res, next) => {
  try {
    const quarter = configs.getQuaterDates();
    const userData = await Users.findById(req.params.id).select('department_id credits').exec();
    if (!userData) {
      return res.json({
        status: configs.success_status,
        result: {
          credits: 0,
          remainingCredits: 0,
          totalCredits: 0
        },
        message: 'No Data found!'
      });
    }
    const eventData = await Events.aggregate([
      {
        $match: {
          $or: [
            {
              "departments": userData.department_id,
            },
            {
              "host_user_id": userData._id,
            },
            {
              "manual_users": userData._id
            }
          ]
          // "event.start_date": { $gt: quarter.startDate },
          // "event.end_date": { $lt: quarter.endDate }
        }
      },
      {
        $group: {
          _id: null, credits: {
            $sum: {
              $cond: {
                if: {
                  $eq: ["$host_user_id", userData._id]
                },
                then: 2,
                else: "$credit"
              }
            }
          }
        }
      }
    ]);

    if (eventData?.length > 0 && userData) {
      let totalCredits = eventData[0].credits;
      let credits = userData.credits;
      let remainingCredits = (totalCredits - credits) > 0 ? totalCredits - credits : 0;
      const result = {
        credits: credits,
        remainingCredits,
        totalCredits: totalCredits
      }
      return res.json({
        status: configs.success_status,
        result,
        message: 'Request completed successfully'
      });
    } else {
      return res.json({
        status: configs.success_status,
        result: {
          credits: 0,
          remainingCredits: 0,
          totalCredits: 0
        },
        message: 'No Data found!'
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
};

exports.employeeAccountAction = async (req, res, next) => {
  try {
    const schema = Joi.object({
      user_id: Joi.string(),
    })
    const validationResult = await schema.validateAsync(req.body);

    const userData = await Users.findById(req.params.id).exec();
    if (userData) {
      userData.isDeleted = typeof userData.isDeleted === 'undefined' ? false : !userData.isDeleted;
      userData.deletedBy = validationResult.user_id;
      await userData.save();
      if (userData.isDeleted) {
        return res.send({
          status: configs.success_status,
          userData,
          message: 'Employee Deactivated successfully'
        });
      } else {
        return res.send({
          status: configs.success_status,
          userData,
          message: 'Employee Activated successfully'
        });
      }
    } else {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Employee not found!'
      });
    }
  } catch (error) {
    console.log(error)
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
}

exports.usersRankList = async (req, res, next) => {
  try {
    const schema = Joi.object({
      user_id: Joi.string().required(),
    });
    const validationResult = await schema.validateAsync(req.body);

    let queryDoc = [
      {
        $match: {
          role_id: mongoose.Types.ObjectId('60e68a875f40862222c64ecb'),
          "isDeleted": false
        },
      },
      {
        $project: {
          _id: "$_id",
          first_name: { $ifNull: ["$first_name", ""] },
          last_name: { $ifNull: ["$last_name", ""] },
          user_img: { $ifNull: ["$user_img", ""] },
          credits: { $ifNull: ["$credits", ""] },
        },
      },
      {
        $sort: { credits: -1 }
      }
    ];

    const usersList = await Users.aggregate(queryDoc).exec();

    if (usersList && usersList.length > 0) {
      const index = usersList.findIndex((item) => item._id.toString() === validationResult.user_id);
      const rankList = usersList.map((item, index) => ({
        rank: index + 1,
        ...item
      }));
      const userData = rankList[index];

      return res.json({
        status: configs.success_status,
        data: {
          userData,
          rankList,
        },
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
}

exports.exportUsers = async (req, res, next) => {
  try {
    const schema = Joi.object({
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(10),
      search: Joi.string(),
      department_id: Joi.string(),
      isActivate: Joi.boolean(),
      org_id: Joi.string().required(),
      role_id: Joi.string().default('60e68a875f40862222c64ecb'),
      exportFileType: Joi.string().valid('csv', 'xlsx').insensitive().default('csv'),
    });
    const validationResult = await schema.validateAsync({ ...req.params, ...req.body });
    const orFilter = {};
    const andFilter = {};

    if (validationResult.search) {
      orFilter["full_name"] = {
        $regex: validationResult.search,
        $options: "i",
      };
    }

    if (validationResult.department_id) {
      andFilter["department._id"] = mongoose.Types.ObjectId(
        validationResult.department_id
      );
    }

    if (typeof validationResult.isActivate !== "undefined") {
      andFilter["isActivate"] = validationResult.isActivate;
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
          path: "$department"
        }
      },
      {
        $match: {
          // org_id: mongoose.Types.ObjectId(validationResult.org_id),
          role_id: mongoose.Types.ObjectId(validationResult.role_id),
          "isDeleted": false,
        },
      },
      {
        $project: {
          _id: "$_id",
          first_name: { $ifNull: ["$first_name", ""] },
          last_name: { $ifNull: ["$last_name", ""] },
          email: { $ifNull: ["$email", ""] },
          phone_number: { $ifNull: ["$phone_number", ""] },
          position: { $ifNull: ["$position", ""] },
          credits: { $ifNull: ["$credits", ""] },
          department: {
            _id: "$department_id",
            department_name: { $ifNull: ["$department.department_name", ""] },
          },
          role_id: 1,
        },
      },
      {
        $match: {
          ...andFilter,
          $or: [orFilter],
        },
      },
    ];

    const data = await Users.aggregate(queryDoc).exec();
    console.log(data)
    if (!data || data.length === 0) {
      return res.json({
        status: configs.success_status,
        data: null,
        message: "No data found",
      });
    }
    let result;
    let csvData = data.map(item => {
      const first_name = item.first_name.charAt(0).toUpperCase() + item.first_name.slice(1);
      const last_name = item.last_name.charAt(0).toUpperCase() + item.last_name.slice(1);
      const position = item.position.charAt(0).toUpperCase() + item.position.slice(1);
      const department_name = item.department.department_name.charAt(0).toUpperCase() + item.department.department_name.slice(1);
      return {
        'First Name': first_name,
        'Last Name': last_name,
        'Phone Number': item.phone_number,
        'Position': position,
        'Credits': item.credits,
        'Department Name': department_name
      }
    });

    const csvFields = ["First Name", "Last Name", "Phone Number", "Position", "Credits", "Department Name"];
    const exportFileTypeLower = _.toLower(validationResult.exportFileType);
    if (exportFileTypeLower === 'csv') {
      result = await generateCSV(csvData, csvFields);
      return res.json({
        status: configs.success_status,
        data: result,
        message: "File downloaded successfully",
      });
    } else if (exportFileTypeLower === 'xlsx') {
      result = await generateXLSX(csvData);
      return res.json({
        status: configs.success_status,
        data: result,
        message: "File downloaded successfully",
      });
    } else {
      return res.json({
        status: configs.error_status,
        data: '',
        message: "Please provide csv file format to download",
      });
    }
  } catch (error) {
    console.log(error)
    return res.json({
      status: configs.error_status,
      message: configs.errMessage,
      error: error ? error : "",
    });
  }
}

exports.BirthdateListAdmin = async (req, res, next) => {
  try {
    const schema = Joi.object({
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(10),
      search: Joi.string(),
      role_id: Joi.string().default('60e68a875f40862222c64ecb'),
    });

    const validationResult = await schema.validateAsync(req.body);
    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const orFilter = {};
    const andFilter = {};
    const now = moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate()
    const nextDate = moment().add(15, 'days').set({ hour: 23, minute: 59, second: 59, millisecond: 59 }).toDate();

    if (validationResult.search) {
      orFilter["full_name"] = {
        $regex: validationResult.search,
        $options: "i",
      };
    }

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
              'year': {
                $cond: {
                  if: {
                    $lt: [
                      { $subtract: [{ $month: '$birthdate' }, now.getMonth()] }
                      , 0]
                  }, then: nextDate.getFullYear(), else: now.getFullYear()
                }
              },
              'month': {
                $month: {
                  date: '$birthdate',
                  // timezone: "Asia/Kolkata"
                },
              },
              'day': {
                $dayOfMonth: {
                  date: '$birthdate',
                  // timezone: "Asia/Kolkata"
                },
              },
              'hour': 0,
              'minute': 0,
              'second': 0,
              // 'timezone': "Asia/Kolkata"
            },
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

    queryDoc = [...queryDoc, ...[{ $sort: { birthdate_new: 1 } }, { $skip: skip }, { $limit: limit }]];

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
    console.log('data', data);
    const totalUsers = await Users.aggregate(queryCount).exec();
    console.log('totalUsers', totalUsers);
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
}

exports.BirthdateList = async (req, res, next) => {
  try {
    const schema = Joi.object({
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(5000),
      search: Joi.string(),
      user_id: Joi.string(),
      role_id: Joi.string().default('60e68a875f40862222c64ecb'),
    });
    // console.log("schema",schema)
    const validationResult = await schema.validateAsync(req.body);
    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const orFilter = {};
    const andFilter = {};
    const andEventTypeFilter_1 = {};
    const now = moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate()
    const nextDate = moment().add(15, 'days').set({ hour: 23, minute: 59, second: 59, millisecond: 59 }).toDate();

    if (validationResult.search) {
      orFilter["full_name"] = {
        $regex: validationResult.search,
        $options: "i",
      };
    }

    if (validationResult.user_id) {
      const messageUser = mongoose.Types.ObjectId(validationResult.user_id);
      andEventTypeFilter_1["message_user_list.message_id"] = messageUser;
    }

    let queryDoc = [
      // {
      //   $lookup: {
      //     from: 'users',
      //     localField: 'sender_user_id',
      //     foreignField: '_id',
      //     as: "sender_user"
      //   }
      // },
      // {
      //   $unwind: {
      //     path: "$sender_user",
      //   }
      // },
      // {
      //   $lookup: {
      //     from: 'users',
      //     localField: 'receiver_user_id',
      //     foreignField: '_id',
      //     as: "receiver_user"
      //   }
      // },
      // {
      //   $unwind: {
      //     path: "$receiver_user",
      //   }
      // },
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
              'year': {
                $cond: {
                  if: {
                    $lt: [
                      { $subtract: [{ $month: '$birthdate' }, now.getMonth()] }
                      , 0]
                  }, then: nextDate.getFullYear(), else: now.getFullYear()
                }
              },
              'month': {
                $month: {
                  date: '$birthdate',
                  // timezone: "Asia/Kolkata"
                },
              },
              'day': {
                $dayOfMonth: {
                  date: '$birthdate',
                  // timezone: "Asia/Kolkata"
                },
              },
              'hour': 0,
              'minute': 0,
              'second': 0,
              // 'timezone': "Asia/Kolkata"
            },
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
          // $or: [
          //   // {
          //   //   sender_user_id: mongoose.Types.ObjectId(validationResult.user_id),
          //   // },
          //   // {
          //   //   receiver_user_id: mongoose.Types.ObjectId(validationResult.user_id),
          //   // },
          // ],
        },
      },
    ];
    let queryCount = queryDoc;

    queryDoc = [...queryDoc, ...[{ $sort: { birthdate_new: 1 } }, { $skip: skip }, { $limit: limit }]];

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
    var results = await Promise.all(data.map(async (reciever_user, index)=> {
      const res = await Messages.exists({
        sender_user_id: validationResult.user_id,
        receiver_user_id: reciever_user._id
      })
      return {...reciever_user,'message_flag':res}
    }));
    const totalFilteredPage =
      totalUsers?.length > 0 && totalUsers[0].count
        ? Math.ceil(totalUsers[0].count / limit)
        : 0;
    if (results && results.length > 0) {
      return res.json({
        status: configs.success_status,
        results,
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
}