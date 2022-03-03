const express = require('express');
const router = express.Router();
const logger = require('morgan');
const configs = require('../configs');

const org = require('./org');
const department = require('./department');
const admin = require('./admin');
const message = require('./messages');
const users = require('./users');
const eventType = require('./eventType');
const postCard = require('./postcard');
const event = require('./event');
const host = require('./host');
const adminsetting = require('./adminSettings')
const fileImport = require('./fileImport')
const roles = require('./roles')
const feedback = require('./feedbacks');
const surveys = require('./surveys');
const elevateForms = require('./elevateForms');
const postCardTemplete = require('./Postcard_templete');
const notification = require('./notification');
const auth = require('./auth');
const userprofile = require('./userprofile');

router.use(logger('dev'));

router.use('/admin', admin);
router.use('/org', org);
router.use('/department', department);
router.use('/message', message);
router.use('/employees', users);
router.use('/eventType', eventType);
router.use('/postcard', postCard);
router.use('/event', event);
router.use('/host', host);
router.use('/roles', roles)
router.use('/adminsettings', adminsetting)
router.use('/feedback', feedback);
router.use('/surveys', surveys);
router.use('/elevateForms', elevateForms);
router.use('/postCardTemplete', postCardTemplete);
router.use('/importFile', fileImport);
router.use('/notification', notification);
router.use('/auth', auth);
router.use('/userprofile', userprofile);

router.use('/*', configs.errorResponseController);

module.exports = router;