const mongoose = require('mongoose');
const Org = mongoose.model('org');
const Roles = mongoose.model('roles');
const Users = mongoose.model('users');

exports.addRole = (req, res, next) => {
    let newRole = new Roles({
        role_name: req.body.role_name,
        role_type: req.body.role_type,
    });
    newRole.save((err, data) => {
        if (err) {
            console.log(err);
        }
        else {
            res.json(data);
        }
    })
};

exports.addUser = (req, res, next) => {
    const newUser = new Users({
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        password: req.body.password,
        phone_number: req.body.phone_number,
        role_id: req.body.role_id,
        org_id: req.body.org_id,
        createdBy: req.body.user_id,
        updatedBy: req.body.user_id,
    })
    newUser.save((err, data) => {
        if (err) {
            console.log(err)
        } else {
            res.json(data)
        }
    })
}

exports.addOrg = (req, res, next) => {
    let orgg = new Org({
        org_name: req.body.org_name,
        createdBy: req.body.createdBy,
        updatedBy: req.body.createdBy,
    });
    orgg.save((err, data) => {
        if (err) {
            console.log(err);
        }
        else {
            res.json(data)
        }
    })
}

// exports.getOrganizations = (req, res, next) => {
//     Org.find((err, data) => {
//         if (err) {
//             console.log(err);
//         }
//         else {
//             res.send(data)
//         }
//     })

// };

// exports.getOrganization = (req, res, next) => {
//     if (ObjectId.isValid(req.params.id)) {
//         Org.findById(req.params.id, (err, data) => {
//             if (err) {
//                 console.log(err);
//             }
//             else {
//                 res.send(data)
//             }
//         })
//     }
//     else {
//         return res.status(400).send("No record Found With This id :" + req.params.id);
//     }
// };

// exports.editOrganization = (req, res, next) => {

//     if (ObjectId.isValid(req.params.id)) {
//         let orgg = {
//             org_id: req.body.org_id,
//             org_name: req.body.org_name,
//             createdBy: req.body.createdBy,
//             created_At: req.body.created_At,
//             updatedBy: req.body.updatedBy,
//             updated_At: req.body.updated_At,
//             deletedBy: req.body.deletedBy,
//             isDeleted: req.body.isDeleted
//         };
//         Org.findByIdAndUpdate(req.params.id, { $set: orgg }, { new: true }, (err, doc) => {
//             if (err) {
//                 console.log(err);

//             }
//             else {
//                 res.send("Record Updated successfully")
//             }
//         })
//     }
//     else {
//         return res.status(400).send("No record Found With This id :" + req.params.id);
//     }
// };

// exports.deleteOrganization = (req, res, next) => {

//     if (ObjectId.isValid(req.params.id)) {
//         Org.findByIdAndRemove(req.params.id, (err, data) => {
//             if (err) {
//                 console.log(err);

//             }
//             else {
//                 res.send("Record Deleted successfully")
//             }
//         })
//     }
//     else {
//         return res.status(400).send("No record Found With This id :" + req.params.id);
//     }
// };