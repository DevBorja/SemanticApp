// OtroSensorQuery.js
// --------------------------------------------------------------
// Consultas de relación entre los valores de los sensores.
// --------------------------------------------------------------

import React from 'react';
import '../../index.css';
import {Button, Icon, Row, Col, Card, Input} from 'react-materialize'
//import M from 'materialize-css';
import $ from 'jquery';
import Slider, { Range } from 'rc-slider';
import 'rc-slider/assets/index.css';

var _ = require('lodash');

export class OtroSensorQueryForm extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			knownSensors:{},
			selectedSensors: [],
			askedSensors: [],
			quitarAnomalias: false,
			filterValues: [],
			values: {},
			fechaInicio: '',
			fechaFin: '',
			errores: {
				fechasMal:false,
				faltaFecha: false,
			},
		};
	}

	static getDerivedStateFromProps(props, state){
        if (!_.isEqual(props.selectedSensors, state.selectedSensors)){
			const knownSensors = state.knownSensors;
			let newKnownSensors = {};
			const askedSensors = state.askedSensors;
			let newAskedSensors = [];
			const filterValues = state.filterValues;
			let newFilterValues = [];
			const selectedSensors = props.selectedSensors;
			selectedSensors.forEach((sensorId,i) => {
				if (state.selectedSensors.length === 0){
					if (i === 0)
						newAskedSensors.push(sensorId);
					else
						newKnownSensors[sensorId] = null;
				}
				else{
					if (askedSensors.indexOf(sensorId) !==-1){
						newAskedSensors.push(sensorId);
					}
					else if (!knownSensors[sensorId]){
						newKnownSensors[sensorId] = null;
					}
					else{
						newKnownSensors[sensorId] = knownSensors[sensorId];
					}
					if (filterValues[sensorId]){
						newFilterValues.push(sensorId);
					}
				}
			});
			//console.log(selectedSensors);
			//console.log(newKnownSensors);
			//console.log(newAskedSensors);
			return {
				selectedSensors: selectedSensors,
				knownSensors: newKnownSensors,
				askedSensors: newAskedSensors,
				filterValues: newFilterValues,
			};
		}
		else{
			return null;
		}
    }

	handleCheckedSensor(event){
		const value = event.target.value;
		let askedSensors = this.state.askedSensors.slice();
		let knownSensors = this.state.knownSensors;
		let newAskedSensors = askedSensors;
		let newKnownSensors = knownSensors;
		const iAskedSensor = askedSensors.indexOf(value);
		if (iAskedSensor !== -1){
			newAskedSensors.splice(iAskedSensor, 1);
			newKnownSensors[value] = null;
		}
		else{
			newAskedSensors.push(value);
			newKnownSensors = _.omit(knownSensors, [value]);
		}
		this.setState({
			askedSensors: newAskedSensors,
			knownSensors: newKnownSensors,
		});
		//console.log("askedSensors: " + JSON.stringify(newAskedSensors));
		//console.log("knownSensors: " + JSON.stringify(newKnownSensors));
	}

	handleValueChange(event, sensorId){
		let value = event.target.value;
		let knownSensors = this.state.knownSensors;
		if (value === ""){
			knownSensors[sensorId] = null;
		}
		else{
			knownSensors[sensorId] = parseFloat(value);
		}
		this.setState({
			knownSensors: knownSensors,
		});
	}

	handleSelectChange(event, sensorId){
		let value = event.target.value;
		let knownSensors = this.state.knownSensors;
		if (value === 'esp'){
			knownSensors[sensorId] = null;
		}
		else{
			knownSensors[sensorId] = value;
		}
		this.setState({
			knownSensors: knownSensors,
		});
	}

	handleElimAnom(event){
		const quitarAnomalias = this.state.quitarAnomalias;
		this.setState({
			quitarAnomalias: !quitarAnomalias,
		});
	}

	handleRange(range, sensorId){
		let values = this.state.values;
		values[sensorId] = range;
		this.setState({
			values: values,
		});

	}

	handleFilterValueChecked(event, sensorId, min, max){
		let values = this.state.values;
		let checked = event.target.checked;
		let filterValues = this.state.filterValues;
		if (checked){
			filterValues.push(sensorId);
			if (!values[sensorId]){
				values[sensorId] = [min, max];
			}
		}
		else{
			let iSensor = filterValues.indexOf(sensorId);
			filterValues.splice(iSensor,1);
		}
		this.setState({
			values: values,
			filterValues: filterValues,
		});
		//console.log(filterValues);
		//console.log(values);
	}

	handleFechaInicio(event, value){
		const fechaFin = this.state.fechaFin;
		var errores = this.state.errores;
		var fechasMal = false;
		var faltaFecha = false;
		if (value !== ''){
			if (fechaFin === ''){
				faltaFecha = true;
			}
			else{
				var dateInicio = new Date(value + 'T00:00:00');
				var dateFin = new Date(fechaFin + 'T00:00:00');
				if (dateInicio.getTime() > dateFin.getTime()){
					fechasMal = true;
				}
			}
		}
		else{
			if (fechaFin !== ''){
				faltaFecha = true;
			}
		}
		errores['fechasMal'] = fechasMal;
		errores['faltaFecha'] = faltaFecha;
		this.setState({
			fechaInicio: value,
			errores: errores,
		});
	}

	handleFechaFin(event, value){
		const fechaInicio = this.state.fechaInicio;
		var errores = this.state.errores;
		var fechasMal = false;
		var faltaFecha = false;
		if (value !== ''){
			if (fechaInicio === ''){
				faltaFecha = true;
			}
			else{
				var dateInicio = new Date(fechaInicio + 'T00:00:00');
				var dateFin = new Date(value + 'T00:00:00');
				if (dateInicio.getTime() > dateFin.getTime()){
					fechasMal = true;
				}
			}
		}
		else{
			if (fechaInicio !== ''){
				faltaFecha = true;
			}
		}
		errores['fechasMal'] = fechasMal;
		errores['faltaFecha'] = faltaFecha;
		this.setState({
			fechaFin: value,
			errores: errores,
		});
	}

	handleSubmit(){
		const knownSensors = this.state.knownSensors;
		const askedSensors = this.state.askedSensors.slice();
		const values = this.state.values;
		const stateFilterValues = this.state.filterValues;
		const fechaInicio = this.state.fechaInicio;
		const fechaFin = this.state.fechaFin;

		let filterValues = {'filter': false, 'values': {}};
		let filter = {'filter':false, 'filterDate':false, 'startDate':'', 'endDate':'', 'filterTime':false, 'startTime':'', 'endTime':''};

		if (stateFilterValues.length > 0){
			filterValues['filter'] = true;
			stateFilterValues.forEach((sensorId) => {
				filterValues['values'][sensorId] = values[sensorId];
			});
		}

		if (fechaInicio !== ''){
			filter['filter'] = true;
			filter['filterDate'] = true;
			filter['startDate'] = fechaInicio;
			filter['endDate'] = fechaFin;
		}

		this.props.getOtherSensorQuery(knownSensors, askedSensors, filterValues, filter);
	}

	render(){
		const selectedSensors = this.state.selectedSensors.slice();
		const askedSensors = this.state.askedSensors.slice();
		const knownSensors = this.state.knownSensors;
		const filterValues = this.state.filterValues;
		const values = this.state.values;
		const errores = this.state.errores;

		const Slider = require('rc-slider');
		const createSliderWithTooltip = Slider.createSliderWithTooltip;
		const Range = createSliderWithTooltip(Slider.Range);

		const checkboxesSensores = selectedSensors.map((sensorId, i) => {
			const sensor = _.find(this.props.infoSensores, ['indicatorId', sensorId]);
			const defChecked = (askedSensors.indexOf(sensorId) !== -1)
				? (true)
				: (false);
			const checkValue = sensor.name + ' (' + sensorId + ')';
			const sensorName = sensor.name;
			return(
				<Input s={12} key={sensorId} name='checkboxesSensores'
					type='checkbox' value={sensorId} label={checkValue}
					className='filled-in' checked={defChecked}
					onChange={(e) => {this.handleCheckedSensor(e);}}
				/>

			);
		});

		let restoSensores = selectedSensors.map((sensorId, i) => {
			if (askedSensors.indexOf(sensorId) === -1){
				const sensor = _.find(this.props.infoSensores, ['indicatorId', sensorId]);
				const sensorName = sensor.name;
				const minValue = sensor["minValue"];
				const maxValue = sensor["maxValue"];
				const valorClass = (knownSensors[sensorId] === null)
					? ('error')
					: ('');
				const disabled = (filterValues.indexOf(sensorId) === -1)
					? (true)
					: (false);
				const defaultRange = (!values[sensorId])
					? ([minValue, maxValue])
					: ([values[sensorId][0], values[sensorId][1]]);
				const valueInput = (isNaN(knownSensors[sensorId]))
						? (null)
						: (<Input s={3} label="Value" className={valorClass}
								onChange={(e) => {this.handleValueChange(e,sensorId);}}
							/>);
				const valuePickerType = (sensor['valueType'] === 'double')
						? (<Range
								min={minValue} max={maxValue}
								defaultValue={defaultRange}
								disabled={disabled}
								onAfterChange={(e) => {this.handleRange(e,sensorId);}}
							/>)
						: (<div className="switch">
								<label>
									Off
									<input type="checkbox" disabled={disabled}
										onChange={(e) => {this.handleSwitch(e,sensorId);}}
									/>
									<span className="lever"></span>
									On
								</label>
							</div>);
				const showFilterValues = (isNaN(knownSensors[sensorId]))
						? (<div>
								<Col s={12}>
									<Input name='filterValue' type='checkbox' className='filled-in'
										label="Filter values to avoid anomalies"
										onChange={(e) => {this.handleFilterValueChecked(e,sensorId,minValue,maxValue);}}
									/>
								</Col>
								<Col s={10} offset="s1">
									{valuePickerType}
								</Col>
							</div>)
						: (null);
				const errorValor = (knownSensors[sensorId] === null)
					? (<p className='red-text'> A value must be indicated for the sensor.</p>)
					: (null);
				return(
					<Row key={sensorId}>
						<Col s={12}>
							<p>Sensor <span className="bold">{sensorName}</span> ({sensorId}) has: </p>
						</Col>
						<Input s={6} type='select' defaultValue='esp'
							onChange={(e) => {this.handleSelectChange(e,sensorId);}}
						>
							<option value='esp'>Exact value</option>
							<option value='min'>Minimum value</option>
							<option value='max'>Maximum value</option>
						</Input>
						{valueInput}
						<Col s={12}>
							{errorValor}
						</Col>
						{showFilterValues}
					</Row>
				);
			}
			else{
				return null;
			}
		});

		let buttonDisabled = false;
		let erroresFechas = null;
		let fechasClass = '';

		if (_.includes(knownSensors, null)){
			buttonDisabled = true;
		}

		if (errores['faltaFecha']){
			erroresFechas = (<p className='red-text'> You must indicate a date.</p>);
			buttonDisabled = true;
			fechasClass = 'error';
		}
		else if (errores['fechasMal']){
			erroresFechas = (<p className='red-text'> The start date cannot be greater than the end date. </p>);
			buttonDisabled = true;
			fechasClass = 'error';
		}
		else if (askedSensors.length === 0 || askedSensors.length === selectedSensors.length){
			buttonDisabled = true;
		}

		return(
			<Card>
				<div className='form'>
					<Row>
						<p className='black-text'>
							Check the values from some of the selected sensors when the remaining sensors have some specific values.
						</p>
					</Row>
					<Row>
						<p className='blue-text text-darken-3'>
							Sensors whose data must be consulted:
						</p>
					</Row>
					<Row>
						{checkboxesSensores}
					</Row>
					<Row>
						<p className='blue-text text-darken-3'>
							Which values take these sensors when...
						</p>
					</Row>
					{restoSensores}
					<Row s={12}>
					 	<p className='blue-text text-darken-3'>
							Filter results by date:
						</p>
					 </Row>
					 <Row className="center">
					 	<Input s={12} l={6} type='date' label="From..."
							options={{format: 'yyyy-mm-dd'}}
					 		onChange={(e, value) => {this.handleFechaInicio(e, value);}}
							className={fechasClass}/>
					 	<Input s={12} l={6} type='date' label="To..."
							options={{format: 'yyyy-mm-dd'}}
					 		onChange={(e, value) => {this.handleFechaFin(e, value);}}
							className={fechasClass}/>
						{erroresFechas}
					</Row>
					<Row className='center-align'>
						<Button className='blue darken-3' type='submit'
							name='action' disabled={buttonDisabled}
							onClick={() => {this.handleSubmit();}}>
							RUN QUERY 
		   				</Button>
					</Row>
				</div>
			</Card>
		)
	}
}
