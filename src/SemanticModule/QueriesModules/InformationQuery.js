// InformationQuery.js
// --------------------------------------------------------------
// Consultas de información general.
// --------------------------------------------------------------

import React from 'react';
import '../../index.css';
import {Button, Icon, Row, Col, Card, Input, Collapsible, CollapsibleItem} from 'react-materialize'
// import M from 'materialize-css';
import Slider, { Range } from 'rc-slider';
import 'rc-slider/assets/index.css';
// import $ from 'jquery';

var _ = require('lodash');

export class InformationQueryForm extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			fechaInicio: '',
			fechaFin: '',
			horaInicio: {hor:null, min:null, seg:null},
			horaFin: {hor:null, min:null, seg:null},
			selectAggregates: {'avg':false, 'min':false, 'max':false},
			groupBy: 'day',
			filterValues: [],
			values: {},
			formArrowUp: [false, false, false, false],
			errores: {
				fechasMal:false,
				faltaFecha: false,
				horasMal:false,
				faltaHora:false,
			},
			openedTabs: [false, false, false, false],
		};
	}

	componentDidMount(){
		//$('.collapsible').collapsible();
	}

	addToTabs(id){
		let openedTabs = this.state.openedTabs.slice();
		openedTabs.push(id);
		this.setState({
			openedTabs: openedTabs,
		});
	}

	removeFromTabs(id){
		let openedTabs = this.state.openedTabs.slice();
		const posId = openedTabs.indexOf(id);
		openedTabs.splice(posId, 1);
		this.setState({
			openedTabs: openedTabs,
		});
	}

	handleOpenForm(index){
		let formArrowUp = this.state.formArrowUp;
		let openedTabs = this.state.openedTabs;
		formArrowUp[index] = !this.state.formArrowUp[index];
		openedTabs[index] = !this.state.openedTabs[index];
		this.setState({
			formArrowUp: formArrowUp,
			openedTabs: openedTabs,
		});
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
				var dateInicio = new Date(value);
				var dateFin = new Date(fechaFin);
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
				var dateInicio = new Date(fechaInicio);
				var dateFin = new Date(value);
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

	handleTimeChange(event,  timeName, timeType){
		let value = event.target.value;
		let newValue = value;

		if (value.length === 1){
			newValue = '0' + value;
			event.target.value = newValue;
		}
		else if (value.length === 3){
			newValue = value.substr(1);
			event.target.value = newValue;
		}
		let time = this.state[timeName];
		time[timeType] = newValue;

		this.setState({
			[timeName]: time,
		});

		this.checkTimes();
	}

	checkTimes(){
		const horaInicio = this.state.horaInicio;
		const horaFin = this.state.horaFin;
		var errores = this.state.errores;

		var faltaHora = false, horasMal = false;

		if (_.includes(horaInicio, null) || _.includes(horaFin, null)){
			faltaHora = true;
		}
		else{
			var dateInicio = new Date('2000-01-01T' + horaInicio['hor'] + ':' + horaInicio['min'] + ':' + horaInicio['seg']);
			var dateFin = new Date('2000-01-01T' + horaFin['hor'] + ':' + horaFin['min'] + ':' + horaFin['seg']);
			if (dateInicio.getTime() > dateFin.getTime()){
				horasMal = true;
			}
		}
		errores['horasMal'] = horasMal;
		errores['faltaHora'] = faltaHora;
		this.setState({
			errores: errores,
		});
	}

	handleSwitch(event, sensorId){
		let checked = event.target.checked;
		let values = this.state.values;
		if (values[sensorId])
			values[sensorId][0] = checked;
		else
			values[sensorId] = [checked];

		this.setState({
			values: values,
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
	}

	handleAggregates(event){
		let selectAggregates = this.state.selectAggregates;
		let groupBy = this.state.groupBy;
		const checked = event.target.checked;
		const value = event.target.value;

		if (checked && groupBy === ''){
			groupBy = 'all';
		}

		selectAggregates[value] = !selectAggregates[value];
		this.setState({
			selectAggregates: selectAggregates,
			groupBy: groupBy,
		});
	}

	handleGroupBy(event){
		const value = event.target.value;
		this.setState({
			groupBy: value,
		});
	}

	handleSubmit(){
		const sensors = this.props.selectedSensors;
		let groupBy = {'groupBy':false, 'groupByDate':false, 'groupByHour':false, 'groupByAll': false, 'avg':false, 'min':false, 'max':false};
		let filter = {'filter':false, 'filterDate':false, 'startDate':'', 'endDate':'', 'filterTime':false, 'startTime':'', 'endTime':''};
		let filterValues = {'filter': false, 'values': {}};

		const fechaInicio = this.state.fechaInicio;
		const fechaFin = this.state.fechaFin;
		const horaInicio = this.state.horaInicio;
		const horaFin = this.state.horaFin;
		const values = this.state.values;
		const stateFilterValues = this.state.filterValues;
		const selectAggregates = this.state.selectAggregates;
		const groupByState = this.state.groupBy;

		if (fechaInicio !== ''){
			filter['filter'] = true;
			filter['filterDate'] = true;
			filter['startDate'] = fechaInicio;
			filter['endDate'] = fechaFin;
		}

		let filterTime = true;
		_.forEach(horaInicio, (value, key) => {
			if (value === null){
				filterTime = false;
			}
		});

		if (filterTime){
			filter['filter'] = true;
			filter['filterTime'] = true;
			filter['startTime'] = horaInicio['hor'] + ':' + horaInicio['min'] + ':' + horaInicio['seg'];
			filter['endTime'] = horaFin['hor'] + ':' + horaFin['min'] + ':' + horaFin['seg'];
		}

		if (stateFilterValues.length > 0){
			filterValues['filter'] = true;
			stateFilterValues.forEach((sensorId) => {
				filterValues['values'][sensorId] = values[sensorId];
			});
		}

		if (_.includes(selectAggregates, true)){
			groupBy['groupBy'] = true;
			groupBy['avg'] = selectAggregates['avg'];
			groupBy['min'] = selectAggregates['min'];
			groupBy['max'] = selectAggregates['max'];
			if (groupByState === 'day'){
				groupBy['groupByDate'] = true;
			}
			else if (groupByState === 'hour'){
				groupBy['groupByHour'] = true;
			}
			else{
				groupBy['groupByAll'] = true;
			}
		}

		//console.log(filter);

		this.props.getInformationQuery(sensors, groupBy, filter, filterValues);
	}

	render(){
		const groupBy = this.state.groupBy;
		const selectedSensors = this.props.selectedSensors;
		const filterValues = this.state.filterValues;
		const values = this.state.values;
		const formArrowUp = this.state.formArrowUp;
		const errores = this.state.errores;
		const openedTabs = this.state.openedTabs;

		const Slider = require('rc-slider');
		const createSliderWithTooltip = Slider.createSliderWithTooltip;
		const Range = createSliderWithTooltip(Slider.Range);

		let groupByDisabled = (groupBy === '')
			? (true)
			: (false);

		const filtrarValores = selectedSensors.map((sensorId) => {
			const sensor = _.find(this.props.infoSensores, ['indicatorId', sensorId]);
			//console.log("SENSOR: ",sensor);
			const sensorName = sensor['name'];
			const labelCheckbox = sensorName + " (" + sensorId + ") : ";
			const minValue = sensor["minValue"];
			const maxValue = sensor["maxValue"];
			const disabled = (filterValues.indexOf(sensorId) === -1)
				? (true)
				: (false);

			const defaultRange = (!values[sensorId])
				? ([minValue, maxValue])
				: ([values[sensorId][0], values[sensorId][1]]);

				
				//idoia:borrar
				const step=0.1;
				//fin idoia
				
				//idoia: en valuePicker quitar step e included
			const valuePicker = (sensor['valueType'] === 'double')
				? (<Row><Col l={2}>{minValue.toFixed(1)}</Col><Col l={8}><Range
						min={minValue} max={maxValue}
						defaultValue={defaultRange}
						step={step}														
						disabled={disabled}
						onAfterChange={(e) => {this.handleRange(e,sensorId);}}
					/></Col><Col l={2}>{maxValue.toFixed(1)}</Col></Row>)
				: (<div className="switch">
						<label>
							Off
							<input type="checkbox" disabled={disabled}
								onChange={(r) => {this.handleSwitch(r,sensorId);}}
							/>
							<span className="lever"></span>
							On
						</label>
					</div>);
			return(
				<Row key={sensorId} s={12}>
					<Col s={12}>
						<Input name='filterValue' type='checkbox' className='filled-in'
							label={labelCheckbox}
							onChange={(e) => {this.handleFilterValueChecked(e,sensorId,minValue,maxValue);}}
						/>
					</Col>
					<Col s={10} offset="s1">
						{valuePicker}
					</Col>
				</Row>
			);
		});

		const formIcons = formArrowUp.map((value) => {
			if (value){
				return "keyboard_arrow_up";
			}
			else{
				return "keyboard_arrow_down";
			}
		});

		const formTitleColors = formArrowUp.map((value) => {
			if (!value){
				return "black-text";
			}
			else{
				return "blue-text text-darken-3";
			}
		});

		const formIconColors = formArrowUp.map((value) => {
			if (!value){
				return "material-icons black-text";
			}
			else{
				return "material-icons blue-text text-darken-3";
			}
		});

		let erroresFechas = null;
		let erroresHoras = null;
		let buttonDisabled = false;
		let fechasClass = '';
		let horasClass = '';

		if (openedTabs[0] && errores['faltaFecha']){
			erroresFechas = (<p className='red-text'> You must indicate a date.</p>);
			buttonDisabled = true;
			fechasClass = 'error';
		}
		else if (openedTabs[0] && errores['fechasMal']){
			erroresFechas = (<p className='red-text'> The start date cannot be greater than the end date. </p>);
			buttonDisabled = true;
			fechasClass = 'error';
		}

		if (openedTabs[1] && errores['faltaHora']){
			erroresHoras = (<p className='red-text'> The hours have not been correctly indicated. </p>);
			buttonDisabled = true;
			horasClass = 'error';
		}
		else if (openedTabs[1] && errores['horasMal']){
			erroresHoras = (<p className='red-text'> The start time cannot be greater than the end time. </p>);
			buttonDisabled = true;
			horasClass = 'error';
		}

		return(
			<Card>

				<Row>
					<p className="black-text">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Obtain a graph with the values of the selected sensors.</p>
				</Row>

				<Collapsible accordion className="white">
				<CollapsibleItem header='Filter results by date' onClick={() => {this.handleOpenForm(0)}} icon={formIcons[0]}>
					<span className="center">
					<Row>
						<Col s={12} l={6}>
							<Input type='date' label="From..." options={{format: 'yyyy-mm-dd'}}
								onChange={(e, value) => {this.handleFechaInicio(e, value);}}
								className={fechasClass}/>
						</Col>
						<Col s={12} l={6}>
							<Input type='date' label="To..." options={{format: 'yyyy-mm-dd'}}
								onChange={(e, value) => {this.handleFechaFin(e, value);}}
								className={fechasClass}/>
						</Col>
						{erroresFechas}
					</Row>
				</span>
				</CollapsibleItem>

				<CollapsibleItem header='Filter results by hour' onClick={() => {this.handleOpenForm(1)}} icon={formIcons[1]}>
					<span className="center">
						<Row className='grey-text center'>
							<Col s={12} l={6}>
								<p> From... (HH:mm:ss) </p>
								<input id="number" type="number" min="0" max="23"
									onChange={(e) => {this.handleTimeChange(e, 'horaInicio', 'hor');}}
									className={horasClass}/>
								:
								<input id="number" type="number" min="0" max="59"
									onChange={(e) => {this.handleTimeChange(e, 'horaInicio', 'min');}}
									className={horasClass}/>
								:
								<input id="number" type="number" min="0" max="59"
									onChange={(e) => {this.handleTimeChange(e, 'horaInicio', 'seg');}}
									className={horasClass}/>
							</Col>
							<Col s={12} l={6}>
								<p> To... (HH:mm:ss) </p>
								<input id="number" type="number" min="0" max="23"
									onChange={(e) => {this.handleTimeChange(e, 'horaFin', 'hor');}}
									className={horasClass}/>
								:
								<input id="number" type="number" min="0" max="59"
									onChange={(e) => {this.handleTimeChange(e, 'horaFin', 'min');}}
									className={horasClass}/>
								:
								<input id="number" type="number" min="0" max="59"
									onChange={(e) => {this.handleTimeChange(e, 'horaFin', 'seg');}}
									className={horasClass}/>
							</Col>
							{erroresHoras}
						</Row>
					</span>
				</CollapsibleItem>

				<CollapsibleItem header='Filter results by value' onClick={() => {this.handleOpenForm(2)}} icon={formIcons[2]}>
					<span className="center">
						{filtrarValores}
					</span>
				</CollapsibleItem>

				<CollapsibleItem header='Group results' onClick={() => {this.handleOpenForm(3)}} icon={formIcons[3]}>
					<span className="center">
						<Row>
							<Col s={12}>
								<Input name='groupBy' type='checkbox' className='filled-in'
									value='avg' label='Average value'
									onChange={(e) => {this.handleAggregates(e);}}
								/>
							</Col>
							<Col s={12}>
								<Input name='groupBy' type='checkbox' className='filled-in'
									value='max' label='Maximum value'
									onChange={(e) => {this.handleAggregates(e);}}
								/>
							</Col>
							<Col s={12}>
								<Input name='groupBy' type='checkbox' className='filled-in'
									value='min' label='Minimum value'
									onChange={(e) => {this.handleAggregates(e);}}
								/>
							</Col>
							<Col s={12}>
								<Input s={12} type='select' defaultValue='day' onChange={(e) => {this.handleGroupBy(e);}} disabled={groupByDisabled}>
									<option value='day'>Each day</option>
									<option value='hour'>Each hour</option>
								</Input>
							</Col>
						</Row>
					</span>
				</CollapsibleItem>

				</Collapsible>

				<Row className='center-align form-collap'>
					<Button className='blue darken-3 topMargin' type='submit'
						name='action' onClick={() => {this.handleSubmit();}}
						disabled={buttonDisabled}>
						RUN QUERY 
						</Button>
				</Row>
			</Card>
			
		)
	}
}

/*
<ul className="collapsible" data-collapsible="expandable">
	<li>
		<div className="collapsible-header no-pointer grey-text">
			<div className="form-collap">
				Obtener una gráfica sobre los valores que toman los sensores selecionados.
			</div>
		</div>
	</li>
	<li>
		<div className="collapsible-header" onClick={() => {this.handleOpenForm(0);}}>
			<i className={formIconColors[0]}>{formIcons[0]}</i>
			<div className={formTitleColors[0]}>
				 Filtrar resultados por fechas
			</div>
		 </div>
		 <div className="collapsible-body">
			 <span className="center">
				<Row>
					<Col s={12} l={6}>
						<Input type='date' label="From..." options={{format: 'yyyy-mm-dd'}}
							onChange={(e, value) => {this.handleFechaInicio(e, value);}}
							className={fechasClass}/>
					</Col>
					<Col s={12} l={6}>
						<Input type='date' label="To..." options={{format: 'yyyy-mm-dd'}}
							onChange={(e, value) => {this.handleFechaFin(e, value);}}
							className={fechasClass}/>
					</Col>
					{erroresFechas}
				</Row>
			</span>
		</div>
	</li>
	<li>
		<div className="collapsible-header" onClick={() => {this.handleOpenForm(1);}}>
			<i className={formIconColors[1]}>{formIcons[1]}</i>
			<div className={formTitleColors[1]}>
				 Filter results by hour
			</div>
		</div>
		<div className="collapsible-body">
			<span className="center">
				<Row className='grey-text center'>
					<Col s={12} l={6}>
						<p> From... (HH:mm:ss) </p>
						<input id="number" type="number" min="0" max="23"
							onChange={(e) => {this.handleTimeChange(e, 'horaInicio', 'hor');}}
							className={horasClass}/>
						:
						<input id="number" type="number" min="0" max="59"
							onChange={(e) => {this.handleTimeChange(e, 'horaInicio', 'min');}}
							className={horasClass}/>
						:
						<input id="number" type="number" min="0" max="59"
							onChange={(e) => {this.handleTimeChange(e, 'horaInicio', 'seg');}}
							className={horasClass}/>
					</Col>
					<Col s={12} l={6}>
						<p> To... (HH:mm:ss) </p>
						<input id="number" type="number" min="0" max="23"
							onChange={(e) => {this.handleTimeChange(e, 'horaFin', 'hor');}}
							className={horasClass}/>
						:
						<input id="number" type="number" min="0" max="59"
							onChange={(e) => {this.handleTimeChange(e, 'horaFin', 'min');}}
							className={horasClass}/>
						:
						<input id="number" type="number" min="0" max="59"
							onChange={(e) => {this.handleTimeChange(e, 'horaFin', 'seg');}}
							className={horasClass}/>
					</Col>
					{erroresHoras}
				</Row>
			</span>
		</div>
	</li>
	<li>
		<div className="collapsible-header" onClick={() => {this.handleOpenForm(2);}}>
			<i className={formIconColors[2]}>{formIcons[2]}</i>
			<div className={formTitleColors[2]}>
				 Filter results by value
			</div>
		</div>
		<div className="collapsible-body">
			<span className="center">
				{filtrarValores}
			</span>
		</div>
	</li>
	<li>
		<div className="collapsible-header" onClick={() => {this.handleOpenForm(3);}}>
			<i className={formIconColors[3]}>{formIcons[3]}</i>
			<div className={formTitleColors[3]}>
				 Group results
			</div>
		</div>
		<div className="collapsible-body">
			<span className="center">
				<Row>
					<Col s={12}>
						<Input name='groupBy' type='checkbox' className='filled-in'
							value='avg' label='Valor medio (Media aritmética)'
							onChange={(e) => {this.handleAggregates(e);}}
						/>
					</Col>
					<Col s={12}>
						<Input name='groupBy' type='checkbox' className='filled-in'
							value='max' label='Valor máximo'
							onChange={(e) => {this.handleAggregates(e);}}
						/>
					</Col>
					<Col s={12}>
						<Input name='groupBy' type='checkbox' className='filled-in'
							value='min' label='Valor mínimo'
							onChange={(e) => {this.handleAggregates(e);}}
						/>
					</Col>
					<Col s={12}>
						<Input s={12} type='select' defaultValue='day' onChange={(e) => {this.handleGroupBy(e);}} disabled={groupByDisabled}>
							<option value='day'>Each day</option>
							<option value='hour'>Each hour</option>
						</Input>
					</Col>
				</Row>
			</span>
		</div>
	</li>
	<li id='consultar'>
		<div className="collapsible-header no-pointer blue-text text-darken-3">
			<Row className='center-align form-collap'>
				<Button className='blue darken-3 topMargin' type='submit'
					name='action' onClick={() => {this.handleSubmit();}}
					disabled={buttonDisabled}>
					Consult <Icon right>bar_chart</Icon>
					</Button>
			 </Row>
		</div>
	</li>
</ul>
*/
