const mongoose = require('mongoose');
const Joi = require('joi');
const configs = require('../configs');
const Users = mongoose.model('users');
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
        let fileExtension = mime.extension(mimetype);
        let fname = `${file.fieldname}-${Date.now()}.${fileExtension}`;
        if (file.mimetype === 'application/octet-stream') {
            fileExtension = path.extname(file.originalname);
            fname = `${file.fieldname}-${Date.now()}${fileExtension}`;
        }
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
    // fileFilter: fileFilter,
}).single('user_img')


exports.userprofileList = async (req, res, next) => {
    try {
        let limit = 4;
        if (req.query.limit) {
            limit = parseInt(req.query.limit);
        }
        let queryDoc = {
            role_id: '60e68a875f40862222c64ecb',
        }
        let _id;
        if (req.user?._id) {
            queryDoc._id = mongoose.Types.ObjectId(req.user._id);
          }
        const totalUsers = await Users.countDocuments(queryDoc).exec();
        const data = await Users.find(queryDoc)
            .populate('department_id', 'department_name')
            .select('user_img first_name last_name email phone_number')
            .limit(limit)
            .exec();
        if (data.length > 0) {
            const plushCount = totalUsers > 0 ? totalUsers - data.length : totalUsers;
            return res.json({
                status: configs.success_status,
                data,
                plushCount,
                message: 'Request completed successfully'
            });
        } else {
            return res.json({
                status: configs.success_status,
                data: [],
                plushCount: 0,
                message: 'No user found!'
            });
        }
    } catch (error) {
        return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
    }
};

exports.userprofileById = async (req, res, next) => {
    try {
        const data = await Users.findById(req.params.id).exec();
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
        return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
    }
};

exports.edituserprofile = async (req, res, next) => {
    try {
        const schema = Joi.object({
            first_name: Joi.string().required(),
            last_name: Joi.string().required(),
            user_id: Joi.string().required(),
        });
        const validationResult = await schema.validateAsync(req.body);

        const emp = {
            first_name: validationResult.first_name,
            last_name: validationResult.last_name,
            updatedBy: validationResult.user_id,
            updated_At: configs.utcDefault(),
        };
        const data = await Users.findByIdAndUpdate(req.params.id, { $set: emp }, { new: true }).exec();
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
        console.log(error)
        return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
    }
};

exports.edituserprofilepicture = async (req, res, next) => {
    uploadEventFile(req, res, async (data, err) => {
        if (err) {
            console.log(err);
            res.json({ status: configs.error_status, message: "Something went wrong while uploading files." });
        } else {
            try {
                console.log('req.file', req.file);
                let receivedBody = req.body;
                let user_img = req.file?.filename ? req.file.filename : '';
                if (user_img) {
                    receivedBody.user_img = user_img;
                }
                console.log('user_img', user_img)
                const schema = Joi.object({
                    user_img: Joi.string().required(),
                    user_id: Joi.string().required(),
                });
                const validationResult = await schema.validateAsync(req.body);

                const emp = {
                    user_img: validationResult.user_img,
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
                if (data) {
                    return res.json({
                        status: configs.success_status,
                        data,
                        message: 'profile photo updated successfully'
                    });
                } else {
                    return res.json({
                        status: configs.success_status,
                        data,
                        message: 'photo not found!'
                    });
                }
            } catch (error) {
                console.log(error)
                return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
            }
        };
    })
}