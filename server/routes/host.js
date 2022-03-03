const express = require('express');
const router = express.Router();
const configs = require('../configs');
const response = require('../configs/response');

const hostController = require('../controller/host');

router.post('/addHost', configs.verifyUserToken, hostController.addHost);
router.post('/seedingHost', configs.verifyUserToken, hostController.seedingHost);
router.post('/hostList', configs.verifyUserToken, hostController.hostList);
router.get('/getEventByIdForHost/:id', configs.verifyUserToken, hostController.getEventByIdForHost);
router.get('/hostDropdownList', configs.verifyUserToken, hostController.hostDropdownList);
router.post('/hostUpcomingEvents', [configs.verifyUserToken], hostController.hostUpcomingEvents);
router.post('/hostPreviousEvents', [configs.verifyUserToken], hostController.hostPreviousEvents);
router.post('/hostLiveEvents', [configs.verifyUserToken], hostController.hostLiveEvents);
router.post('/hostMyEvents', [configs.verifyUserToken], hostController.hostMyEvents);
router.post('/sendFeedbackForm/:id', [configs.verifyUserToken, response.verifyDeviceId], hostController.sendFeedbackForm);
router.post('/usersAttendance', hostController.usersAttendance);
router.post('/checkhost', hostController.checkHostUser);
router.post('/registerAttendance',  hostController.registerAttendance);
router.post('/unRegisterAttendance',  hostController.unRegisterAttendance);
router.post('/hostAttendanceReport', hostController.hostAttendanceReport);
router.post('/eventAttendanceReport', [configs.verifyUserToken, response.verifyDeviceId], hostController.eventAttendanceReport);

module.exports = router;