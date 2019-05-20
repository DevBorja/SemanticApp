// SPARQLQueries.js
// --------------------------------------------------------------
// Funciones de creación de preguntas SPARQL.
// --------------------------------------------------------------

var _ = require('lodash');

 // ------------------- FUNCIÓN "getInformationQueryIndividual" -------------------
 // Consultas de información general de un sensor.
 // -----------
 // Estructura Objeto JSON parámtero:
 // 	sensorId: id of sensor to ask
 // 	groupBy: Collection
 // 		- groupBy['groupBy']: true or false
 // 		- groupBy['groupByDate']: true or false
 // 		- groupBy['groupByHour']: true or false
 //			- groupBy['groupByAll']: true or false
 // 		- groupBy['avg']: true or false
 // 		- groupBy['min']: true or false
 // 		- groupBy['max']: true or false
 // 	filter: Collection
 // 		- filter['filter']: true or false
 // 		- filter['filterDate']: true or false
 // 		- filter['startDate']: STRING ('yyyy-mm-dd')
 // 		- filter['endDate']: STRING ('yyyy-mm-dd')
 // 		- filter['filterTime']: true or false
 // 		- filter['startTime']: STRING ('HH:MM:ss')
 // 		- filter['endTime']: STRING ('HH:MM:ss')
 // 	filterValues: Collection
// 			- filterValues['filter']: true or false
// 			- filtervalues['values']: {'XXXXX':[startvalue, finalValue] OR [true/false], ... }
// 										--> XXXXX = sensorId
 // 	orderBy: Collection
 // 		- orderBy['orderBy']: true or false
 // 		- orderBy['order']: 'desc' or 'asc'
 // 		- orderBy['orderField']: 'value', 'dateTime', 'date', 'sensorId'
 // 	graphURI: URI del grafo a consultar
 // -----------
export function getInformationQueryIndividual(sensorId, groupBy, filter, filterValues, orderBy, graphURI){

	const prefixes = 'base ' + graphURI + ' ' +
		'prefix : ' + graphURI + ' ' +
		'prefix sosa: <http://www.w3.org/ns/sosa/> ' +
		'prefix xsd: <http://www.w3.org/2001/XMLSchema#> ';

	const select = getSelect(groupBy);

	const from = 'from ' + graphURI + ' ';

	let where = 'where { ';

	where += '?sensorName sosa:madeObservation ?obsName . ' +
			'?obsName sosa:hasSimpleResult ?resultValue . ' +
			'?obsName sosa:resultTime ?resultTime . ';

	if (filterValues['filter'] && filterValues['values'][sensorId]){
			where += 'filter(?resultValue  ';
			let sensorFilterValues = filterValues['values'][sensorId];
			if (typeof(sensorFilterValues[0]) === "boolean"){
				where += '= "' + sensorFilterValues[0] + '"^^xsd:boolean ';
			}
			else{
				console.log(sensorFilterValues[0] + " is a number.");
				where += '>= "' + sensorFilterValues[0] + '"^^xsd:double && ' +
						'?resultValue <= "' + sensorFilterValues[1] + '"^^xsd:double ';
			}
			where += '&& ?sensorName = <#sensor'+ sensorId +'> ) .';
	}
	else{
		where += 'filter( ?sensorName = <#sensor'+ sensorId +'> ) .';
	}

    if (groupBy['groupByDate']) {
    	where += 'bind(xsd:date(xsd:dateTime(?resultTime)) as ?resultDate) ' +
				'filter(?resultValue > "-1"^^xsd:double)'; // Añadido puesto que Virtuoso no admite el valor "NaN"^^xsd:double
															// Para evitar así que los valores "-50" afecten a los valores agrupados
    }
    else if(groupBy['groupByHour']){
    	where += 'bind(xsd:time(xsd:dateTime(?resultTime)) as ?time) . ' +
    		'bind(substr(str(?time), 1, 2) as ?hour) . ' +
    		'bind(concat(?hour, ":00:00") as ?resultHour) . ' +
			'filter(?resultValue > "-1"^^xsd:double)'; // Añadido puesto que Virtuoso no admite el valor "NaN"^^xsd:double
														// Para evitar así que los valores "-50" afecten a los valores agrupados
    }

    if (filter['filter']){
    	where += getFilter(filter);
    }

    where += '} ';

    let finalQuery = prefixes + select + from + where;

    if (groupBy['groupBy']){
    	finalQuery += getGroupBy(groupBy);
    }

    if (orderBy['orderBy'] && !groupBy['groupByAll']){
    	finalQuery += getOrderBy(orderBy, groupBy);
    }

    return finalQuery;
}

// ------------------- FUNCIÓN "getOtherSensorQueryIndividual" -------------------
// Consultas de relación de valor entre dos o más sensores.
// Devuelve los resultados de un sensor cuando el resto cumplen las condiciones impuestas.
// -----------
// Estructura Objeto JSON parámtero:
// 	knownSensors: Collection
// 		{'sensorName':sensorValue, ...}
// 			or
// 		{'sensorName':'min'/'max', ...}
// 	askedSensorId: string
// 	filterValues: Collection
// 			- filterValues['filter']: true or false
// 			- filtervalues['values']: {'XXXXX':[startvalue, finalValue] OR [true/false], ... }
// 										--> XXXXX = sensorId
// 	filter: Collection
// 		- filter['filter']: true or false
// 		- filter['filterDate']: true or false
// 		- filter['startDate']: STRING ('yyyy-mm-dd')
// 		- filter['endDate']: STRING ('yyyy-mm-dd')
// 		- filter['filterTime']: true or false
// 		- filter['startTime']: STRING ('HH:MM:ss')
// 		- filter['endTime']: STRING ('HH:MM:ss')
// 	orderBy: Collection
// 		- orderBy['orderBy']: true or false
// 		- orderBy['order']: 'desc' or 'asc'
// 		- orderBy['orderField']: 'value', 'dateTime', 'date', 'sensorId'
// 	graphURI: URI del grafo a consultar
// ----------
export function getOtherSensorQueryIndividual(knownSensors, askedSensorId, filterValues, filter, orderBy, graphURI){
	const prefixes = 'base ' + graphURI + ' ' +
		'prefix : ' + graphURI + ' ' +
		'prefix sosa: <http://www.w3.org/ns/sosa/> '+
		'prefix xsd: <http://www.w3.org/2001/XMLSchema#> ';;

	let select = 'select ?resultValue ?resultTime ';

	const from = 'from ' + graphURI + ' ';

	let where = 'where { ';
	let i = 1;

	_.forEach(knownSensors, (value,sensorName) => {
		var obsName = 'knownObs' + i;

		if (isNaN(value)){
			var calObsName = 'calObs' + i;
			var calValName = 'calculatedValue' + i;

			where += '{ '
			if (value === 'min'){
				where += 'select (MIN(?calResultValue) as ?' + calValName + ') ';
			}
			else {
				where += 'select (MAX(?calResultValue) as ?' + calValName + ') ';
			}
			where += 'where { ' +
				'<#sensor' + sensorName + '> sosa:madeObservation ?' + calObsName + ' . ' +
				'?' + calObsName + ' sosa:hasSimpleResult ?calResultValue . ';

			if (filterValues['filter'] && filterValues['values'][sensorName]){
					where += 'filter(?calResultValue  ';
					let sensorFilterValues = filterValues['values'][sensorName];
					if (typeof(sensorFilterValues[0]) === "boolean"){
						where += '= "' + sensorFilterValues[0] + '"^^xsd:boolean ';
					}
					else{
						where += '>= "' + sensorFilterValues[0] + '"^^xsd:double && ' +
								'?calResultValue <= "' + sensorFilterValues[1] + '"^^xsd:double ';
					}
					where += ' ) .';
			}

			where += ' } } ' ;

			where += '<#sensor' + sensorName + '> sosa:madeObservation ?' + obsName + ' . ' +
				'?' + obsName + ' sosa:hasSimpleResult ?' + calValName + ' . ' +
				'?' + obsName + ' sosa:resultTime ?resultTime . ';
		}
		else {
			where += '<#sensor' + sensorName + '> sosa:madeObservation ?' + obsName + ' . ' +
				'?' + obsName + ' sosa:hasSimpleResult "' + value + '"^^xsd:double . ' +
				'?' + obsName + ' sosa:resultTime ?resultTime . ';
		}
		i++;
	});

	where += '<#sensor' + askedSensorId +'> sosa:madeObservation ?askedObs . ' +
			'?askedObs sosa:hasSimpleResult ?resultValue . ' +
			'?askedObs sosa:resultTime ?resultTime . ';

	if (filter['filter']){
		  where += getFilter(filter);
	}

	where += '} ';

	let finalQuery = prefixes + select + from + where;

	if (orderBy['orderBy']){
    	finalQuery += getOrderBy(orderBy, {});
    }

	return finalQuery;
}

// ------------------- FUNCIÓN "getInsertQueryDebian" -------------------
// Sentencia INSERT para Virtuoso en Debian.
// -----------
export function getInsertQueryDebian(prefixes, dataToInsert, graphURI){
	let query = prefixes;
	query += ' insert into graph ' + graphURI + ' { ';
	query += dataToInsert;
	query += ' } ';

	return query;
}

// ------------------- FUNCIÓN "getInsertQueryLocal" -------------------
// Sentencia INSERT para Virtuoso en local.
// -----------
export function getInsertQueryLocal(prefixes, dataToInsert, graphURI){
	let query = prefixes;
	query += ' insert data { graph ' + graphURI + ' { ';
	query += dataToInsert;
	query += ' } } ';

	return query;
}

// ------------------- FUNCIÓN "getInfoSensores" -------------------
// Consulta de la información de los sensores de la máquina Extrusora de Cuatro Zonas.
// -----------
export function getInfoSensoresQuery(graphURI){
	let query = 'prefix : ' + graphURI + ' ' +
			'prefix owl: <http://www.w3.org/2002/07/owl#> ' +
			'prefix sosa: <http://www.w3.org/ns/sosa/> ' +
			'prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
			'prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
			'prefix qudt: <http://bdi.si.ehu.es/bdi/ontologies/extrusion/quantities#> ' +
			'select ?sensorId ?name ?sensorType ?observationType ?valueType ?zone ?observedProperty ?measureUnit ?symbol ?minValue ?maxValue ' +
			'from ' + graphURI + ' ' +
' where {  ' +
' ?sensorName rdf:type ?sensorType ; rdf:type owl:NamedIndividual ; :indicatorId ?sensorId ; :sensorName ?name .  ' +
' ?sensorType rdfs:subClassOf ?metaSensorType .  ' +
' ?metaSensorType rdfs:subClassOf :Sensor .   ' +
' ?metaSensorType rdfs:subClassOf [ rdf:type owl:Restriction ; owl:onProperty sosa:madeObservation ; owl:allValuesFrom ?observationType ] .  ' +
' ?observationType rdfs:subClassOf [ rdf:type owl:Restriction ; owl:onProperty sosa:hasSimpleResult ; owl:allValuesFrom ?valueType ] .  ' +
' ?sensorType rdfs:subClassOf [ rdf:type owl:Restriction ; owl:onProperty sosa:observes ; owl:hasValue ?observedProperty ] .   ' +
' optional { ?sensorName :unit ?measureUnit . ?measureUnit qudt:symbol ?symbol .}' +
' optional { ?sensorName :minValue ?minValue. }  ' +
' optional { ?sensorName :maxValue ?maxValue. }  ' +
' optional { ?sensorName :zone ?zone. } ' +
' }order by asc(?name) ';
//console.log(query);
	return query;
}

// ------------------- FUNCIÓN "getGraphRecommendation" -------------------
//Consulta para determinar  el tipo de grafico a mostrar
export function getGraphRecommendation(queryType, sensor, graphURI){
let query = 'prefix : <http://bdi.si.ehu.es/bdi/ontologies/extrusion/visualization#> ' +
'prefix owl: <http://www.w3.org/2002/07/owl#> ' +
'prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
'prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
'prefix ins: <http://bdi.si.ehu.es/bdi/ontologies/extrusion/instances#> ' +
'select ?graph ' +
' from ' + graphURI +' '+
' where { :' + queryType + ' :hasRecommendation ?r .' +
' ?r rdf:type [rdf:type owl:Restriction; ' +
' owl:onProperty :sensor; '+
' owl:someValuesFrom ?s ]; ' +
' :graph ?graph . ' +
'ins:sensor'+sensor+' rdf:type ?x .' +
'?x rdfs:subClassOf* ?s . }';
//console.log(query);
return query;
}




// ------------------- FUNCIONES AUXILIARES  -------------------

// Función para el SELECT de las sentencias.
function getSelect(groupBy){
	let select = 'select ';
	if (groupBy['groupBy']){
		if (groupBy['groupByDate']) {
	    	select += '?resultDate ';
	    }
	    else if (groupBy['groupByHour']){
	    	select += '?resultHour ';
	    }
		if (groupBy['avg']){
			select += ' (AVG(?resultValue) as ?avgValue) ';
		}
		if (groupBy['min']){
			select += ' (MIN(?resultValue) as ?minValue) ';
		}
		if (groupBy['max']){
			select += ' (MAX(?resultValue) as ?maxValue) ';
		}
	}
	else {
		select += '?resultValue ?resultTime ';
	}

	return select;
}

// Función para los filtros de las sentencias.
function getFilter(filter){
	let where = 'filter( ';
    	if (filter['filterTime'] && filter['filterDate']){
   			where += ' (xsd:dateTime(?resultTime) >= "' + filter['startDate'] + 'T00:00:00.000Z"^^xsd:dateTime) && ' +
            	'(xsd:dateTime(?resultTime) < "' + filter['endDate'] + 'T23:59:59.999Z"^^xsd:dateTime) && ' +
    			'(xsd:time(xsd:dateTime(?resultTime)) >= "' + filter['startTime'] + '.000Z"^^xsd:time) && ' +
            	'(xsd:time(xsd:dateTime(?resultTime)) <= "' + filter['endTime'] + '.000Z"^^xsd:time) ';
    	}
    	else if (filter['filterDate']){
    		where += ' (xsd:dateTime(?resultTime) >= "' + filter['startDate'] + 'T00:00:00.000Z"^^xsd:dateTime) && ' +
            	'(xsd:dateTime(?resultTime) <= "' + filter['endDate'] + 'T23:59:59.999Z"^^xsd:dateTime) ';
    	}
    	else if (filter['filterTime']){
    		where += '(xsd:time(xsd:dateTime(?resultTime)) >= "' + filter['startTime'] + '.000Z"^^xsd:time) && ' +
            	'(xsd:time(xsd:dateTime(?resultTime)) <= "' + filter['endTime'] + '.000Z"^^xsd:time) ';
    	}
    where += ') ';

    return where;
}

// Función para el GROUP BY de las sentencias.
function getGroupBy(groupBy){
	let groupByQuery = 'group by ';
    if (groupBy['groupByDate']) {
    	groupByQuery += '?resultDate ';
    }
    else if(groupBy['groupByHour']){
    	groupByQuery += '?resultHour ';
    }

    return groupByQuery;
}

// Función para el ORDER BY de las sentencias.
function getOrderBy(orderBy, groupBy){
	let orderByQuery = 'order by ' + orderBy['order'] + '(';
    if (orderBy['orderField'] === 'value'){
    	orderByQuery += '?resultValue';
    }
    else if (orderBy['orderField'] === 'sensorId'){
    	orderByQuery += '?sensorName';
    }
    else {
    	if (groupBy['groupByDate']) {
    		orderByQuery += '?resultDate';
    	}
    	else if(groupBy['groupByHour']){
    		orderByQuery += '?resultHour';
    	}
    	else{
    		orderByQuery += 'xsd:dateTime(?resultTime)';
    	}
    }
    orderByQuery += ') ';

    return orderByQuery;
}
