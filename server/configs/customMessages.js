/**
 * Common Messages
 */
module.exports = {
    // Common Messages
    'EMAIL_PASSWORD_NOT_MATCH': 'Incorrect Email or Password',
    'USER_NOT_EXIST': 'User account does not exist.',
    'EMAIL_ALREADY_EXIST' : 'Email already exists.', 
    'CUSTOMET_NOT_EXIST' : 'Customer does not exist.', 
    'PASSWORD_NOT_MATCH' : 'Old Password is incorrect.', 
    'FORGOT_PASSWORD_SUCCESS' : 'Reset Password link is sent on your mail.', 
    'RESET_PASSWORD_SUCCESS' : 'Password has been changed successfully.', 
    'RESET_LINK_EXPIRE' : 'Reset Password link is expired.', 
    'ROLE_ALREADY_EXIST' : 'Role already exist.', 
    'BULK_USER_INSERT' : 'All users are saved successfully.', 
    'OPERATION_NOT_FOUND' : 'Operation not found.', 
    'ROLE_SAVED': 'Role added successfully.', 
    'USER_DELETED': 'User deleted successfully.', 
    'ROLE_NOT_FOUND': 'Role not found.', 
    'NO_ATTACHMENT': 'Attachment not found.', 
    'NO_DELETE_ATTACHMENT_PERMISSION': 'You do not have enough permission to perform this action.', 
    'NO_VIEW_ATTACHMENT_PERMISSION': 'You do not have enough permission to view one or more of the documents.',
    'ATTACHMENT_FOR_DOWNLOAD_MISSING': 'Some file(s) were not present on server. Please refresh and try again.', 
    'PROJECT_ATTACHMENT_NOT_FOUND': 'Project attachment does not exists.',
    'DELETED_ATTACHMENT': 'Attachment deleted successfully.', 
    'NO_ATTACHMENT_IN_DIRECTORY': 'No files were present in the provided directory',
    'THIS_ROLE_ASSIGNED_TO_USER': 'Role is assigned to users, Cannot be deleted.', 
    'ROLE_DELETED': 'Role deleted successfully.', 
    'ROLE_IS_ADMIN_ROLE': 'User cannot delete Admin role.', 
    'ROLE_CANNOT_BE_MODIFIED': 'Not allowed to modify this role.', 
    
    'USER_NOT_ACTIVE_FORGOT': 'Your account is deactivated. Please contact your Administrator.',
    'USER_NOT_ACTIVE': 'Your account is deactivated. Please contact your Administrator.',
    'USER_DELETED': 'Your account has been deleted. Please contact your Administrator.',
    
    'IMPORT_FILE_NOT_PROVIDED': 'No file was provided for importing. Please try again.',
    'IMPORT_ONLY_ONE_FILE_ALLOWED': 'Only one file is allowed for importing.',
    'IMPORT_FILE_EXT_NOT_SUPPORTED': 'File type not supported for importing.',
    
    'NO_USER_OR_CUSTOMER_MODIFY_PERMISSION': 'You do not have user or customer modify permission to perform this action',
    'NO_SPACE_OR_PROJECT_FOUND': 'Invalid data provided for attachment uploading',
    
    'DEVICE_TYPE_NOT_PROVIDED': 'Please provide device type in API request',
    'INVALID_DEVICE_TYPE_PROVIDED': 'Please provide valid device type in request',
    'INVALID_TOKEN_IN_REQUEST': 'Please provide valid access token in API request',
    'NO_TOKEN_IN_REQUEST': 'Please provide access token for this API request',
    'UNKNOWN_PASSPORT_ERROR': 'Please provide valid data for user session',
    
    'SESSION_EXPIRED': 'Your session has expired. Please login again',
    'PASSWORD_CHANGED': 'Your session has expired. Please login again to continue',
    'USER_NOT_ACTIVE_AFTER_LOGIN': 'Your account is deactivated. Please contact your Administrator.',
    'USER_FIRST_LOGIN_RESET_PASSWORD': 'Please reset your password first and then try to login.',
    'USER_DELETED_AFTER_LOGIN': 'Your account has been deleted. Please contact your Administrator.',
    'NO_ACCESS_ON_WEB_AFTER_LOGIN': 'You do not have access to the website. Please contact your administrator.',
    'NO_ACCESS_ON_MOBILE_AFTER_LOGIN': 'You do not have access on the mobile application. Please contact your administrator.',
    
    'NO_ACCESS_ON_WEB': 'You do not have access to the website. Please contact your administrator.',
    'NO_ACCESS_ON_MOBILE': 'You do not have access on the mobile application. Please contact your administrator.',
    
    'PROJECT_ROLE_NOT_FOUND': 'Project Role not found',
    'DEFAULT_PROJECT_ROLE_NO_DELETE': 'Default Project Role cannot be deleted',
    'PROJECT_ROLE_DELETE_HAS_USERS': 'Project Role has assigned users. Please unassign all users from this Project Role before deleting it', 

    'DAILY_REPORT_NOT_FOUND': 'Daily Report not found',

    'PROJECT_NOT_FOUND': 'Project not found',
    'DIRECTORY_DOES_NOT_EXISTS': 'Such a directory does not exist.',
    'ATLEAST_ONE_DIRECTORY_DOES_NOT_EXISTS': 'One or more directory does not exist.',
    'DIRECTORY_DELETE_SUCCESS': 'Directory deleted successfully.',
    'FILE_SHOULD_NOT_EXIST_IN_DIRECTORY': 'Directory should be empty before deleting it.',
    'DIRECTORY_WITH_SAME_NAME': 'Directory with the same name already exist.',
};