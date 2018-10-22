const getServices = (servicesList, toJs = true) => {
		const services = servicesList.get('services');

		return toJs ? services.toList().toJS() : services;
	},
	getServicesByType = (servicesList, type, toJs = true) => {
		const gatewayServices = servicesList.get('services').filter((service) => service.type === type);

		return toJs ? gatewayServices.toList().toJS() : gatewayServices;
	},
	getServiceById = (servicesList, serviceId, toJs = true) => {
		const service = servicesList.getIn(['services', serviceId]);

		if (!service) {
			return;
		}

		return toJs ? service.toJS() : service;
	},
	getServiceNameById = (servicesList, serviceId) => getServiceById(servicesList, serviceId).settings.name,
	getServiceByTypeAndDeviceId = (servicesList, type, deviceId, toJs = true) => {
		const servicesOfType = getServicesByType(servicesList, type, false),
			service = servicesOfType.find((_service) => _service.device_id === deviceId);

		if (!service) {
			return;
		}

		return toJs ? service.toJS() : service;
	},
	getSettingsOptionLabelByValue = (servicesList, serviceId, setting, value) => {
		const service = getServiceById(servicesList, serviceId, false);

		if (!service) {
			return;
		}

		const valueOptions = service.getIn(['settings_definitions', setting, 'value_options']);

		if (!valueOptions) {
			return;
		}

		const option = valueOptions.find((_option) => _option.value === value);

		if (!option) {
			return;
		}

		return option.label || option.value;
	},
	cameraGetRecordings = (servicesList, cameraServiceId, toJs = true) => {
		const cameraService = getServiceById(servicesList, cameraServiceId, false);

		if (!cameraService) {
			return;
		}

		const recordings = cameraService.recordingsList.get('recordings');

		return toJs ? recordings.toList().toJS() : recordings;
	},
	cameraGetRecordingsByDate = (servicesList, cameraServiceId, date, toJs = true) => {
		const cameraService = getServiceById(servicesList, cameraServiceId, false);

		if (!cameraService) {
			return;
		}

		// Make sure date is a valid moment date.
		if (!date || !date.isValid || !date.isValid()) {
			return;
		}

		const recordings = cameraService.recordingsList.get('recordings').filter((recording) => date.isSame(recording.date, 'day'));

		return toJs ? recordings.toList().toJS() : recordings;
	},
	cameraGetRecordingById = (servicesList, cameraServiceId, recordingId) => {
		const cameraService = getServiceById(servicesList, cameraServiceId, false);

		if (!cameraService) {
			return;
		}

		return cameraService.recordingsList.getIn(['recordings', recordingId]);
	},
	cameraIsRecordingsListLoading = (servicesList, cameraServiceId) => {
		const cameraService = getServiceById(servicesList, cameraServiceId, false);

		if (!cameraService) {
			return;
		}

		return cameraService.recordingsList.get('loading');
	},
	hasInitialFetchCompleted = (servicesList) => {
		return servicesList.get('fetched');
	};

export {
	getServices,
	getServicesByType,
	getServiceById,
	getServiceNameById,
	getServiceByTypeAndDeviceId,
	getSettingsOptionLabelByValue,
	cameraGetRecordings,
	cameraGetRecordingsByDate,
	cameraGetRecordingById,
	cameraIsRecordingsListLoading,
	hasInitialFetchCompleted
};
