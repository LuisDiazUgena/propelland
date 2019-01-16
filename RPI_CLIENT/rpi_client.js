const express    = require('express');        // call express
const app        = express();                 // define our app using express
const bodyParser = require('body-parser');
const fs = require('fs');

const si = require('systeminformation');
const http = require('http');
// const si = require('systeminformation');
const os = require('os-utils');
//const gpio = require('rpi-gpio');
var rpio = require('rpio');
rpio.init({mapping: 'gpio'});

var gpiop = gpio.promise;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var port = process.env.PORT || 8081;        // set our port

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

router.get('/gpio', function(req, res) {

    console.log("***********************************\ngpio handler\n***********************************");

    res.json({ message: 'hooray! welcome to our gpio api!' });
    let gpio = parseInt(req.query.gpio);
    let state = parseInt(req.query.state);

    console.log("gpio="+gpio+" State="+state);
    //TODO: CHANGE GPIO State
    changeGPIO(gpio,state);
});

function changeGPIO(gpio,state){

    console.log("state " +state);
    // gpio = parseInt(gpio,10);
    rpio.open(gpio, rpio.OUTPUT, state);
    rpio.write(gpio, + state);
    // gpiop.setup(gpio, gpio.DIR_OUT)
    // .then(() => {
    //
    //     console.log("gpio " +gpio);
    //     // return gpiop.write(gpio, state);
    // })
    // .catch((err) => {
    //     console.log('Error setting up gpio state: ', err.toString());
    // })
}

function retrieveData(){
    console.log("Gathering data...");
    var sendStr = getData();
}

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

retrieveData();
setInterval(retrieveData,1000); // place interval for sending data

function initializeTemp() {
    // Return new promise
    return new Promise(function(resolve, reject) {
    	// Do async job
        var spawn = require('child_process').spawn;
        temp = spawn('cat', ['/sys/class/thermal/thermal_zone0/temp']);
        temp.stdout.on('data', function(data) {
            var degrees = data/1000;
            // console.log('Core temp: ' + data/1000 + ' degrees Celcius');
            if (degrees) {
                resolve(degrees);
            } else {
                var err = 'no degrees';
                reject(err);
            }
        });
    })
};

function getTemp(){
    var tempPromise = initializeTemp();
    tempPromise.then(function(result) {
        //TODO MODIFICAR
        temp = result;
        return temp;
    }, function(err) {
        console.log(err);
    })
}

function retrieveData() {
    // var ramusg;
    var cpuusg;
    var diskusg;
    var temp;

    var tempPromise = initializeTemp();
    tempPromise.then(function(result) {
        temp = result;
        si.fsSize()
            .then(function(data){
                data.forEach(function(data){
                    var disks = 0;
                    if(data.type != "ext4"){
                        diskusg = data.use;
                    }
                })

                si.currentLoad()
                    .then(function(data){
                        cpuusg = data.currentload;

                        // console.log("\n\ndiskusg\t"+diskusg+"\ncpuusg\t"+cpuusg+"\ntemp\t"+temp+"\n\n");

                        if(diskusg && cpuusg && temp){
                            // PORTATIL
                            var portatilIP = '192.168.1.39:8080'
                            var movilIP = '192.168.1.37:8082'
                            var sendStr = 'http://'+portatilIP+'/api/rpi?disk='+diskusg+'&cpu='+cpuusg+'&temp='+temp;
                            sendData(sendStr);
                            // MOVIL
                            //var sendStr = 'http://'+movilIP+'/api/rpi?disk='+diskusg+'&cpu='+cpuusg+'&temp='+temp;
                            //sendData(sendStr);
                        }

                    })
                    .catch(error => console.error(error));
            })
	        .catch(error => console.error(error));
    });
}
// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
