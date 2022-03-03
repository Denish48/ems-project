const express = require('express');
const router = express.Router();
const configs = require('../configs');
const response= require('../configs/response');

const userController = require('../controller/userprofile');

router.get('/userprofileList', [configs.verifyUserToken, response.verifyDeviceId], userController.userprofileList);
router.get('/userprofileById/:id', [configs.verifyUserToken, response.verifyDeviceId], userController.userprofileById);
router.put('/edituserprofile/:id', [configs.verifyUserToken, response.verifyDeviceId], userController.edituserprofile);
router.put('/edituserprofilepicture/:id', [configs.verifyUserToken, response.verifyDeviceId], userController.edituserprofilepicture);
module.exports = router;