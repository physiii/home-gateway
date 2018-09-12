const DeviceDriver = require('./device-driver.js'),
	noOp = () => {},
	SERVICE_EVENT_DELIMITER = '::',
	TAG = '[StandardDeviceDriver]';

class StandardDeviceDriver extends DeviceDriver {
	constructor (data, socket, device_id) {
		super(socket, device_id);

		this.device_listeners = [];

		if (socket) {
			this.setSocket(socket);
		}
	}

	on (event, callback, service_id, service_type) {
		const prefixed_event = this._getPrefixedEvent(event, service_id, service_type);

		this.device_listeners.push([prefixed_event, callback]);

		if (this.socket) {
			this.socket.on(prefixed_event, callback);
		}
	}

	emit (event, data, callback = noOp, service_id, service_type) {
		const prefixed_event = this._getPrefixedEvent(event, service_id, service_type);

		if (!this.socket) {
			console.log(TAG, this.device_id, 'Tried to emit socket event "' + prefixed_event + '" but the device does not have a socket.');
			callback('Device not connected');
			return;
		}

		if (!this.socket.connected) {
			console.log(TAG, this.device_id, 'Tried to emit socket event "' + prefixed_event + '" but the socket is not connected.');
			callback('Device not connected');
			return;
		}

		this.socket.emit(prefixed_event, data, callback);
	}

	_getPrefixedEvent (event, service_id, service_type) {
		return service_id
			? service_id + SERVICE_EVENT_DELIMITER + service_type + SERVICE_EVENT_DELIMITER + event
			: event;
	}

	_subscribeToSocket () {
		// Set up listeners on new socket.
		this.device_listeners.forEach((listener) => {
			this.socket.on.apply(this.socket, listener);
		});
	}
}

module.exports = StandardDeviceDriver;
