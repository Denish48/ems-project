const Joi = require('joi');
const XLSX = require('xlsx');
const mongoose = require('mongoose');
const Users = mongoose.model('users');
const Department = mongoose.model('departments');
const path = require('path')
const fs = require('fs')
const configs = require('../configs');

const jsonDataFromFile = (fileObj) => {
  // read file from buffer
  const wb = XLSX.read(fileObj.buffer, {
    type: 'buffer',
    cellDates: true, // otherwise for csv 2021-04-12T12:00:00Z is converted to 44298.22928240741
  });

  const sheetNameList = wb.SheetNames;
  const parsedJsonData = XLSX.utils.sheet_to_json(wb.Sheets[sheetNameList[0]]);
  return parsedJsonData;
}

exports.importUsers = async (req, res) => {
  try {
    if (!req.files || !req.files.attachment) {
      return res.json({ message: 'IMPORT_FILE_NOT_PROVIDED', statusCode: 400 });
    }
    if (req.files.attachment.length !== 1) {
      return res.json({ message: 'IMPORT_ONLY_ONE_FILE_ALLOWED', statusCode: 400 });
    }
    const fileObj = req.files.attachment[0];

    const fileExt = fileObj.originalname.split('.')[fileObj.originalname.split('.').length - 1];

    if (!['xlsx', 'xls', 'csv'].includes(fileExt.toLowerCase())) {
      return res.json({ message: 'IMPORT_FILE_EXT_NOT_SUPPORTED', statusCode: 400 });
    }
    const dataPayload = jsonDataFromFile(fileObj);
    console.log(dataPayload);

    const bodySchema = Joi.object({
      org_id: Joi.string().required(),
      user_id: Joi.string().required()
    });
    const validationBodyResult = await bodySchema.validateAsync(req.body);

    const userSchema = Joi.object({
      First_Name: Joi.string().required(),
      Last_Name: Joi.string().required(),
      Email: Joi.string().required(),
      Phone_Number: Joi.any(),
      Department_name: Joi.string().required(),
      Position: Joi.string().default(''),
    });
    const payloadSchema = Joi.array().items(userSchema).min(1).required();
    const validationResult = await payloadSchema.validateAsync(dataPayload);

    const result = [];

    await Promise.all(validationResult.map(async (item) => {
      const isEmp = await Users.findOne({
        $or: [
          { email: validationResult.email },
          { phone_number: validationResult.phone_number }
        ],
      }).select('_id').exec();
      if (isEmp) {
        return res.json({
          status: configs.error_status,
          data: [],
          message: "User is already exist",
        });
      }
      const departmentData = await Department.findOne({
        // department_name: { "$regex": '^' + item.Department_name + '$', $options: 'i' }
        department_name: item.Department_name
      }).select('_id').exec();
      if (!departmentData) {
      console.log(item.Department_name);

        throw new Error('Department not found');
      }
      if (item.Phone_Number) {
        const userData = {
          first_name: item.First_Name,
          last_name: item.Last_Name,
          user_img: item.user_img,
          email: item.Email,
          phone_number: item.Phone_Number?.toString().replace(/\s+/g,''),
          department_id: departmentData._id,
          position: item.Position,
          role_id: '60e68a875f40862222c64ecb',
          createdBy: validationBodyResult.user_id,
          updatedBy: validationBodyResult.user_id,
          org_id: validationBodyResult.org_id,
        };
        result.push(userData);
        const new_emp = new Users(userData);
        const data = await new_emp.save();
        if (data) {
          console.log('User inserted', data);
        } 
      }
    }));

    if (result) {
      return res.json({
        status: configs.success_status,
        data: result,
        message: "Import data successfully",
      });
    } else {
      return res.json({
        status: configs.error_status,
        data: [],
        message: "CSV upload failed",
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error?.message ? error?.message : "" });
  }
}

exports.downlaodFormat = async (req, res) => {
  try {
    var filePath = 'examples/user.csv';
    res.download(filePath);
  } catch (error) {
    console.log(error);
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error?.message ? error?.message : "" });
  }
}