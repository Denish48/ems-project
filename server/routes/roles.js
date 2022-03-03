const express = require('express');
const router = express.Router();
const configs = require('../configs');

const rolesController = require('../controller/roles');

// router.post('/addDepartment', configs.verifyUserToken, departmentController.addDepartments);
// router.post('/departmentList', configs.verifyUserToken, departmentController.departmentList)
router.get('/rolesDropdownList', configs.verifyUserToken, rolesController.rolesDropdownList)
// router.get('/departmentById/:id', configs.verifyUserToken, departmentController.departmentById);
// router.put('/editDepartment/:id', configs.verifyUserToken, departmentController.editDepartment);
// router.delete('/deleteDepartment/:id', configs.verifyUserToken, departmentController.deleteDepartment);

module.exports = router;