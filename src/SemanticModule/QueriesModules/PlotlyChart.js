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
import { TimeSeries } from '../PlotlyClasses/TimeSeriesPlot';
import { Scatter } from '../PlotlyClasses/ScatterPlot';
import { Bar } from '../PlotlyClasses/BarChart';
import { CustomTimeSeries } from '../PlotlyClasses/CustomTimeSeriesPlot';

const material = true;

export class PlotlyChart extends React.Component{

	constructor(props) {
		super(props);
		  const self = this;
		  //console.log("chartType:",this.props.chartType);
	 }

	graphType(chartType, chartData){
		switch (chartType.toLowerCase()) {
			case "scatterplot":
				return new Scatter(chartData);
				break;
			case "barchart":
				return new Bar(chartData);
				break;
			case "customtimeseriesplot":
				return new CustomTimeSeries(chartData);
				break;
			default:
				return new TimeSeries(chartData);
				break;
		}
	}



	render(){
		let charts = null;
		const allChartData = this.props.allChartData;
		if (allChartData){
			charts = allChartData.map((chartData, i) => {

				let grafico = this.graphType(this.props.chartType, chartData);
				let [plotlyData, plotlyLayout] = grafico.getData();

				//console.log("DATA:",plotlyData);

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