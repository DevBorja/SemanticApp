// QueriesPage.js
// --------------------------------------------------------------
// Página principal de consulta de la máquina seleccionada.
// Interfaz que une el mapa de sensores, con los formularios y
// con los resultados.
// --------------------------------------------------------------

import React from 'react';
import '../../index.css';
import * as Queries from '../Functions/SPARQLQueries.js';
import {Button, Row, Col, Card, Icon} from 'react-materialize'
// import M from 'materialize-css';
import axios from 'axios';
//import {GoogleChart} from './GoogleChart.js'
import {PruebaTabsMat} from './SelectQueryTabs.js'
import * as DataFunctions from '../Functions/DataFunctions.js'
import { PlotlyChart } from './PlotlyChart';

// ----------- CAMBIAR EN LA UNIÓN CON I4TSPS ---------
const imgPath = './img/';
// ----------------------------------------------------

const _ = require('lodash');
const querystring = require('querystring');

const lineChartName = 'Line';
const barChartName = 'Bar';
const scatterChartName = 'Scatter';

const orderBy = {'orderBy':true, 'order':'asc', 'orderField':'dateTime'};

const sensorIconNames = ['tempIcon', 'resistIcon', 'ventIcon', 'rpmIcon', 'consumoIcon', 'presionIcon', 'tempFundidoIcon'];
const sensorIconTooltips = {
	'tempIcon':'Temperatura',
	'resistIcon':'Resistencia',
	'ventIcon':'Ventilación',
	'rpmIcon':'R.P.M. husillo',
	'consumoIcon':'Consumo del motor',
	'presionIcon':'Presión',
	'tempFundidoIcon':'Temperatura de fundido'
};

export class SensorsInfo extends React.Component {
	constructor(props){
		super(props);
		this.state = {
			selectedSensors: [],
			showQueries: true,
			moreThanOneSensor: false,
			loadingQuery: false,
			showChart: false,
			noDataCharts: [],
			allChartData: null,
			chartType: "ColumnChart",
			longDateFormat: true,
			queryType: '',
			queryInfor: {}
		};
	}

	toggleSelectedSensor(sensor){
		const selectedSensors = this.state.selectedSensors.slice();
		const sensorIndex = selectedSensors.indexOf(sensor);
		const showQueries = this.state.showQueries;
		const moreThanOneSensor = this.state.moreThanOneSensor;
		const loadingQuery = this.state.loadingQuery;
		const showChart = this.state.showChart;

		if (sensorIndex < 0)
			selectedSensors.push(sensor);
		else
			selectedSensors.splice(sensorIndex, 1);

		this.setState({
			selectedSensors: selectedSensors,
		});

		if (!showQueries && !loadingQuery && !showChart){
			this.setState({
				showQueries: true,
			});
		}

		if (selectedSensors.length > 1 && !moreThanOneSensor){
			this.setState({
				moreThanOneSensor: true,
			});
		}
		else if (selectedSensors.length <= 1){
			this.setState({
				moreThanOneSensor: false,
			});
		}

	}

	renderSensorMap(){
		const sensors = this.props.infoSensores;
		const sensorIcons = sensorIconNames.slice();
		const selectedSensors = this.state.selectedSensors;
		const loadingQuery = this.state.loadingQuery;
		const showChart = this.state.showChart;

		const sensorDivs = sensors.map((value) => {
			const sensorId = value.indicatorId;
			const typeClass = value.sensorType;
			const zoneClass = (isNaN(value.zone)) ? ("") : ("zone" + value.zone);
			const sensorIndex = selectedSensors.indexOf(sensorId);
			let classes;
			if (sensorIndex < 0)
				classes = 'sensorDiv z-depth-1 ' + typeClass + ' ' + zoneClass;
			else
				classes = 'sensorDivSelected z-depth-1 ' + typeClass + ' ' + zoneClass;

			return(
				<div key={sensorId} className={classes}
					onClick={() => this.toggleSelectedSensor(sensorId)}>
				</div>
			);
		});

		const iconDivs = sensorIcons.map((iconName) => {
			const classes = 'iconDiv tooltipped ' + iconName;
			const tooltipName = sensorIconTooltips[iconName];
			return(
				<div key={classes} className={classes} data-position="top"
					data-delay="10" data-tooltip={tooltipName}
				>
					<img alt={iconName} src={`${imgPath}${iconName}.png`}/>
				</div>
			);
		});

		const selectedSensorsNames = selectedSensors.map((sensorId) => {
			const sensor = _.find(this.props.infoSensores, ['indicatorId', sensorId]);
			const sensorName = sensor.name;
			return(
				<li key={sensorId}><span className="bold">{sensorName}</span> ({sensorId})</li>
			);
		});


		const cardContent = (!loadingQuery && !showChart)
			? (<div>
				<p> Sensores seleccionados: </p>
					<div className='margin-left margin-top'>
						{selectedSensorsNames}
					</div>
				</div>)
			: (<p className='center'>
					Pregunta realizada...
				</p>);

		const cardValue = (selectedSensors.length === 0)
			? (<p className='center'>
					Selecciona uno o varios sensores para realizar consultas personalizadas.
				</p>)
			: (cardContent);

		return(
			<Card header={
				<div className='mapContainer'>
					<img alt='Mapa de sensores'
						src={`${imgPath}extrusora_editada_grande_claro.png`}
					/>
					{iconDivs}
					{sensorDivs}
				</div>} >
				{cardValue}
			</Card>
		)
	}

	getInformationQuery(sensors, groupBy, filter, filterValues){
		console.log("Tiempo inicio " + new Date().toISOString());
		let infor = {'sensors': sensors, 'groupBy': groupBy, 'filter': filter, 'filterValues': filterValues};

		let chartType = lineChartName;
		let longDateFormat = true;

		[chartType,longDateFormat] = DataFunctions.getGraphRecommendation("info", groupBy['groupBy'], filterValues['filter']);
		// if (groupBy['groupBy']){
		// 	chartType = barChartName;
		// 	longDateFormat = false;
		// }
		// else if (filterValues['filter']) {
		// 	chartType = scatterChartName;
		// }

		this.setState({
			showQueries: false,
			loadingQuery: true,
			queryInfor: infor,
			queryType: 'infor',
			chartType: chartType,
			longDateFormat: longDateFormat,
		});

		let numberOfResponses = 0;
		let sensorValues = {};
		let sensorDatetimes = {};
		let formInfo = DataFunctions.getFormInfo({'groupBy': groupBy, 'type': 'infor'});
		let sensorsWithData = [];

		this.recursiveInforCall_New(sensors, groupBy, filter, filterValues, numberOfResponses, sensorValues, sensorDatetimes, formInfo['selectedValues'], formInfo['selectedDateTime'], sensorsWithData);
	}

	recursiveInforCall_New(selectedSensors, groupBy, filter, filterValues, nResponses, sensorValues, sensorDatetimes, selectedValues, selectedDateTime, sensorsWithData){
		let query = Queries.getInformationQueryIndividual(
						selectedSensors[nResponses],
						groupBy,
						filter,
						filterValues,
						orderBy,
						this.props.graphURI
					);
		console.log(query);
		axios.post(this.props.usedURL,
			querystring.stringify({'query': query})
		)
		.then((response) => {
			const sensorId = selectedSensors[nResponses];
			if (response.data["results"]["bindings"].length > 0){
				// Sustituir y tratar aquí los datos, ponerlos en el formato adecuado y reducirlos
				var result = DataFunctions.parseResponseData(
					response.data["results"]["bindings"],
					selectedValues,
					selectedDateTime,
					sensorId,
					{'sensors': selectedSensors, 'type': 'infor', 'parMotor':{}},
					this.props.infoSensores
				);
				sensorValues[sensorId] = result['values'];
				sensorDatetimes[sensorId] = result['datetimes'];
				sensorsWithData.push(sensorId);
 			}
			else{
				let noDataCharts = this.state.noDataCharts;
				noDataCharts.push(sensorId);
				this.setState({
					noDataCharts: noDataCharts,
				});
			}
			nResponses++;
			if (nResponses === selectedSensors.length){
				console.log("finalizado!, podemos continuar");
				let allChartData = [];
				if (_.size(sensorValues) > 0){
					// Preparar los datos de la gráfica de Google con los datos ya reducidos.
					allChartData = DataFunctions.prepareGoogleChartsData(
										sensorValues,
										sensorDatetimes,
										sensorsWithData,
										{type: 'infor', parMotor:{}, selectedValues: selectedValues},
										this.props.infoSensores
									);
				}
				this.setState({
					showChart: true,
					loadingQuery: false,
					allChartData: allChartData,
				});
				console.log("Tiempo fin " + new Date().toISOString());
			}
			else{
				this.recursiveInforCall_New(selectedSensors, groupBy, filter, filterValues, nResponses, sensorValues, sensorDatetimes, selectedValues, selectedDateTime, sensorsWithData);
			}
		})
		.catch((error) => {
			console.log(error);
			alert("An error occurred, check the console.log for more info.");
			this.newQuery();
		});
	}

	getOtherSensorQuery(knownSensors, askedSensors, filterValues, filter){
		console.log("Tiempo inicio " + new Date().toISOString());
		let infor =  {'sensors': askedSensors, 'knownSensors': knownSensors, 'filterValues': filterValues, 'filter': filter};

		let chartType = lineChartName;
		let longDateFormat = true;

		[chartType,longDateFormat] = DataFunctions.getGraphRecommendation("other", false, false);

		this.setState({
			showQueries: false,
			loadingQuery: true,
			queryInfor: infor,
			queryType: 'otro',
			chartType: chartType,
			longDateFormat: longDateFormat,
		});

		let numberOfResponses = 0;
		let sensorValues = {};
		let sensorDatetimes = {};
		let formInfo = DataFunctions.getFormInfo({'groupBy': {}, 'type': 'otro'});
		let sensorsWithData = [];

		this.recursiveOtroSensorCall_New(askedSensors, knownSensors, filterValues, filter, numberOfResponses, sensorValues, sensorDatetimes, formInfo['selectedValues'], formInfo['selectedDateTime'], sensorsWithData);
	}

	recursiveOtroSensorCall_New(askedSensors, knownSensors, filterValues, filter, nResponses, sensorValues, sensorDatetimes, selectedValues, selectedDateTime, sensorsWithData){
		let query = Queries.getOtherSensorQueryIndividual(
						knownSensors,
						askedSensors[nResponses],
						filterValues,
						filter,
						orderBy,
						this.props.graphURI
					);
		console.log(query);
		//console.log("Comi: ",Date.now());
		axios.post(this.props.usedURL,
			querystring.stringify({'query': query})
		)
		.then((response) => {
			const sensorId = askedSensors[nResponses];
			if (response.data["results"]["bindings"].length > 0){
				var result = DataFunctions.parseResponseData(
								response.data["results"]["bindings"],
								selectedValues,
								selectedDateTime,
								sensorId,
								{'sensors': askedSensors, 'type': 'otro', 'parMotor':{}},
								this.props.infoSensores
							);
				sensorValues[sensorId] = result['values'];
				sensorDatetimes[sensorId] = result['datetimes'];
				sensorsWithData.push(sensorId);
			}
			else{
				let noDataCharts = this.state.noDataCharts;
				noDataCharts.push(sensorId);
				this.setState({
					noDataCharts: noDataCharts,
				});
			}
			nResponses++;
			if (nResponses === askedSensors.length){
				console.log("finalizado!, podemos continuar");
				let allChartData = [];
				if (_.size(sensorValues) > 0){
					allChartData = DataFunctions.prepareGoogleChartsData(
										sensorValues,
										sensorDatetimes,
										sensorsWithData,
										{type: 'otro', parMotor:{}, selectedValues: selectedValues},
										this.props.infoSensores
									);
				}
				this.setState({
					showChart: true,
					allChartData: allChartData,
					loadingQuery: false
				});
				console.log("Tiempo fin " + new Date().toISOString());
			}
			else{
				this.recursiveOtroSensorCall_New(askedSensors, knownSensors, filterValues, filter, nResponses, sensorValues, sensorDatetimes, selectedValues, selectedDateTime, sensorsWithData);
			}
		})
		.catch((error) => {
			//console.log("Termi: ",Date.now());
			console.log(error);
			alert("An error occurred, check the console.log for more info.");
			this.newQuery();
		});
	}

	getAnomaliasQuery(sensorsDir, parMotor, filter){
		let selectedSensors = [];
		_.forEach(sensorsDir, (value, key) => {
			selectedSensors.push(key);
		});

		let infor = {'sensors': selectedSensors, 'sensorsDir':sensorsDir, 'parMotor':parMotor, 'filter':filter};

		let chartType = lineChartName;
		let longDateFormat = true;

		[chartType,longDateFormat] = DataFunctions.getGraphRecommendation("anom", false, false);

		this.setState({
			showQueries: false,
			loadingQuery: true,
			queryInfor: infor,
			queryType: 'anom',
			chartType: chartType,
			longDateFormat: longDateFormat,
		});

		let numberOfResponses = 0;
		let sensorValues = {};
		let sensorDatetimes = {};
		let formInfo = DataFunctions.getFormInfo({'groupBy': {}, 'type': 'anom'});
		let sensorsWithData = [];

		this.recursiveAnomCall_New(selectedSensors, sensorsDir, parMotor, filter, numberOfResponses, sensorValues, sensorDatetimes, formInfo['selectedValues'], formInfo['selectedDateTime'], sensorsWithData);
	}

	recursiveAnomCall_New(selectedSensors, sensorsDir, parMotor, filter, nResponses, sensorValues, sensorDatetimes, selectedValues, selectedDateTime, sensorsWithData){
		console.log(nResponses);
		var query = Queries.getInformationQueryIndividual(
						selectedSensors[nResponses],
						{},
						filter,
						{},
						orderBy,
						this.props.graphURI
					);
		axios.post(this.props.usedURL,
			querystring.stringify({'query': query})
		)
		.then((response) => {
			console.log(response);
			const sensorId = selectedSensors[nResponses];
			if (response.data["results"]["bindings"].length > 1){
				var result = DataFunctions.parseResponseData(
								response.data["results"]["bindings"],
								selectedValues,
								selectedDateTime,
								sensorId,
								{'sensors': selectedSensors, 'type': 'anom', 'parMotor':parMotor},
								this.props.infoSensores
							);
				sensorValues[sensorId] = result['values'];
				sensorDatetimes[sensorId] = result['datetimes'];
				sensorsWithData.push(sensorId);
			}
			else{
				let noDataCharts = this.state.noDataCharts;
				noDataCharts.push(sensorId);
				this.setState({
					noDataCharts: noDataCharts,
				});
			}
			nResponses++;
			if (nResponses === selectedSensors.length){
				console.log("finalizado!, podemos continuar");
				let allChartData = [];
				if (_.size(sensorValues) > 0){
					let anomResults = DataFunctions.getAnomaliasValues(
										sensorsWithData,
										sensorsDir,
										sensorValues,
										sensorDatetimes,
										parMotor,
										this.props.infoSensores
									);
					allChartData = DataFunctions.prepareGoogleChartsData(
										anomResults['anomValues'],
										anomResults['anomDatetimes'],
										selectedSensors,
										{type:'anom', parMotor:parMotor, selectedValues: selectedValues},
										this.props.infoSensores
									);
				}
				if (allChartData.length > 0){
					this.setState({
						showChart: true,
						allChartData: allChartData,
						loadingQuery: false
					});
				}
				else{
					console.log("No hay anomalías");
					this.setState({
						loadingQuery: false,
						// noData: true,
						showChart: true,
						noAnom: true
					});
				}
			}
			else{
				this.recursiveAnomCall_New(selectedSensors, sensorsDir, parMotor, filter, nResponses, sensorValues, sensorDatetimes, selectedValues, selectedDateTime, sensorsWithData);
			}
		})
		.catch((error) => {
			console.log(error);
			alert("An error occurred, check the console.log for more info.");
			this.newQuery();
		});
	}

	newQuery(){
		this.setState({
			showQueries: true,
			loadingQuery: false,
			showChart: false,
			noAnom: false,
			noDataCharts: [],
			queryType: '',
			queryInfor: {},
		});
	}

	makeQueryResume(){
		const type = this.state.queryType;
		const info = this.state.queryInfor;
		const showChart = this.state.showChart;

		const newQueryButton = (showChart)
			? (<Button className='blue darken-3' onClick={() => {this.newQuery();}}> Nueva pregunta </Button>)
			: (<img className='loading' alt='Cargando...' src={`${imgPath}loading_bars.gif`}/>);

		let tipoDePregunta;
		let resumenInfo;

		let sensores;

		if (type === 'infor'){
			let filtroFechas = '', filtroHoras = '', agrupVal = '';
			tipoDePregunta = 'Información sobre los sensores: ';
			sensores = info['sensors'].map((sensorId, i) => {
				const sensor = _.find(this.props.infoSensores, ['indicatorId', sensorId]);
				const sensorName = sensor.name;
				let filtroValores = '';
				if (info['filterValues']['filter']){ //Hay filtros de valores
					if (info['filterValues']['values'][sensorId]){
						var values = info['filterValues']['values'][sensorId];
						if (values.length > 1){
							filtroValores += ', filtrado entre los valores ' + values[0] + ' y ' + values[1] + '.';
						}
						else{
							filtroValores += ', filtrado para cuando su valor es ' + values[0] + '.';
						}
					}
				}
				return(
					<li key={sensorId}>
						<span className="bold">{sensorName}</span> ({sensorId}) {filtroValores}
					</li>
				);
			});
			if (info['filter']['filter']){ //Hay filtros de fechas y/o horas
				if(info['filter']['filterDate']){ //Hay filtro de fechas
					let dateInicio = new Date(info['filter']['startDate']);
					let dateFinal = new Date(info['filter']['endDate']);
					let options = {year: 'numeric', month: 'long', day: 'numeric' };
					let formDateInicio = dateInicio.toLocaleString('es-ES', options);
					let formDateFinal = dateFinal.toLocaleString('es-ES', options);
					filtroFechas = 'Entre el ' + formDateInicio + ' y el ' + formDateFinal + '. \n ';
				}
				if(info['filter']['filterTime']){ //Hay filtro de horas
					filtroHoras = 'Entre las ' + info['filter']['startTime'] + ' y las ' + info['filter']['endTime'] + '. \n ';
				}
			}
			if (info['groupBy']['groupBy']){ //Hay agrupaciones de datos
				agrupVal = 'Se mostrará el valor '
				if (info['groupBy']['avg']){ //Agrupados por día
					agrupVal += ' medio,';
				}
				if (info['groupBy']['min']){ //Agrupados por día
					agrupVal += ' mínimo,';
				}
				if (info['groupBy']['max']){ //Agrupados por día
					agrupVal += ' máximo,';
				}
				agrupVal += 'de los sensores '
				if (info['groupBy']['groupByDate']){ //Agrupados por día
					agrupVal += ' agrupado por días, mostrando un valor por día.';
				}
				else if (info['groupBy']['groupByHour']){ //Agrupados por día
					agrupVal += ' agrupado por horas, mostrando un valor por hora.';
				}
				else if (info['groupBy']['groupByAll']){ //Agrupados por día
					agrupVal += ' agrupado en un único valor por cada sensor.';
				}
			}
			resumenInfo = (<div>
								<p>{filtroFechas}</p>
								<p>{filtroHoras}</p>
								<p>{agrupVal}</p>
							</div>);
		}
		else if (type === 'otro'){
			tipoDePregunta = 'Valores de los sensores: ';
			let filtroFechas = '';
			if(info['filter']['filterDate']){ //Hay filtro de fechas
				let dateInicio = new Date(info['filter']['startDate']);
				let dateFinal = new Date(info['filter']['endDate']);
				let options = {year: 'numeric', month: 'long', day: 'numeric' };
				let formDateInicio = dateInicio.toLocaleString('es-ES', options);
				let formDateFinal = dateFinal.toLocaleString('es-ES', options);
				filtroFechas = 'Entre el ' + formDateInicio + ' y el ' + formDateFinal + '. \n ';
			}
			sensores = info['sensors'].map((sensorId, i) => {
				const sensor = _.find(this.props.infoSensores, ['indicatorId', sensorId]);
				const sensorName = sensor.name;
				return(
					<li key={sensorId}>
						<span className="bold">{sensorName}</span> ({sensorId})
					</li>
				);
			});
			let sentenceOtros = 'Cuando los siguientes sensores toman estos valores: ';
			let otrosSensores = _.map(info['knownSensors'], (value, sensorId) => {
				const sensor = _.find(this.props.infoSensores, ['indicatorId', sensorId]);
				const sensorName = sensor.name;
				let filtroValores = '';
				if (info['filterValues']['filter']){ //Hay filtros de valores
					if (info['filterValues']['values'][sensorId]){
						var values = info['filterValues']['values'][sensorId];
						if (values.length > 1){
							filtroValores = ', filtrado entre los valores ' + values[0] + ' y ' + values[1] + '. \n ';
						}
						else{
							filtroValores = ', filtrado para el valor ' + values[0] + '. \n ';
						}
					}
				}
				let finalValue = value;
				if (value === 'min'){
					finalValue = 'su valor mínimo';
				}
				else if (value === 'max'){
					finalValue = 'su valor máximo';
				}
				return(
					<li key={sensorId}>
						<span className="bold">{sensorName}</span> ({sensorId}): {finalValue} {filtroValores}
					</li>
				);
			});
			resumenInfo = (<div>
								<p> {sentenceOtros} </p>
								<div className='margin-left margin-top'>
									 {otrosSensores}
								 </div>
								 <div className='margin-top'>
									 <p>{filtroFechas}</p>
								 </div>
							</div>);
		}
		else {
			tipoDePregunta = 'Mostrar los valores de los sensores cuando no siguen esta relación: ';
			resumenInfo = null;
			sensores = _.map(info['sensorsDir'], (value, sensorId) => {
				const sensor = _.find(this.props.infoSensores, ['indicatorId', sensorId]);
				const sensorName = sensor.name;
				let icon;
				if (value === 'up'){
					icon = (<Icon>arrow_upward</Icon>);
				}
				else if (value === 'down'){
					icon = (<Icon>arrow_downward</Icon>);
				}
				else if (value === 'on'){
					icon = 'TRUE';
				}
				else if (value === 'off'){
					icon = 'FALSE';
				}
				return(
					<li key={sensorId}>
						<span className="bold">{sensorName}</span> ({sensorId}) {icon}
					</li>
				);
			});
		}

		return (
			<div className="card">
	            <div className="card-content">
	              <span className="card-title blue-text text-darken-3">Resumen de la pregunta: </span>
					<p> {tipoDePregunta} </p>
					<div className='margin-left margin-top'>
						 {sensores}
					 </div>
					<div className='margin-top'>
						 {resumenInfo}
					</div>
					<div className='center margin-top'>
						{newQueryButton}
					</div>
				</div>
			</div>
		);
	}

	render(){
		const selectedSensors = this.state.selectedSensors.slice();
		const showQueries = this.state.showQueries;
		const moreThanOneSensor = this.state.moreThanOneSensor;
		const loadingQuery = this.state.loadingQuery;
		const showChart = this.state.showChart;
		const allChartData = this.state.allChartData;
		const chartType = this.state.chartType;
		const longDateFormat = this.state.longDateFormat;
		const noDataCharts = this.state.noDataCharts;
		const noAnom = this.state.noAnom;

		const queriesCardMat = (showQueries)
			? (<PruebaTabsMat
		      		selectedSensors={selectedSensors}
		          	moreThanOneSensor={moreThanOneSensor}
		          	getInformationQuery={(s,g,f,fv) => {this.getInformationQuery(s,g,f,fv);}}
		          	getOtherSensorQuery={(k,a,v,f) => {this.getOtherSensorQuery(k,a,v,f);}}
					getAnomaliasQuery={(s,p,f) => {this.getAnomaliasQuery(s,p,f);}}
					infoSensores={this.props.infoSensores}
					infoMaquina={this.props.infoMaquina}
		        />)
			: (null);

		const loadingQueryCard = (loadingQuery || showChart)
			&& (this.makeQueryResume());

		const loadingChartCard = (loadingQuery) &&
		 	(<Card className='center'>
				<img className='loading' alt='Cargando...'
					src={`${imgPath}loading_bars.gif`}
				/>
			</Card>);

		const chartClass = (showChart && !noAnom)
			? ("")
			: ("hidden");

		const noDataInfo = noDataCharts.map((sensorId) => {
			return(
				<p key={sensorId}> No hay datos disponibles del sensor {sensorId}</p>
			);
		});

		const noDataCard = (noDataCharts.length > 0 && showChart) &&
			(<Card className='center red-text'>
				{noDataInfo}
			</Card>);

		const noAnomCard = (noAnom && showChart) &&
			(<Card className='center green-text'>
				No se ha encontrado ninguna anomalía en la relación especificada.
			</Card>);

		const chartCard = (showChart && !noAnom) &&
			(<PlotlyChart
				allChartData={allChartData}
				chartType={chartType}
				longDateFormat={longDateFormat}
			/>);

		return(
			<div className='sensorsInfo'>
				<Row>
					<Col s={12} m={6} l={5}>
						<div className='sensorMap'>
							{this.renderSensorMap()}
						</div>
					</Col>
					<Col s={12} m={6} l={7}>
						{queriesCardMat}
						{loadingQueryCard}
					</Col>
				</Row>
				<Row s={12}>
					{loadingChartCard}
					{noAnomCard}
					{chartCard}
					{noDataCard}
				</Row>
			</div>
		);
	}
}
