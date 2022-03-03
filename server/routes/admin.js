const express = require('express');
const router = express.Router();
const configs = require('../configs');

const adminController = require('../controller/admin');
const eventController = require('../controller/events');

router.post('/login', adminController.login);

router.post('/addAdminUser', configs.verifyUserToken, adminController.addAdminUser);
router.get('/userById/:id', configs.verifyUserToken, adminController.userById);
router.put('/editadminuserprofile/:id', configs.verifyUserToken, adminController.editadminuserprofile);

router.post('/event/addEvent', configs.verifyUserToken, eventController.addEvent);
router.get('/event/eventById/:id', configs.verifyUserToken, eventController.eventById);
router.put('/event/editEvent/:id', configs.verifyUserToken, eventController.editEvent);
router.delete('/event/deleteEvent/:id', configs.verifyUserToken, eventController.deleteEvent);
router.post('/event/exportEvents', adminController.exportEvents);

router.post('/event/eventList', configs.verifyUserToken, adminController.eventList);
router.post('/event/upcomingEvents', configs.verifyUserToken, adminController.upcomingEvents);
router.post('/event/previousEvents', configs.verifyUserToken, adminController.previousEvents);
router.post('/event/liveEvents', configs.verifyUserToken, adminController.liveEvents);

router.get('/dashboard/total_events_count', configs.verifyUserToken, adminController.total_events_count);
router.get('/dashboard/upcoming_events_count', configs.verifyUserToken, adminController.upcoming_events_count);
router.get('/dashboard/previous_events_count', configs.verifyUserToken, adminController.previous_events_count);
router.get('/dashboard/cancel_events_count', configs.verifyUserToken, adminController.cancel_events_count);
router.get('/dashboard/completed_events_count', configs.verifyUserToken, adminController.completed_events_count);
router.get('/dashboard/live_events_count', configs.verifyUserToken, adminController.live_events_count);
router.get('/dashboard/event_calender', configs.verifyUserToken, adminController.event_calender);
router.post('/dashboard/employeesrank', configs.verifyUserToken, adminController.employeesrank);

router.post('/employeesStatisfaction', configs.verifyUserToken, adminController.employeesStatisfaction);

router.post('/adminuserlist/:id', configs.verifyUserToken, adminController.adminUserlist)

router.post('/notificationlist', configs.verifyUserToken, adminController.notificationList);

router.post('/event/myScoreAttendedEvent', configs.verifyUserToken, adminController.myScoreAttendedEvent);

module.exports = router;