const mongoose = require('mongoose');
const configs = require("../configs");
const Joi = require('joi');
const PostCard = mongoose.model('postCard');
const PostCardTempletes = mongoose.model('postcard_templetes');

exports.addPostcardTemplete = async (req, res, next) => {
    try {
        const schema = Joi.object({
            org_id: Joi.string(),
            templete_name: Joi.string(),
            templete: Joi.string(),
            user_id: Joi.string(),
        });
        const validationResult = await schema.validateAsync(req.body);
        const postCardTempletes = new PostCardTempletes({
            org_id: validationResult.org_id,
            templete_name: validationResult.templete_name,
            templete: validationResult.templete,
            user_id: validationResult.user_id,
            createdBy: validationResult.user_id,
            updatedBy: validationResult.user_id,
        });

        const data = await postCardTempletes.save();
        if (data) {
            return res.json({
                status: configs.success_status,
                data,
                message: 'Request completed successfully'
            });
        }
    } catch (error) {
        console.log(error)
        return res.json({
            status: configs.error_status,
            message: configs.errMessage,
            error: error ? error : ""
        });
    }
}

exports.postCardTempleteById = async (req, res, next) => {
  try {
    const data = await PostCardTempletes.findById(req.params.id)
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
        message: "Post Card not found!",
      });
    }
  } catch (error) {
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
};

exports.editPostcardTemplete = async (req, res, next) => {
  
    try {
        const schema = Joi.object({
            templete_name: Joi.string(),
            templete: Joi.string(),
        });
        const validationResult = await schema.validateAsync(req.body);
        const postCardTempletes = {
            templete_name: validationResult.templete_name,
            templete: validationResult.templete,
            // updatedBy: validationResult.user_id,
        };
        const data = await PostCardTempletes.findByIdAndUpdate(
            req.params.id, {
                $set: postCardTempletes
            }, {
                new: true
            }
        ).exec();

        if (!data) {
            return res.json({
                status: configs.success_status,
                data,
                message: "PostCard Templete not found!",
            });
        }

        return res.json({
            status: configs.success_status,
            data,
            message: 'PostCard Templete updated successfully'
        });
    } catch (error) {
        console.log(error)
        return res.json({
            status: configs.error_status,
            message: configs.errMessage,
            error: error ? error : ""
        });
    }
}

exports.deletePostcardTempleteById = async (req, res, next) => {
    try {
      const data = await PostCardTempletes.findByIdAndDelete(req.params.id)
        .exec();
      if (data) {
        return res.json({
          status: configs.success_status,
          data,
          message: 'Postcard Templete deleted successfully'
        });
      } else {
        return res.json({
          status: configs.success_status,
          data: {},
          message: "Postcard Templete not found!",
        });
      }
    } catch (error) {
      return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
    }
};

exports.postCardList = async (req, res, next) => {
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
            templete_name: { $ifNull: ["$templete_name", ""] },
            templete: {$ifNull: ["$templete",""]},
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
      const data = await PostCardTempletes.aggregate(queryDoc).exec();
      const totalfeedback_survey = await PostCardTempletes.aggregate(queryCount).exec();
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

exports.savePostcard = async (req, res, next) => {
    try {
      const schema = Joi.object({
        postCard: Joi.array(),
      });
      const validationResult = await schema.validateAsync(req.body);
      const eventFormInfo = await Event_forms.findOneAndUpdate({ event_id: validationResult.event_id }, {
        $set: {
          postCard: validationResult.postCard,
          updatedBy: validationResult.user_id,
        }
      }).exec();
    //   if (eventFormInfo) {
    //     await Event.findOneAndUpdate({ _id: validationResult.event_id }, {
    //       $set: {
    //         updatedBy: validationResult.user_id,
    //       }
    //     }).exec();
    //     return res.json({
    //       status: configs.error_status, message: "Event form updated successfully"
    //     });
    //   }
      const event_forms = new PostCard({
        org_id: validationResult.org_id,
        questions: validationResult.questions,
        event_id: validationResult.event_id,
        createdBy: validationResult.user_id,
        updatedBy: validationResult.user_id,
      });
  
      const data = await PostCard.save();
    //   if (data) {
    //     const eventInfo = await Event.findOneAndUpdate({ _id: validationResult.event_id }, {
    //       $set: {
    //         event_form_id: data._id,
    //         updatedBy: validationResult.user_id,
    //       }
    //     }).exec();
    //     if (eventInfo) {
    //       console.log('eventInfo', eventInfo);
    //     }
    //}
        return res.json({
          status: configs.success_status,
          data,
          message: 'Post card updated successfully'
        });
    //   }
    } catch (error) {
      console.log(error)
      return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
    } 
}

exports.getPostcard = async (req, res, next) => {
    try {
      const postCardInfo = await PostCard.findById(req.params.id).select('postcard').exec();
      if (postCardInfo) {
        return res.json({
          status: configs.success_status,
          data: postCardInfo,
          message: "Post card found successfully"
        });
      }
      return res.json({
        status: configs.success_status,
        data: {},
        message: 'Post card not found!'
      });
    } catch (error) {
      console.log(error)
      return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
    }
}

exports.postcardDropdownList = async (req, res, next) => {
  try {
    const data = await PostCardTempletes.find().select({ templete_name: 1 })
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