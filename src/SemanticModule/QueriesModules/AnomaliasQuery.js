// InformationQuery.js
// --------------------------------------------------------------
// Consultas de búsqueda de anomalías en los valores de sensores.
// CONTIENE CAMBIOS NECESARIOS PARA LA UNIÓN CON I4TSPS.
// --------------------------------------------------------------

import React from 'react';
import '../../index.css';
import {Button, Icon, Row, Col, Card, Input} from 'react-materialize'
import 'rc-slider/assets/index.css';

var _ = require('lodash');

const parMotorId = '79PWN7';

export class AnomaliasQueryForm extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			selectedSensors: this.props.selectedSensors,
            sensorDir: {},
			calParMotor: false,
			relType: 'predef',
			fechaInicio: '',
			fechaFin: '',
			errores: {
				fechasMal:false,
				faltaFecha: false,
			},
			paresValores: this.props.infoMaquina['anomalies'],
			relSelected: -1,
		};
	}

    static getDerivedStateFromProps(props, state){
		if (!_.isEqual(props.selectedSensors, state.selectedSensors)){
			const relType = state.relType;
			if (relType === 'custom'){
				const sensorDir = state.sensorDir;
				let newSensorDir = {};
				let relType = state.relType;
		        props.selectedSensors.forEach((sensorId) => {
		            if (!sensorDir[sensorId]){
						const sensor = _.find(props.infoSensores, ['indicatorId', sensorId]);
						if (sensor['valueType'] === 'double')
							newSensorDir[sensorId] = 'up';
						else
							newSensorDir[sensorId] = 'off';
		            }
					else{
						newSensorDir[sensorId] = sensorDir[sensorId];
					}
		        });
				if (props.selectedSensors.length <2)
					relType = 'predef';
		        return {
		            sensorDir: newSensorDir,
					selectedSensors: props.selectedSensors,
					relType: relType,
		        };
			}
			else{
				return {
					selectedSensors: props.selectedSensors
				};
			}
		}
		else{
			return null;
		}
    }

	resetValues(){
		let sensorDir = {};
		this.state.selectedSensors.forEach((sensorId) => {
			const sensor = _.find(this.props.infoSensores, ['indicatorId', sensorId]);
			if (sensor['valueType'] === 'double')
				sensorDir[sensorId] = 'up';
			else
				sensorDir[sensorId] = 'off';
        });
        this.setState({
            sensorDir: sensorDir,
			calParMotor: false,
			relSelected: -1,
        });
	}

	handleParMotorChecked(event){
		const checked = event.target.checked;
		this.setState({
			calParMotor: checked,
		});
		//console.log(checked);
	}

    handleClick(sensorId){
	      let sensorDir = this.state.sensorDir;
          if (sensorDir[sensorId] === 'up'){
              sensorDir[sensorId] = 'down';
          }
          else{
              sensorDir[sensorId] = 'up';
          }
          this.setState({
             sensorDir: sensorDir,
          });

		  //console.log(sensorDir);
	}

	handleSwitch(event, sensorId){
		let sensorDir = this.state.sensorDir;
		if (sensorDir[sensorId] === 'off'){
			sensorDir[sensorId] = 'on';
		}
		else{
			sensorDir[sensorId] = 'off';
		}
		this.setState({
		   sensorDir: sensorDir,
		});

		//console.log(sensorDir);
	}

	handleRadioChange(event, i){
		const paresValores = this.state.paresValores;
		const selectedRel = paresValores[i];
		let sensorDir = {};
		let calParMotor = false;
		_.forEach(selectedRel, (value, key) => {
			if (key === 'ParMotor'){
				sensorDir[parMotorId] = value;
				calParMotor = true;
			}
			else{
				sensorDir[key] = value;
			}
		});

		this.setState({
			sensorDir: sensorDir,
			relSelected: i,
			calParMotor: calParMotor,
		});

		//console.log(sensorDir);
		//console.log(calParMotor);
	}

	handleSelectChange(event){
		const value = event.target.value;
		if (value === 'custom'){
			this.resetValues();
		}
		this.setState({
			relType: value,
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
		const sensorDir = this.state.sensorDir;
		const calParMotor = this.state.calParMotor;
		const fechaInicio = this.state.fechaInicio;
		const fechaFin = this.state.fechaFin;

		let filter = {'filter':false, 'filterDate':false, 'startDate':'', 'endDate':'', 'filterTime':false, 'startTime':'', 'endTime':''};

		if (fechaInicio !== ''){
			filter['filter'] = true;
			filter['filterDate'] = true;
			filter['startDate'] = fechaInicio;
			filter['endDate'] = fechaFin;
		}

		this.props.getAnomaliasQuery(sensorDir, {'parMotorId':parMotorId, 'calParMotor': calParMotor}, filter);
	}

	addSelectedAnomalie(){
		const sensorDir = this.state.sensorDir;
		let newParesValores = this.state.paresValores;

		newParesValores.push(sensorDir);

		// ------------------- CAMBIAR PARA LA UNIÓN CON I4TSPS -------------------

		// --- Comentar esto:
		this.setState({
			paresValores: newParesValores,
		})
		// --- Añadir en su lugar el guardado en Firebase de las nuevas anomalías.

		// ------------------------------------------------------------------------
	}

	removeSelectedAnomalie(){
		const sensorDir = this.state.sensorDir;
		let paresValores = this.state.paresValores;
		const calParMotor = this.state.calParMotor;

		let newSensorDir = {};
		if (calParMotor && sensorDir[parMotorId]){
			_.forEach(sensorDir, (value, key) =>{
				if (key !== parMotorId){
					newSensorDir[key] = value;
				}
				else{
					newSensorDir['ParMotor'] = value;
				}
			});
		}
		else{
			newSensorDir = sensorDir;
		}

		let newParesValores = _.reject(paresValores, newSensorDir);

		// ------------------- CAMBIAR PARA LA UNIÓN CON I4TSPS -------------------

		// --- Comentar esto:
		this.setState({
			paresValores: newParesValores,
		})
		// --- Añadir en su lugar el guardado en Firebase de las nuevas anomalías.

		// ------------------------------------------------------------------------
	}

	render(){
        const sensorDir = this.state.sensorDir;
        const selectedSensors = this.props.selectedSensors;
		const relType = this.state.relType;
		const errores = this.state.errores;
		const paresValores = this.state.paresValores;
		const relSelected = this.state.relSelected;

		const select = (selectedSensors.length > 1)
			? (<Input s={12} l={6} type='select' defaultValue='predef' onChange={(e) => {this.handleSelectChange(e);}}>
					<option value='predef'>Predefined relation</option>
					<option value='custom'>Customized relation</option>
				</Input>)
			: (null);

        const sensores = selectedSensors.map((sensorId, i) => {
            const sensor = _.find(this.props.infoSensores, ['indicatorId', sensorId]);
			const sensorName = sensor.name;
            const arrowIcon = (sensorDir[sensorId] === 'up')
                ? (<Icon className='green-text text-darken-3'> arrow_upward </Icon>)
                : (<Icon className='red-text text-darken-3'> arrow_downward </Icon>);
			const parMotor = (sensorId === parMotorId) &&
				(<Col>
						<Input name='filterValue' type='checkbox' className='filled-in'
							label="Calcular Par Motor"
							onChange={(e) => {this.handleParMotorChecked(e);}}
						/>
					</Col>);

			const valueType = (sensor['valueType'] === 'double')
				? (<Button floating className='white'
						onClick={() => this.handleClick(sensorId)}>
						{arrowIcon}
					</Button>)
				: (<div className="switch">
						<label>
							Off
							<input type="checkbox"
								onChange={(e) => {this.handleSwitch(e,sensorId);}}
							/>
							<span className="lever"></span>
							On
						</label>
					</div>);
            return(
                <Row key={this.props.selectedSensors[i]} className="valign-wrapper">
                    <Col>
                        <p> <span className="bold"> {sensorName} </span> ({sensorId}): </p>
                    </Col>
                    <Col>
                        {valueType}
                    </Col>
					{parMotor}
                </Row>
            );
        });

		const predefRel = paresValores.map((object, iRel) => {
			let sensorIds = [];
			let sensorIdDirs = [];
			_.forEach(object, (value, key) => {
				sensorIds.push(key);
				sensorIdDirs.push(value);
			});
			const sensorRels = sensorIdDirs.map((value, iPar) => {
				const arrowDir = (value === 'up') ? "arrow_upward" : "arrow_downward";
				const color = (value === 'up') ? "my-green" : "my-red";
				const icon = (<Icon className={color}>{arrowDir}</Icon>);
				const sensorId = sensorIds[iPar];
				let sensorName;
				if (sensorId === 'ParMotor'){
					sensorName = "Torque";
				}
				else{
					const sensor = _.find(this.props.infoSensores, ['indicatorId', sensorId]);
					sensorName = sensor.name + ' (' + sensorId + ')';
				}
				const key = "keyRel" + iRel + "par" + iPar;
				const className = "valign-wrapper " + color;
				return(
					(<p key={key} className="valign-wrapper "> {sensorName} {icon}</p>)
				);
			});
			const id = "sensorRel" + iRel;
			const buttonDisabled = (iRel === relSelected)
				? (false)
				: (true);
			const textClass = (iRel === relSelected)
				? ("grey-text text-darken-3 margin-left")
				: ("grey-text margin-left");
			return(
				<Row key={id}>
					<Col s={6} m={12} l={6} className="margin-bottom">
						<input name="predefRel" className="with-gap" type="radio" id={id} onChange={(e) => {this.handleRadioChange(e,iRel);}}/>
						<label htmlFor={id} className="valign-wrapper">
							{sensorRels}
						</label>
					</Col>
					<Col s={6} m={12} l={6}>
						<Button floating className="grey darken-2" disabled={buttonDisabled}
							onClick={() => {this.removeSelectedAnomalie();}}>
							<Icon>remove</Icon>
						</Button>
						<span className={textClass}>
							Delete
						</span>
					</Col>
				</Row>
			);
		});

		const addAnomalieToPredef = (_.find(paresValores, sensorDir) !== undefined)
			? (<div className="col s12">
					<Button floating disabled>
						<Icon>done</Icon>
					</Button>
					<span className='grey-text italic margin-left'>
						Predefined anomaly.
					</span>
				</div>)
			: (<div className="col s12">
					<Button floating className='green darken-3'
						onClick={() => {this.addSelectedAnomalie();}}>
						<Icon>add</Icon>
					</Button>
					<span className='green-text text-darken-3 margin-left'>
						Add predefined anomaly.
					</span>
				</div>);

		const selectedRelType = (relType === 'custom')
			? (<div>
					<Row>
						<p className='grey-text'>
							Indicate the expected tendency that must hold in normal circumstances for the selected sensors.
						</p>
					</Row>
					{sensores}
					<div className="row">
						{addAnomalieToPredef}
					</div>
				</div>)
			: (<div>
					<Row>
						<Col s={12}>
							<p className='black-text'>
								Choose one of the predefined relations, which represent the expected tendency that must hold in normal circumstances for the selected sensors.
							</p>
						</Col>
					</Row>
					<Row>
						{predefRel}
					</Row>
				</div>);

		let buttonDisabled = false;
		let erroresFechas = null;
		let fechasClass = '';

		if (_.size(sensorDir) < 1){
			buttonDisabled = true;
		}

		if (errores['faltaFecha']){
			erroresFechas = (<p className='red-text'> You must select a date.</p>);
			buttonDisabled = true;
			fechasClass = 'error';
		}
		else if (errores['fechasMal']){
			erroresFechas = (<p className='red-text'> The start date cannot be greather than the end date. </p>);
			buttonDisabled = true;
			fechasClass = 'error';
		}

		return(
			<Card>
				<div className='form'>
					<Row>
						{select}
					</Row>
					<Row s={12}>
					 	<p className='blue-text text-darken-3'>
							Relation that must hold between the sensors:
						</p>
					 </Row>
					{selectedRelType}
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
						<Button className='blue darken-3' type='submit' name='action' disabled={buttonDisabled}
							onClick={() => {this.handleSubmit();}}>
							RUN QUERY 
		   				</Button>
					</Row>
				</div>
			</Card>
		)
	}
}
