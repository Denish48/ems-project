const mongoose = require('mongoose');
const Joi = require('joi');
const _ = require('lodash');
const moment = require('moment-timezone');
const configs = require('../configs');
const Host = mongoose.model('host');
const EventUser = mongoose.model('event_user');
const Events = mongoose.model("events");
const EventAttendances = mongoose.model("event_attendances");
const Users = mongoose.model("users");
const notificationService = require('../services/notificationService');
const EventSession = mongoose.model("event_sessions")

exports.addHost = async (req, res, next) => {
  try {
    const schema = Joi.object({
      org_id: Joi.string(),
      user_id: Joi.string(),
      isExternal: Joi.boolean(),
      role_id: Joi.string().default('60ede3a387c3ae1f9cc108f6')
    });
    const validationResult = await schema.validateAsync(req.body);
    const new_host = new Host({
      org_id: validationResult.org_id,
      user_id: validationResult.user_id,
      isExternal: validationResult.isExternal,
      role_id: validationResult.role_id,
      createdBy: validationResult.user_id,
      updatedBy: validationResult.user_id,

    });

    const data = await new_host.save();
    if (data) {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Request completed successfully'
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
};

exports.seedingHost = async (req, res, next) => {
  try {
    const event_list = await Events.find().select('_id createdBy host_users').exec();
    const data = [];
    for (const item of event_list) {
      const checkHostUser = await Host.exists({
        user_id: {$in:item.host_users},
      });
      if (!checkHostUser) {
        const new_host = new Host({
          org_id: item.org_id,
          user_id: item.host_users,
          createdBy: item.createdBy,
          updatedBy: item.createdBy,
        });
        const host_data = await new_host.save();
        data.push(host_data);
      }
    }

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
        message: 'Request completed successfully'
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
};

exports.hostList = async (req, res, next) => {
  try {
    const schema = Joi.object({
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(10),
      search: Joi.string(),
      department_id: Joi.array(),
      isActivate: Joi.boolean(),
    });
    const validationResult = await schema.validateAsync(req.body);
    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const orFilter = {};
    const andFilter = {};

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
    andFilter["isDeleted"] = false;

    let queryDoc = [
      {
        $lookup: {
          from: "users",
          localField: "user_id",
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
          localField: "host_user.department_id",
          foreignField: "_id",
          as: "host_user.department",
        },
      },
      {
        $unwind: {
          path: "$host_user.department",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: "$host_user._id",
          full_name: { $concat: ["$host_user.first_name", " ", "$host_user.last_name"] },
          first_name: { $ifNull: ["$host_user.first_name", ""] },
          last_name: { $ifNull: ["$host_user.last_name", ""] },
          email: { $ifNull: ["$host_user.email", ""] },
          phone_number: { $ifNull: ["$host_user.phone_number", ""] },
          position: { $ifNull: ["$host_user.position", ""] },
          credits: { $ifNull: ["$host_user.credits", ""] },
          user_img: { $ifNull: ["$host_user.user_img", ""] },
          isActivate: { $ifNull: ["$host_user.isActivate", false] },
          isDeleted: { $ifNull: ["$host_user.isDeleted", false] },
          department: {
            _id: "$host_user.department._id",
            department_name: { $ifNull: ["$host_user.department.department_name", ""] },
          },
          role_id: "$host_user.role_id",
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
    const data = await Host.aggregate(queryDoc).exec();
    const totalUsers = await Host.aggregate(queryCount).exec();
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

exports.hostDropdownList = async (req, res, next) => {
  try {
    const data = await Host.find({ role_id: '60ede3a387c3ae1f9cc108f6' })
      .select({ first_name: 1, last_name: 1, user_id: 1 }).populate('user_id')
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

exports.hostUpcomingEvents = async (req, res, next) => {
  try {
    const schema = Joi.object({
      user_id: Joi.any().required(),
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(5000),
      search: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);

    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const sort = { "_id": -1 };
    const now = moment().toDate();
    // now.setDate(now.getDate+1)

    const filter = {};
    if (validationResult.search) {
      filter["event_name"] = {
        $regex: validationResult.search,
        $options: "i",
      };
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
          from: "departments",
          localField: "departments",
          foreignField: "_id",
          as: "departments",
        },
      },
      {
        $match: {
          $and: [
            { "status": "upcoming" },
            {"host_users": mongoose.Types.ObjectId(validationResult.user_id)},
            // { "start_date": { $gt: now } },
            // {
            //   $or: [
            //     { "start_date": { $gte: now } },
            //     { "end_date": { $lte: now }, }
            //   ]
            // }
          ],
          $or: [filter],
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
          departments: {
            $ifNull: [
              {
                $map: {
                  input: "$departments",
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
      {
        $match: {
          $and: [
            { "event.event_dates": { $ne: null } },
            { "event.event_dates": { $ne: [] } }
          ]
        }
      }
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

    const data = await Events.aggregate(queryDoc).exec();
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
//  exports.hostUpcomingEvents = async (req, res, next) => {
//   try {
//     const schema = Joi.object({
//       user_id: Joi.any(),
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
//     //now.setHours(0, 0, 0, 0);
// console.log(validationResult.user_id);
//     const filter = {
//       //"host_user._id":{$in:validationResult.user_id} ,

//     };
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
//            { "host_users":{$in: validationResult.user_id} },
//             { "event.status": "upcoming" },
//             // { "event.start_date": { $gt: now } },
//             // {
//             //   $or: [
//             //     { "event.start_date": { $gte: now } },
//             //     { "event.end_date": { $lte: now }, }
//             //   ]
//             // }
//           ],
//           $or: [filter],
//         },
//       },
//       {
//         $project: {
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

//       // {
//       //   $match: {
//       //     $and: [
//       //       { "event.event_dates": { $ne: null } },
//       //       { "event.event_dates": { $ne: [] } }
//       //     ]
//       //   }
//       // }
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

exports.hostPreviousEvents = async (req, res, next) => {
  try {
    const schema = Joi.object({
      user_id: Joi.any().required(),
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(5000),
      search: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);

    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const sort = { "_id": -1 };

    const now = moment().toDate();
    // now.setDate(now.getDate-1)

    const filter = {};
    if (validationResult.search) {
      filter["event_name"] = {
        $regex: validationResult.search,
        $options: "i",
      };
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
          from: "departments",
          localField: "departments",
          foreignField: "_id",
          as: "departments",
        },
      },
      {
        $match: {
          $and: [
            {"status": "completed"},
            {"host_users": mongoose.Types.ObjectId(validationResult.user_id)},
          ],
          $or: [filter],
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
            sendFeedbackCounter: { $ifNull: ["$sendFeedbackCounter", 0] }
          },
          departments: {
            $ifNull: [
              {
                $map: {
                  input: "$departments",
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
      {
        $match: {
          $and: [
            { "event.event_dates": { $ne: null } },
            { "event.event_dates": { $ne: [] } }
          ]
        }
      }
    ];

    let queryCount = queryDoc;

    queryDoc = [
      ...queryDoc,
      ...[{ $sort: {start_date: 1} }, { $skip: skip }, { $limit: limit }],
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

    const data = await Events.aggregate(queryDoc).exec();
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

exports.hostLiveEvents = async (req, res, next) => {
  try {
    const schema = Joi.object({
      user_id: Joi.any().required(),
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(5000),
      search: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);

    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const sort = { "_id": -1 };
    const now = moment().toDate();

    const filter = {};
    if (validationResult.search) {
      filter["event_name"] = {
        $regex: validationResult.search,
        $options: "i",
      };
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
          from: "departments",
          localField: "departments",
          foreignField: "_id",
          as: "departments",
        },
      },
      {
        $match: {
          $and: [
            { "status": "inprogress" },
            { "host_users": mongoose.Types.ObjectId(validationResult.user_id), },
          ],
          $or: [filter],
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
            sendFeedbackCounter: { $ifNull: ["$sendFeedbackCounter", 0] }
          },
          departments: {
            $ifNull: [
              {
                $map: {
                  input: "$departments",
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
      {
        $match: {
          $and: [
            { "event.event_dates": { $ne: null } },
            { "event.event_dates": { $ne: [] } }
          ]
        }
      }
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

    const data = await Events.aggregate(queryDoc).exec();
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

exports.hostMyEvents = async (req, res, next) => {
  try {
    const schema = Joi.object({
      user_id: Joi.any(),
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(5000),
      search: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);

    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const sort = { "_id": -1 };

    const filter = {};
    if (validationResult.search) {
      filter["event_name"] = {
        $regex: validationResult.search,
        $options: "i",
      };
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
          from: "departments",
          localField: "departments",
          foreignField: "_id",
          as: "departments",
        },
      },
      {
        $match: {
          "host_users": mongoose.Types.ObjectId(validationResult.user_id),
          $or: [filter],
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
            event_dates: "$event_dates",
          },
          departments: {
            $ifNull: [
              {
                $map: {
                  input: "$departments",
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

    const data = await Events.aggregate(queryDoc).exec();
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

exports.sendFeedbackForm = async (req, res, next) => {
  try {
    const schema = Joi.object({
      event_id: Joi.string()
    })

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
        $lookup: {
          from: "feedbacks",
          localField: "event_id",
          foreignField: "event_id",
          as: "feedbackList",
        },
      },
      {
        $lookup: {
          from: "event_forms",
          localField: "event_id",
          foreignField: "event_id",
          as: "eventForm",
        },
      },
      {
        $unwind: {
          path: "$eventForm",
        },
      },
      {
        $match: {
          "event.host_user_id": mongoose.Types.ObjectId(req.params.id),
          event_id: mongoose.Types.ObjectId(validationResult.event_id),
          isAccept: "accepted",
        }
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
            status: { $ifNull: ["$event.status", ""] },
          },
          event_form: {
            event_form_id: { $ifNull: ["$eventForm._id", ""] },
          },
          user_id: "$user_id",
          feedbacks: { $size: '$feedbackList' },
        },
      },
      {
        $match: {
          feedbacks: 0
        }
      },
      {
        $project: {
          feedbacks: 0
        },
      },
    ];

    const data = await EventUser.aggregate(queryDoc).exec()
    if (data) {
      await Promise.all(data.map(async (item) => {
        let collapse_key = 'event_feedback'
        let title = `Elsner Elevate feedback`;

        details = {
          screen: 'feedback',
          id: item.event_form.event_form_id,
          event_id: item.event._id,
          event_name: item.event.event_name
        };

        await notificationService.sendNotification([item.user_id],
          {
            notification: {
              title,
            },
            data: {
              click_action: configs.click_action,
              collapse_key,
              ...details,
            }
          }
        );
      }));
      await Events.findByIdAndUpdate(
        validationResult.event_id,
        {
          $set: {
            sendFeedbackCounter: 1,
          }
        },
        { new: true }
      ).exec();
      return res.json({
        status: configs.success_status,
        message: 'Feedback Send successfully'
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
    })
  }
}

exports.usersAttendance = async (req, res, next) => {
  try {
    const schema = Joi.object({
      event_id: Joi.string().required(),
      event_session_id: Joi.string().required(),
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
        $lookup: {
          from: "event_attendances",
          localField: "participateUser._id",
          foreignField: "user_id",
          as: "event_attendance_data",
        },
      },
      {
        $match: {
          "event_id": mongoose.Types.ObjectId(validationResult.event_id),
          "isAccept": "accepted",
          "participateUser.isDeleted": false,
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
          event_attendances: {
            $let: {
              vars: {
                event_session: {
                  $first: {
                    $filter: {
                      input: "$event_attendance_data",
                      as: "item",
                      cond: {
                        $and: [
                          {
                            $eq: [
                              "$$item.event_session_id", mongoose.Types.ObjectId(validationResult.event_session_id)
                            ]
                          }
                        ]
                      }
                    }
                  }
                }
              },
              in: {
                $ifNull: ["$$event_session._id", ""],
              }
            }
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
    console.log(error)
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
}

exports.registerAttendance = async (req, res, next) => {
  try {
    const schema = Joi.object({
      event_id: Joi.string(),
      host_user_id: Joi.string(),
      attendee_users: Joi.array().items(Joi.string()).min(1).required(),
    });
    const validationResult = await schema.validateAsync(req.body);
    const now = moment().toDate();

    const filter = {};
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
          from: "departments",
          localField: "departments",
          foreignField: "_id",
          as: "departments",
        },
      },
      {
        $match: {
          $and: [
            { "_id": mongoose.Types.ObjectId(validationResult.event_id) },
            { "host_user_id": mongoose.Types.ObjectId(validationResult.host_user_id), },
            { "status": "inprogress" },
          ],
          $or: [filter],
        },
      },
      {
        $project: {
          event: {
            _id: "$_id",
            start_date: { $ifNull: ["$start_date", ""] },
            end_date: { $ifNull: ["$end_date", ""] },
            start_time: { $ifNull: ["$start_time", ""] },
            end_time: { $ifNull: ["$end_time", ""] },
            credit: { $ifNull: ["$credit", ""] },
            org_id: { $ifNull: ["$org_id", ""] },
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
            }
          },
        },
      },
      {
        $match: {
          $and: [
            { "event.event_dates": { $ne: null } },
            { "event.event_dates": { $ne: [] } }
          ]
        }
      },
      {
        $limit: 1
      }
    ];

    const data = await Events.aggregate(queryDoc).exec();

    if (data?.length === 0) {
      return res.json({
        status: configs.error_status,
        data: {},
        message: 'Unable to register attendance as event session is not avaialble!'
      });
    }

    const finalResult = [];
    const eventData = data[0];
    const event_session = await EventSession.findOne({
      event_id: eventData._id,
      event_status: 'inprogress'
    }).exec();
    const event_session_id = event_session?._id;
    const event_session_start = eventData?.event?.event_dates?.length > 0 && eventData?.event?.event_dates[0]?.start ? eventData?.event.event_dates[0]?.start : null;
    if (!event_session_id) {
      return res.json({
        status: configs.error_status,
        data: eventData,
        message: 'Unable to register attendance as event session is not avaialble!'
      });
    }

    let attendee_users = _.uniq(validationResult.attendee_users);
    attendee_users = validationResult.attendee_users.map((item) => mongoose.Types.ObjectId(item));
    const attendee_users_list = await EventUser.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
        },
      },
      {
        $match: {
          user_id: { $in: attendee_users },
          event_id: mongoose.Types.ObjectId(validationResult.event_id),
        }
      },
      {
        $project: {
          _id: 1,
          user: {
            _id: "$user._id",
            first_name: 1,
            last_name: 1,
            credits: "$user.credits",
            isAccept: "$user.isAccept",
          },
        },
      },
    ]).exec();

    if (attendee_users_list.length === 0) {
      return res.json({
        status: configs.error_status,
        data: eventData,
        message: 'Unable to register attendance as user not associated with event!'
      });
    }

    await Promise.all(attendee_users_list.map(async (item) => {
      const checkAttendee = await EventAttendances.exists({
        user_id: item?.user?._id,
        event_session_id
      });
      if (!checkAttendee) {
        let event_credit = Math.round(eventData?.event.credit);
        let credits = Math.round(item?.user?.credits);
        credits += event_credit;
        credits = credits < 0 ? 0 : credits;
        const updatedUserCredit = await Users.findByIdAndUpdate(
          item?.user?._id,
          {
            $set: {
              credits,
            },
          },
          { new: true }
        ).exec();
        const new_attendee = new EventAttendances({
          event_session_id,
          event_session_start,
          user_id: item?.user?._id,
          event_user_id: item._id,
          event_id: eventData.event._id,
          host_user_id: validationResult.host_user_id,
          org_id: eventData.event.org_id,
          createdBy: validationResult.host_user_id,
          updatedBy: validationResult.host_user_id,
        });
        const attendee_data = await new_attendee.save();
        finalResult.push(attendee_data);
      }
    }));

    return res.json({
      status: configs.success_status,
      data: finalResult,
      message: 'Attendace registered successfully'
    });
  } catch (error) {
    console.log(error);
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
};

exports.unRegisterAttendance = async (req, res, next) => {
  try {
    const schema = Joi.object({
      event_id: Joi.string(),
      host_user_id: Joi.string(),
      attendee_users: Joi.array().items(Joi.string()).min(1).required(),
    });
    const validationResult = await schema.validateAsync(req.body);
    const now = moment().toDate();

    const filter = {};
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
          from: "departments",
          localField: "departments",
          foreignField: "_id",
          as: "departments",
        },
      },
      {
        $match: {
          $and: [
            { "_id": mongoose.Types.ObjectId(validationResult.event_id) },
            { "host_user_id": mongoose.Types.ObjectId(validationResult.host_user_id) },
            { "status": "inprogress" },
          ],
          $or: [filter],
        },
      },
      {
        $project: {
          event: {
            _id: "$_id",
            credit: { $ifNull: ["$credit", ""] },
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
            }
          },
        },
      },
      {
        $match: {
          $and: [
            { "event.event_dates": { $ne: null } },
            { "event.event_dates": { $ne: [] } }
          ]
        }
      },
      {
        $limit: 1
      }
    ];

    const data = await Events.aggregate(queryDoc).exec();

    if (data?.length === 0) {
      return res.json({
        status: configs.error_status,
        data: {},
        message: 'Unable to unregister attendance as event session is not avaialble!'
      });
    }

    const eventData = data[0];
    const event_session = await EventSession.findOne({
      event_id: eventData._id,
      event_status: 'inprogress'
    }).exec();
    const event_session_id = event_session?._id;

    if (!event_session_id) {
      return res.json({
        status: configs.error_status,
        data: eventData,
        message: 'Unable to unregister attendance as event session is not avaialble!'
      });
    }

    let attendee_users = _.uniq(validationResult.attendee_users);

    attendee_users = validationResult.attendee_users.map((item) => mongoose.Types.ObjectId(item));
    const attendee_users_list = await EventUser.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
        },
      },
      {
        $match: {
          user_id: { $in: attendee_users },
          event_id: mongoose.Types.ObjectId(validationResult.event_id),
        }
      },
      {
        $project: {
          user: {
            _id: "$user._id",
            first_name: 1,
            last_name: 1,
            credits: "$user.credits",
          },
        },
      },
    ]).exec();


    if (attendee_users_list.length === 0) {
      return res.json({
        status: configs.success_status,
        data: eventData,
        message: 'Attendace unregistered successfully'
      });
    }

    await Promise.all(attendee_users_list.map(async (item) => {
      const checkDelete = await EventAttendances.deleteOne({
        user_id: item?.user?._id,
        event_session_id
      });
      if (checkDelete.deletedCount) {
        let event_credit = Math.round(eventData?.event.credit);
        let credits = Math.round(item?.user?.credits);
        credits -= event_credit;
        credits = credits < 0 ? 0 : credits;

        const updatedUserCredit = await Users.findByIdAndUpdate(
          item?.user?._id,
          {
            $set: {
              credits,
            },
          },
          { new: true }
        ).exec();
      }
    }));

    return res.json({
      status: configs.success_status,
      message: 'Attendace unregistered successfully'
    });
  } catch (error) {
    console.log(error);
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
};

exports.hostAttendanceReport = async (req, res, next) => {
  try {
    const schema = Joi.object({
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(10),
      search: Joi.string(),
      start_date: Joi.string(),
      end_date: Joi.string(),
      event_id: Joi.string().required(),
      host_user_id: Joi.string(),
      event_session_id: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);

    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const sort = { "_id": -1 };

    const orFilter = {};
    const andFilter = {};

    if (validationResult.start_date) {
      let start_date = moment(validationResult.start_date);
      let end_date = moment(validationResult.start_date);
      start_date.set('hour', 0);
      start_date.set('minute', 0);
      start_date.set('second', 0);
      start_date.set('millisecond', 0);
      end_date.set('hour', 23);
      end_date.set('minute', 59);
      end_date.set('second', 59);
      end_date.set('millisecond', 0);
      andFilter["event.event_dates.start"] = {
        $gt: start_date,
        $lt: end_date,
      };
    }

    if (validationResult.host_user_id) {
      andFilter["host_user_id"] = mongoose.Types.ObjectId(validationResult.host_user_id);
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
          from: "departments",
          localField: "event.departments",
          foreignField: "_id",
          as: "event.departments",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "user.department_id",
          foreignField: "_id",
          as: "user.department",
        },
      },
      {
        $unwind: {
          path: "$user.department",
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
        },
      },
      {
        $match: {
          $and: [
            { "event_id": mongoose.Types.ObjectId(validationResult.event_id), },
            andFilter,
          ],
          $or: [orFilter],
        },
      },
      {
        $group: {
          _id: "$event_session_id",
          event_session_start: { $first: "$event_session_start" },
          event: { $first: "$event" },
          host_user: { $first: "$host_user" },
          event: { $first: "$event" },
          users: { $push: "$user" },
        }
      },
      {
        $project: {
          _id: 1,
          event_session_start: 1,
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
          host_user: {
            _id: "$host_user._id",
            first_name: { $ifNull: ["$host_user.first_name", ""] },
            last_name: { $ifNull: ["$host_user.last_name", ""] },
            user_img: { $ifNull: ["$host_user.user_img", ""] },
          },
          users: {
            $ifNull: [
              {
                $map: {
                  input: "$users",
                  as: "user_item",
                  in: {
                    _id: "$$user_item._id",
                    first_name: { $ifNull: ["$$user_item.first_name", ""] },
                    last_name: { $ifNull: ["$$user_item.last_name", ""] },
                    user_img: { $ifNull: ["$$user_item.user_img", ""] },
                    department_name: "$$user_item.department.department_name",
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

    const data = await EventAttendances.aggregate(queryDoc).exec();

    const totalEvents = await EventAttendances.aggregate(queryCount).exec();
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

exports.eventAttendanceReport = async (req, res, next) => {
  try {
    const schema = Joi.object({
      event_user_id: Joi.string().required(),
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(10),
      search: Joi.string(),
      event_session_id: Joi.string(),
      start_date: Joi.string(),
      end_date: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);

    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const sort = { "_id": -1 };

    const orFilter = {};
    const andFilter = {};

    if (validationResult.start_date) {
      let start_date = moment(validationResult.start_date);
      let end_date = moment(validationResult.start_date);
      start_date.set('hour', 0);
      start_date.set('minute', 0);
      start_date.set('second', 0);
      start_date.set('millisecond', 0);
      end_date.set('hour', 23);
      end_date.set('minute', 59);
      end_date.set('second', 59);
      end_date.set('millisecond', 0);
      andFilter["event.event_dates.start"] = {
        $gt: start_date,
        $lt: end_date,
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
          from: "departments",
          localField: "event.departments",
          foreignField: "_id",
          as: "event.departments",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
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
        },
      },
      {
        $match: {
          $and: [
            { "event_id": mongoose.Types.ObjectId(validationResult.event_id), },
          ],
          ...andFilter,
          $or: [orFilter],
        },
      },
      {
        $project: {
          event_session_id: 1,
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
          },
          departments: {
            $ifNull: [
              {
                $map: {
                  input: "event.$departments",
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
          user: {
            _id: "$user._id",
            first_name: { $ifNull: ["$user.first_name", ""] },
            last_name: { $ifNull: ["$user.last_name", ""] },
            user_img: { $ifNull: ["$user.user_img", ""] },
          },
          host_user: {
            _id: "$host_user._id",
            first_name: { $ifNull: ["$host_user.first_name", ""] },
            last_name: { $ifNull: ["$host_user.last_name", ""] },
            user_img: { $ifNull: ["$host_user.user_img", ""] },
          },
        },
      },
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

    const data = await EventAttendances.aggregate(queryDoc).exec();

    const totalEvents = await EventAttendances.aggregate(queryCount).exec();
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


exports.checkHostUser = async (req, res, next) => {
  try {
    const schema = Joi.object({
      user_id: Joi.any().required(),
      isHost: Joi.boolean()
    });

    const validationResult = await schema.validateAsync(req.body);

    const checkHostUser = await Host.exists({
      user_id: validationResult.user_id,
    });
    const isHost = typeof checkHostUser === 'boolean' ? checkHostUser : false;

    return res.json({
      status: configs.success_status,
      data: {
        isHost
      },
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

exports.getEventByIdForHost = async (req, res, next) => {
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
          isAccept: {$ifNull: ["$isAccept", "pending"]},
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
        host_user: {
          _id: "$host_user._id",
          first_name: "$host_user.first_name",
          last_name: "$host_user.last_name",
          user_img: { $ifNull: ["$host_user.user_img", ""] },
        },
      },
    },
    { $limit: 1 },
  ]).exec();
  if (data?.length > 0) {
    const eventUser = await EventUser.find({
      event_id: mongoose.Types.ObjectId(req.params.id),
      user_id: { $ne: mongoose.Types.ObjectId(req.user._id) },
    }).populate("user_id", "first_name last_name user_img isAccept").exec();
    const result = data[0];

    result.users_list = eventUser?.length > 0 ?
      eventUser.map(item => (
        {
          _id: item.user_id?._id,
          first_name: item.user_id?.first_name ? item.user_id?.first_name : '',
          last_name: item.user_id?.last_name ? item.user_id?.last_name : '',
          user_img: item.user_id?.user_img ? item.user_id?.user_img : '',
          isAccept: item?.isAccept ? item?.isAccept : ''
        }
      )) : [];
    result.isAccept = typeof checkUser?.isAccept === 'string' ? checkUser.isAccept : 'pending' ? checkUser?.isAccept : 'Accept';

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