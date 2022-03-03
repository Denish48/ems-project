const mongoose = require('mongoose');
const configs = require("../configs");
const Joi = require('joi');
const Feedback = mongoose.model('feedbacks');
const EventUser = mongoose.model('event_user');

exports.addfeedback = async (req, res, next) => {
  try {
    const schema = Joi.object({
      org_id: Joi.string(),
      event_id: Joi.string(),
      rating: Joi.number(),
      feedback_survey_description: Joi.string(),
      user_id: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);
    const fs = new Feedback({
      org_id: validationResult.org_id,
      event_id: validationResult.event_id,
      rating: validationResult.rating,
      feedback_survey_description: validationResult.feedback_survey_description,
      user_id: validationResult.user_id,
      createdBy: validationResult.user_id,
      updatedBy: validationResult.user_id,
    });
    const data = await fs.save();
    if (data) {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Feedback submitted successfully'
      });
    }
  } catch (error) {
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }

}

exports.feedbackList = async (req, res, next) => {
  try {
    const schema = Joi.object({
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(10),
      search: Joi.string(),
      event_id: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);
    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);
    const orFilter = {};
    const andFilter = {};

    if (validationResult.search) {
      orFilter["event_name"] = {
        $regex: validationResult.search,
        $options: "i",
      };
    }

    if (validationResult.event_id) {
      andFilter["event._id"] = mongoose.Types.ObjectId(
        validationResult.event_id
      );
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
          preserveNullAndEmptyArrays: false,
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
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: "event_forms",
          localField: "event_form_id",
          foreignField: "_id",
          as: "event_form",
        },
      },
      {
        $unwind: {
          path: "$event_form",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          _id: "$_id",
          user: {
            _id: "$user_id",
            full_name: { $concat: ["$user.first_name", " ", "$user.last_name"] },
          },
          event: {
            _id: "$event._id",
            event_name: { $ifNull: ["$event.event_name", ""] },
          },
          event_form: "$event_form",
          answers: "$answers"
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
    const data = await Feedback.aggregate(queryDoc).exec();
    const totalfeedback_survey = await Feedback.aggregate(queryCount).exec();
    const totalFilteredPage =
      totalfeedback_survey?.length > 0 && totalfeedback_survey[0].count
        ? Math.ceil(totalfeedback_survey[0].count / limit)
        : 0;
    if (data && data.length > 0) {
      return res.json({
        status: configs.success_status,
        data,
        metaData: {
          currentPage: pageNum,
          totalFilteredCount: totalfeedback_survey[0].count,
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

exports.feedbackById = async (req, res, next) => {
  try {
    const schema = Joi.object({
      next: Joi.string(),
    });

    const validationResult = await schema.validateAsync(req.query);
    const andFilter = {};

    if (req.params.id) {
      andFilter["_id"] = mongoose.Types.ObjectId(
        req.params.id
      );
    }

    if (typeof validationResult.next !== 'undefined') {
      if (validationResult.next == '0') {
        andFilter["_id"] = {
          $lt: mongoose.Types.ObjectId(
            req.params.id
          )
        };
      } else if (validationResult.next == '1') {
        andFilter["_id"] = {
          $gt: mongoose.Types.ObjectId(
            req.params.id
          )
        };
      }
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
          preserveNullAndEmptyArrays: false,
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
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: "event_forms",
          localField: "event_form_id",
          foreignField: "_id",
          as: "event_form",
        },
      },
      {
        $unwind: {
          path: "$event_form",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          _id: "$_id",
          user: {
            _id: "$user_id",
            full_name: { $concat: ["$user.first_name", " ", "$user.last_name"] },
          },
          event: {
            _id: "$event._id",
            event_name: { $ifNull: ["$event.event_name", ""] },
          },
          event_form: "$event_form",
          answers: "$answers"
        },
      },
      {
        $match: {
          ...andFilter,
        },
      },

    ];

    let queryCount = queryDoc;

    queryDoc = [...queryDoc, ...[{ $limit: 1 }]];

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
    const data = await Feedback.aggregate(queryDoc).exec();
    if (data && data.length > 0) {
      return res.json({
        status: configs.success_status,
        data,
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

exports.feedbackChecklist = async (req, res, next) => {
  try {
    //console.log(req.params.id);
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
          user_id: mongoose.Types.ObjectId(req.params.id),
          isAccept: "accepted",
          "event.status": "completed",
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


    const data = await EventUser.aggregate(queryDoc).exec();
    if (data) {
      console.log(data);
      return res.json({
        status: configs.success_status,
        data,
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
    })
  }
}

exports.deleteFeedback = async (req, res, next) => {
  try {
    const schema = Joi.object({
      feedback_id: Joi.string().required(),
    });
    const validationResult = await schema.validateAsync(req.body);
    const data = await Feedback.findByIdAndDelete(mongoose.Types.ObjectId(validationResult.feedback_id)).exec();
    if (data) {
      return res.json({
        status: configs.success_status,
        data,
        message: "Feedback deleted successfully",
      });
    } else {
      return res.json({
        status: configs.success_status,
        data,
        message: "Feedback not found!",
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

exports.FeedbackUsers = async (req, res, next) => {
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
        $match: {
          user_id: mongoose.Types.ObjectId(req.params.id),
          isAccept: "accepted",
          "event.status": "completed",
          // $expr: { $gte: [{ $size: "feedbackList" }, 1] }
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
          },
          feedbacks: "$feedbackList"
        },
      },
      {
        $limit: 1
      }
    ]

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

    const data = await Feedback.aggregate(queryDoc).exec();

    const totalEvents = await Feedback.aggregate(queryCount).exec();
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

exports.feedbackAnswers = async (req, res, next) => {
  try {
    const schema = Joi.object({
      org_id: Joi.string(),
      event_id: Joi.string(),
      event_form_id: Joi.string(),
      answers: Joi.any(),
      user_id: Joi.string(),
    });
    const org_id = req.user?.org_id?._id;
    const validationResult = await schema.validateAsync({ ...req.body, org_id });
    const feedbackans = new Feedback({
      org_id: validationResult.org_id,
      event_id: validationResult.event_id,
      event_form_id: validationResult.event_form_id,
      answers: validationResult.answers,
      user_id: validationResult.user_id,
      createdBy: validationResult.user_id,
      updatedBy: validationResult.user_id,
    });
    const data = await feedbackans.save();
    if (data) {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Feedback submitted successfully'
      });
    }
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  } catch (error) {
    console.log(error);
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }

}

exports.feedbackAnswerList = async (req, res, next) => {
  try {
    const schema = Joi.object({
      event_id: Joi.string().required(),
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(10),
    });
    const validationResult = await schema.validateAsync(req.body);
    const data = await Feedback.find({
      event_id: validationResult.event_id
    })
      .populate('event_id', 'feedbacck_questions ')
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