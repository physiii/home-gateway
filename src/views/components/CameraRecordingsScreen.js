import React from 'react';
import PropTypes from 'prop-types';
import {withRoute} from './Route.js';
import NavigationScreen from './NavigationScreen.js';
import SliderControl from './SliderControl.js';
import DatePicker from './DatePicker.js';
import VideoPlayer from './VideoPlayer.js';
import AudioPlayer from './AudioPlayer.js';
import PlayButtonIcon from '../icons/PlayButtonIcon.js';
import List from './List.js';
import moment from 'moment';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {getServiceById, getServiceNameById, cameraGetRecordingsByDate, cameraGetRecordingById, cameraGetDatesOfRecordings, cameraIsRecordingsListLoading, cameraGetRecordingsListError} from '../../state/ducks/services-list/selectors.js';
import {cameraFetchRecordings, doServiceAction} from '../../state/ducks/services-list/operations.js';
import './CameraRecordingsScreen.css';

const playButtonIcon = <PlayButtonIcon size={24} />;

export class CameraRecordingsScreen extends React.Component {
	constructor (props) {
		super(props);

		this.handleDateSelected = this.handleDateSelected.bind(this);
		this.handleCloseClick = this.handleCloseClick.bind(this);

		this.state = {
			selectedMonth: this.props.selectedDate.startOf('month'),
			currentPlayLocation: 0
		};
	}

	componentDidMount () {
		this.props.fetchRecordings(this.props.service);
	}

	componentDidUpdate (previousProps) {
		if (this.props.service.state.get('connected') && !previousProps.service.state.get('connected')) {
			this.props.fetchRecordings(this.props.service);
		}
	}

	getPathForDate (date) {
		return `${this.props.match.urlWithoutOptionalParams}/${date.year()}/${date.month() + 1}/${date.date()}`; // Add 1 to month because moment months are zero-based. This just makes the url one-based.
	}

	goToDate (date) {
		// Update current URL to new selected date.
		this.props.history.replace(this.getPathForDate(date));
	}

	playRecording (recordingId) {
		this.props.history.replace(this.getPathForDate(this.props.selectedDate) + '/' + recordingId);
	}

	handleDateSelected (date) {
		this.goToDate(date);
	}

	handleCloseClick (event) {
		event.preventDefault();

		this.goToDate(this.props.selectedDate);
	}

	transportVideo (time) {
		this.setState({currentPlayLocation: time});
		this.props.doAction(this.props.service.id, {
			property: 'setCurrentPlayLocation',
			value: time
		});
	}

	render () {
		let bottomContent;

		if (this.props.isLoading) {
			bottomContent = <p>Loading Recordings</p>;
		} else if (this.props.error) {
			bottomContent = <p>{this.props.error}</p>;
		} else if (this.props.selectedDateRecordings.length) {
			bottomContent = (
				<List
					title={this.props.selectedDate.format('MMMM Do')}
					isOrdered={true}
					shouldVirtualize={true}>
					{this.props.selectedDateRecordings.map((recording) => ({
						key: recording.id,
						label: () => moment(recording.date).format('h:mm A'),
						icon: playButtonIcon,
						meta: () => 'Movement for ' + moment.duration(recording.duration, 'seconds').humanize(),
						onClick: () => this.playRecording(recording.id)
					}))}
				</List>
			);
		} else {
			bottomContent = <p>No recordings were found for the selected date.</p>;
		}

		return (
			<NavigationScreen
				title={(this.props.cameraName || 'Camera') + ' Recordings'}
				url={this.props.match.urlWithoutOptionalParams}>
				<div styleName="screen">
					<div styleName={this.props.selectedRecording ? 'topRecordingSelected' : 'top'}>
						{this.props.selectedRecording
							? <div>
								<div styleName="videoContainer">
									<AudioPlayer
										audioServiceId={this.props.service.id}
										recording={this.props.selectedRecording}
										shouldShowControls={false}
										streamingToken={this.props.selectedRecording.audio_streaming_token}
										showControlsWhenStopped={false}
										onPlay={this.onStreamStart}
										onStop={this.onStreamStop}
										ref={this.audioPlayer}
										autoplay={true} />
									<VideoPlayer
										cameraServiceId={this.props.service.id}
										recording={this.props.selectedRecording}
										key={this.props.selectedRecording.id}
										streamingToken={this.props.selectedRecording.streaming_token}
										width={this.props.selectedRecording.width}
										height={this.props.selectedRecording.height}
										videoLength={this.props.selectedRecording.duration}
										autoplay={true} />
									<div styleName="overlayTransport">
										<SliderControl
											value={this.state.currentPlayLocation}
											max={this.props.selectedRecording.duration}
											onChange={this.transportVideo.bind(this)}
										/>
									</div>
								</div>
							</div>
							: <div styleName="datePickerContainer">
								<DatePicker
									selectedDate={this.props.selectedDate}
									enabledDates={this.props.getDatesOfRecordings(this.state.selectedMonth).map((date) => moment(date))}
									onSelect={this.handleDateSelected}
									onMonthChange={(selectedMonth) => this.setState({selectedMonth})} />
							</div>}
						{this.props.selectedRecording && <a href="#" styleName="closeButton" onClick={this.handleCloseClick}>Close</a>}
					</div>
					<div styleName={this.props.selectedRecording ? 'bottomRecordingSelected' : 'bottom'}>
						{bottomContent}
					</div>
				</div>
			</NavigationScreen>
		);
	}
}

CameraRecordingsScreen.propTypes = {
	videoLength: PropTypes.number,
	service: PropTypes.object,
	cameraName: PropTypes.string,
	selectedDate: PropTypes.object.isRequired,
	selectedDateRecordings: PropTypes.array,
	selectedRecording: PropTypes.object,
	match: PropTypes.object,
	history: PropTypes.object.isRequired,
	isLoading: PropTypes.bool,
	fetchRecordings: PropTypes.func,
	getDatesOfRecordings: PropTypes.func,
	error: PropTypes.string,
	doAction: PropTypes.func
};

CameraRecordingsScreen.defaultProps = {
	selectedDateRecordings: []
};

const mapStateToProps = ({servicesList}, {match}) => {
		const service = getServiceById(servicesList, match.params.cameraServiceId, false),
			recordingsError = cameraGetRecordingsListError(servicesList, match.params.cameraServiceId);

		let selectedDate = moment([
				match.params.year,
				match.params.month - 1, // Subtract 1 from month because Moment months are zero-based.
				match.params.date
			]),
			error;

		if (!selectedDate.isValid()) {
			selectedDate = moment();
		}

		if (!service) {
			error = 'There was a problem loading the camera’s recordings.';
		} else if (!service.state.get('connected')) {
			error = 'Recordings cannot be viewed when the camera is not connected.';
		} else if (recordingsError) {
			error = recordingsError;
		}

		return {
			error,
			service,
			cameraName: getServiceNameById(servicesList, service.id),
			selectedDate,
			selectedDateRecordings: service && cameraGetRecordingsByDate(servicesList, service.id, selectedDate),
			selectedRecording: cameraGetRecordingById(servicesList, service.id, match.params.recordingId),
			isLoading: cameraIsRecordingsListLoading(servicesList, service.id),
			getDatesOfRecordings: (month) => cameraGetDatesOfRecordings(servicesList, service.id, month.format('YYYY-M')) || []
		};
	},
	mapDispatchToProps = (dispatch) => {
		return {
			doAction: (serviceId, action) => dispatch(doServiceAction(serviceId, action)),
			fetchRecordings: (service) => service && service.state.get('connected') && dispatch(cameraFetchRecordings(service.id))
		};
	};

export default compose(
	withRoute({params: '/:cameraServiceId/:year?/:month?/:date?/:recordingId?'}),
	connect(mapStateToProps, mapDispatchToProps)
)(CameraRecordingsScreen);
