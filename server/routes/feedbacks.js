const express = require('express');
const router = express.Router();
const feedbackController = require('../controller/feedback');
const configs = require('../configs');
const response = require('../configs/response');


router.post('/addfeedback', configs.verifyUserToken, feedbackController.addfeedback);
router.post('/feedbackList', [configs.verifyUserToken, response.verifyDeviceId],feedbackController.feedbackList);
router.get('/feedbackById/:id',[configs.verifyUserToken, response.verifyDeviceId],feedbackController.feedbackById);
router.post('/feedbackChecklist/:id', [configs.verifyUserToken, response.verifyDeviceId],feedbackController.feedbackChecklist);
router.delete('/deleteFeedback', configs.verifyUserToken, feedbackController.deleteFeedback);
router.post('/feedbackUser', [configs.verifyUserToken, response.verifyDeviceId], feedbackController.FeedbackUsers);
router.post('/feedbackAnswers', [configs.verifyUserToken, response.verifyDeviceId], feedbackController.feedbackAnswers);

module.exports = router;