const express = require('express');
const router = express.Router();
const auth = require('../controller/auth');

router.post('/login', auth.login);
router.post('/signInWithGoogle', auth.signInWithGoogle);
router.post('/signUpWithGoogle', auth.signUpWithGoogle);
router.post('/verify', auth.verify);
router.post('/refreshToken', auth.refreshToken);
router.post('/forgotPassword', auth.forgotPassword);
router.post('/resetPassword', auth.resetPassword);
router.post('/updateDeviceId', auth.updateDeviceId);

// router.post('/updatePassword', auth.updatePassword);

module.exports = router;