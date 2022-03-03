const express = require('express');
const router = express.Router();
const configs = require('../configs');
const response = require('../configs/response');

const eventController = require('../controller/events');

router.post('/addEvent', configs.verifyUserToken, eventController.addEvent);
router.get('/eventById/:id', configs.verifyUserToken, eventController.eventById);
router.put('/editEvent/:id', configs.verifyUserToken, eventController.editEvent);
router.put('/saveEventNotification/:id', configs.verifyUserToken, eventController.saveEventNotification);
router.delete('/deleteEvent/:id', configs.verifyUserToken, eventController.deleteEvent);
router.post('/eventClone/:id', configs.verifyUserToken, eventController.eventClone);
router.post('/participateUser', configs.verifyUserToken, eventController.participateUsers);
router.post('/totalUser', configs.verifyUserToken, eventController.totalUser);
router.post('/eventAction', configs.verifyUserToken, eventController.eventAction);
router.post('/eventStatus', configs.verifyUserToken, eventController.eventStatus);
router.get('/eventDropdownList', configs.verifyUserToken, eventController.eventDropdownList);
router.get('/designationDropdownList', eventController.designationDropdownList);

//for Mobile
router.post('/upcomingEvents',  eventController.upcomingEvents);
router.post('/previousEvents', eventController.previousEvents);
router.post('/liveEvents',  eventController.liveEvents);
router.post('/myEvents',  eventController.myEvents);

router.post('/myScoreAllEvent', [configs.verifyUserToken, response.verifyDeviceId], eventController.myScoreAllEvent);
router.post('/myScoreAttendedEvent', configs.verifyUserToken, eventController.myScoreAttendedEvent);
router.post('/myScoreNotAttendedEvent', [configs.verifyUserToken, response.verifyDeviceId], eventController.myScoreNotAttendedEvent);

module.exports = router;