export class CustomTimeSeries{
    
    chartData = [];
    type="scatter";
    mode="lines+markers";

    constructor(_chartData, _){
        this.chartData = _chartData;
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

    getData(){
        let data = [...this.chartData['data']];
        //console.log(this.chartData);

        let position = [0, 0.95, 0.05, 1];
        let plotlyData = [];
        let plotlyType = this.type;
        let plotlyLayout = {
            height: 400,
            barmode: 'group',
            title: this.chartData['title'],
            xaxis: {
                titlefont: { color: "#888888", size: 11 },
                tickfont: { color: "#888888", size: 11 },
                title: `<b>${this.chartData['data'][0][0]}</b>`,
                domain: [0.05, 0.95],
            },
            annotations: [{
                text: this.chartData['subtitle'],
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
        //console.log(DataHeader);
        let axisCount = {};

        for(var x = 1; x < DataHeader[0].length; x++){
            let newStyle = false;
            if(!axisCount[this.chartData['y-axis'][x-1][1]]){
                axisCount[this.chartData['y-axis'][x-1][1]] = Object.keys(axisCount).length+1;
                newStyle = true;
            }
            let estilo = {
                title: "<b>" + this.chartData['y-axis'][x-1][1] + "</b>",
                titlefont: { color: "#888888", size: 11 },
                tickfont: { color: "#888888", size: 11 },
                side: this.plotAxisSide(),
                position: position[(axisCount[this.chartData['y-axis'][x-1][1]])-1]
            };
            let datos = {
                x: data.map(a => a[0]),
                y: data.map(a => a[x]),
                type: plotlyType,
                connectgaps: false,
                name: DataHeader[0][x],
                mode: this.mode
            };
            if(x>1){
                datos["yaxis"] = "y" + axisCount[this.chartData['y-axis'][x-1][1]];
                estilo["overlaying"] = "y";
                estilo["anchor"] = this.plotAxisAnchor();
            }

            plotlyData.push(datos);
            if(newStyle){
            plotlyLayout["yaxis" + axisCount[this.chartData['y-axis'][x-1][1]]] =  estilo;
            }
        }

        return [plotlyData,plotlyLayout];
    }

}