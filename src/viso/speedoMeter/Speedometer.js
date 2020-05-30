import React, { Component } from 'react';
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import * as am4plugins_forceDirected from "@amcharts/amcharts4/plugins/forceDirected"; 
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import * as am4plugins_bullets from "@amcharts/amcharts4/plugins/bullets";
import { isNullOrUndefined } from 'util';

am4core.useTheme(am4themes_animated);

class Speedometer extends React.Component {

    constructor(props){
      super(props);
      //id, min, max, val, color

      this.chart = null;
      this.hand = null;
      this.range0 = null;
      this.range1 = null;

      this.generateSpeedometer = this.generateSpeedometer.bind(this);
      this.moveHand = this.moveHand.bind(this);
    }

    generateSpeedometer(){
        var chart = am4core.create(this.props.id, am4charts.GaugeChart);
        chart.hiddenState.properties.opacity = 0; // this makes initial fade in effect
        chart.radius = am4core.percent(100);
        chart.innerRadius = am4core.percent(87);

        var axis = chart.xAxes.push(new am4charts.ValueAxis());
        axis.min = this.props.min;
        axis.max = this.props.max;
        axis.strictMinMax = true;
        axis.renderer.ticks.template.disabled = true;
        axis.renderer.grid.template.disabled = true;
        axis.renderer.labels.template.disabled = true;

        var colorSet = new am4core.ColorSet();

        var range0 = axis.axisRanges.create();
        range0.value = this.props.min;
        range0.endValue = this.props.val;
        range0.axisFill.fillOpacity = 1;
        range0.axisFill.fill = am4core.color('#556efd');
        if(!isNullOrUndefined(this.props.color)){
            range0.axisFill.fill = am4core.color(this.props.color);
        }
        range0.axisFill.zIndex = - 1;

        var range1 = axis.axisRanges.create();
        range1.value = this.props.val;
        range1.endValue = this.props.max;
        range1.axisFill.fillOpacity = 1;
        range1.axisFill.fill = am4core.color('#999999');
        range1.axisFill.zIndex = -1;

        var hand = chart.hands.push(new am4charts.ClockHand());
        hand.pin.disabled = false;
        hand.strokeWidth = 0;
        hand.fill = am4core.color("#556efd");
        if(!isNullOrUndefined(this.props.color)){
            hand.fill = am4core.color(this.props.color);
        }
        hand.showValue(Math.min(Math.max(this.props.val, this.props.min), this.props.max));

        this.chart = chart;
        this.hand = hand;
        this.range0 = range0;
        this.range1 = range1;

    }

    moveHand(newVal){
        if(isNullOrUndefined(this.chart) || isNullOrUndefined(this.hand) || 
        isNullOrUndefined(this.range0) || isNullOrUndefined(this.range1))
            return ;
        this.chart.setTimeout(randomValue, 500);
        let scope = this;
        function randomValue() {
            scope.hand.showValue(Math.min(Math.max(newVal, scope.props.min), scope.props.max),1000, am4core.ease.cubicOut);
            scope.range0.endValue = newVal;
            scope.range1.value = newVal;
        }
    }

    componentWillReceiveProps(nextProps){
        if(this.props.val != nextProps.val){
            this.moveHand(nextProps.val);
        }
    }

    componentDidMount(){
        this.generateSpeedometer();
    }

    render(){
        return(
            <div id={this.props.id} style={{ width: "100%", height: "100%" }}></div>
        );
    }
}
export default Speedometer;