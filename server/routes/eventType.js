const express = require('express');
const router = express.Router();
const configs = require('../configs');

const eventTypeController = require('../controller/eventType');

router.post('/addEventTypes', configs.verifyUserToken, eventTypeController.addEventTypes);
router.post('/eventTypeList', configs.verifyUserToken, eventTypeController.eventTypeList);
router.get('/eventTypeDropdownList', configs.verifyUserToken, eventTypeController.eventTypeDropdownList);
router.get('/eventTypeById/:id', configs.verifyUserToken, eventTypeController.eventTypeById);
router.put('/editEventType/:id', configs.verifyUserToken, eventTypeController.editEventType);
router.delete('/deleteEventType/:id', configs.verifyUserToken, eventTypeController.deleteEventType);
router.get('/downloadeventTypeList', configs.verifyUserToken, eventTypeController.downloadeventTypeList);

module.exports = router;