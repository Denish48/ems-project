const mongoose = require('mongoose');
const configs = require('../configs');
const roles = mongoose.model('roles');

exports.rolesDropdownList = async (req, res, next) => {
  try {
    const data = await roles.find(
      { role_type: { $ne: 'superAdmin' } }
    )
      .select({ role_type: 1, role_name: 1 })
      .exec();
    return res.json({
      status: configs.success_status,
      data,
      message: 'Request completed successfully'
    });
  } catch (error) {
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
};