const mongoose = require('mongoose');
const Schema = mongoose.Schema
const configs = require('../configs');
const bcrypt = require('bcrypt');
const SALT_WORK_FACTOR = 10;

var today = new Date();
        var date = today.getFullYear() + '' + (today.getMonth() + 1) + '' + today.getDate();
        var time = today.getHours() + "" + today.getMinutes();
        var dateTime = date + '' + time;


const userSchema = new Schema({
    org_id: { type: Schema.Types.ObjectId, ref: 'org' },
    user_img: { type: String, default: '' },
    email: { type: String, required: true, unique: { args: true, msg: 'Email already exist' } },
    phone_number: { type: String, required: true, unique: { args: true, msg: 'Phone number already exist' } },
    full_name: { type: String },
    first_name: { type: String },
    last_name: { type: String },
    middleName: { type: String },
    department_id: { type: Schema.Types.ObjectId, ref: 'departments', },
    birthdate: { type: Date ,default: dateTime},
    designation_id: { type: Schema.Types.ObjectId, ref: 'designations', },
    password: { type: String },
    credits: { type: Number, default: 0 },
    penlity: { type: Number, default: 0 },
    role_id: { type: Schema.Types.ObjectId, ref: 'roles', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    created_At: { type: Date, default: configs.utcDefault },
    updated_At: { type: Date, default: configs.utcDefault },
    isDeleted: { type: Boolean, default: false },
    isActivate: { type: Boolean, default: true },
    resetCode: { type: String },
    isNewUser: { type: Boolean, default: true },
});

userSchema.pre('save', function (next) {
    var user = this;
    user.email = user.email && user.email != '' ? user.email.toLowerCase() : undefined;

    if (typeof user.password !== 'undefined' && user.password !== '') {
        if (!user.isModified('password')) {
            return next();
        }
        // generate a salt
        bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
            if (err) return next(err);
            // hash the password using our new salt
            bcrypt.hash(user.password, salt, function (err, hash) {
                if (err) return next(err);
                // override the cleartext password with the hashed one
                user.password = hash;
                next();
            });
        });
    } else {
        next();
    }
});

userSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

module.exports = mongoose.model('users', userSchema);