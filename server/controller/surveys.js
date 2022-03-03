const mongoose = require('mongoose');
const configs = require("../configs");
const Joi = require('joi');
const Users = mongoose.model('users');
const Survey = mongoose.model('surveys')
const SurveyAnswers = mongoose.model('surveys_answers');
const notificationService = require('../services/notificationService');

exports.addsurvey = async (req, res, next) => {
  try {
    const schema = Joi.object({
      org_id: Joi.string(),
      survey_name: Joi.string(),
      survey_questions: Joi.array(),
      user_id: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);
    const survey = new Survey({
      org_id: validationResult.org_id,
      survey_name: validationResult.survey_name,
      survey_questions: validationResult.survey_questions,
      user_id: validationResult.user_id,
      createdBy: validationResult.user_id,
      updatedBy: validationResult.user_id,
    });
    const data = await survey.save();
    console.log(data, 'data');
    const totalUsers = await Users.find().exec();
    await Promise.all(totalUsers.map(async (user) => {
      let collapse_key = 'event_survey'
      let title = `Elsner Elevate Survey`;
      details = {
        screen: 'survey',
        id: survey._id
      };
      
      await notificationService.sendNotification([user],
        {
          notification: {
            title,
          },
          data: {
            click_action: configs.click_action,
            collapse_key,
            ...details
          }
        }
      );
    }));
    if (data) {
      return res.json({
        status: configs.success_status,
        data,
        message: 'survey form added successfully'
      });
    }
  } catch (error) {
    console.log(error)
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }

}

exports.surveyById = async (req, res, next) => {
  try {
    const data = await Survey.findById(req.params.id)
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
        data: {},
        message: "Survey not found!",
      });
    }
  } catch (error) {
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
};

exports.editSurvey = async (req, res, next) => {
  try {
    const schema = Joi.object({
      survey_name: Joi.string(),
      survey_questions: Joi.array(),
      user_id: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);
    const survey = {
      survey_name: validationResult.survey_name,
      survey_questions: validationResult.survey_questions,
      user_id: validationResult.user_id,
      updatedBy: validationResult.user_id,
    };
    const data = await Survey.findByIdAndUpdate(
      req.params.id,
      { $set: survey },
      { new: true }
    ).exec();

    if (!data) {
      return res.json({
        status: configs.success_status,
        data,
        message: "Survey form not found!",
      });
    }

    const totalUsers = await Users.find().exec();
    await Promise.all(totalUsers.map(async (user) => {
      let collapse_key = 'event_survey'
      let title = `Elsner Elevate Survey`;
      details = {
        screen: 'survey',
        id: survey._id
      };
      
      await notificationService.sendNotification([user],
        {
          notification: {
            title,
          },
          data: {
            click_action: configs.click_action,
            collapse_key,
            ...details
          }
        }
      );
    }));
    return res.json({
      status: configs.success_status,
      data,
      message: 'Elevate Form updated successfully'
    });
  } catch (error) {
    console.log(error)
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
}

exports.surveyAnswers = async (req, res, next) => {
  try {
    const schema = Joi.object({
      org_id: Joi.string(),
      survey_id: Joi.string(),
      answers: Joi.any(),
      user_id: Joi.string(),
    });
    //const org_id = req.user?.org_id?._id;
    const validationResult = await schema.validateAsync({ ...req.body});
    const data = await Survey.findById(validationResult.survey_id)
      .exec();
    if (data) {
      const surveyans = new SurveyAnswers({
        org_id: validationResult.org_id,
        survey_id: validationResult.survey_id,
        answers: validationResult.answers,
        user_id: validationResult.user_id,
        createdBy: validationResult.user_id,
        updatedBy: validationResult.user_id,
      });
      const data = await surveyans.save();
      if (data) {
        return res.json({
          status: configs.success_status,
          data,
          message: 'survey add successfully'
        });
      }
      return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
    } else {
      return res.json({
        status: configs.success_status,
        data: {},
        message: "Survey not found!",
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
}

exports.surveyList = async (req, res, next) => {
  try {
    const schema = Joi.object({
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(10),
      search: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);
    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);

    let queryDoc = [
      {
        $project: {
          _id: "$_id",
          survey_name: { $ifNull: ["$survey_name", ""] },
          survey_questions: { $ifNull: ["$survey_questions", ""] },
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
    const data = await Survey.aggregate(queryDoc).exec();
    const totalfeedback_survey = await Survey.aggregate(queryCount).exec();
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

exports.SurveyUsersList = async (req, res, next) => {
  try {
    const schema = Joi.object({
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(10),
      search: Joi.string(),
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

    let queryDoc = [
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
          from: "surveys",
          localField: "survey_id",
          foreignField: "_id",
          as: "survey_form",
        },
      },
      {
        $unwind: {
          path: "$survey_form",
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
          survey_form: "$survey_form",
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
    const data = await SurveyAnswers.aggregate(queryDoc).exec();
    const totalfeedback_survey = await SurveyAnswers.aggregate(queryCount).exec();
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

exports.surveyAnswersById = async (req, res, next) => {
  try {
    const data = await SurveyAnswers.findById(req.params.id)
      .populate('survey_id', 'survey_questions ')
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