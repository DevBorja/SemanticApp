// DataFunctions.js
// --------------------------------------------------------------
// Funciones para el tratamiento de los resultados de las consultas.
// --------------------------------------------------------------

const maxPoints = 50000;
const _ = require('lodash');

const propertyNames = {
	temperature: 'Temperatura',
	operationState: 'Estado del sensor',
	Power: 'Energía',
	AngularVelocity: 'Velocidad angular',
	Pressure: 'Presión'
}

const unitSymbols = {
	degreeCelsius: '℃',
	Ampere: 'A',
	RevolutionPerMinute: 'RPM',
	Bar: 'bar'
}

// ------------------- FUNCIÓN "getFormInfo" -------------------
// Obtener información sobre la consulta realizada para después
// poder tratar la respuesta de Virtuoso.
// -----------
// Estructura Objeto JSON parámtero:
// 	groupBy: Collection
// 		- groupBy['groupBy']: true or false
// 		- groupBy['groupByDate']: true or false
// 		- groupBy['groupByHour']: true or false
//		- groupBy['groupByAll']: true or false
// 		- groupBy['avg']: true or false
// 		- groupBy['min']: true or false
// 		- groupBy['max']: true or false
// 	type: 'infor', 'anom' or 'otro'
// ----------
export function getFormInfo(info){
	let selectedValues = [];
	let selectedDateTime = '';
	if (info['type'] === 'infor'){
		if (!info['groupBy']['groupByAll']){
			if (info['groupBy']['groupBy']){
				if (info['groupBy']['groupByDate'])
					selectedDateTime = 'resultDate';
				else if (info['groupBy']['groupByHour'])
					selectedDateTime = 'resultHour';

				if (info['groupBy']['avg'])
					selectedValues.push('avgValue');

				if (info['groupBy']['min'])
					selectedValues.push('minValue');

				if (info['groupBy']['max'])
					selectedValues.push('maxValue');
			}
			else {
				selectedValues.push('resultValue');
				selectedDateTime = "resultTime";
			}
		}
	}
	else{
		selectedValues.push('resultValue');
		selectedDateTime = "resultTime";
	}

	return {selectedValues: selectedValues, selectedDateTime: selectedDateTime}
}

// ------------------- FUNCIÓN "parseResponseData" -------------------
// Tratar la respuesta de Virtuoso.
// ----------
// Estructura Objeto JSON parámtero:
// 	sensorResponse: Collection (respuesta de Virtuoso)
// 	selectedValues: Array (valores SPARL seleccionados)
//  selectedDateTime: String
//  sensorId: String
//  info: Collection
// 		sensors: Array (sensores seleccionados),
// 		type: 'infor' / 'otro' / 'anom',
// 		parMotor: Collection
//  infoSensores: Collection (información sobre los sensores)
// ----------
export function parseResponseData(sensorResponse, selectedValues, selectedDateTime, sensorId, info, infoSensores){

	let parsedResults = parseSensorValues(sensorResponse, sensorId, selectedValues, selectedDateTime, info['parMotor'], infoSensores);

	let finalResults;
	if (info['type'] === 'anom' || selectedValues.length > 1){
		finalResults = parsedResults;
	}
	else{
		finalResults = reduceSensorValues(parsedResults['values'], parsedResults['datetimes'], info['sensors']);
	}

    return {'values': finalResults['values'], 'datetimes': finalResults['datetimes'], 'selectedValues': selectedValues};
}

// ------------------- FUNCIÓN "prepareGoogleChartsData" -------------------
// Preparar los datos para introducirlos en las gráficas de Google.
// ----------
// Estructura Objeto JSON parámtero:
// 	sensorValues: Array
// 	sensorDatetimes: Array
// 	infoQuery: Collection
// 		sensors: Array (sensores seleccionados),
// 		type: 'infor' / 'otro' / 'anom',
// 		parMotor: Collection
//  infoSensores: Collection (información sobre los sensores)
// ----------
export function prepareGoogleChartsData(sensorValues, sensorDatetimes, selectedSensors, infoQuery, infoSensores){
    let allChartData = [];

	let largestDatetimes = [];

	_.forEach(sensorDatetimes, (datetimes, sensorId) => {
		if (largestDatetimes.length < datetimes.length){
			largestDatetimes = datetimes;
		}
	});

	// Más de una gráfica
	if (infoQuery['type']==='infor' && infoQuery['selectedValues'].length > 1){
		_.forEach(sensorValues, (sensorData, sensorId) =>{
			var dataToZip = [largestDatetimes];

			_.forEach(sensorData, (data, selectHeader) =>{
				dataToZip.push(data);
			});

			var chartData = _.zip.apply(_,dataToZip);

			let chartFullData = {};

			var sensor = _.find(infoSensores, ['indicatorId', sensorId]);

			chartFullData['title'] = "Información del sensor: "+ sensor.name;
			chartFullData['subtitle'] = "";
			infoQuery['selectedValues'].forEach((value, i) => {
				if (i === 0){
					if (value === 'minValue'){
						chartFullData['subtitle'] += "Valor mínimo";
					}
					else if (value === 'maxValue'){
						chartFullData['subtitle'] += "Valor máximo";
					}
					else{
						chartFullData['subtitle'] += "Valor medio";
					}
				}
				else{
					if (value === 'minValue'){
						chartFullData['subtitle'] += ", valor mínimo.";
					}
					else if (value === 'maxValue'){
						chartFullData['subtitle'] += ", valor máximo.";
					}
					else{
						chartFullData['subtitle'] += ", valor medio.";
					}
				}
			});

			var property = sensor['observedProperty'];
			var axisLabel;
			if (sensor['measureUnit'] !== ''){
				var unit = sensor['measureUnit'];
				axisLabel = propertyNames[property] + " (" + unitSymbols[unit] + ")";
			}
			else{
				axisLabel = propertyNames[property] + " (Encendido/Apagado)";
			}
			var axisData = [property, axisLabel];
			chartFullData['y-axis'] = [];
			infoQuery['selectedValues'].forEach((value) => {
				chartFullData['y-axis'].push(axisData);
			});

			chartFullData['data'] = chartData;

			allChartData.push(chartFullData);
		});
	}
	else{ // Sólo una gráfica

		var chartFullData = {};

		var title;
		if (infoQuery['type']==='infor'){
			title = 'Información general.';
		}
		else if (infoQuery['type']==='otro'){
			title = 'Relación entre sensores.';
		}
		else{
			title = 'Búsqueda de anomalías.';
		}
		chartFullData['title'] = title;

		chartFullData['subtitle'] = "";
		if (infoQuery['selectedValues'][0] === 'resultValue'){
			selectedSensors.forEach((sensorId, i) => {
				if (i !== (selectedSensors.length - 1)){
					chartFullData['subtitle'] += sensorId + ", ";
				}
				else{
					chartFullData['subtitle'] += sensorId;
				}
			});
		}
		else{
			if (infoQuery['selectedValues'][0] === 'minValue'){
				chartFullData['subtitle'] = "Valor mínimo.";
			}
			else if (infoQuery['selectedValues'][0] === 'maxValue'){
				chartFullData['subtitle'] = "Valor máximo.";
			}
			else{
				chartFullData['subtitle'] = "Valor medio.";
			}
		}

		let properties = [];
		chartFullData['y-axis'] = [];
		selectedSensors.forEach((sensorId, i) => {
				if (infoQuery['parMotor']['parMotorId'] && infoQuery['parMotor']['parMotorId'] === sensorId && infoQuery['parMotor']['calParMotor'] === true){
					chartFullData['y-axis'].push(['ParMotor', 'Par Motor']);
				}
				else{
					var sensor = _.find(infoSensores, ['indicatorId', sensorId]);
					var property = sensor['observedProperty'];
					if (properties.indexOf(property) === -1){
						properties.push(property);
					}
					var axisLabel;
					if (sensor['measureUnit'] !== ''){
						var unit = sensor['measureUnit'];
						axisLabel = propertyNames[property] + " (" + unitSymbols[unit] + ")";
					}
					else{
						axisLabel = propertyNames[property] + " (Encendido/Apagado)";
					}
					var axisData = [property, axisLabel];
					chartFullData['y-axis'].push(axisData);
				}
		});

		var dataToZip = [largestDatetimes];

		selectedSensors.forEach((sensorId) => {
			dataToZip.push(sensorValues[sensorId]);
		});

		if (properties.length === 1 && infoQuery['type']==='infor' && infoQuery['selectedValues'][0] === 'resultValue'){
			let sensorId = selectedSensors[0];
			let actualSensor = _.find(infoSensores, ['indicatorId', sensorId]);
			let outlierMax = ['Outlier superior'];
			let outlierMin = ['Outlier inferior'];
			sensorValues[sensorId].forEach((value) => {
				outlierMax.push(actualSensor.maxValue);
				outlierMin.push(actualSensor.minValue);
			});
			dataToZip.push(outlierMax);
			dataToZip.push(outlierMin);
			let preAxisData = chartFullData['y-axis'][0];
			chartFullData['y-axis'].push(preAxisData);
			chartFullData['y-axis'].push(preAxisData);
		}

		var chartData = _.zip.apply(_,dataToZip);

		chartFullData['data'] = chartData;

		allChartData.push(chartFullData);
	}

	return allChartData;
}

// ------------------- FUNCIÓN "getAnomaliasValues" -------------------
// Buscar anomalías en los valores de los sensores.
// ----------
// Estructura Objeto JSON parámtero:
// 	selectedSensors: Array (sensores seleccionados)
// 	sensorDir: Collection
// 		'sensor_id': 'Up'/'Down'/'On'/'Off'
// 		[...]
// 	sensorValues: Array
//  sensorDatetimes: Array
//  parMotor: Collection
// ----------
export function getAnomaliasValues(selectedSensors, sensorDir, sensorValues, sensorDatetimes, parMotor, infoSensores){
	let anomDatetimes = [];
	let anomValues = {}

	let reducedAnomResults = {};
	let reducedAnomDatetimes = {};

	selectedSensors.forEach((sensorId) => {
		var reducedResults = reduceSensorValues(sensorValues[sensorId], sensorDatetimes[selectedSensors[0]], selectedSensors);
		reducedAnomResults[sensorId] = reducedResults['values'];
		reducedAnomDatetimes[sensorId] = reducedResults['datetimes'];
	});

	sensorValues = reducedAnomResults;
	sensorDatetimes = reducedAnomDatetimes;

	const datetimes = sensorDatetimes[selectedSensors[0]];

	selectedSensors.forEach((sensorId) => {
		var sensor = _.find(infoSensores, ['indicatorId', sensorId]);
		if (parMotor['parMotorId'] && parMotor['parMotorId'] === sensorId && parMotor['calParMotor'] === true){
			anomValues[sensorId] = [sensor.name + " (Par Motor)"];
		}
		else{
			anomValues[sensorId] = [sensor.name];
		}
	});

	//console.log("DIRECCION: ",sensorDir);

	anomDatetimes.push(datetimes[0]);

	let primSensor = selectedSensors[0];
	let restoSensores = selectedSensors.slice(1,selectedSensors.length);
	let prevValues = {};
	sensorValues[primSensor].forEach((value, i) => {
		if (prevValues[primSensor] && !isNaN(value)){
			var booleans = [];
			if (sensorDir[primSensor] === 'up' && prevValues[primSensor] < value )
				booleans.push(true);
			else if (sensorDir[primSensor] === 'down' && prevValues[primSensor] > value ){
				booleans.push(true);
				// console.log("DOWN", prevValues[primSensor], value);
			}
			else if (prevValues[primSensor] !== value){
				booleans.push(false);
				// console.log("DIFF", prevValues[primSensor], value);
			}

			restoSensores.forEach((sensorId) => {
				if (sensorDir[sensorId] === 'up' && prevValues[sensorId] < sensorValues[sensorId][i] )
					booleans.push(true);
				else if (sensorDir[sensorId] === 'down' && prevValues[sensorId] > sensorValues[sensorId][i] ){
					booleans.push(true);
					// console.log("DOWN", prevValues[sensorId], sensorValues[sensorId][i]);
				}
				else if (prevValues[sensorId] !== sensorValues[sensorId][i]){
					booleans.push(false);
					// console.log("DIFF", prevValues[sensorId], sensorValues[sensorId][i]);
				}
			});
			if (!(booleans.every(allTrue) || booleans.every(allFalse))) {
				// console.log("ANOMALIA!");
				anomValues[primSensor].push(prevValues[primSensor]);
				anomValues[primSensor].push(value);
				restoSensores.forEach((sensorId) => {
					anomValues[sensorId].push(prevValues[sensorId]);
					anomValues[sensorId].push(sensorValues[sensorId][i]);
				});
			}
			else{
				anomValues[primSensor].push("NaN");
				anomValues[primSensor].push("NaN");
				restoSensores.forEach((sensorId) => {
					anomValues[sensorId].push("NaN");
					anomValues[sensorId].push("NaN");
				});
			}
			anomDatetimes.push(datetimes[i-1]);
			anomDatetimes.push(datetimes[i]);
			prevValues[primSensor] = value;
			restoSensores.forEach((sensorId) => {
				prevValues[sensorId] = sensorValues[sensorId][i];
			});
		}
		else if (!prevValues[primSensor] && !isNaN(value)){
			prevValues[primSensor] = value;
			restoSensores.forEach((sensorId) => {
				prevValues[sensorId] = sensorValues[sensorId][i];
			});
		}
		else{
			anomValues[primSensor].push("NaN");
			anomValues[primSensor].push("NaN");
			anomDatetimes.push(datetimes[i-1]);
			anomDatetimes.push(datetimes[i]);
			restoSensores.forEach((sensorId) => {
				anomValues[sensorId].push("NaN");
				anomValues[sensorId].push("NaN");
			});
		}
	});

	console.log();

	selectedSensors.forEach((sensorId) => {
		reducedAnomDatetimes[sensorId] = anomDatetimes;
	});

	console.log("RTA2: ",anomValues,reducedAnomDatetimes);
	
	return {'anomValues':anomValues, 'anomDatetimes':reducedAnomDatetimes};
}

export function getInfoSensores(results){
	let infoSensores = [];
	results.forEach((object) => {
		var infoSensor = {};

		infoSensor['indicatorId'] = object['sensorId']['value'];
		infoSensor['name'] = object['name']['value'];

		var sensType = object['sensorType']['value'];
		var iSensType = sensType.indexOf('#');
		var sensTypeParsed = sensType.substring(iSensType+1, sensType.length);
		infoSensor['sensorType'] = sensTypeParsed;

		var obsType = object['observationType']['value'];
		var iObsType = obsType.indexOf('#');
		var obsTypeParsed = obsType.substring(iObsType+1, obsType.length);
		infoSensor['observationType'] = obsTypeParsed;

		var valType = object['valueType']['value'];
		var iValType = valType.indexOf('#');
		var valTypeParsed = valType.substring(iValType+1, valType.length);
		infoSensor['valueType'] = valTypeParsed;

		if (object['zone']){
			infoSensor['zone'] = object['zone']['value'];
		}
		else{
			infoSensor['zone'] = '';
		}

		var obsProp = object['observedProperty']['value'];
		var iObsProp = obsProp.indexOf('#');
		var obsPropParsed = obsProp.substring(iObsProp+1, obsProp.length);
		infoSensor['observedProperty'] = obsPropParsed;

		if (object['measureUnit']){
			var unit = object['measureUnit']['value'];
			var iUnit = unit.indexOf('#');
			var unitParsed = unit.substring(iUnit+1, unit.length);
			infoSensor['measureUnit'] = unitParsed;
		}
		else{
			infoSensor['measureUnit'] = '';
		}

		if (object['minValue']){
			infoSensor['minValue'] = parseInt(object['minValue']['value'], 10);
			infoSensor['maxValue'] = parseInt(object['maxValue']['value'], 10);
		}
		else{
			infoSensor['minValue'] = '';
			infoSensor['maxValue'] = '';
		}

		infoSensores.push(infoSensor);
	});

	return infoSensores;
}

// ------------------- FUNCIÓN "getGraphRecommendation" -------------------
//Consulta para determinar  el tipo de grafico a mostrar
export function getGraphRecommendation(queryType, sensor, graphURI) {
	let chartType = "timeseriesplot";
	let longDateFormat = true;
	if(queryType == "info"){
		if (sensor){
			chartType = "barchart";
			longDateFormat = false;
		}
		else if (graphURI) {
			chartType = "scatterplot";
		}
	}
	else if(queryType == "other"){
		chartType = "scatterplot";
	}
	else if(queryType == "anom"){
		chartType = "customtimeseriesplot";
	}
	return [chartType,longDateFormat];
}

// -------------------- FUNCIONES AUXILIARES --------------------

// Tratar los valores de los sensores.
function parseSensorValues(sensorResponse, sensorId, selectValues, selectDateTime, parMotor, infoSensores){
    let sensorValues;
	let datetimes = [];

	if (selectDateTime === "resultHour"){
		datetimes.push("Hora");
	}
	else if (selectDateTime === "resultDate"){
		datetimes.push("Fecha");
	}
	else if (selectDateTime === "resultTime"){
		datetimes.push("Fecha y hora");
	}

	var sensor = _.find(infoSensores, ['indicatorId', sensorId]);

    // --------- Teniendo en cuenta más de un valor agregado ---------
	if (selectValues.length === 1){
		sensorValues = [];
		sensorValues.push(sensor.name);
	}
	else{
		sensorValues = {};
		selectValues.forEach((selectValue) => {
			if (selectValue === 'avgValue'){
				sensorValues[selectValue] = ['Valor medio'];
			}
			else if (selectValue === 'minValue'){
				sensorValues[selectValue] = ['Valor mínimo'];
			}
			else if (selectValue === 'maxValue'){
				sensorValues[selectValue] = ['Valor máximo'];
			}

		});
	}

	sensorResponse.forEach((result, i) => {
		if (selectDateTime !== ''){
			var resultDateTimeValue = result[selectDateTime]["value"];
			var datetime;
			if (selectDateTime === 'resultDate'){
				datetime = new Date(resultDateTimeValue);
			}
			else if (selectDateTime === 'resultHour'){
				var indexFirstSep = resultDateTimeValue.indexOf(':');
				var hour = parseInt(resultDateTimeValue.substring(0,indexFirstSep),10);
				datetime = hour + ":00 - " + (hour + 1) + ":00";
			}
			else {
				datetime = new Date(resultDateTimeValue);
			}
			datetimes.push(datetime);
		}

        // --------- Teniendo en cuenta más de un valor agregado ---------
		if (selectValues.length === 1){
			if (parMotor['parMotorId'] && parMotor['parMotorId'] === sensorId && parMotor['calParMotor'] === true){ // [79PWN7] * 0.00302) * 3.84
				let parMotorValue = (parseFloat(result[selectValues[0]]["value"]) * 0.00302) * 3.84;
				sensorValues.push(parMotorValue);
			}
			else{
				var aux = parseFloat(result[selectValues[0]]["value"]);
				if (aux === -50){ // Añadido puesto que Virtuoso no admite el valor "NaN"^^xsd:double
					sensorValues.push(NaN);
				}
				else{
					sensorValues.push(aux);
				}
			}
		}
		else{
			selectValues.forEach((selectValue) => {
				var aux = parseFloat(result[selectValue]["value"]);
				if (aux === -50){
					sensorValues[selectValue].push(NaN);
				}
				else{
					sensorValues[selectValue].push(aux);
				}

			});
		 }
	});

	return {'values':sensorValues, 'datetimes':datetimes};
}

// Reducir los resultados
function reduceSensorValues(values, datetimes, selectedSensors){
    let reducedValues = [];
    let reducedDatetimes = [];
    if (values.length > (maxPoints / selectedSensors.length)){
        let prevValues = [];
        let prevDatetimes = [];
        const splitLength = Math.ceil(values.length / maxPoints) * selectedSensors.length;
        values.forEach((value, i) => {
            if (i !== 0){
				if (!isNaN(value)){
					prevValues.push(value);
				}
				let datetime = datetimes[i].getTime();
				if (!isNaN(datetime)){
					prevDatetimes.push(datetime);
				}
                if (prevDatetimes.length === splitLength){ // hacer la media, introducir, vaciar y seguir
					if (prevValues.length > 0){
						reducedValues.push(_.mean(prevValues));
					}
                    else{
						reducedValues.push(NaN);
					}
                    reducedDatetimes.push(new Date(Math.round(_.mean(prevDatetimes))));

                    prevValues = [];
                    prevDatetimes = [];
                }
            }
			else{
				reducedValues.push(value);
				reducedDatetimes.push(datetimes[i]);
			}
        });
        if (prevValues.length > 0){
            reducedValues.push(_.mean(prevValues));
            reducedDatetimes.push(new Date(Math.round(_.mean(prevDatetimes))));
        }
    }
    else{
        reducedValues = values;
        reducedDatetimes = datetimes;
    }

    return {'values':reducedValues, 'datetimes': reducedDatetimes};

}

function allTrue(value){
	return value === true;
}

function allFalse(value){
	return value === false;
}

