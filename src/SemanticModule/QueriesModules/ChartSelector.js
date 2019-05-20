// ChartSelector.js
// --------------------------------------------------------------
// Selector del tipo de gráficas
// --------------------------------------------------------------

import React from 'react';
import ReactDOM from 'react-dom';
import '../../index.css';
import {Card, CardContent, Button} from 'react-materialize'
//import M from 'materialize-css';

// ----------- CAMBIAR EN LA UNIÓN CON I4TSPS ---------
const imgPath = './img/';
// ----------------------------------------------------

const material = true;

class Tooltip extends React.Component {
    constructor(props) {
      super(props)
  
      this.state = {
        displayTooltip: false
      }
      this.hideTooltip = this.hideTooltip.bind(this)
      this.showTooltip = this.showTooltip.bind(this)
    }
    
    hideTooltip () {
      this.setState({displayTooltip: false})
      
    }
    showTooltip () {
      this.setState({displayTooltip: true})
    }
  
    render() {
      let message = this.props.message
      let position = this.props.position
      return (
        <span className='tooltip'
            onMouseLeave={this.hideTooltip}
          >
          {this.state.displayTooltip &&
          <div className={`tooltip-bubble tooltip-${position}`}>
            <div className='tooltip-message'>{message}</div>
          </div>
          }
          <span 
            className='tooltip-trigger'
            onMouseOver={this.showTooltip}
            >
            {this.props.children}
          </span>
        </span>
      )
    }
  }

export class ChartSelector extends React.Component{

	constructor(props) {
		super(props);
		  const self = this;
		  //console.log("chartType:",this.props.chartType);
	 }

	render(){

        return(
            <Card className="card-chart">
                <Tooltip message={'TimeSeries'} position={'left'}>
                    <Button className='btn-flat waves-effect waves-red btn-large btn-chart' onClick={() => {}}>
                        <img title='TimeSeries Plot'
                                src={`${imgPath}graph_timeseriesplot.png`}
                            />
                    </Button>
                </Tooltip><br />
                <Tooltip message={'Scatter plot'} position={'left'}>
                    <Button className='btn-flat waves-effect waves-red btn-large btn-chart' onClick={() => {}}>
                    <img alt='Mapa de sensores'
                            src={`${imgPath}graph_scatterplot.png`}
                        />
                    </Button>
                </Tooltip><br />
                <Tooltip message={'Anomalies plot'} position={'left'}>
                    <Button className='btn-flat waves-effect waves-red btn-large btn-chart' onClick={() => {}}>
                    <img alt='Mapa de sensores'
                            src={`${imgPath}graph_customtimeseriesplot.png`}
                        />
                    </Button>
                </Tooltip><br />
                <Tooltip message={'Pie chart'} position={'left'}>
                    <Button className='btn-flat waves-effect waves-red btn-large btn-chart' onClick={() => {}}>
                    <img alt='Mapa de sensores'
                            src={`${imgPath}graph_piechart.png`}
                        />
                    </Button>
                </Tooltip><br />
                <Tooltip message={'Bar chart'} position={'left'}>
                    <Button className='btn-flat waves-effect waves-red btn-large btn-chart' onClick={() => {}}>
                    <img alt='Mapa de sensores'
                            src={`${imgPath}graph_barchart.png`}
                        />
                    </Button>
                </Tooltip><br />
                <Tooltip message={'Gauge chart'} position={'left'}>
                    <Button className='btn-flat waves-effect waves-red btn-large btn-chart' onClick={() => {}}>
                    <img alt='Mapa de sensores'
                            src={`${imgPath}graph_gaugechart.png`}
                        />
                    </Button>
                </Tooltip><br />
                <Tooltip message={'TimeSeries 3D'} position={'left'}>
                    <Button className='btn-flat waves-effect waves-red btn-large btn-chart' onClick={() => {}}>
                    <img alt='Mapa de sensores'
                            src={`${imgPath}graph_timeseriesplot3D.png`}
                        />
                    </Button>
                </Tooltip>
            </Card>
        );
			
	}
}