var Cylon = require('cylon');

Cylon.robot({
	connections: (function() {
		var connections = {
			keyboard: { adaptor: 'keyboard' },
			bebop: { adaptor: 'bebop' },
		}
		return connections;
	})(),

	devices: (function() {
		var devices = {
			keyboard: { driver: 'keyboard', connection: 'keyboard' },
			drone: { driver: 'bebop', connection: 'bebop' },
			stream: { driver: 'media-streaming', connection: 'bebop' },
			record: { driver: 'media-record', connection: 'bebop' }
		};
		return devices;
	})(),

	work: function (my) {
		my.record.pictureV2();
  },
}).start();
