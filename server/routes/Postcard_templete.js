const express = require('express');
const router = express.Router();
const postCardTempletes = require('../controller/postcard_templetes');
const configs = require('../configs');

router.post('/addPostcardTemplete', configs.verifyUserToken, postCardTempletes.addPostcardTemplete);
router.get('/postcardById/:id', configs.verifyUserToken, postCardTempletes.postCardTempleteById);
router.put('/editPostcardTemplete/:id', configs.verifyUserToken, postCardTempletes.editPostcardTemplete);
router.delete('/deletePostcardTempleteById/:id', configs.verifyUserToken, postCardTempletes.deletePostcardTempleteById);
router.post('/postCardTempleteList', configs.verifyUserToken, postCardTempletes.postCardList);
router.post('/savePostcard', configs.verifyUserToken, postCardTempletes.savePostcard);
router.get('/getPostcard/:id', configs.verifyUserToken, postCardTempletes.getPostcard);
router.get('/getPostcardDropdownlist', configs.verifyUserToken, postCardTempletes.postcardDropdownList);

module.exports = router;