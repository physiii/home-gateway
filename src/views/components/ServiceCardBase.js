import React from 'react';
import PropTypes from 'prop-types';
import Toolbar from './Toolbar.js';
import './ServiceCardBase.css';

export const ServiceCardBase = (props) => {
	const status = props.isConnected
		? props.status
		: 'Not Responding';

	return (
		<section styleName="card" onClick={props.onCardClick}>
			<div styleName={props.hideToolbars ? 'topBarHidden' : 'topBar'}>
				{props.icon &&
					<div styleName={props.isConnected ? 'icon' : 'disconnectedIcon'}>
						{props.icon}
					</div>}
				<div styleName="nameWrapper">
					<h1 styleName="name">
						{props.name}
					</h1>
					{status &&
						<span styleName={props.isConnected ? 'status' : 'disconnectedStatus'}>
							{status}
						</span>}
				</div>
			</div>
			<div styleName={props.toolbarsOverlayContent ? 'contentBehindToolbars' : 'content'}>
				{props.content}
			</div>
			<div styleName={props.hideToolbars ? 'bottomBarHidden' : 'bottomBar'}>
				<Toolbar leftChildren={<div onClick={(event) => event.stopPropagation()}>{props.secondaryAction}</div>} />
			</div>
		</section>
	);
};

ServiceCardBase.propTypes = {
	name: PropTypes.string,
	status: PropTypes.string,
	icon: PropTypes.node,
	isConnected: PropTypes.bool,
	content: PropTypes.node,
	toolbarsOverlayContent: PropTypes.bool,
	secondaryAction: PropTypes.node,
	hideToolbars: PropTypes.bool,
	onCardClick: PropTypes.func
};

export default ServiceCardBase;