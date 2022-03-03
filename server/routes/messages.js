const express = require('express');
const router = express.Router();
const configs = require('../configs');

const messagesController = require('../controller/messages');

router.post('/addMessage', configs.verifyUserToken, messagesController.addMessage);
router.post('/MessageConversion', configs.verifyUserToken, messagesController.MessageConversion);
router.post('/messageUsers', configs.verifyUserToken, messagesController.messageUsers);
router.post('/userlist', configs.verifyUserToken, messagesController.userList);
router.post('/deleteMessage', configs.verifyUserToken, messagesController.deleteMessage);

module.exports = router;