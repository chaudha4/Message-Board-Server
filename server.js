'use strict';

var express     = require('express');
var bodyParser  = require('body-parser');
var expect      = require('chai').expect;
var cors        = require('cors');
var helmet      = require('helmet');

var apiRoutes         = require('./routes/api.js');
var fccTestingRoutes  = require('./routes/fcctesting.js');
var runner            = require('./test-runner');

require('dotenv').config(); // load .env file into env variables.

var app = express();

// The following takes control of dnsPrefetchControl, frameguard
// hidePoweredBy, hsts, ieNoOpen, noSniff, xssFilter by deafult
app.use(helmet()); 

// Only allow your site to send the referrer for your own pages.
app.use(helmet.referrerPolicy({ policy: 'same-origin' }))

//Only allow your site to be loading in an iFrame on your own pages.
app.use(helmet.frameguard({ action: 'sameorigin' }))

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Sample front-end
app.route('/b/:board/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/board.html');
  });
app.route('/b/:board/:threadid')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/thread.html');
  });

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);


//Sample Front-end


function notFoundMW() {
  return new Promise((resolve, reject) => {
  app.use(function(req, res, next) {
    res.status(404)
      .type('text')
      .send('Not Found');
  });
  resolve();
})};

console.log(process.env.DB);

//Start our server and tests!
function startServer() {
  return new Promise((resolve, reject) => {
    app.listen(process.env.PORT || 3000, function () {
      console.log("Listening on port " + this.address().port);
      if(process.env.NODE_ENV==='test') {
        console.log('Running Tests...');
        setTimeout(function () {
          try {
            runner.run();
          } catch(e) {
            var error = e;
              console.log('Tests are not valid:');
              console.log(error);
          }
        }, 1500);
      }
    });
    resolve();
  });  
}

//Routing for API 
apiRoutes(app).then(notFoundMW).then(startServer);   


module.exports = app; //for testing