import Immutable from 'immutable';

const DeviceRecord = (defaultValues) => class extends Immutable.Record({
	id: null,
	type: null,
	token: null,
	config: Immutable.Map({}),
	...defaultValues
}) {};

export default DeviceRecord;
