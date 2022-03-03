const mongoose = require('mongoose');
const Joi = require('joi');
const configs = require('../configs');

const Departments = mongoose.model('departments');
const Users = mongoose.model('users');
const ObjectId = require('mongoose').Types.ObjectId;

exports.addDepartments = async (req, res, next) => {
  try {
    const schema = Joi.object({
      org_id: Joi.string().required(),
      department_name: Joi.string().required(),
      user_id: Joi.string().required(),
    });
    const validationResult = await schema.validateAsync(req.body);

    const isDepartment = await Departments.findOne({ department_name: { $regex: validationResult.department_name, $options: "i" } }).limit(5).select('_id').exec();
    if (isDepartment) {
      return res.json({
        status: configs.error_status, message: "Department is already Registered"
      });
    }

    const deprt = new Departments({
      org_id: validationResult.org_id,
      department_name: validationResult.department_name,
      createdBy: validationResult.user_id,
      updatedBy: validationResult.user_id,
    });

    const data = await deprt.save();
    if (data) {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Department added successfully'
      });
    }
  } catch (error) {
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }

}

exports.departmentList = async (req, res, next) => {
  try {
    const pageNum = req.body.pageNum ? req.body.pageNum : 1;
    const limit = req.body.pageLimit ? req.body.pageLimit : 10;
    const skip = limit * (pageNum - 1);
    const search = req.body.search?.trim() ? req.body.search.trim() : null;

    const query = {};

    if (search) {
      query.department_name = { $regex: search, $options: 'i' }
    }

    const queryListDepartment = Departments.find(query);
    const qrCountdepartemnt = Departments.find(query);

    if (limit) {
      queryListDepartment.skip(skip).limit(limit);
    }
    const totalDepartments = await qrCountdepartemnt.countDocuments().exec();
    const data = await queryListDepartment.exec();
    const totalFilteredPage = Math.ceil(totalDepartments / limit);

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

exports.departmentDropdownList = async (req, res, next) => {
  try {
    const data = await Departments.find()
      .select({ department_name: 1 })
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

exports.departmentById = async (req, res, next) => {
  try {
    const data = await Departments.findById(req.params.id).exec();
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
        message: 'Department not found!'
      });
    }
  } catch (error) {
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
};

exports.editDepartment = async (req, res, next) => {
  try {
    const schema = Joi.object({
      department_name: Joi.string().required(),
      user_id: Joi.string().required(),
    });
    const validationResult = await schema.validateAsync(req.body);

    const isDeparmtent = await Departments.findOne({
      _id: { $ne: req.params.id },
      department_name: {
        $regex: validationResult.department_name,
        $options: "i"
      }
    }).select('_id').exec();
    if (isDeparmtent) {
      return res.json({
        status: configs.error_status, message: "Department is already Registered"
      });
    }

    const deprt = {
      department_name: validationResult.department_name,
      updatedBy: validationResult.user_id,
      updated_At: configs.utcDefault(),
    };
    const data = await Departments.findByIdAndUpdate(req.params.id, { $set: deprt }, { new: true }).exec();
    if (data) {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Department updated successfully'
      });
    } else {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Department not found!'
      });
    }
  } catch (error) {
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
};

exports.deleteDepartment = async (req, res, next) => {
  try {
    const schema = Joi.object({
      user_id: Joi.string().required(),
    });
    await schema.validateAsync(req.body);
    const userList = await Users.find({ department_id: req.params.id }).countDocuments().exec();
    if (userList > 0) {
      return res.json({
        status: configs.success_status,
        data: null,
        message: 'You can not delete this deparment as it linked with user(s)'
      });
    }
    const data = await Departments.findByIdAndDelete(req.params.id).exec();
    if (data) {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Department deleted successfully'
      });
    } else {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Department not found!'
      });
    }
  } catch (error) {
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
};