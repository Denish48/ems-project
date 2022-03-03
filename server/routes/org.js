const express = require('express');
const router = express.Router()
const orgController = require('../controller/org')

router.post('/addrole', orgController.addRole);
router.post('/addUser', orgController.addUser);
router.post('/addOrg', orgController.addOrg);
// router.get('/organizationlist', orgController.getOrganizations);
// router.get('/getorganizationById/:Id', orgController.getOrganization);
// router.put('/editorganization/:Id', orgController.editOrganization);
// router.delete('/deleteorganization/:Id', orgController.deleteOrganization);

module.exports = router;