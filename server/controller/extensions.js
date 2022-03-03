const mongoose = require('mongoose');
const Joi = require('joi');
const configs = require('../configs');
const EmailDomains = mongoose.model('emailDomains');
const Users = mongoose.model('users');

exports.addEmailDomains = async (req, res, next) => {
  try {
    const schema = Joi.object({
      org_id: Joi.string().required(),
      email_domain: Joi.string().required(),
      user_id: Joi.string().required(),
    });
    const validationResult = await schema.validateAsync(req.body);

    const isDepartment = await EmailDomains.findOne({ email_domain: { $regex: validationResult.email_domain, $options: "i" } }).limit(5).select('_id').exec();
    if (isDepartment) {
      return res.json({
        status: configs.error_status, message: "Email Domains is already Registered"
      });
    }

    const emal = new EmailDomains({
      org_id: validationResult.org_id,
      email_domain: validationResult.email_domain,
      createdBy: validationResult.user_id,
      updatedBy: validationResult.user_id,
    });

    const data = await emal.save();
    if (data) {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Email Domains added successfully'
      });
    }
  } catch (error) {
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }

}

exports.emailDomainList = async (req, res, next) => {
  try {
    const pageNum = req.body.pageNum ? req.body.pageNum : 1;
    const limit = req.body.pageLimit ? req.body.pageLimit : 10;
    const skip = limit * (pageNum - 1);
    const search = req.body.search?.trim() ? req.body.search.trim() : null;

    const query = {};

    if (search) {
      query.email_domain = { $regex: search, $options: 'i' }
    }

    const queryListEmailDomain = EmailDomains.find(query);
    const qrCountEmailDomain = EmailDomains.find(query);

    if (limit) {
      queryListEmailDomain.skip(skip).limit(limit);
    }
    const totalEmailDomains = await qrCountEmailDomain.countDocuments().exec();
    const data = await queryListEmailDomain.exec();
    const totalFilteredPage = Math.ceil(totalEmailDomains / limit);

    if (data && data.length > 0) {
      return res.json({
        status: configs.success_status,
        data,
        metaData: {
          currentPage: pageNum,
          totalDepartments,
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

// exports.departmentDropdownList = async (req, res, next) => {
//   try {
//     const data = await Departments.find()
//       .select({ email_domain: 1 })
//       .exec();
//     return res.json({
//       status: configs.success_status,
//       data,
//       message: 'Request completed successfully'
//     });
//   } catch (error) {
//     return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
//   }
// };

exports.emailDomainsById = async (req, res, next) => {
  try {
    const data = await EmailDomains.findById(req.params.id).exec();
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
        message: 'EmailDomains not found!'
      });
    }
  } catch (error) {
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
};

exports.editEmailDomain = async (req, res, next) => {
  try {
    const schema = Joi.object({
      email_domain: Joi.string().required(),
      user_id: Joi.string().required(),
    });
    const validationResult = await schema.validateAsync(req.body);

    const isEmailDomain = await EmailDomains.findOne({
      _id: { $ne: req.params.id },
      email_domain: {
        $regex: validationResult.email_domain,
        $options: "i"
      }
    }).select('_id').exec();
    if (isEmailDomain) {
      return res.json({
        status: configs.error_status, message: "EmailDomain is already Registered"
      });
    }

    const emil = {
      email_domain: validationResult.email_domain,
      updatedBy: validationResult.user_id,
      updated_At: configs.utcDefault(),
    };
    const data = await EmailDomains.findByIdAndUpdate(req.params.id, { $set: emil }, { new: true }).exec();
    if (data) {
      return res.json({
        status: configs.success_status,
        data,
        message: 'emailDomain updated successfully'
      });
    } else {
      return res.json({
        status: configs.success_status,
        data,
        message: 'emailDomain not found!'
      });
    }
  } catch (error) {
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
};

exports.deleteEmailDomains = async (req, res, next) => {
  try {
    const schema = Joi.object({
      user_id: Joi.string().required(),
    });
    await schema.validateAsync(req.body);
    const userList = await Users.find({ emailDomain_id: req.params.id }).countDocuments().exec();
    if (userList > 0) {
      return res.json({
        status: configs.success_status,
        data: null,
        message: 'You can not delete this deparment as it linked with user(s)'
      });
    }
    const data = await EmailDomains.findByIdAndDelete(req.params.id).exec();
    if (data) {
      return res.json({
        status: configs.success_status,
        data,
        message: 'EmailDomains deleted successfully'
      });
    } else {
      return res.json({
        status: configs.success_status,
        data,
        message: 'EmailDomains not found!'
      });
    }
  } catch (error) {
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
};