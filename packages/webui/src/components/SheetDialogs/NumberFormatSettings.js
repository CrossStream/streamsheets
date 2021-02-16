/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
/* eslint-disable react/forbid-prop-types,react/no-unused-prop-types */
import React from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles';
import MenuList from '@material-ui/core/MenuList';
import MenuItem from '@material-ui/core/MenuItem';
import Checkbox from '@material-ui/core/Checkbox';
import Grid from '@material-ui/core/Grid';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import { NumberFormatter } from '@cedalo/number-format';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { graphManager } from '../../GraphManager';
import { numberFormatTemplates } from '../../languages/NumberFormatTemplates';
import * as Actions from '../../actions/actions';
import { intl } from '../../helper/IntlGlobalProvider';

let numberFormats = [];
let numberFormatCategories = [];

const styles = {
	menuitem: {
		fontSize: '0.85rem',
		paddingTop: '6px',
		paddingBottom: '6px',
	},
	label: {
		fontSize: '0.85rem',
	},
};

class NumberFormatSettings extends React.Component {
	static propTypes = {
		handler: PropTypes.func.isRequired,
		classes: PropTypes.object.isRequired,
		machine: PropTypes.object.isRequired,
		numberFormat: PropTypes.string.isRequired,
		localCulture: PropTypes.string.isRequired,
	};

	constructor(props) {
		super(props);

		numberFormats = [];
		numberFormatCategories = [];

		numberFormatCategories.push({
			name: <FormattedMessage id="FormatCellsDialog.numberFormatGeneral" defaultMessage="General" />,
			id: 0,
		});
		numberFormatCategories.push({
			name: <FormattedMessage id="FormatCellsDialog.numberFormatNumber" defaultMessage="Number" />,
			id: 1,
		});
		numberFormatCategories.push({
			name: <FormattedMessage id="FormatCellsDialog.numberFormatCurrency" defaultMessage="Currency" />,
			id: 2,
		});
		numberFormatCategories.push({
			name: <FormattedMessage id="FormatCellsDialog.numberFormatDate" defaultMessage="Date" />,
			id: 3,
		});
		numberFormatCategories.push({
			name: <FormattedMessage id="FormatCellsDialog.numberFormatTime" defaultMessage="Time" />,
			id: 4,
		});
		numberFormatCategories.push({
			name: <FormattedMessage id="FormatCellsDialog.numberFormatPercent" defaultMessage="Percent" />,
			id: 5,
		});
		numberFormatCategories.push({
			name: <FormattedMessage id="FormatCellsDialog.numberFormatFraction" defaultMessage="Fraction" />,
			id: 6,
		});
		numberFormatCategories.push({
			name: <FormattedMessage id="FormatCellsDialog.numberFormatScientific" defaultMessage="Scientific" />,
			id: 7,
		});
		numberFormatCategories.push({
			name: <FormattedMessage id="FormatCellsDialog.numberFormatText" defaultMessage="Text" />,
			id: 8,
		});

		const sheetView = graphManager.getActiveSheetView();
		if (!sheetView) {
			return;
		}

		const nf = props.numberFormat;
		const settings = props.localCulture;
		let sampleValue = 123456.654321;

		const selection = sheetView.getItem().getOwnSelection();
		const cell = sheetView.getItem().getDataProvider().get(selection.getActiveCell());
		if (cell) {
			const value = cell.getValue();
			if (value !== undefined) {
				sampleValue = value;
			}
		}

		let thousands;
		let decimals;
		let currency;
		let numberFormatSelected = 0;
		let numberFormatCategorySelected;
		let region;

		const sections = settings.split(';');
		if (sections.length) {
			currency = '€';
			region = this.props.machine.locale;
			decimals = 0;
			thousands = false;
			switch (sections[0]) {
			case 'general':
				numberFormatCategorySelected = 0;
				break;
			case 'number':
				numberFormatCategorySelected = 1;
				decimals = Number(sections[1]);
				thousands = sections[2] === 'true';
				break;
			case 'currency':
				numberFormatCategorySelected = 2;
				decimals = Number(sections[1]);
				thousands = sections[2] === 'true';
				[,,, currency] = sections;
				break;
			case 'date':
				numberFormatCategorySelected = 3;
				[, region] = sections;
				break;
			case 'time':
				numberFormatCategorySelected = 4;
				[, region] = sections;
				break;
			case 'percent':
				numberFormatCategorySelected = 5;
				decimals = Number(sections[1]);
				break;
			case 'fraction':
				numberFormatCategorySelected = 6;
				break;
			case 'science':
				numberFormatCategorySelected = 7;
				decimals = Number(sections[1]);
				break;
			case 'text':
				numberFormatCategorySelected = 8;
				break;
			default:
				break;
			}
		}

		this.addNumberTemplates(numberFormatCategorySelected, sampleValue, thousands, decimals, currency, region);

		switch (numberFormatCategorySelected) {
		case 1:
		case 2:
		case 3:
		case 4:
		case 6:
			numberFormats.forEach((fmt, index) => {
				if (fmt.format === nf) {
					numberFormatSelected = index;
				}
			});
			break;
		default:
			break;
		}

		const sample = this.prepareSampleValue(
			numberFormatCategorySelected,
			numberFormatSelected,
			sampleValue,
			decimals,
			thousands,
			currency,
			region,
		);

		this.state = {
			sampleValue,
			sampleFormatted: sample.sampleFormatted,
			sampleFormattedColor: sample.sampleFormattedColor,
			numberFormatSelected,
			numberFormatCategorySelected,
			thousands,
			decimals,
			currency,
			region,
		};
	}

	handleNumberFormatRowSelection = (categoryId, key) => {
		if (categoryId === undefined || key === undefined) {
			return;
		}

		const sample = this.prepareSampleValue(
			categoryId,
			key,
			this.state.sampleValue,
			this.state.decimals,
			this.state.thousands,
			this.state.currency,
			this.state.region,
		);
		this.setState({
			numberFormatSelected: key,
			sampleFormatted: sample.sampleFormatted,
			sampleFormattedColor: sample.sampleFormattedColor,
		})
	};

	addNumberTemplates(key, value, thousands, decimals, currency, region) {
		numberFormats = [];

		switch (key) {
		case 0: // Category: General
			value = 1234.56;
			numberFormats.push({
				id: 0,
				v: value,
				format: 'General',
				formattedvalue: NumberFormatter.formatNumber('General', value, 'general'),
			});
			break;
		case 1: // Category: Numbers
			value = 1234.56;
			for (let i = 0; i < 4; i += 1) {
				numberFormats.push(numberFormatTemplates.getNegativeNumberTemplates(
					thousands,
					Number(decimals),
					i % 2 ? 'red' : undefined,
					value,
					i,
					undefined,
					i,
				));
			}
			break;
		case 2: // Category: Currency
			value = 1234.56;
			for (let i = 0; i < 4; i += 1) {
				numberFormats.push(numberFormatTemplates.getNegativeNumberTemplates(
					thousands,
					Number(decimals),
					i % 2 ? 'red' : undefined,
					value,
					i,
					currency,
					i,
				));
			}
			break;
		case 3: { // Category: Date
			value = 43500.3;
			let id = 0;
			const templates = numberFormatTemplates.getTemplates(region);
			if (templates) {
				templates.Date.forEach((item) => {
					numberFormats.push({
						id,
						v: value,
						format: item.t,
						formattedvalue: NumberFormatter.formatNumber(item.t, value, 'date'),
					});
					id += 1;
				});
			}
			break;
		}
		case 4: { // Category: Time
			value = 0.3;
			let id = 0;
			const templates = numberFormatTemplates.getTemplates(region);
			if (templates) {
				templates.Time.forEach((item) => {
					numberFormats.push({
						id,
						v: value,
						format: item.t,
						formattedvalue: NumberFormatter.formatNumber(item.t, value, 'time'),
					});
					id += 1;
				});
			}
			break;
		}
		case 5: // Category: Percent
			value = 0.56;
			numberFormats.push(numberFormatTemplates.getNumberTemplate(Number(decimals), value, 5, 0));
			break;
		case 6: { // Category: Fraction
			value = 13.125;
			let id = 0;
			const templates = numberFormatTemplates.getTemplates(region);
			if (templates) {
				templates.Fraction.forEach((item) => {
					numberFormats.push({
						id,
						v: value,
						format: item.t,
						formattedvalue: { formattedValue: intl.formatMessage({ id: `Fraction${id}` }, {})}
						// formattedvalue: NumberFormatter.formatNumber(item.t, value, 'fraction'),
					});
					id += 1;
				});
			}
			break;
		}
		case 7: // Category: Scientific
			value = 1234.56;
			numberFormats.push(numberFormatTemplates.getNumberTemplate(Number(decimals), value, key, 0));
			break;
		case 8: // Text
			numberFormats.push({
				id: 0,
				v: value,
				format: '@',
				formattedvalue: NumberFormatter.formatNumber('@', value, 'text'),
			});
			break;
		default:
			break;
		}
	}

	handleNumberFormatCategoryChange = (key, value) => {
		this.setState({
			numberFormatCategorySelected: key,
			numberFormatSelected: 0,
			thousands: false,
			decimals: 0,
			currency: '€',
			region: this.props.machine.locale,
		});

		this.addNumberTemplates(key, value, false, 0, '€', this.props.machine.locale);
		this.handleNumberFormatRowSelection(key, 0);
	}

	handleThousand = (event) => {
		this.addNumberTemplates(
			this.state.numberFormatCategorySelected,
			this.state.sampleValue,
			event.target.checked,
			this.state.decimals, this.state.currency, this.state.region,
		);
		const sample = this.prepareSampleValue(
			this.state.numberFormatCategorySelected,
			this.state.numberFormatSelected,
			this.state.sampleValue,
			this.state.decimals,
			event.target.checked,
			this.state.currency,
			this.state.region,
		);
		this.setState({
			thousands: event.target.checked,
			sampleFormatted: sample.sampleFormatted,
			sampleFormattedColor: sample.sampleFormattedColor,
		})
	}

	handleDecimals = (event) => {
		this.addNumberTemplates(
			this.state.numberFormatCategorySelected,
			this.state.sampleValue,
			this.state.thousands,
			event.target.value, this.state.currency, this.state.region,
		);
		const sample = this.prepareSampleValue(
			this.state.numberFormatCategorySelected,
			this.state.numberFormatSelected,
			this.state.sampleValue,
			event.target.value,
			this.state.thousands,
			this.state.currency,
			this.state.region,
		);
		this.setState({
			decimals: event.target.value,
			sampleFormatted: sample.sampleFormatted,
			sampleFormattedColor: sample.sampleFormattedColor,
		})
	}

	handleCurrency = (event) => {
		this.addNumberTemplates(
			this.state.numberFormatCategorySelected, this.state.sampleValue, this.state.thousands,
			this.state.decimals, event.target.value, this.state.region,
		);
		const sample = this.prepareSampleValue(
			this.state.numberFormatCategorySelected,
			this.state.numberFormatSelected,
			this.state.sampleValue,
			this.state.decimals,
			this.state.thousands,
			event.target.value,
			this.state.region,
		);
		this.setState({
			currency: event.target.value,
			sampleFormatted: sample.sampleFormatted,
			sampleFormattedColor: sample.sampleFormattedColor,
		})
	}

	handleRegion = (event) => {
		this.addNumberTemplates(
			this.state.numberFormatCategorySelected, this.state.sampleValue, this.state.thousands,
			this.state.decimals, this.state.currency, event.target.value,
		);
		const sample = this.prepareSampleValue(
			this.state.numberFormatCategorySelected,
			this.state.numberFormatSelected,
			this.state.sampleValue,
			this.state.decimals,
			this.state.thousands,
			this.state.currency,
			event.target.value,
		);
		this.setState({
			region: event.target.value,
			sampleFormatted: sample.sampleFormatted,
			sampleFormattedColor: sample.sampleFormattedColor,
		})
	}

	prepareSampleValue(category, formatId, value, decimals, thousands, currency, region) {
		let settings = '';
		let type;

		if (category === undefined || formatId === undefined) {
			return { sampleFormatted: '', sampleFormattedColor: 'black' };
		}

		const format = numberFormats[formatId];
		if (format === undefined) {
			this.setState({ sampleFormatted: '' });
			return { sampleFormatted: '', sampleFormattedColor: 'black' };
		}

		switch (category) {
		case 0:
			settings = 'general';
			type = 'general';
			break;
		case 1:
			if (decimals !== undefined && thousands !== undefined) {
				settings = `number;${decimals};${thousands}`;
			}
			type = 'number';
			break;
		case 2:
			if (decimals !== undefined && thousands !== undefined) {
				settings = `currency;${decimals};${thousands};${currency}`;
			}
			type = 'number';
			break;
		case 3:
			if (region !== undefined) {
				settings = `date;${region}`;
			}
			type = 'date';
			break;
		case 4:
			if (region !== undefined) {
				settings = `time;${region}`;
			}
			type = 'time';
			break;
		case 5:
			if (decimals !== undefined) {
				settings = `percent;${decimals}`;
			}
			type = 'percent';
			break;
		case 6:
			settings = 'fraction';
			type = 'fraction';
			break;
		case 7:
			if (decimals !== undefined) {
				settings = `science;${decimals}`;
			}
			type = 'science';
			break;
		case 8:
			settings = 'text';
			type = 'text';
			break;
		default:
			break;
		}

		this.props.handler(format.format, settings);
		const result = NumberFormatter.formatNumber(format.format, value, type);

		return {
			sampleFormatted: result.formattedValue,
		 	sampleFormattedColor: result.color
		};
	}

	render() {
		return (
			<Grid container>
				<Grid item xs={3} >
					<MenuList
						style={{
							height: '342px',
							border: '1px solid grey',
							marginTop: '9px',
						}}
						role="menu">
						{numberFormatCategories.map(row => (
							<MenuItem
								style={styles.menuitem}
								key={row.id}
								selected={row.id === this.state.numberFormatCategorySelected}
								onClick={() => this.handleNumberFormatCategoryChange(row.id, this.state.sampleValue)}
							>
								{row.name}
							</MenuItem>
						))}
					</MenuList>
				</Grid>
				<Grid
					item
					xs={9}
					style={{
						height: '330px',
						paddingLeft: '15px',
					}}
				>
					<TextField
						variant="outlined"
						size="small"
						margin="normal"
						label={<FormattedMessage
							id="FormatCellsDialog.sample"
							defaultMessage="Sample"
						/>}
						fullWidth
						inputProps={{
							readOnly: true,
							style: { color: this.state.sampleFormattedColor},
						}}
						style={{
							marginTop: '8px',
						}}
						value={this.state.sampleFormatted}
					/>
					<div>
						{(this.state.numberFormatCategorySelected === 2) &&
						<FormControl
							style={{
								marginTop: '0px',
								marginBottom: '10px',
								marginRight: '20px',
								width: '100px',
							}}
						>
							<TextField
								variant="outlined"
								size="small"
								margin="normal"
								select
								label={<FormattedMessage
									id="FormatCellsDialog.currencySymbol"
									defaultMessage="Currency Symbol"
								/>}
								style={{
									fontSize: '0.85rem',
								}}
								value={this.state.currency}
								onChange={event => this.handleCurrency(event)}
							>
								<MenuItem value="€" key="€">€</MenuItem>
								<MenuItem value="$" key="$">$</MenuItem>
								<MenuItem value="£" key="£">£</MenuItem>
							</TextField>
						</FormControl>}
						{(this.state.numberFormatCategorySelected === 3 ||
							this.state.numberFormatCategorySelected === 4) &&
							<FormControl
								style={{
									marginTop: '0px',
									marginBottom: '10px',
									marginRight: '20px',
									width: '200px',
								}}
							>
								<TextField
									variant="outlined"
									size="small"
									margin="normal"
									select
									label="Region"
									style={{
										fontSize: '0.85rem',
									}}
									value={this.state.region}
									onChange={event => this.handleRegion(event)}
								>
									<MenuItem value="de" key="de">
										{intl.formatMessage({ id: 'Germany' }, { })}
									</MenuItem>
									<MenuItem value="us" key="us">
										{intl.formatMessage({ id: 'EnglishUS' }, { })}
									</MenuItem>
									<MenuItem value="en" key="en">
										{intl.formatMessage({ id: 'EnglishUK' }, { })}
									</MenuItem>
								</TextField>
							</FormControl>}
						{(this.state.numberFormatCategorySelected === 1 ||
							this.state.numberFormatCategorySelected === 2 ||
							this.state.numberFormatCategorySelected === 5 ||
							this.state.numberFormatCategorySelected === 7) &&
						<FormControl
							style={{
								marginTop: '0px',
								marginBottom: '10px',
								marginRight: '20px',
								width: '100px',
							}}
						>
							<TextField
								variant="outlined"
								size="small"
								margin="normal"
								id="number"
								label={<FormattedMessage id="FormatCellsDialog.decimals" defaultMessage="Decimals" />}
								inputProps={{
									min: 0,
									max: 10,
									step: 1,
									style: { fontSize: '0.85rem' },
								}}
								value={this.state.decimals}
								onChange={event => this.handleDecimals(event)}
								type="number"
							/>
						</FormControl>}
						{(this.state.numberFormatCategorySelected === 1 ||
							this.state.numberFormatCategorySelected === 2) &&
							<FormControlLabel
								style={{
									marginTop: '18px',
								}}
								classes={{
									label: this.props.classes.label,
								}}
								control={
									<Checkbox
										checked={this.state.thousands}
										onChange={event => this.handleThousand(event)}
									/>
								}
								label={<FormattedMessage id="FormatCellsDialog.thousands" defaultMessage="Thousands" />}
							/>}
					</div>
					{this.state.numberFormatCategorySelected > 0 &&
					this.state.numberFormatCategorySelected !== 5 &&
					this.state.numberFormatCategorySelected !== 7 &&
					this.state.numberFormatCategorySelected !== 8 &&
					<MenuList
						style={{
							border: '1px solid grey',
							position: 'relative',
							width: 'auto',
							overflowY: 'auto',
							height: '227px',
						}}
					>
						{numberFormats.map(row => (
							<MenuItem
								style={styles.menuitem}
								key={row.id}
								selected={row.id === this.state.numberFormatSelected}
								onClick={
									event => this.handleNumberFormatRowSelection(
										this.state.numberFormatCategorySelected,
										row.id,
										event,
									)
								}
							>
								<div
									style={{
										color: row.color !== undefined ? row.color : undefined,
										display: 'flex',
									}}
								>
									{row.formattedvalue ? row.formattedvalue.formattedValue : row.displayformat}
								</div>
							</MenuItem>
						))}
					</MenuList>}
				</Grid>
			</Grid>
		);
	}
}

function mapStateToProps(state) {
	return {
		machine: state.machine,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators(Actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(NumberFormatSettings));
