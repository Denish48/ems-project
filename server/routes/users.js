const express = require('express');
const router = express.Router();
const configs = require('../configs');
const response = require('../configs/response');

const userController = require('../controller/users');

router.post('/addEmployees', userController.addEmployees);
router.post('/employeesList', configs.verifyUserToken, userController.employeesList);
router.get('/employeesDropdownList', userController.employeesDropdownList);
router.post('/birthdatelist', userController.BirthdateList);
router.post('/birthdatelistAdmin', userController.BirthdateListAdmin);
router.get('/employeeById/:id', userController.employeesById);
router.get('/employeesByIdForImage/:id',userController.employeesByIdForImage)
router.get('/gettingbirthdaytemplete/:id',userController.gettingbirthdaytemplete)
router.put('/editEmployee/:id', userController.editEmployee);
router.delete('/deleteEmployee/:id', userController.deleteEmployee);
router.post('/employeeAccountAction/:id', userController.employeeAccountAction);

router.get('/myCreditPoints/:id', [configs.verifyUserToken, response.verifyDeviceId], userController.myCreditPoints);
router.post('/usersRankList', [configs.verifyUserToken, response.verifyDeviceId], userController.usersRankList);
router.post('/exportUsers/:org_id', userController.exportUsers);

module.exports = router;