/*eslint-env node*/

/**
 * Module dependencies.
 */
var express = require('express'),
	compress = require('compression'),
	favicon = require('serve-favicon'),
	bodyParser = require('body-parser'),
	logger = require('morgan'),
	errorHandler = require('errorhandler'),
	path = require('path'),
	Cylon = require('cylon'),
	fs = require('fs'),
	io = require('socket.io')(8000),
	atob = require('atob');

/**
 * Controllers (route handlers).
 */
var homeController = require('./controllers/home');

/**
 * Create Express server.
 */
var app = express();

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(compress());
app.use(logger('dev'));
app.use(favicon(path.join(__dirname, 'public/favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

/**
 * Primary app routes.
 */
app.get('/', homeController.index); // Landing page

/**
 * Error Handler.
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
app.listen(app.get('port'), function () {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

var toUint8Array = function (parStr) {
  var raw = atob(parStr);
  var array = new Uint8Array(new ArrayBuffer(raw.length));

  Array.prototype.forEach.call(raw, function (data, index) {
    array[index] = raw.charCodeAt(index);
  });

  return array;
};

var LINEAR_XY_VEL = 100;
var LINEAR_Z_VEL = 75;
var ANGULAR_VEL = 100;

Cylon.robot({
	connections: {
		keyboard: { adaptor: 'keyboard' },
		joystick: { adaptor: "joystick" },
		bebop: { adaptor: 'bebop' },
	},

	devices: {
		keyboard: { driver: 'keyboard', connection: 'keyboard' },
		controller: { driver: "dualshock-4", connection: "joystick" },
		drone: { driver: 'bebop', connection: 'bebop' },
	},

	work: function (my) {
		console.log('Initializing setup with the following parameters');
		console.log('\t Linear velocity (xy):\t' + LINEAR_XY_VEL);
		console.log('\t Linear velocity (z):\t' + LINEAR_Z_VEL);
		console.log('\t Angular velocity:\t' + ANGULAR_VEL);

		// my.drone.connection.connector.GPSSettings.resetHome();
		// my.drone.connection.connector.WifiSettings.outdoorSetting(1);

		// console.log(my.drone)

		// PlayStation Dualshock 4 controller
    	var that = this,
		rightStick = { x: 0.0, y: 0.0 },
		leftStick = { x: 0.0, y: 0.0 };

		// socket io connection
	    io.on('connection', function (socket) {
			console.log('Socket IO connection established!');

			my.drone.on('video', function (data) {
				socket.emit('data', data.toString('base64'));
			});

			my.drone.on('PositionChanged', function(data) {
				console.log(data);
				socket.emit('position', data);
			});

			my.drone.on('battery', function(data) {
				console.log(data);
				socket.emit('battery', data);
			});

			my.drone.on('ready', function() {
				console.log('drone is ready...');
				socket.emit('state', 'ready');
			});

			my.drone.on('flying', function() {
				console.log('drone is flying...');
				socket.emit('state', 'flying');
			});

			my.drone.on('hovering', function() {
				console.log('drone is hovering...');
				socket.emit('state', 'hovering');
			});

			my.drone.on('landed', function() {
				console.log('drone just landed...');
				socket.emit('state', 'landed');
			});

			my.drone.on('landing', function() {
				console.log('drone is landing...');
				socket.emit('state', 'landing');
			});

			my.drone.on('takingOff', function() {
				console.log('drone is taking off...');
				socket.emit('state', 'takingOff');
			});

			that.controller.on("square:press", function() {
				that.drone.takeOff();
			});

			that.controller.on("triangle:press", function() {
				that.drone.stop();
			});

			that.controller.on("x:press", function() {
				socket.emit('button', 'x:press');
				that.drone.land();
			});

			that.controller.on("right_x:move", function(data) {
				console.log('right_x:move: ' + data);
				rightStick.x = data;
			});

			that.controller.on("right_y:move", function(data) {
				console.log('right_y:move' + data);
				rightStick.y = data;
			});

			that.controller.on("right_stick:release", function(data) {
				console.log('right_stick:release');
			});

			that.controller.on("left_x:move", function(data) {
				console.log('left_x:move' + data);
				leftStick.x = data;
			});

			that.controller.on("left_y:move", function(data) {
				console.log('left_y:move' + data);
				leftStick.y = data;
			});

	    	that.controller.on("l2:press", function(data) {
	    		socket.emit('button', 'l2:press');
	    		that.drone.up(LINEAR_Z_VEL)
	    	});

	    	that.controller.on("r2:press", function(data) {
	    		socket.emit('button', 'r2:press');
	    		that.drone.down(LINEAR_Z_VEL)
	    	});

	    	that.controller.on("l2:release", function(data) {
	    		socket.emit('button', 'l2:release');
	    		that.drone.stop()
	    	});

	    	that.controller.on("r2:release", function(data) {
	    		socket.emit('button', 'r2:release');
		    	that.drone.stop()
		    });
	    });


		setInterval(function() {
			var pair = leftStick;

			if (pair.y < 0) {
				that.drone.forward(validatePitch(pair.y));
			} else if (pair.y > 0) {
				that.drone.backward(validatePitch(pair.y));
			}

			if (pair.x > 0) {
				that.drone.right(validatePitch(pair.x));
			} else if (pair.x < 0) {
				that.drone.left(validatePitch(pair.x));
			}
		}, 0);

		setInterval(function() {
			var pair = rightStick;

			if (pair.y < 0) {
				that.drone.up(validatePitch(pair.y));
			} else if (pair.y > 0) {
				that.drone.down(validatePitch(pair.y));
			}

			if (pair.x > 0) {
				that.drone.clockwise(validatePitch(pair.x));
			} else if (pair.x < 0) {
				that.drone.counterClockwise(validatePitch(pair.x));
			}
		}, 0);

		setInterval(function() {
			that.drone.stop();
		}, 10);

		// keyboard controls

		// take off
		my.keyboard.on('o', function () {
			console.log('TAKING OFF');
			my.drone.takeOff();
		});

		// land
		my.keyboard.on('p', function () {
			console.log('LANDING');
			my.drone.land();
		});

		// increase altitude
		my.keyboard.on('up', function () {
			console.log('MOVING UP');
			my.drone.up(LINEAR_Z_VEL);
		});

		// decrease altitude
		my.keyboard.on('down', function () {
			console.log('MOVING DOWN');
			my.drone.down(LINEAR_Z_VEL);
		});

		// spin counter-clockwise
		my.keyboard.on('q', function () {
			console.log('SPINNING CCW');
			my.drone.counterClockwise(ANGULAR_VEL);
		});

		// spin clockwise
		my.keyboard.on('e', function () {
			console.log('SPINNING CW');
			my.drone.clockwise(ANGULAR_VEL);
		});

		// move forward
		my.keyboard.on('w', function () {
			console.log('MOVING FORWARD');
			my.drone.forward(LINEAR_XY_VEL);
		});

		// move left
		my.keyboard.on('a', function () {
			console.log('MOVING LEFT');
			my.drone.left(LINEAR_XY_VEL);
		});

		// move backward
		my.keyboard.on('s', function () {
			console.log('MOVING BACKWARD');
			my.drone.backward(LINEAR_XY_VEL);
		});

		// move right
		my.keyboard.on('d', function () {
			console.log('MOVING RIGHT');
			my.drone.right(LINEAR_XY_VEL);
		});

		// stop the drone when a key is released
		my.keyboard.on('keyup', function (key) {
			my.drone.stop();
		});
	},
}).start();

function validatePitch(data) {
  var value = Math.abs(data);
  if (value >= 0.1) {
    if (value <= 1.0) {
      return Math.round(value * 100);
    } else {
      return 100;
    }
  } else {
    return 0;
  }
}

module.exports = app;
