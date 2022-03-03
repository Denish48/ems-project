const express = require('express');
const router = express.Router();
const configs = require('../configs')
const adminsettingsController = require('../controller/adminsettings')

router.post('/addAdminsetting', adminsettingsController.addAdminsetting)
router.put('/editAdminSetting/:id', adminsettingsController.editAdminSetting)
router.get('/adminSetting/:id', adminsettingsController.adminSetting)
router.get('/appSetting/:id', adminsettingsController.appSetting)
router.put('/customadminSetting/:id', adminsettingsController.customadminSetting)

module.exports = router;