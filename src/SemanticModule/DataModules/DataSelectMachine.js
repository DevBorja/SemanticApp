// DataSelectMachine.js
// --------------------------------------------------------------
// Página principal de la funcionalidad de inserción de datos.
// Selección de la máquina a insertar datos.
// CONTIENE CAMBIOS NECESARIOS PARA LA UNIÓN CON I4TSPS.
// --------------------------------------------------------------

import React from 'react';
import '../../index.css';
import {ParseData} from './DataPage.js'
import axios from 'axios';
import {Card, Button, Row, Col} from 'react-materialize'
import * as DataFunctions from '../Functions/DataFunctions.js'
import * as Queries from '../Functions/SPARQLQueries.js';

// ----------- CAMBIAR EN LA UNIÓN CON I4TSPS ---------
const imgPath = './img/';
// ----------------------------------------------------

const _ = require('lodash');

const virtuosoLocalURL = 'http://localhost:8890/sparql';
const virtuosoDebianURL = 'http://35.237.96.154:8890/sparql'; // Cambia cada vez que se inicia la máquina
const usedURL = virtuosoDebianURL;

const graphURI = "<http://bdi.si.ehu.es/bdi/ontologies/extrusion/sensors#>";

const machineId = "1086_WWN_BGY3MW_3"; // La única máquina contemplada en el sistema

export class DataSelectMachine extends React.Component {
	constructor(props){
		super(props);
		this.state = {
			infoSensores: [],
			state: 'selecMaq',
			errorLoading: false,
			noMachineInfo: false,
			machines: [],
			selectedMachine: null
		};
	}

	componentDidMount(){
		const idOrg = this.props.idOrganization;

		// ------------------ CAMBIAR PARA LA UNIÓN CON I4TSPS ------------------

		// --- Comentar esto: ---
		const infoGeneral = require('../../semanticModule.json');
		const maquinas = infoGeneral['SemanticModule']['Organizations'][idOrg];
		this.setState({
			machines: maquinas,
		});

		// --- Descomentar esto: ---
		// ref.child(`Modules/SemanticModule/Organizations/${idOrg}`).once('value')
	    //     .then(snap =>{
		// 		var infoGeneral = snap.val()
		// 		console.log(infoGeneral);
		// 		this.setState({
		// 			machines: infoGeneral,
		// 		});
	 	// 	})

		// ------------------------------------------------------------------------------------

		this.setState({
			machines: maquinas,
		});
	}

	loadMachineInfo(id){
        this.setState({
            state: 'cargando',
        });
		const machines = this.state.machines;
		const machineInfo = machines[id];

		if (id === machineId){

			let query = Queries.getInfoSensoresQuery(graphURI);
			
			console.log(usedURL);
			console.log(query);

			const querystring = require('querystring');
			axios.post(usedURL,
				querystring.stringify({'query': query})
			)
			.then((response) => {
				console.log(response);
				let results = response.data["results"]["bindings"];
				if (results.length > 0) {
					let infoSensores = DataFunctions.getInfoSensores(results);
					this.setState({
						infoSensores: infoSensores,
						state: 'showData',
						errorLoading: false,
						selectedMachine: machineInfo,
					});
				}
				else{
					this.setState({
						errorLoading: true,
					});
				}

			})
			.catch((error) => {
				console.log(error);
				this.setState({
					errorLoading: true,
				});
			});
		}
		else{
			this.setState({
				noMachineInfo: true,
			})
		}
	}

	selectNewMachine(){
		this.setState({
			state: 'selecMaq',
			errorLoading: false,
			noMachineInfo: false,
		})
	}

	render(){
		const state = this.state.state;
		const infoSensores = this.state.infoSensores;
		const errorLoading = this.state.errorLoading;
        const machines = this.state.machines;
		const selectedMachine = this.state.selectedMachine;
		const noMachineInfo = this.state.noMachineInfo;

		const cargando = (state === 'cargando' && !errorLoading && !noMachineInfo)
			? (<Card s={12} l={8} offset='l2' title="Cargando datos..." className='center'>
				<img className='loading' alt='Cargando...'
					src={`${imgPath}loading_bars.gif`}
				/>
				</Card>)
			: (null);

		const cardError = (state === 'cargando' && errorLoading) &&
			(<Card s={12} l={8} offset='l2' title="Error al cargar datos" className='center'>
				<p>Ha ocurrido un error al cargar los datos necesarios desde el servidor.</p>
				<p>Vuelva a cargar la página para intentar solucionarlo.</p>
			</Card>);

		const noMachineError = (state === 'cargando' && noMachineInfo) &&
			(<Card s={12} l={8} offset='l2'
				title="Información no disponible"
				className='center'
				actions={
					<Button className="blue darken-3"
						onClick={() => {this.selectNewMachine();}}>
						Elegir otra máquina
					</Button>}>
				<p>Actualmente no hay información disponible sobre la máquina seleccionada.</p>
			</Card>);

		let listaMaq = [];

	    _.forEach(machines, (value, key) => {
			const tipo = value['type'];
	        const altValue = 'Imagen de la máquina ' + key;
	        listaMaq.push(
	        	<Col key={key} s={12} m={6} l={4}>
	            	<Card className="center machine_card_insert pointer" onClick={() => {this.loadMachineInfo(key);}}
						header={
	        				<img width="100%" alt={altValue}
								src={`${imgPath}${tipo}.png`}
	        				/>}>
	        			La máquina <span className='bold'> {key} </span>.
	        		</Card>
	            </Col>
	        );
	    });

        const maq = (state === 'selecMaq') && (listaMaq);

        const showDatos = (state === 'showData') &&
            (<ParseData
				infoSensores={infoSensores}
				infoMaquina={selectedMachine}
				graphURI={graphURI}
				usedURL={usedURL}
			/>);

		return(
			<div className='container'>
				<Row>
                    {maq}
                    {cargando}
                    {cardError}
					{noMachineError}
                    {showDatos}
                </Row>
			</div>
		)
	}
}
