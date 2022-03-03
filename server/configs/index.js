const nodemailer = require('nodemailer');
const ical = require('ical-generator');
const path = require('path')
const moment = require('moment');
const _ = require('lodash');
const chalk = require('chalk');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const Handlebars = require('handlebars')
var fs = require('fs');
const upload = multer();
const cal = ical();

const { NODE_ENV, NODE_PORT_ENV } = process.env;

exports.chalk = chalk;
exports.NODE_PORT = NODE_ENV === "production" && NODE_PORT_ENV ? NODE_PORT_ENV : 8888;
exports.HOST_URL = NODE_ENV === "production" && NODE_PORT_ENV ? 'http://elevate.elsner.com' : 'http://eems.elsnerit.com' + this.NODE_PORT;

exports.secret = 'EeMs@123$';
exports.masterPassword = 'eems@123$';
exports.errMessage = 'Something went wrong!';

exports.success_status = 200;
exports.error_status = 403;
exports.badRequest_status = 400;
exports.unauthorised_status = 401;
exports.unauthorised_device_id = 501;
exports.pageLimit = 10;
exports.AdminRole = [1, 2, 3, 4];

exports.FCMserverKey = process.env.FCM_SERVER_KEY ? process.env.FCM_SERVER_KEY : 'AAAAp_d4duA:APA91bFRYRHQ3kadp5HarwxR-SOAC0-ak0WoP1YcV_LmboXvIxvDgdlc8KveGNbukxJr5pammASfIaXrIfFqKzTrvLZMsWCXmhbQNGBXNlZCSMS0EWYlRUzdFftCgtWc5XBq_p2nZSf8';
exports.click_action = 'FLUTTER_NOTIFICATION_CLICK';

exports.utcDefault = () => {
    let date = new Date();
    return moment.utc(date).format();
};

exports.createTokens = (user) => {
    const expiryTime = process.env.TOKEN_EXPIRY_TIME !== undefined ? process.env.TOKEN_EXPIRY_TIME : '10m';
    const accessToken = jwt.sign(
        { user },
        this.secret,
        {
            expiresIn: expiryTime,
            issuer: user._id.toString(),
        }
    );
    const refreshToken = jwt.sign(
        { user },
        this.secret,
        {
            expiresIn: '1y',
            issuer: user._id.toString(),
        }
    );
    return { accessToken, refreshToken };
}

exports.jwtTokenVerifier = (token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, this.secret, function (err, decoded) {
            if (err) {
                reject('Failed to authenticate token.');
            } else {
                resolve(decoded);
            }
        });
    });
};

exports.verifyUserToken = async (req, res, next) => {
    let jwtToken = req.headers.authorization;
    if (jwtToken && jwtToken.includes('Bearer')) {
        const tokenArray = jwtToken.split(" ");
        jwtToken = tokenArray[1];
        try {
            const decoded = await this.jwtTokenVerifier(jwtToken);
            if (decoded && decoded.user) {
                req.user = decoded.user;
            }
            next();
        } catch (error) {
            return res.status(401).json({
                status: "err",
                code: 401,
                success: false,
                message: 'Failed to authenticate token.',
                data: null
            });
        }
    } else {
        return res.status(this.unauthorised_status).send({
            status: "err",
            code: this.unauthorised_status,
            success: false,
            message: 'No token provided.',
            data: null
        });
    }
}

exports.errorResponseController = (req, res) => {
    res.status(404).send({
        code: 0,
        status: 'Error',
        message: 'The server has not found anything matching the Request-URI',
    });
}

transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    // requireTLS: true,
    // requireTLS: false,
    // secure: true,
    // secure: false,
    tls: {
        rejectUnauthorized: false
    },
    pool: true,
    auth: {
        user: 'dharams.elsner@gmail.com',
        pass: 'elsner1234'
    },
});

transporter.verify(function (error, success) {
    if (error) {
        console.log(chalk.red(error));
    } else {
        console.log();
        console.log(chalk.green('Server is verified to send'), chalk.yellow('E-Mail'));
    }
});

exports.emailSender = async ({ to, from, content }) => {
    const contacts = {
        to,
        from: from ? from : 'ivanshu@elsner.in'
    }

    let email = Object.assign({}, content, contacts);

    return await transporter.sendMail(email, (err, message) => {
        if (err) {
            console.log(err);
        } else {
            console.log(message);
            return;
        }
    })
};

exports.forgetPasswordContent = (userData, authToken) => ({
    subject: 'Reset your password',
    html: `<p>Hi <strong> ${userData.first_name} ${userData.last_name}</strong>,<br>
    You recently requested to reset your password for your <strong>${userData.email}</strong> account. Use the link given below to reset your password.<br>
    Link: <a href='${this.HOST_URL}/reset-password/${authToken}'> click to reset your account</a><br />
    If you did not request a password reset, please ignore this email or&nbsp;contact support&nbsp;if you have questions.<br>
    <br>
    Thanks,&nbsp;<br>
    The <strong>[EEMS]</strong> Team​​​​​​​</p>`
});

exports.resetPasswordContent = (userData) => ({
    subject: 'Account Reset password',
    html: `<p>Hi <strong> ${userData.first_name} ${userData.last_name}</strong>,<br>
    Your password for your <strong> ${userData.email} </strong> account is updated successfully.<br>
    <br>
    Thanks,&nbsp;<br>
    The <strong>[EEMS]</strong> Team​​​​​​​</p>`
});

exports.icalEventGen = (eventData) => {
    const start_date = new Date(eventData.start_date);
    const end_date = new Date(eventData.end_date);
    let event_start_time, event_end_time;
    if (eventData.start_time && eventData.end_time) {
        event_start_time = new Date(eventData.start_time);
        event_end_time = new Date(eventData.end_time);
        start_date.setHours(
            event_start_time.getHours(),
            event_start_time.getMinutes()
        );
        end_date.setHours(
            event_end_time.getHours(),
            event_end_time.getMinutes()
        );
    }
    const content = ical({
        domain: 'google.com',
        method: 'PUBLISH',
        prodId: '//Google Inc//Google Calendar 70.9054//EN',
        events: [
            {
                start: moment(start_date),
                status: 'CONFIRMED',
                end: moment(end_date),
                summary: `${eventData.event_name}`,
                transparency: 'OPAQUE',
            }
        ]
    }).toString();

    return {
        subject: `${eventData.event_name}`,
        icalEvent: {
            filename: 'invite.ics',
            method: 'PUBLISH',
            content
        }
    };
}

exports.fileMiddleware = (() => {
    return upload.fields([{ name: 'logo' }, { name: 'profileImage' }, { name: 'attachment' }])
})();

exports.getQuaterDates = () => {
    var now = new Date(); //current date   
    var nowMonth = now.getMonth(); //current month   
    var nowYear = now.getFullYear(); //current year   
    nowYear += (nowYear < 2000) ? 1900 : 0;

    // Get the number of days in a month
    function getMonthDays(myMonth) {
        var monthStartDate = new Date(nowYear, myMonth, 1);
        var monthEndDate = new Date(nowYear, myMonth + 1, 1);
        var days = (monthEndDate - monthStartDate) / (1000 * 60 * 60 * 24);
        return days;
    }

    //Get the start month of the quarter   
    function getQuarterStartMonth() {
        return Math.floor((nowMonth / 3)) * 3;
    }

    //Get the start date of this quarter   
    function getQuarterStartDate() {
        var quarterStartDate = new Date(nowYear, getQuarterStartMonth(), 1);
        return (quarterStartDate);
    }

    //or the end date of the quarter   
    function getQuarterEndDate() {
        var quarterEndMonth = getQuarterStartMonth() + 2;
        var quarterStartDate = new Date(nowYear, quarterEndMonth, getMonthDays(quarterEndMonth));
        return (quarterStartDate);
    }

    return {
        startDate: getQuarterStartDate(),
        endDate: getQuarterEndDate()
    }
}

exports.ElevateDefaultForm = [
    {
        "type": "header",
        "subtype": "h2",
        "label": "Survey/Feedback Form",
        "access": false
    },
    {
        "type": "text",
        "required": false,
        "label": "Which upcomming event you would like to have?",
        "className": "form-control",
        "name": "text-1627715062312-0",
        "access": false,
        "subtype": "text"
    },
    {
        "type": "textarea",
        "required": false,
        "label": "Please provide description",
        "className": "form-control",
        "name": "textarea-1627715062317-0",
        "access": false,
        "subtype": "textarea"
    },
    {
        "type": "starRating",
        "required": false,
        "label": "Event Rating",
        "name": "statisfaction-starRating-0",
        "access": false
    },
    {
        "type": "header",
        "subtype": "h2",
        "label": "Terms & Conditions",
        "className": "header",
        "access": false
    },
    {
        "type": "paragraph",
        "subtype": "p",
        "label": "Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum",
        "access": false
    },
    {
        "type": "checkbox-group",
        "required": true,
        "label": "Do you agree to the terms and conditions?",
        "toggle": false,
        "inline": false,
        "name": "checkbox-1627715065180-0",
        "access": false,
        "other": false,
        "values": [
            {
                "label": "Yes",
                "value": "yes",
                "selected": false
            }
        ]
    }
]

exports.htmlContent = async (data) => {
    // function to encode file data to base64 encoded string
    function base64_encode(file) {
        // read binary data
        var bitmap = fs.readFileSync(file);
        // convert binary data to base64 encoded string
        return Buffer.from(bitmap).toString('base64');
    }
    let base64str = base64_encode(`./uploads/user_images/${data.user_img}`);
    let name = `${data.first_name} ${data.last_name}`;
    let imagetype;
    if (base64str.charAt(0) === '/') {
        imagetype = "jpg"
    }
    if (base64str.charAt(0) === 'i') {
        imagetype = "png"
    }
    if (base64str.charAt(0) === 'R') {
        imagetype = "gif"
    }
    if (base64str.charAt(0) === 'U') {
        imagetype = "webp"
    }
    data.profileUrl = `data:image/${imagetype};base64,${base64str}`
    data.name = name
    let html = `<!doctype html>
    <html lang="en">
    <head>
        <title>Work Anniversary</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1"> 
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.uploadscom/css2?family=Roboto:wght@400;700;900&display=swap" rel="stylesheet">
    <style>
        body{
            margin:0;
            padding:0;
            font-size: 16px;
            line-height:32px;
            font-family: 'Roboto', sans-serif;
            color: #a2a2a2;
        }
        .work-anniversary{
            max-width: 1024px;
            margin: 0 auto;
            border:1px solid #a2a2a2;
            text-align: center;
            background-image: urmargin:0;
            padding:0;
            font-size: 16px;
            line-height:32px;
            font-family: 'Roboto', sans-serif;
            color: #a2a2a2;l(main-bkg.png);
            background-position: top left;
            background-size:cover;
            padding-top: 200px;
        }
        .content .name{
           background-color: #DF4E27;
           color:#fff;
           border-radius: 8px;
           padding: 8px 40px;
           font-weight:600;
           margin-bottom: 20px;
           letter-spacing: 0.5px;
        }
        .content{
            line-height: 40px;
            color:#a2a2a2;
            margin-top: 80px;
            max-width: 500px;
            margin: 80px auto 0;
        }
        .image img{
            width:100%;
            height: auto;
        }
        .image {
            position: relative;
            max-width: 320px;
            margin: 0 auto;
        }
        .image .work-label{
            position: absolute;
            top: -18px;
            left: -53px;
            background-image: url(label.png);
            color: #fff;
            background-repeat: no-repeat;
            padding: 14px 50px 50px 30px;
            background-size: cover;
            height: auto;
        }
        /* .work-label img{
            min-width: 120px;
            height: auto;
            position: absolute;
            left:-28px;
            top:-6px;
        } */
        .work-label h1{
            position: relative;
            margin-bottom: 0;
            font-size: 40px;
            margin-top: 0;
        }
        .work-label span{
            position: relative;
            font-size: 24px;
        }
        .image h1.heading{
            color: #071CE1;
            font-size: 100px;
            margin: 0;
            line-height: 80px;
            position: absolute;
            bottom: -40px;
            left: -100px;
        }
    
    </style>
    </head>
    
    <body>
    <div class="work-anniversary">
        <div class="image">
            {{!-- <img src="home/nteam/Downloads/Elsner Wishing template/Aniruddha.png"> --}}
            <img src={{profileUrl}}>
            <div class="work-label">
     <!-- <img src="label.png"> -->
               
                <h1>03</h1>
                <span>Years</span>
            </div>
            <h1 class="heading">Work<br>Anniversary</h1>
        </div>
       
        <div class="content">
           <span class="name"> {{name}}</span>
           <p>
            Congratulations on yet another year for setting an example for everyone on what it means to work hard and demonstrate never-ending team spirit. Happy Work Anniversary
           </p>
        </div>
       
    </div>
    </body>
    </html>`
    try {
        let htmlData = Handlebars.compile(html)(data, {
            allowedProtoMethods: {
                trim: true
            }
        });
        return htmlData
    } catch (error) {
        return error;
    }
};



exports.htmlContentfortemplete = async (userData, templeteData, dapartmentData, postcardData) => {

    try {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const date = postcardData.map(item => {
            return item.post_date
        })
        let d = new Date(date);
        let month = months[d.getMonth()]
        let year = d.getFullYear().toString().substr(-2)
        let user_image;
        NODE_ENV === "production" ?
            user_image = `https://elevate.elsner.com/uploads/user_images/${userData.user_img}`
            :
            user_image = `http://localhost:8888/uploads/user_images/${userData.user_img}`;
        userData.name = `${userData.first_name} ${userData.last_name}`;
        userData.user_image = user_image
        userData.dapartment = dapartmentData.department_name
        userData.month = month
        userData.year = year
        let htmlData = await Handlebars.compile(templeteData.templete)(userData, {
            allowedProtoMethods: {
                trim: true
            }
        });
        return htmlData
    } catch (error) {
        return error;
    }
};



