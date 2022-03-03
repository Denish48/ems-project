// import dependencies
var express = require('express'); // Used for routing https://expressjs.com/
var mongoose = require('mongoose'); // Provide MongoDB services
var fs = require('fs');
var path = require('path'); // allows path combinations https://www.npmjs.com/package/path
var compression = require('compression'); // gzip compression for nodejs https://www.npmjs.com/package/compression
var ip = require('ip');
// import local dependencies
 require('./wss')
require('dotenv').config(); // loads CONFIG variables from the .env top-level file
var configs = require('./configs');
console.log();
console.log(configs.chalk.yellow('[ wait ] compiling ...'));

// app internal setup
var app = express(); // sets app to use express

var { DB_URL } = process.env;
mongoose.Promise = global.Promise;
mongoose.connect(DB_URL, { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }, function (err, data) {
    if (err) {
        console.log();
        console.log(configs.chalk.red('Server failed to connect with database...'));
        console.log(err);
        return;
    } else if (data) {
        console.log();
        console.log(configs.chalk.yellow('Database'), configs.chalk.green('connected successfully...'));
        const models_path = __dirname + '/models';
        fs.readdirSync(models_path).forEach(function (file) {
            if (~file.indexOf('.js')) require(models_path + '/' + file);
        });
        startserver();
        return;
    }
});

function startserver() {
    app.use(compression()); // uses compression
    app.use(express.static('build')); // sets static file directory path
    app.use('/uploads', express.static('uploads'));
    var enableCORS = function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
        res.header('Access-Control-Allow-Headers', '*');
        // res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        if ('OPTIONS' === req.method) {
            res.sendStatus(200);
        } else {
            next();
        }
    };
    app.use(enableCORS);
    // uses bodyParser to parse req
    app.use(express.json({
        limit: '50mb'
    }));
    // Parses the text as URL encoded data, extended extends UTF chars
    app.use(express.urlencoded({
        limit: '50mb',
        extended: true,
        parameterLimit: 50000
    }));
    
    // Routes
    app.use('/api', require('./routes'));

    app.get('*', (req, res) => {
        const filePath = path.join(__dirname, '/build/index.html');
        if (filePath && fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        }
        return res.send('Website is under maintaince!');
    });

    // error catching
    // stacktrace in dev., dislay error page in prod
    app.use('/*', configs.errorResponseController);
    if (app.get('env') === 'development') {
        app.use(function (err, req, res, next) {
            console.log(configs.chalk.red('Error'), err);
            res.status(err.status || 500);
            res.send('error: ' + err.message + ' | ' + err);
        });
    }
    process.on('uncaughtException', function (err) {
        console.log(configs.chalk.red('Caught exception: '), err);
        console.log(err.stack);
    });

    require('./schedular');

    // serve the app on PORT variable
    app.listen(configs.NODE_PORT, function (err) {
        if (err) {
            console.log();
            console.log(configs.chalk.red('App is listening error '), err);
        } else {
            console.log();
            console.log(configs.chalk.green(`App is running on ${app.get('env')} mode at`), configs.chalk.blue(configs.NODE_PORT));
        }
    });
}
