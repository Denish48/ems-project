const express = require('express');
const router = express.Router()
const configs = require('../configs');
const response= require('../configs/response');

const notification = require('../controller/notification')

router.post('/sendNotification', notification.sendNotification);
router.post('/updateDeviceToken', [configs.verifyUserToken, response.verifyDeviceId], notification.updateDeviceToken);
router.delete('/removeDeviceToken', [configs.verifyUserToken, response.verifyDeviceId], notification.removeDeviceToken);
router.post('/customNotification', configs.verifyUserToken, notification.customNotification);
router.post('/notificationlist',  notification.notificationList);
router.delete('/deleteNotification', configs.verifyUserToken, notification.deleteNotification);
router.post('/checkNotificationStatus', notification.checkNotificationStatus);
module.exports = router;