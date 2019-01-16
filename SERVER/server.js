var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var http = require('http');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var port = process.env.PORT || 8080;        // set our port

mongoose.connect('mongodb://localhost/raspi', function (err) {
    if (err) throw err;
    console.log('Successfully connected');
});

var rpiSchema = mongoose.Schema({
    Datetime: Date,
    diskUsage: Number,
    ramUsage: Number,
    cpuUsage: Number,
    tempCore: Number,
});

var RpiSchema = mongoose.model('rpiSchema', rpiSchema);
var current_disk;
var current_ram;
var current_cpu;
var current_temp;


function saveData(current_hour,current_disk,current_ram,current_cpu,current_temp){
    // TODO:  GET DISK, RAM, CPU AND TEMP FROM RPI

    var newRpiIndex = new RpiSchema ({
        'Datetime': current_hour,
        'diskUsage': current_disk,
        'ramUsage': current_ram,
        'cpuUsage': current_cpu,
        'tempCore': current_temp,
    });

    newRpiIndex.save(function(err) {
        if (err) throw err;
        console.log('new rpi successfully saved.');
    });
}

function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec;

}

// ROUTES FOR OUR API
var router = express.Router();              // get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});

router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});

router.get('/rpi', function(req, res) {

    console.log("rpi router");

    res.json({ message: 'hooray! welcome to our rpi api!' });
    let current_disk = req.query.disk;
    let current_ram = req.query.ram;
    let current_cpu = req.query.cpu;
    let current_temp = req.query.temp;

    var date = new Date();
    var current_hour = getDateTime();
    saveData(current_hour,current_disk,current_ram,current_cpu,current_temp);

    var movilIP = '192.168.1.37:8082'
    var sendStr = 'http://'+movilIP+'/api/rpi?disk='+current_disk+'&cpu='+current_cpu+'&temp='+current_temp;
    sendData(sendStr);
});


function sendData (sendStr){
    // console.log("sendStr " + sendStr);
    if(sendStr){
        // console.log("sending data...");
        // console.log("sendStr\t"+sendStr+"\n\n");
        http.get(sendStr, (resp) => {
            let data = '';
            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });
            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                // console.log("done");
            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    }

};

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
