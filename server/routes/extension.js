const express = require('express');
const router = express.Router();
const configs = require('../configs');

const emailDomainController = require('../controller/extensions');

router.post('/addEmailDomains', configs.verifyUserToken, emailDomainController.addEmailDomains);
router.post('/emailDomainList', configs.verifyUserToken, emailDomainController.emailDomainList);
//router.get('/departmentDropdownList', emailDomainController.departmentDropdownList);
router.get('/emailDomainsById/:id', configs.verifyUserToken, emailDomainController.emailDomainsById);
router.put('/editEmailDomain/:id', configs.verifyUserToken, emailDomainController.editEmailDomain);
router.delete('/deleteEmailDomains/:id', configs.verifyUserToken, emailDomainController.deleteEmailDomains);

module.exports = router;