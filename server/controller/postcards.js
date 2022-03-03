const mongoose = require('mongoose');
const Joi = require('joi');
const configs = require('../configs');
const PostCardTempletes = mongoose.model('postcard_templetes');
const PostCards = mongoose.model('postCard');
const Users = mongoose.model('users');
const DepartMent = mongoose.model('departments');


exports.addPostCard = async (req, res, next) => {
    try {
        const schema = Joi.object({
            org_id: Joi.string().required(),
            postCard_templete_id: Joi.string().required(),
            user_id: Joi.string().required(),
            post_date: Joi.date().required(),
        });
        const validationResult = await schema.validateAsync(req.body);
        const postCard = new PostCards({
            org_id: validationResult.org_id,
            post_date: validationResult.post_date,
            user_id:validationResult.user_id,
            postCard_templete_id: validationResult.postCard_templete_id,
            updatedBy:req.user._id,
            createdBy: req.user._id,
        });

        const data = await postCard.save();
   
        if (data) {
            return res.json({
                status: configs.success_status,
                data,
                message: 'PostCard added successfully'
            });
        }
    } catch (error) {
        return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
    }

}

exports.postCardList = async (req, res, next) => {
    try {
        const pageNum = req.body.pageNum ? req.body.pageNum : 1;
        const limit = req.body.pageLimit ? req.body.pageLimit : 10;
        const skip = limit * (pageNum - 1);
        const search = req.body.search?.trim() ? req.body.search.trim() : null;

        const query = {};

        if (search) {
            query.postCard = { $regex: search, $options: 'i' }
        }

        const queryListPostCards = PostCards.find(query)


        const qrCountPostCards = PostCards.find(query);

        if (limit) {
            queryListPostCards.skip(skip).limit(limit);
        }

        const data = await queryListPostCards.populate('postCard_templete_id', 'templete_name templete' ).populate('user_id', 'first_name last_name').exec();
        const totalPostCards = await qrCountPostCards.countDocuments().exec();
        const totalFilteredPage = Math.ceil(totalPostCards / limit);

        if (data && data.length > 0) {
            return res.json({
                status: configs.success_status,
                data,
                metaData: {
                    currentPage: pageNum,
                    totalPostCards,
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
        return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
    }
};

exports.postCardDropdownList = async (req, res, next) => {
    try {
        const data = await PostCards.find()
            .select({ postCard: 1 })
            .exec();
        return res.json({
            status: configs.success_status,
            data,
            message: 'Request completed successfully'
        });
    } catch (error) {
        return res.json({
            status: configs.error_status,
            message: configs.errMessage,
            error: error ? error : ""
        });
    }
};


exports.previewPostcard=async(req, res, next) => {
    
    try {
        const userData=await Users.findById(req.body.user_id)
        const postcardData = await PostCards.find({user_id:req.body.user_id}).select({post_date:1}).sort({_id:-1})
        .limit(1)
        // console.log("postcardData",postcardData)
        const dapartmentData= await DepartMent.findById(userData.department_id)
        const templeteData = await PostCardTempletes.findById(req.body.postCard_templete_id)
        const dynamictemplete = await configs.htmlContentfortemplete(userData,templeteData,dapartmentData,postcardData)
        
        if (dynamictemplete) {
            return (
              res.set('Content-Type', 'text/html'),
              res.send(Buffer.from(dynamictemplete)))
          } else {
            return res.json({
              status: configs.success_status,
              message: 'Employee not found!'
            });
          } 
    } catch (error) {
        return res.json({
            status: configs.error_status,
            message: configs.errMessage,
            error: error ? error : ""
        });
    }
};
exports.deletePostcardById = async (req, res, next) => {
    try {
      const data = await PostCards.findByIdAndDelete(req.params.id)
        .exec();
      if (data) {
        return res.json({
          status: configs.success_status,
          data,
          message: 'Postcard  deleted successfully'
        });
      } else {
        return res.json({
          status: configs.success_status,
          data: {},
          message: "Postcard  not found!",
        });
      }
    } catch (error) {
      return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
    }
};
