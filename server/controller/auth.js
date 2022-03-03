const _ = require('lodash');
const mongoose = require('mongoose');
const Joi = require('joi');
const configs = require('../configs');
const jwt = require('jsonwebtoken');
const Tokens = mongoose.model('tokens');
const Users = mongoose.model('users');
const Host = mongoose.model('host');
const Events = mongoose.model('events');
const EventUser = mongoose.model("event_user");
const EmailDomains = mongoose.model('emailDomains');
const multer = require('multer');
const path = require('path');
const mime = require('mime-types');
const fs = require("fs");
const axios = require('axios');
const moment = require('moment');

const uploadUserImageFilePath = 'uploads/user_images/';

var storageUserImageFiles = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadUserImageFilePath)
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
const uploadEventFile = multer({
  storage: storageUserImageFiles,
  // fileFilter: fileFilter,
}).single('user_img')

// const client = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN)

const opt_code = '123456';

exports.login = async (req, res) => {
  try {
    const schema = Joi.object({
      phone_number: Joi.string().required(),
    });
    const validationResult = await schema.validateAsync(req.body);
    const userData = await Users.findOne({
      phone_number: validationResult.phone_number
    })
      .populate('role_id', 'role_type')
      .exec();
    if (!userData) {
      return res.json({ status: configs.error_status, message: "Your phone number is invalid" });
    }
    if (userData.isDeleted) {
      return res.status(configs.error_status).json({
        status: configs.error_status,
        data: {},
        message: "Your Account is deactivated"
      });
    }
    userData.password = undefined;
    return res.json({
      status: configs.success_status,
      data: userData,
      // authToken,
      message: "Please check otp you recevied."
    });
  } catch (error) {
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
}

exports.verify = async (req, res) => {
  try {
    const schema = Joi.object({
      phone_number: Joi.string().required(),
      otp: Joi.string().required(),
      device_id: Joi.string().required()
    });
    const validationResult = await schema.validateAsync(req.body);
    if (validationResult.otp !== opt_code) {
      return res.json({ status: configs.error_status, message: "Your otp is invalid" });
    }
    const userData = await Users.findOne({
      phone_number: validationResult.phone_number
    })
      .populate('org_id', '_id org_name')
      .populate('role_id', 'role_type')
      .lean()
      .exec();
    if (!userData) {
      return res.json({ status: configs.error_status, message: "Your phone number is invalid" });
    }
    if (userData.isActivate == true) {
      userData.password = undefined;

      const { _id, org_id, email, phone_number, first_name, last_name, department_id } = userData;
      const authData = {
        _id,
        org_id,
        email,
        phone_number,
        first_name,
        last_name,
        department_id
      };
      const authToken = configs.createTokens(authData);
      if (userData.isNewUser === true) {
        await Users.findByIdAndUpdate(
          userData._id,
          { $set: { isNewUser: false } },
          { new: true }
        ).exec();
      }

      const checkHostUser = await Host.exists({
        user_id: _id,
      });
      userData.isHost = typeof checkHostUser === 'boolean' ? checkHostUser : false;

      const deviceId = await Tokens.findOneAndUpdate({ user_id: _id }, {
        $set: {
          device_id: validationResult.device_id,
        }
      }).exec();

      if (!deviceId) {
        const newDeviceId = new Tokens({
          device_id: validationResult.device_id,
          user_id: _id
        });
        newDeviceId.save();
      }
      return res.json({
        status: configs.success_status,
        data: userData,
        authToken,
        message: "Login successfull"
      });
    } else {
      return res.json({
        status: configs.error_status, message: "Your Account is deactivated"
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
}

exports.refreshToken = async (req, res) => {
  try {
    const schema = Joi.object({
      refreshToken: Joi.string().required(),
    });
    const validationResult = await schema.validateAsync(req.body);

    let receivedUser = await configs.jwtTokenVerifier(validationResult.refreshToken);
    const userData = await Users.findById(receivedUser.iss)
      .populate('org_id', '_id org_name')
      .populate('role_id', 'role_type')
      .exec();
    if (!userData) {
      return res.json({ status: configs.error_status, message: "No data found" });
    }
    if (userData.isActivate == true) {
      isAccountMatch = true;
      userData.password = undefined;
      const authToken = configs.createTokens(userData);
      return res.json({
        status: configs.success_status,
        authToken,
        message: "Login successfull"
      });
    } else {
      return res.status(403).json({
        status: configs.error_status, message: "Your Account is deactivated"
      });
    }
  } catch (error) {
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
}

exports.forgotPassword = async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().required(),
    });
    const validationResult = await schema.validateAsync(req.body);
    const userData = await Users.findOne({
      email: validationResult.email
    }).exec();
    if (!userData) {
      return res.json({ status: configs.error_status, message: "Your email is invalid" });
    }
    var emailResetToken = "";
    var useCharacters = "1234567890";
    for (var i = 0; i < 6; i++) {
      emailResetToken += useCharacters.charAt(Math.floor(Math.random() * useCharacters.length));
    };
    let jwtData = {
      passwordResetToken: emailResetToken
    }
    const result = await Users.updateOne({
      _id: userData._id
    }, {
      $set: {
        resetCode: jwtData.passwordResetToken
      }
    }).exec();
    if (result) {
      const authToken = jwt.sign(jwtData, configs.secret, {
        expiresIn: '24h'
      });
      await configs.emailSender({
        to: userData.email,
        content: configs.forgetPasswordContent(userData, authToken,)
      });
      res.json({
        status: configs.success_status,
        message: 'Email sent sucessfully',
      });
      Users.updateOne({ _id: userData._id }, { '$set': { isEmailsent: true } });
    }
  } catch (error) {
    console.log(error);
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
}

exports.resetPassword = async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().required(),
      password: Joi.string().required(),
      emailResetToken: Joi.string().required(),
    });
    const validationResult = await schema.validateAsync(req.body);
    const userData = await Users.findOne({
      email: validationResult.email
    })
    if (!userData) {
      return res.json({ status: configs.error_status, message: "Your email is invalid" });
    }
    let passwordResetToken = null;
    const decoded = await configs.jwtTokenVerifier(validationResult.emailResetToken);
    if (decoded && decoded.passwordResetToken) {
      passwordResetToken = decoded.passwordResetToken;
    }
    if (passwordResetToken) {
      const userData = await Users.findOne({
        email: validationResult.email,
        resetCode: passwordResetToken,
      }).select('email first_name last_name').exec();
      if (userData) {
        userData.resetCode = null;
        userData.password = validationResult.password;
        const result = await Users.updateOne({
          _id: userData._id
        }, {
          $set: {
            resetCode: null,
            password: validationResult.password
          }
        }).exec();
        if (result.nModified > 0) {
          await configs.emailSender({
            to: userData.email,
            content: configs.resetPasswordContent(userData)
          });
          res.json({
            status: configs.success_status,
            message: 'Password change successfully',
          });
        } else {
          res.json({
            status: configs.error_status,
            message: configs.errMessage,
          });
        }
      } else {
        res.json({
          status: configs.error_status,
          message: "Your email address is wrong or may be your token get expiered.",
        });
      }
    } else {
      res.json({
        status: configs.error_status,
        message: "Please try again, may be your token get expiered.",
      });
    }
  } catch (error) {
    console.log(error);
  }
}

exports.updateDeviceId = async (req, res, next) => {
  try {
    const schema = Joi.object({
      org_id: Joi.string(),
      user_id: Joi.string(),
      device_id: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);
    const deviceId = await Tokens.findOneAndUpdate({ user_id: validationResult.user_id }, {
      $set: {
        device_id: validationResult.device_id,
      }
    }).exec()
    if (deviceId) {
      return res.json({
        status: configs.error_status, message: "Device Id updated successfully"
      });
    }
    const newDevice = new Tokens({
      org_id: validationResult.org_id,
      user_id: validationResult.user_id,
      device_id: validationResult.device_id
    });
    const data = await newDevice.save();
    if (data) {
      return res.json({
        status: configs.success_status,
        message: "Device Id registered successfully"
      });
    }
  } catch (error) {
    console.log(error)
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
}

exports.signInWithGoogle = async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().required(),
      device_id: Joi.string().required()
    });
    const validationResult = await schema.validateAsync(req.body);
    const userData = await Users.findOne({
      email: validationResult.email
    })
      .populate('role_id', 'role_type')
      .lean()
      .exec();
    if (!userData) {
      return res.json({
        status: configs.success_status,
        isExist: false,
        data: {},
        authToken: {},
        message: "Please SignUp first and again signIn with that Id."
      });
    }
    if (userData.isDeleted) {
      return res.status(configs.error_status).json({
        status: configs.error_status,
        data: {},
        authToken: {},
        message: "Your Account is deactivated"
      });
    }
    const { _id, org_id, email, phone_number, first_name, last_name, department_id, designation_id, birthdate } = userData;
    const authData = {
      _id,
      org_id,
      email,
      phone_number,
      first_name,
      last_name,
      department_id,
      designation_id,
      birthdate
    };
    const authToken = configs.createTokens(authData);
    if (userData.isNewUser === true) {
      await Users.findByIdAndUpdate(
        userData._id,
        { $set: { isNewUser: false } },
        { new: true }
      ).exec();
    }

    const checkHostUser = await Host.exists({
      user_id: _id,
    });
    userData.isHost = typeof checkHostUser === 'boolean' ? checkHostUser : false;

    const deviceId = await Tokens.findOneAndUpdate({ user_id: _id }, {
      $set: {
        device_id: validationResult.device_id,
      }
    }).exec();

    if (!deviceId) {
      const newDeviceId = new Tokens({
        device_id: validationResult.device_id,
        user_id: _id
      });
      newDeviceId.save();
    }
    return res.json({
      status: configs.success_status,
      isExist: true,
      data: userData,
      authToken,
      message: "Login successfull."
    });
  } catch (error) {
    console.log(error);
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
}

async function downloadImage(url, dest) {
  return new Promise(async (resolve, reject) => {
    /* Create an empty file where we can save data */
    const file = fs.createWriteStream(dest);

    /* Using Promises so that we can use the ASYNC AWAIT syntax */
    const response = await axios({
      url,
      responseType: 'stream',
    });
    response.data
      .pipe(file)
      .on('finish', () => resolve(true))
      .on('error', e => resolve(false));
  });
}

//if (typeof req.body.deploy_comment != 'undefined' && req.body.deploy_comment !== '') { new_item.deploy_comment = req.body.deploy_comment; }

exports.signUpWithGoogle = async (req, res, next) => {
  uploadEventFile(req, res, async (data, err) => {
    if (err) {
      console.log(err);
      res.json({ status: configs.error_status, message: "Something went wrong while uploading files." });
    } else {
      try {
        let receivedBody = req.body;
        let user_img = req.file?.filename ? req.file.filename : null;
        receivedBody.user_img = user_img ? user_img : receivedBody.user_img;
        const schema = Joi.object({
          org_id: Joi.string().default('60e69006c78d482d9347a830'),
          first_name: Joi.string().required(),
          last_name: Joi.string().required(),
          user_img: Joi.string(),
          email: Joi.string().required(),
          phone_number: Joi.string().required(),
          department_id: Joi.string().required(),
          designation_id: Joi.string().required(),
          birthdate: Joi.string().required(),
          user_id: Joi.string(),
          credits: Joi.string().default(0),
          penlity: Joi.string().default(0),
          role_id: Joi.string().default('60e68a875f40862222c64ecb')
        });
        const validationResult = await schema.validateAsync(receivedBody);
// let email=req.body.email;
        //const res1 = req.body.email.split("@")[1].toString();
        //const res2 = req.body.email.split("@")[0].toString();
        //const res3 = res2 +"@" + res1
        //let x = 'elsner';
        //const res4 = res3.includes(x);
        //const res5 = res4.split(".")[1];
        //console.log('res1', res1)
        //console.log('res2', res2)
        //console.log('res3', res3)
        //console.log('res4', res4)
        //console.log('res5', res5)
        // const isEmailDomain = await EmailDomains.exists({
        //   email_domain: res4
        // })
        //console.log("email domain",isEmailDomain)
 let   emailValid = false
        if (req.body.email.endsWith("xhtmljunkies.com")) {
          emailValid = true;
        } else if (req.body.email.endsWith("elsner.com")) {
          emailValid = true;
        } else if (req.body.email.endsWith("elsner.in")) {
          emailValid = true;
        } else if (req.body.email.endsWith("elsner.com.au")) {
          emailValid = true;
        } else if (req.body.email.includes("elsner@gmail.com")) {
          emailValid = true;
        // } else if (req.body.email.endsWith("outlook.com")) {
        //   emailValid = true;
        // }else if (req.body.email.endsWith("yahoo.com")) {
        //   emailValid = true;
        } else if (req.body.email.endsWith("linkpublishers.net")) {
          emailValid = true;
        }  else if (req.body.email.endsWith("hbirdsolutions.net")) {
          emailValid = true;
        } else if (req.body.email.includes("elsner")) {
          emailValid = true;
        } else {
          emailValid = false;
        }
        if (emailValid === false) {
          return res.json({
            status: configs.error_status, message: "email domain is not registered"
          })
        }
        if (typeof req.file?.filename === 'undefined' || req.file?.filename === null) {
          const fName = `user_img-${Date.now()}.png`;
          const fPath = `${uploadUserImageFilePath}/${fName}`;
          const downloadedData = await downloadImage(validationResult.user_img, fPath).catch((e) => console.log(e));
          if (downloadedData === true) {
            validationResult.user_img = fName;
          }
        }

        const isEmpPhone = await Users.findOne({ phone_number: validationResult.phone_number }).select('_id').exec();
        if (isEmpPhone) {
          return res.json({
            status: configs.error_status, message: "Phone number is already registered"
          });
        }

        const isEmpEmail = await Users.findOne({ email: validationResult.email }).select('_id').exec();
        if (isEmpEmail) {
          return res.json({
            status: configs.error_status, message: "Email is already registered"
          });
        }

        const new_emp = new Users({
          org_id: validationResult.org_id,
          first_name: validationResult.first_name,
          last_name: validationResult.last_name,
          user_img: validationResult.user_img,
          email: validationResult.email,
          phone_number: validationResult.phone_number,
          department_id: validationResult.department_id,
          designation_id: validationResult.designation_id,
          birthdate: new Date(validationResult.birthdate),
          createdBy: validationResult.user_id,
          updatedBy: validationResult.user_id,
          credits: validationResult.credits,
          penlity: validationResult.penlity,
          role_id: validationResult.role_id,
        });

        const { _id, org_id, email, phone_number, first_name, last_name, department_id, designation_id, birthdate } = new_emp;
        const authData = {
          _id,
          org_id,
          email,
          phone_number,
          first_name,
          last_name,
          department_id,
          designation_id,
          birthdate
        };
        const authToken = configs.createTokens(authData);

        const data = await new_emp.save();
        if (data) {
          res.json({
            status: configs.success_status,
            data,
            authToken,
            message: 'Users added successfully'
          });
          bindUserUpcomingEvents(data, validationResult.user_id);
        }
      } catch (error) {
        console.log(error);
        return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
      }
    }
  })
}

const bindUserUpcomingEvents = async (user, createdBy) => {
  //const now = moment.tz(moment(), "Asia/Kolkata").toDate();
  let queryDoc = [
    {
      $match: {
        $and: [
          { "department_id": user.department_id },
          { "event.status": "upcoming" },
          // { "start_date": { $gt: now } },
          // {
          //   $or: [
          //     { "start_date": { $gte: now } },
          //     { "end_date": { $lte: now }, }
          //   ]
          // }
        ],
      },
    },
    {
      $project: {
        _id: 1,
        org_id: 1
      },
    },
  ];
  const eventList = await Events.aggregate(queryDoc).exec();
  return await Promise.all(eventList.map(async (item) => {
    const new_event_user = new EventUser({
      org_id: item.org_id,
      event_id: item._id,
      user_id: user._id,
    });
    return await new_event_user.save();
  }));
}