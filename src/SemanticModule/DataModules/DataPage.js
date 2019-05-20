// DataPage.js
// --------------------------------------------------------------
// Página principal de inserción de datos en la máquina seleccionada.
// --------------------------------------------------------------

import React from 'react';
import '../../index.css';
import * as Parser from '../Functions/ParseToRDF.js';
import {Row, Col, Card, Icon, Button} from 'react-materialize'
import Papa from 'papaparse';
//import M from 'materialize-css';
import axios from 'axios';
import * as Queries from '../Functions/SPARQLQueries.js';

// const graphURI_Demo = "<http://www.demo.es/bdi/ontologies/extrusion/demo/sensors#>";

// ----------- CAMBIAR EN LA UNIÓN CON I4TSPS ---------
const imgPath = './img/';
// ----------------------------------------------------

const querystring = require('querystring');
const _ = require('lodash');

const maxReqLength = 250000;

export class ParseData extends React.Component {
	constructor(props) {
	    super(props);
	    this.state = {
			selectFile: true,
	    	insertingData: false,
			dataInserted: false,
			insertState: "",
			fileContent: null,
			fileName: null,
			error: "",
			showLeyenda: false,
	    }
 	}

	showLeyenda(){
		const showLeyenda = this.state.showLeyenda;
		this.setState({
			showLeyenda: !showLeyenda,
		})
	}

	handleInsertData(){
		if (this.fileInput.files.length > 0){
			const selectedFile = this.fileInput.files;
			const fileName = selectedFile[0].name;
			let parsedValues = [];
			let parsedTimestamps = [];

			const indexOfDot = fileName.indexOf('.');
			const sensorIndicator = fileName.substring(0, indexOfDot);
			const currentSensor = _.find(this.props.infoSensores, {indicatorId:sensorIndicator});

			if (currentSensor === undefined){
				this.setState({
					error: 'wrongFile',
				});
			}
			else{
				this.setState({
					error: "",
					insertingData: true,
					insertState: 'readingFile',
					selectFile: false,
					fileName: fileName,
				});

				Papa.parse(selectedFile[0], {
					step: function(row, i) {
						if (row.data[0][0] !== "" && !isNaN(row.data[0][1])){
							parsedTimestamps.push(row.data[0][0]);
							parsedValues.push(parseFloat(row.data[0][1]));
						}
					},
					complete: (results) => {
						console.log("CSV file parsed to JSON");
						parsedTimestamps.reverse();
						parsedValues.reverse();
						this.setState({
							insertState: 'fixingData',
						})
						this.parsingCompleted(fileName, parsedValues, parsedTimestamps, [], []);
					},
				});
			}
		}
		else{
			this.setState({
				error: 'noFile',
			});
		}
	}

	parsingCompleted(fileName, parsedValues, parsedTimestamps, fixedValues, fixedTimestamps){

		const firstValues = parsedValues.splice(0, maxReqLength);
		const firstTimestamps = parsedTimestamps.splice(0, maxReqLength);
		axios.post("http://35.224.159.30/api/fix/",
			{timestamps: firstTimestamps, values:firstValues}
		)
		.then((response) => {
			let newFixedValues = fixedValues.concat(response['data']['values']);
			let newFixedTimestamps = fixedTimestamps.concat(response['data']['timestamps']);
			if (parsedValues.length > 0){
				this.parsingCompleted(fileName, parsedValues, parsedTimestamps, newFixedValues, newFixedTimestamps);
			}
			else{
				console.log("Data fixed.");
				let fixedTimestampsISOFormat = [];
				newFixedTimestamps.forEach((value) => {
					let date = new Date(value+'Z');
					fixedTimestampsISOFormat.push(date.toISOString());
				});
				console.log("Data converted to ISO");
				this.fixingCompleted(fileName, newFixedValues, fixedTimestampsISOFormat)
			}
		})
		.catch((error) => {
			alert("An error has occurred. Please check the console for more information.");
			console.log(error);
		});
	}

	fixingCompleted(fileName, parsedValues, parsedTimestamps){
		this.setState({
			insertState: 'insertingData',
		})

		let infoForParsing = Parser.getInfoToParseData(fileName, this.props.infoSensores, this.props.graphURI);

		let dataToInsert = '';
		let cont = 0;
		let i = 0;
		let wholeData = '';

		console.log("Tiempo inicio " + Date.now());
		//this.insertDataRecursive(i, cont, parsedValues, parsedTimestamps, infoForParsing['virtPrefixes'], infoForParsing['sensorName'], infoForParsing['observationType'], infoForParsing['valueType'], dataToInsert, wholeData);
		this.CreateFile(parsedValues, parsedTimestamps, infoForParsing['virtPrefixes'], infoForParsing['sensorName'], infoForParsing['observationType'], infoForParsing['valueType']);
	}

	CreateFile(values, timestamps, prefixes, sensorName, observationType, valueType){
	
		let wholeData = "";
		for(let x = 0; x < values.length; x++){
			let dataToInsert = Parser.parseDataRecursive(x, values, timestamps, prefixes, sensorName, observationType, valueType);
			wholeData += `${dataToInsert}\n`;
		}

		this.setState({
			dataInserted: true,
			insertingData: false,
			insertState: "",
			fileContent: wholeData,
		})
	
	}
	

	insertDataRecursive(index, cont, values, timestamps, prefixes, sensorName, observationType, valueType, dataToInsert, wholeData){
		dataToInsert += Parser.parseDataRecursive(index, values, timestamps, prefixes, sensorName, observationType, valueType);

		index++;
		cont++;

		if(index < values.length){
			if (cont === 21){
				// -------------------- CAMBIAR PARA LA UNIÓN DE I4TSPS --------------------
				// Comentar esto:
				var query = Queries.getInsertQueryLocal(prefixes, dataToInsert, this.props.graphURI);
				// console.log(query);
				// Descomentar esto:
				// var query = Queries.getInsertQueryDebian(prefixes, dataToInsert, this.props.graphURI);
				// -------------------------------------------------------------------------
				axios.post(this.props.usedURL,
					querystring.stringify({'query': query})
				)
				.then((response) => {
					wholeData += dataToInsert;
					dataToInsert = '';
					cont = 0;
					this.insertDataRecursive(index, cont, values, timestamps, prefixes, sensorName, observationType, valueType, dataToInsert, wholeData);
				})
				.catch((error) => {
					console.log(error);
					console.log(index);
					console.log(query);
				});
			}
			else{
				this.insertDataRecursive(index, cont, values, timestamps, prefixes, sensorName, observationType, valueType, dataToInsert, wholeData);
			}
		}
		else{
			if (cont > 0) {
				console.log('Ultima petición');

				// -------------------- CAMBIAR PARA LA UNIÓN DE I4TSPS --------------------
				// Comentar esto:
				var query = Queries.getInsertQueryLocal(prefixes, dataToInsert, this.props.graphURI);
				// Descomentar esto:
				// var query = Queries.getInsertQueryDebian(prefixes, dataToInsert, this.props.graphURI);
				// -------------------------------------------------------------------------

				axios.post(this.props.usedURL,
					querystring.stringify({'query': query})
				)
				.then((response) => {
					console.log(response);
					console.log("Tiempo Final " + Date.now());
					wholeData += dataToInsert;
					this.setState({
						dataInserted: true,
				        insertingData: false,
						insertState: "",
						fileContent: wholeData,
					})
				})
				.catch((error) => {
					console.log(error);
				});
			}
		}
	}

	handleDownload(){
		const fileContent = this.state.fileContent;
		const filename = this.state.fileName;

		let indexOfDot = filename.indexOf('.');
		let sensorIndicator = filename.substring(0, indexOfDot);
		let sensorName = 'sensor' + sensorIndicator;

		let prefixes = this.getTurtlePrefixes();

		let file = new Blob([prefixes + fileContent], {type: "text/plain"});
		let outputFileName = sensorName + '.ttl'

		if (window.navigator.msSaveOrOpenBlob) // IE10+
	        window.navigator.msSaveOrOpenBlob(file, outputFileName);
	    else { // Others
	        var a = document.createElement("a"),
	                url = URL.createObjectURL(file);
	        a.href = url;
	        a.download = outputFileName;
	        document.body.appendChild(a);
	        a.click();
	        setTimeout(function() {
	            document.body.removeChild(a);
	            window.URL.revokeObjectURL(url);
	        }, 0);
	    }
	}

	getTurtlePrefixes(){
		const turtlePrefixes = "@prefix : " + this.props.graphURI + " . " +
							"@prefix owl: <http://www.w3.org/2002/07/owl#> . " +
							"@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> . " +
							"@prefix xsd: <http://www.w3.org/2001/XMLSchema#> . " +
							"@prefix sosa: <http://www.w3.org/ns/sosa/> . " +
							"@base " + this.props.graphURI + " . ";
		return turtlePrefixes;
	}

	hanldeNewFile(){
		this.setState({
			selectFile: true,
	    	insertingData: false,
			insertState: "",
			dataInserted: false,
			file: null,
			fileName: null,
			error: "",
		});
	}

	render(){
		const selectFile = this.state.selectFile;
		const insertingData = this.state.insertingData;
		const dataInserted = this.state.dataInserted;
		const fileName = this.state.fileName;
		const error = this.state.error;
		const infoSensores = this.props.infoSensores;
		const showLeyenda = this.state.showLeyenda;
		const insertState = this.state.insertState;

		const listaSensores = infoSensores.map((sensor, i) => {
			const sensorId = sensor['indicatorId'];
			const sensorName = sensor['name'];
			const sensorType = sensor['sensorType'];
			return(
				<li className="margin-left-big" key={sensorId}> <span className="bold"> {sensorId} </span>: {sensorName} </li>
			);
		});

		const leyendaSensores = (selectFile && showLeyenda) &&
			(<div className="card">
	            <div className="card-content">
	              <span className="card-title blue-text text-darken-3">Available sensors: </span>
					<p> The sensors that are currently available for this machine are the following: </p>
					<div className="margin-top">
						{listaSensores}
					</div>
				</div>
			</div>);

		let errorCard = null;

		if (error === 'noFile'){
			errorCard = (<Row className="red-text">
						<p className="margin-left"> No data file selected. </p>
					</Row>);
		}
		else if (error === 'wrongFile'){
			errorCard = (<Row className="red-text ">
						<p className="margin-left"> The name of the file must match the name of one of the sensors of this machine. </p>
					</Row>);
		}

		const selectFileOption = (selectFile) &&
		(<div className="card">
            <div className="card-content">
              <span className="card-title blue-text text-darken-3">Select data file</span>
			  <p>The file must be in CSV format and its name must be the name of the sensor. </p>
			  <p> The name of the file must match the name of one of the sensors of this machine.
				  <i className="tiny grey-text text-darken-3 material-icons pointer"
					  onClick={() => {this.showLeyenda();}}>
					  info
				  </i>
			  </p>
			  <form action="#">
				  <div className="file-field input-field">
					  <div className="btn blue darken-3">
						  <span>File</span>
						  <input type="file"
							  ref={input => {this.fileInput = input;}}
							  accept=".csv"/>
					  </div>
					  <div className="file-path-wrapper">
						  <input className="file-path validate"
							  type="text"
							  placeholder="Example: 123XYZ.csv"/>
					  </div>
				  </div>
			  </form>
			  {errorCard}
			  <Row>
				  <a href='#' className="margin-left-data blue-text text-darken-3 valign-wrapper"
					  onClick={() => this.handleInsertData()}>
					  <Icon className='blue-text text-darken-3'>play_circle_filled</Icon>
					  <span className="margin-left"> Begin data insertion. </span>
				  </a>
			  </Row>
            </div>
          </div>);

		let loadingMessage = "";
		if (insertingData && insertState === 'readingFile'){
			loadingMessage = (<p> Reading data from file<span className="bold">{fileName}</span> </p>)
		}
		else if (insertingData && insertState === 'fixingData'){
			loadingMessage = (<p> Preprocessing the data of file <span className="bold">{fileName}</span> before inserting.</p>)
		}
		else{
			loadingMessage = (<p> Inserting the processed data from file <span className="bold">{fileName}</span> in the repository. </p>)
		}

		const loadingInsertData = (insertingData) &&
			(<div className="card">
			 	<div className="card-content center">
			    	<span className="card-title blue-text text-darken-3">Insertando datos... </span>
					{loadingMessage}
					<p> The process may last some minutes. </p>
					<img className='loading' alt='Cargando' src={`${imgPath}loading_bars.gif`}/>
				</div>
			</div>);

			const dataInsertedCard = (dataInserted) &&
				(<div className="card">
					<div className="card-content center">
						<span className="card-title green-text green-darken-3"><Icon>done</Icon> Data correctly inserted.</span>
						<Row>
							<p className="margin-left">The data from file <span className="bold">{fileName}</span> have been correctly inserted in the repository.</p>
						</Row>
						<Row>
							<Col l={6} s={12}>
								<a href="#" className="blue-text text-darken-3 valign-wrapper" onClick={() => {this.hanldeNewFile();}}>
									<Icon>insert_drive_file</Icon>
									Insert data from another file.
								</a>
							</Col>
							<Col l={6} s={12}>
								<a href="#" className="blue-text text-darken-3 valign-wrapper" onClick={() => this.handleDownload()}>
									<Icon>file_download</Icon>
									Download file in RDF format.
								</a>
							</Col>
						</Row>
					</div>
				</div>);

		const offsetMainCard = (showLeyenda && selectFile)
			? "m1"
			: "m1 l2";

		return(
			<div>
				<Row>
					<Col s={12} m={10} l={8} offset={offsetMainCard}>
						<Row>
							{selectFileOption}
							{loadingInsertData}
							{dataInsertedCard}
						</Row>
					</Col>
					<Col s={12} m={10} l={4} offset="m1">
						{leyendaSensores}
					</Col>
				</Row>
			</div>
		)
	}
}

class ParsingFile extends React.Component {
	render(){
		return(
			<img alt='Cargando' src={`${imgPath}loading_bars.gif`}/>
		)
	}
}
