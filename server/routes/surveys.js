const express = require('express');
const router = express.Router();
const surveyController = require('../controller/surveys');
const configs = require('../configs');
const response = require('../configs/response');

router.post('/addsurvey', configs.verifyUserToken, surveyController.addsurvey);
router.get('/surveyById/:id', [configs.verifyUserToken, response.verifyDeviceId], surveyController.surveyById);
router.post('/editSurvey/:id', [configs.verifyUserToken, response.verifyDeviceId], surveyController.editSurvey);
router.post('/surveyAnswers', [configs.verifyUserToken, response.verifyDeviceId], surveyController.surveyAnswers);
router.post('/surveyList', [configs.verifyUserToken, response.verifyDeviceId], surveyController.surveyList);
router.post('/SurveyUsersList/:id', [configs.verifyUserToken, response.verifyDeviceId], surveyController.SurveyUsersList);
router.post('/surveyAnswersById/:id',[configs.verifyUserToken, response.verifyDeviceId], surveyController.surveyAnswersById);

module.exports = router;