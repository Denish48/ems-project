const express = require('express');
const router = express.Router();
const configs = require('../configs');

const postCardController = require('../controller/postcards');

router.post('/addPostcard', configs.verifyUserToken, postCardController.addPostCard);
router.post('/postcardlist', configs.verifyUserToken, postCardController.postCardList);
router.get('/postcardDropdownList', configs.verifyUserToken, postCardController.postCardDropdownList);
router.post('/previewtemplete', configs.verifyUserToken, postCardController.previewPostcard);
router.delete('/deletePostcardById/:id', configs.verifyUserToken, postCardController.deletePostcardById);


module.exports = router;