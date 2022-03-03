const express = require('express');
const router = express.Router();
const elevateForms = require('../controller/elevateForms');
const configs = require('../configs');

router.post('/addElevateForms', configs.verifyUserToken, elevateForms.addElevateForms);
router.get('/elevateFormById/:id', configs.verifyUserToken, elevateForms.elevateFormById);
router.post('/editElevateForm/:id', configs.verifyUserToken, elevateForms.editElevateForm);
router.delete('/deleteElevateFormById/:id', configs.verifyUserToken, elevateForms.deleteElevateFormById);
router.post('/elevateFormList', configs.verifyUserToken, elevateForms.elevateFormsList);
router.post('/saveEventForm', configs.verifyUserToken, elevateForms.saveEventForm);
router.get('/getEventForm/:id', configs.verifyUserToken, elevateForms.getEventForm);

module.exports = router;