const express = require('express');
const router = express.Router();
const configs = require('../configs');

const departmentController = require('../controller/department');

router.post('/addDepartment', configs.verifyUserToken, departmentController.addDepartments);
router.post('/departmentList', configs.verifyUserToken, departmentController.departmentList)
router.get('/departmentDropdownList', departmentController.departmentDropdownList)
router.get('/departmentById/:id', configs.verifyUserToken, departmentController.departmentById);
router.put('/editDepartment/:id', configs.verifyUserToken, departmentController.editDepartment);
router.delete('/deleteDepartment/:id', configs.verifyUserToken, departmentController.deleteDepartment);

module.exports = router;