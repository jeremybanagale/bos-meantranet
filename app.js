/**
 * Module dependencies.
 */
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');
const multer = require('multer');
const cors = require('cors');

/**
 * Custom module dependencies.
 */
const Xray = require('x-ray');

const upload = multer({
    dest: path.join(__dirname, 'uploads')
});

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({
    path: '.env.example'
});

/**
 * Controllers (route handlers).
 */
const homeController = require('./controllers/home');
const userController = require('./controllers/user');
const apiController = require('./controllers/api');
const contactController = require('./controllers/contact');

/**
 * App-specific Controllers (route handlers).
 */
const applicantController = require('./controllers/applicant');
const adminController = require('./controllers/admin');
const internController = require('./controllers/intern');
const crawlerController = require('./controllers/crawler');

/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');

/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGOLAB_URI || process.env.MONGODB_URI);
mongoose.connection.on('error', () => {
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
    process.exit();
});

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(expressStatusMonitor());
app.use(compression());
app.use(sass({
    src: path.join(__dirname, 'public'),
    dest: path.join(__dirname, 'public')
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(expressValidator());
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({
        url: process.env.MONGOLAB_URI || process.env.MONGODB_URI,
        autoReconnect: true
    })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
    if (req.path === '/api/upload') {
        next();
    } else {
        lusca.csrf()(req, res, next);
    }
});
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});
app.use((req, res, next) => {
    // After successful login, redirect back to the intended page
    if (!req.user &&
        req.path !== '/login' &&
        req.path !== '/signup' &&
        !req.path.match(/^\/auth/) &&
        !req.path.match(/\./)) {
        req.session.returnTo = req.path;
    } else if (req.user &&
        req.path == '/account') {
        req.session.returnTo = req.path;
    }
    next();
});
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: 31557600000
}));

app.use(cors());
/**
 * Primary app routes.
 */
app.get('/', homeController.index);
app.route('/login')
  .get(userController.getLogin)
  .post(userController.postLogin)
app.get('/logout', userController.logout);
app.route('/forgot')
  .get(userController.getForgot)
  .post(userController.postForgot)
app.route('/reset/:token')
  .get(userController.getReset)
  .post(userController.postReset)
app.route('/signup')
  .get(userController.getSignup)
  .post(userController.postSignup)
app.route('/contact')
  .get(contactController.getContact)
  .post(contactController.postContact)
app.get('/account', passportConfig.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);

/**
 * API examples routes.
 */
app.get('/api', apiController.getApi);
app.get('/api/nyt', apiController.getNewYorkTimes);
app.get('/api/aviary', apiController.getAviary);
app.get('/api/scraping', apiController.getScraping);
app.get('/api/upload', apiController.getFileUpload);
app.post('/api/upload', upload.single('myFile'), apiController.postFileUpload);
app.get('/api/google-maps', apiController.getGoogleMaps);

/**
 * OAuth authentication routes.
 */
app.get('/auth/google', passport.authenticate('google', {
    scope: 'profile email'
}));
app.get('/auth/google/callback', passport.authenticate('google', {
    failureRedirect: '/login'
}), (req, res) => {
    res.redirect(req.session.returnTo || '/');
});

/**
 * Applicant Hiring Process routes.
 */
app.get('/applicant/exam', applicantController.getExam);
app.get('/applicant/scores',  passportConfig.isAuthenticated, applicantController.getScores);
app.get('/applicant/form',  passportConfig.isAuthenticated, applicantController.getForm);

/**
 * Intern Tools routes.
 */
app.get('/intern/consequence', internController.getConsequence);

/**
 * Crawler routes.
 */
app.route('/crawler')
  .all(cors())
  .get(crawlerController.getCrawler)
app.get('/searching', crawlerController.getData);

/**
 * Admin routes.
 */
app.route('/admin/users')
  .get(adminController.getUsers)
  .post(adminController.postUpdateUsers)

/**
 * Error Handler.
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
    console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env')); 
    console.log('  Press CTRL-C to stop\n');
});

module.exports = app;
