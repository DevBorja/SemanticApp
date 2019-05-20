// index.js
// ----------------------------------------------
// Esta página no entra dentro de la unión.
// Será sustituída por el index.js de I4TSPS.
// ----------------------------------------------

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {DataSelectMachine} from './SemanticModule/DataModules/DataSelectMachine.js'	
import {QueriesSelectMachine} from './SemanticModule/QueriesModules/QueriesSelectMachine.js'
import {Button, SideNav, SideNavItem} from 'react-materialize'
//import $ from 'jquery';

const idOrg = '-L2PV1Ya30YR-SBlesmI';

// ----------- CAMBIAR EN LA UNIÓN CON I4TSPS ---------
const imgPath = './img/';
// ----------------------------------------------------

class SelectedPage extends React.Component {
	constructor(props){
		super(props);
		this.state = {
			preguntasSelected: true,
			selectedPage: 'preguntas',
			errorLoading: false,
			loaded : true,
		};
	}

	componentDidMount(){
		var self = this
		if(this.state.loaded){
			setTimeout(function(){
				self.setState({
					loaded : true
				})

			},3000)
		}
	}

	componentDidUpdate(){

	}

	mostrarPreguntas(){
		this.setState({
			preguntasSelected: true,
			selectedPage: 'preguntas',
		});
	}

	mostrarTraductorDatos(){
		this.setState({
			preguntasSelected: false,
			selectedPage: 'datos',
		});
	}

	render(){
		const preguntasSelected = this.state.preguntasSelected;
		const selectedPage = this.state.selectedPage;

		const queries = (selectedPage === 'preguntas') &&
			(<QueriesSelectMachine idOrganization={idOrg}/>);

		const datos = (selectedPage === 'datos') &&
			(<DataSelectMachine idOrganization={idOrg}/>);

		let preguntasClass = '';
		let traductorClass = '';

		if (selectedPage === 'preguntas'){
			preguntasClass = preguntasClass + 'active ';
		}

		if (selectedPage === 'datos'){
			traductorClass = traductorClass + 'active ';
		}

		const navBarTitle = (preguntasSelected) ? "Query sensor data" : "Insert sensor data";


		const sideNav = (
			<SideNav
			  trigger={<Button className="button-collapse show-on-medium-and-up btn-flat white-text"><i className="material-icons">menu</i></Button>}
			  options={{ closeOnClick: true }}
			  >
			  <SideNavItem userView
			    user={{
			      background: 'https://www.navitasventures.com/wp-content/uploads/2016/06/Material-design-background-514054880_2126x1416-1024x682.jpeg',
			      image: 'data:image/jpeg;base64,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',
			      name: 'John Doe',
			      email: 'jdandturk@gmail.com'
			    }}
			  />
			  <SideNavItem waves icon='bar_chart' onClick={() => this.mostrarPreguntas()}>Query data</SideNavItem>
			  <SideNavItem waves icon='publish' onClick={() => this.mostrarTraductorDatos()}>Insert data</SideNavItem>
			</SideNav>
);

const navBar =
	(
			<div className="nav-wrapper">
				<a href="#" className="brand-logo center">{navBarTitle}</a>
				<ul className="left">
					<li>
					{sideNav}
					</li>
				</ul>
			</div>);

		const navColor = (preguntasSelected) ? ('pink darken-3') : ('green darken-3')

		if(this.state.loaded){
			return(
				<div>
					<div className='navBar'>
						<nav className={navColor}>
								{navBar}
						</nav>
					</div>
					{queries}
					{datos}
				</div>
			)
		}else{
			return (<h1>espera</h1>)
		}
	}
}

ReactDOM.render(
	<SelectedPage />,
  	document.getElementById('root')
);
