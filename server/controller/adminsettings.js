const mongoose = require('mongoose');
const Joi = require('joi');
const configs = require('../configs');
const multer = require('multer');
const path = require('path');
const mime = require('mime-types');
const fs = require("fs");

const AdminSettings = mongoose.model('adminsettings');


const uploadAdminsettingsImageFilePath = 'uploads/adminsettings_images/';

var storageAdminsettingsImageFiles = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadAdminsettingsImageFilePath)
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
const uploadAdminsettingsFile = multer({
  storage: storageAdminsettingsImageFiles,
  fileFilter: fileFilter,
}).fields([
  {
    name: 'logo',
    maxCount: 1
  },
  {
    name: 'fav_icon',
    maxCount: 1
  }
])


exports.addAdminsetting = async (req, res, next) => {
  uploadAdminsettingsFile(req, res, async (data, err) => {
    if (err) {
      console.log(err);
      res.json({ status: configs.error_status, message: "Something went wrong while uploading files." });
    } else {
      try {
        let receivedBody = req.body;
        let logo = req.files?.logo?.length > 0 ? req.files.logo : [];
        if (logo?.length > 0) {
          logo = logo.map((item) => item.filename ? item.filename : '')
          receivedBody.logo = logo;
        }

        let fav_icon = req.files?.fav_icon?.length > 0 ? req.files.fav_icon : [];
        if (fav_icon?.length > 0) {
          fav_icon = fav_icon.map((item) => item.filename ? item.filename : '')
          receivedBody.fav_icon = fav_icon;
        }

        console.log('receivedBody', receivedBody);
        const schema = Joi.object({
          org_id: Joi.string(),
          user_id: Joi.string(),
          fav_icon: Joi.string(),
          logo: Joi.string(),
          footer: Joi.string(),
          custom: Joi.object(),
        });
        const validationResult = await schema.validateAsync(req.body);

        const checkAdminSettings = await AdminSettings.findOne({
          org_id: validationResult.org_id,
        }).exec();

        if (checkAdminSettings) {
          return res.json({
            status: configs.success_status,
            message: 'Admin settings for this organisation already exist'
          });
        }

        const setting = new AdminSettings({
          org_id: validationResult.org_id,
          'config.adminSetting.fav_icon': validationResult.fav_icon,
          'config.adminSetting.logo': validationResult.logo,
          'config.adminSetting.footer': validationResult.footer,
          'config.adminSetting.custom': validationResult.custom,
          createdBy: validationResult.user_id,
          updatedBy: validationResult.user_id,
        });

        if (validationResult.logo) {
          setting.logo = validationResult.logo;
          const adminsettingsImageData = await AdminSettings.findById(req.params.id).select('logo').exec();
          const filePath = adminsettingsImageData?.logo ? uploadAdminsettingsImageFilePath + adminsettingsImageData.logo : '';
          if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }

        if (validationResult.fav_icon) {
          setting.fav_icon = validationResult.fav_icon;
          const adminsettingsImageData = await AdminSettings.findById(req.params.id).select('fav_icon').exec();
          const filePath = adminsettingsImageData?.fav_icon ? uploadAdminsettingsImageFilePath + adminsettingsImageData.fav_icon : '';
          if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }

        const data = await setting.save();
        if (data) {
          return res.json({
            status: configs.success_status,
            data,
            message: 'Adminsettings added successfully'
          });
        }
      } catch (error) {
        console.log(error);
        return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
      }
    }
  })
}

exports.editAdminSetting = async (req, res, next) => {
  uploadAdminsettingsFile(req, res, async (data, err) => {
    if (err) {
      console.log(err);
      res.json({ status: configs.error_status, message: "Something went wrong while uploading files." });
    } else {
      try {
        let receivedBody = req.body;
        console.log('req.file', req.files);
        let logo = req.files?.logo?.length > 0 ? req.files.logo : [];
        if (logo?.length > 0) {
          logo = logo[0].filename ? logo[0].filename : '';
          receivedBody.logo = logo;
        }

        let fav_icon = req.files?.fav_icon?.length > 0 ? req.files.fav_icon : [];
        if (fav_icon?.length > 0) {
          fav_icon = fav_icon[0].filename ? fav_icon[0].filename : '';
          receivedBody.fav_icon = fav_icon;
        }

        const schema = Joi.object({
          org_id: Joi.string(),
          fav_icon: Joi.string(),
          logo: Joi.string(),
          footer: Joi.string(),
          custom: Joi.object(),
          user_id: Joi.string(),
        });
        console.log(receivedBody);
        const validationResult = await schema.validateAsync(receivedBody);

        const setting = {
          'config.adminSetting.fav_icon': validationResult.fav_icon,
          'config.adminSetting.logo': validationResult.logo,
          'config.adminSetting.footer': validationResult.footer,
          'config.adminSetting.custom': validationResult.custom,
          "updatedBy": validationResult.user_id,
          "updated_At": configs.utcDefault(),
        };

        if (validationResult.logo) {
          setting.logo = validationResult.logo;
          const adminsettingsImageData = await AdminSettings.findById(req.params.id).select('logo').exec();
          const filePath = adminsettingsImageData?.logo ? uploadAdminsettingsImageFilePath + adminsettingsImageData.logo : '';
          if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }

        if (validationResult.fav_icon) {
          setting.fav_icon = validationResult.fav_icon;
          const adminsettingsImageData = await AdminSettings.findById(req.params.id).select('fav_icon').exec();
          const filePath = adminsettingsImageData?.fav_icon ? uploadAdminsettingsImageFilePath + adminsettingsImageData.fav_icon : '';
          if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
        const data = await AdminSettings.findOneAndUpdate({
          org_id: validationResult.org_id,
        }, { $set: setting }, { new: true }).exec();
        if (data) {
          return res.json({
            status: configs.success_status,
            data,
            message: 'Adminsettings found successfully'
          });
        } else {
          return res.json({
            status: configs.success_status,
            data,
            message: 'Adminsettings not found!'
          });
        }
      } catch (error) {
        console.log(error)
        return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
      }
    };
  });
};
exports.adminSetting = async (req, res) => {
  try {
    const data = await AdminSettings.findOne({ org_id: req.params.id }).exec();
    if (data) {
      return res.json({
        status: configs.success_status,
        data,
        message: 'AdminSettings completed successfully'
      });
    } else {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Adminsettings not found!'
      });
    }
  } catch (error) {
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
}

exports.appSetting = async (req, res) => {
  try {
    const data = await AdminSettings.findOne({ org_id: req.params.id }).exec();
    if (data) {
      console.log('data', data);
      return res.json({
        status: configs.success_status,
        data: {
        showGoogleSignIn:  data.config?.adminSetting?.custom?.showGoogleSignIn},
        message: 'AppSettings found successfully'
      });
    } else {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Appsettings not found!'
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
}

exports.customadminSetting = async (req, res) => {
  try {
    let receivedBody = req.body;
    const schema = Joi.object({
      org_id: Joi.string(),
      custom: Joi.object(),
      user_id: Joi.string(),
    });
    console.log(receivedBody);
    const validationResult = await schema.validateAsync(receivedBody);

    const setting = {
      'config.adminSetting.custom': validationResult.custom,
      "updatedBy": validationResult.user_id,
      "updated_At": configs.utcDefault(),
    };

    const data = await AdminSettings.findOneAndUpdate({
      org_id: validationResult.org_id,
    }, { $set: setting }, { new: true }).exec();

    if (data) {
      console.log('data', data);
      return res.json({
        status: configs.success_status,
        data: {
        showGoogleSignIn:  data.config?.adminSetting?.custom?.showGoogleSignIn},
        message: 'AppSettings change successfully'
      });
    } else {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Appsettings not found!'
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
}