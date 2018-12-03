// PlotlyChart.js
// --------------------------------------------------------------
// Visualización de los resultados de las consultas mediante
// la libreria Plotly.js.
// --------------------------------------------------------------

import React from 'react';
import ReactDOM from 'react-dom';
import '../../index.css';
import {Card} from 'react-materialize'
//import M from 'materialize-css';
import Plot from 'react-plotly.js';

const material = true;

export class PlotlyChart extends React.Component{

	constructor(props) {
		super(props);
		  const self = this;
		  console.log("chartType:",this.props.chartType);
	 }

	side = true;
	plotAxisSide(){
		this.side = !this.side;
		if(this.side) return "right";
		else return "left";
	}

	anchor = false;
	plotAxisAnchor(){
		this.anchor = !this.anchor;
		if(this.anchor) return "free";
		else return "x";
	}

	graphType(chartType){
		let type = "";
		let mode = "";
		switch (chartType.toLowerCase()) {
			case "scatter":
				type = "scattergl";
				mode = "markers"
				break;
			case "bar":
				type = "bar";
				break;
			default:
				type = "scatter";
				break;
		}
		return [type,mode]
	}



	render(){
		let charts = null;
		const allChartData = this.props.allChartData;
		let [type,mode] = this.graphType(this.props.chartType);
		if (allChartData){
			charts = allChartData.map((chartData, i) => {
				let data = [...chartData['data']];
				console.log(chartData);

				let position = [0, 1, 0.05, 0.95];
				let plotlyData = [];
				let plotlyType = type;
				let plotlyLayout = {
					height: 400,
					barmode: 'group',
					title: chartData['title'],
					xaxis: {
						titlefont: { color: "#888888", size: 11 },
						tickfont: { color: "#888888", size: 11 },
						title: `<b>${chartData['data'][0][0]}</b>`,
						domain: [0.05, 0.9],
					},
					annotations: [{
						text: chartData['subtitle'],
						  font: {
						  size: 13,
						  color: '#000000',
						},
						showarrow: false,
						align: 'center',
						x: 0.5,
						y: 1.2,
						xref: 'paper',
						yref: 'paper',
					  }],
					legend: {
					x:0.9,
					y: 1.35,
					traceorder: "normal",
					font: {
						family: "sans-serif",
						size: 11,
						color: "#000000"
					},
					bgcolor: "#E2E2E2",
					bordercolor: "#FFFFFF",
					borderwidth: 2
					  },
				};

				let DataHeader = data.splice(0, 1);
				console.log(DataHeader);
				let axisCount = {};

				for(var x = 1; x < DataHeader[0].length; x++){
					let newStyle = false;
					if(!axisCount[chartData['y-axis'][x-1][1]]){
						axisCount[chartData['y-axis'][x-1][1]] = Object.keys(axisCount).length+1;
						newStyle = true;
					}
					let estilo = {
						title: "<b>" + chartData['y-axis'][x-1][1] + "</b>",
						titlefont: { color: "#888888", size: 11 },
						tickfont: { color: "#888888", size: 11 },
						side: this.plotAxisSide(),
						position: position[(axisCount[chartData['y-axis'][x-1][1]])-1]
					};
					let datos = {
						x: data.map(a => a[0]),
						y: data.map(a => a[x]),
						type: plotlyType,
						name: DataHeader[0][x],
					};
					if(mode != ""){
						datos["mode"] = mode;
					}
					if(x>1){
						datos["yaxis"] = "y" + axisCount[chartData['y-axis'][x-1][1]];
						estilo["overlaying"] = "y";
						estilo["anchor"] = this.plotAxisAnchor();
					}

					plotlyData.push(datos);
					if(newStyle){
					plotlyLayout["yaxis" + axisCount[chartData['y-axis'][x-1][1]]] =  estilo;
					}
				}

				console.log(plotlyData);
				console.log(plotlyLayout);

				return(
					<Card key={i}>
					   <Plot
							data={plotlyData}
							layout={ plotlyLayout }
							config={ {responsive: true} }
							style= {{width: "100%", height: "100%"}}
						/>
					</Card>
				);
			});
		}

		return(
			<div className={'chartContainer'}>
				{charts}
			</div>
		)
	}
}

function getConvertOptionsFunc(chartType) {
	return window.google && window.google.charts && window.google.charts[chartType]
	    ? window.google.charts[chartType].convertOptions
	    : null;
}
