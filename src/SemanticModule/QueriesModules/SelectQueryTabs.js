// SelectQueryTabs.js
// --------------------------------------------------------------
// Pestañas de selección de los diferentes formularios.
// --------------------------------------------------------------

import React from 'react';
import '../../index.css';
// import M from 'materialize-css';
import $ from 'jquery';
import {Icon, Card, Input, Row, Tabs, Tab} from 'react-materialize'
import {InformationQueryForm} from './InformationQuery.js'
import {OtroSensorQueryForm} from './OtroSensorQuery.js'
import {AnomaliasQueryForm} from './AnomaliasQuery.js'

export class PruebaTabsMat extends React.Component {

	constructor(){
		super()

	}

	render(){
		const selectedSensors = this.props.selectedSensors;
		const moreThanOneSensor = this.props.moreThanOneSensor;
		var tab2 = 'disabled'
		var tab3 = 'disabled'

		const inforClassNames = (selectedSensors.length >= 1)
			? (" ")
			: ("disabled");

		const otroClassNames = (selectedSensors.length >= 2)
			? ("")
			: ("disabled");

		return(
			<div className='selectQuery'>
				<div className="row">
				<div className="col s12">
				<Tabs className='tab-demo z-depth-1 tabs-fixed-width'>
					<Tab title="Anomalies" active>
						<AnomaliasQueryForm
										selectedSensors={selectedSensors}
							getAnomaliasQuery={(s,p,f) => {this.props.getAnomaliasQuery(s,p,f);}}
							infoSensores={this.props.infoSensores}
							infoMaquina={this.props.infoMaquina}/>
					</Tab>
					<Tab title="Information" className={inforClassNames}>
						<InformationQueryForm
										selectedSensors={selectedSensors}
										getInformationQuery={(s,g,f,fv) => {this.props.getInformationQuery(s,g,f,fv);}}
							infoSensores={this.props.infoSensores}/>
					</Tab>
					<Tab title="Relation" className={otroClassNames}>
						<OtroSensorQueryForm
										selectedSensors={selectedSensors}
										getOtherSensorQuery={(k,a,v,f) => {this.props.getOtherSensorQuery(k,a,v,f);}}
							infoSensores={this.props.infoSensores}/>
					</Tab>
				</Tabs>
				 </div>
			 </div>
		 </div>
		)
	}
}

/*
<ul className="tabs tabs-fixed-width">
	<li className="tab col s4">
		<a className="active" href="#anom">
			Anomalies
			<i className="tiny material-icons tooltipped infoTabs"
				data-position="bottom"
				data-tooltip="Búsqueda de anomalías en los valores de los sensores.">
				info
			</i>
		</a>
	</li>
	<li className={inforClassNames}>
		<a href="#infor">
			Information
			<i className="tiny material-icons tooltipped infoTabs"
				data-position="bottom"
				data-tooltip="Consultas de información general sobre cada sensor.">
				info
			</i>
		</a>
	</li>
	<li className={otroClassNames}>
		<a href="#otro">
			Relation
			<i className="tiny material-icons tooltipped infoTabs"
				data-position="bottom"
				data-tooltip="Búsqueda de relaciones entre los valores de los sensores.">
				info
			</i>
		</a>
	</li>
</ul>
</div>
<div id="infor" className="col s12">
<InformationQueryForm
				selectedSensors={selectedSensors}
				getInformationQuery={(s,g,f,fv) => {this.props.getInformationQuery(s,g,f,fv);}}
	infoSensores={this.props.infoSensores}
		/>
</div>
<div id="otro" className="col s12">
<OtroSensorQueryForm
				selectedSensors={selectedSensors}
				getOtherSensorQuery={(k,a,v,f) => {this.props.getOtherSensorQuery(k,a,v,f);}}
	infoSensores={this.props.infoSensores}
		/>
</div>
<div id="anom" className="col s12">
<AnomaliasQueryForm
				selectedSensors={selectedSensors}
	getAnomaliasQuery={(s,p,f) => {this.props.getAnomaliasQuery(s,p,f);}}
	infoSensores={this.props.infoSensores}
	infoMaquina={this.props.infoMaquina}
		/>
*/
