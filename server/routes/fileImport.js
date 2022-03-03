const express = require('express');
const router = express.Router()
const configs = require('../configs');

const importController = require('../controller/importEmployees')

router.post('/importUsers', [configs.verifyUserToken, configs.fileMiddleware], importController.importUsers)
router.get('/downlaodFormat', importController.downlaodFormat)

module.exports = router;