import React from 'react';
import PropTypes from 'prop-types';
import SettingsField from './SettingsField.js';
import './SettingsForm.css';

export const SettingsForm = (props) => {
	return (
		<form styleName="form">
			{props.fields.map((field) => {
				return field && (
					<SettingsField
						{...field}
						disabled={props.disabled}
						onChange={props.onFieldChange}
						key={field.property} />
				);
			})}
		</form>
	);
};

SettingsForm.propTypes = {
	fields: PropTypes.arrayOf(PropTypes.shape({
		property: PropTypes.string,
		definition: PropTypes.object,
		value: PropTypes.any,
		originalValue: PropTypes.any
	})),
	disabled: PropTypes.bool,
	onFieldChange: PropTypes.func
};

export default SettingsForm;