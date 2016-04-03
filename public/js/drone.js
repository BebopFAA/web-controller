$(function () {
	'use strict';

	var LINEAR_XY_VEL = 100;
	var LINEAR_Z_VEL = 75;
	var ANGULAR_VEL = 100;

	Cylon.robot({
		connections: {
			keyboard: { adaptor: 'keyboard' },
			// joystick: { adaptor: "joystick" },
			bebop: { adaptor: 'bebop' },
		},

		devices: {
			keyboard: { driver: 'keyboard', connection: 'keyboard' },
			// controller: { driver: "dualshock-4", connection: "joystick" },
			drone: { driver: 'bebop', connection: 'bebop' },
		},

		work: function (my) {
			console.log('Initializing setup with the following parameters');
			console.log('\t Linear velocity (xy):\t' + LINEAR_XY_VEL);
			console.log('\t Linear velocity (z):\t' + LINEAR_Z_VEL);
			console.log('\t Angular velocity:\t' + ANGULAR_VEL);

			console.log(my.drone);

			my.drone.on('PositionChanged', function(data) {
				console.log(data);
			});

			my.drone.on('battery', function(data) {
				console.log(data);
			});

			my.drone.on('video', function(data) {
				console.log(data);
			});

			// var output = fs.createWriteStream("./video.mpeg"),
			// 	video = my.drone.getVideoStream();

			// video.pipe(output);

	 //		var video = my.drone.getVideoStream();

	 //		server.on('connection', function(client) {
	 //			console.log('PIPING THE VIDEO');
	 //			var stream = client.createStream();
		// 	video.pipe(stream);
		// });

			// var that = this,
		 //        rightStick = { x: 0.0, y: 0.0 },
		 //        leftStick = { x: 0.0, y: 0.0 };

		 //    that.controller.on("square:press", function() {
		 //      that.drone.takeOff();
		 //    });

		 //    that.controller.on("triangle:press", function() {
		 //      that.drone.stop();
		 //    });

		 //    that.controller.on("x:press", function() {
		 //      that.drone.land();
		 //    });

		 //    that.controller.on("right_x:move", function(data) {
		 //      rightStick.x = data;
		 //    });

		 //    that.controller.on("right_y:move", function(data) {
		 //      rightStick.y = data;
		 //    });

		 //    that.controller.on("left_x:move", function(data) {
		 //      leftStick.x = data;
		 //    });

		 //    that.controller.on("left_y:move", function(data) {
		 //      leftStick.y = data;
		 //    });

		 //    setInterval(function() {
		 //      var pair = leftStick;

		 //      if (pair.y < 0) {
		 //        that.drone.forward(validatePitch(pair.y));
		 //      } else if (pair.y > 0) {
		 //        that.drone.backward(validatePitch(pair.y));
		 //      }

		 //      if (pair.x > 0) {
		 //        that.drone.right(validatePitch(pair.x));
		 //      } else if (pair.x < 0) {
		 //        that.drone.left(validatePitch(pair.x));
		 //      }
		 //    }, 0);

		 //    setInterval(function() {
		 //      var pair = rightStick;

		 //      if (pair.y < 0) {
		 //        that.drone.up(validatePitch(pair.y));
		 //      } else if (pair.y > 0) {
		 //        that.drone.down(validatePitch(pair.y));
		 //      }

		 //      if (pair.x > 0) {
		 //        that.drone.clockwise(validatePitch(pair.x));
		 //      } else if (pair.x < 0) {
		 //        that.drone.counterClockwise(validatePitch(pair.x));
		 //      }
		 //    }, 0);

		 //    setInterval(function() {
		 //      that.drone.stop();
		 //    }, 10);


		    // keyboard controls

		    // take off
			my.keyboard.on('o', function() {
				console.log('TAKING OFF');
				my.drone.takeOff();
			});

			// land
			my.keyboard.on('p', function() {
				console.log('LANDING');
				my.drone.land();
			});

			// increase altitude
			my.keyboard.on('up', function() {
				console.log('MOVING UP');
				my.drone.up(LINEAR_Z_VEL);
			});

			// decrease altitude
			my.keyboard.on('down', function() {
				console.log('MOVING DOWN');
				my.drone.down(LINEAR_Z_VEL);
			});

			// spin counter-clockwise
			my.keyboard.on('q', function() {
				console.log('SPINNING CCW');
				my.drone.counterClockwise(ANGULAR_VEL);
			});

			// spin clockwise
			my.keyboard.on('e', function() {
				console.log('SPINNING CW');
				my.drone.clockwise(ANGULAR_VEL);
			});

			// move forward
			my.keyboard.on('w', function() {
				console.log('MOVING FORWARD');
				my.drone.forward(LINEAR_XY_VEL);
			});

			// move left
			my.keyboard.on('a', function() {
				console.log('MOVING LEFT');
				my.drone.left(LINEAR_XY_VEL);
			});

			// move backward
			my.keyboard.on('s', function() {
				console.log('MOVING BACKWARD');
				my.drone.backward(LINEAR_XY_VEL);
			});

			// move right
			my.keyboard.on('d', function() {
				console.log('MOVING RIGHT');
				my.drone.right(LINEAR_XY_VEL);
			});

			// stop the drone when a key is released
			my.keyboard.on('keyup', function(key) {
				my.drone.stop();
			});
		},
	}).start();

});

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