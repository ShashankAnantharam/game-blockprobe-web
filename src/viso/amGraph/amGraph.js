import React, { Component } from 'react';
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import * as am4plugins_forceDirected from "@amcharts/amcharts4/plugins/forceDirected"; 
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import * as am4plugins_bullets from "@amcharts/amcharts4/plugins/bullets";

am4core.useTheme(am4themes_animated);

class AmGraph extends React.Component {

    constructor(props){
      super(props);
      //graph
      
      this.generateAmForceDirectedGraph = this.generateAmForceDirectedGraph.bind(this);
      this.prepareData = this.prepareData.bind(this);
      this.chart = {};
      this.selectedLink = null;

      this.previousChart = JSON.parse(JSON.stringify(props.graph));
    }

    prepareData(data){
        var newData = [];

        for(var i=0; data && i<data.length; i++){
            var newEntry = JSON.parse(JSON.stringify(data[i]));
            if(newEntry.image && newEntry.image.length>0){
                newEntry.imageDisabled = false;
                newEntry.circleDisabled = true;
            }
            else{
                newEntry.imageDisabled = true;
                newEntry.circleDisabled = false;
            }

            if(newEntry.label == 'ALL'){
                newEntry.isNotAll = false;
                newEntry.imageDisabled = true;
                newEntry.circleDisabled = true;
            }
            else{
                newEntry.isNotAll = true;
            }          

            newData.push(newEntry);
        }

        return newData;
    }

    generateAmForceDirectedGraph(){
        // Create chart
        var chart = am4core.create("chartdiv", am4plugins_forceDirected.ForceDirectedTree);

        // Create series
        var series = chart.series.push(new am4plugins_forceDirected.ForceDirectedSeries());


       //console.log(graph);
        series.data = this.prepareData(this.props.graph);
 
        // Set up data fields
        series.dataFields.value = "value";
        series.dataFields.name = "label";
        series.dataFields.id = "id";
        series.dataFields.children = "children";
        series.dataFields.linkWith = "link";

        // Add labels
        series.nodes.template.label.text = "{name}";
        series.nodes.template.tooltipText = "{name}";

      //  /*
        series.nodes.template.label.valign = "bottom";
        series.nodes.template.label.fill = am4core.color("#000");
        series.nodes.template.label.dy = -30;
      //  */
        /*
        series.nodes.template.label.hideOversized = true;
        series.nodes.template.label.truncate = true;
        */

        series.fontSize = 13;
        series.minRadius = 10;
        series.maxRadius = 10;
        series.nodes.template.label.propertyFields.hidden = 'circleDisabled';
        series.nodes.template.togglable = false;
        
         // Configure circles
         series.nodes.template.circle.propertyFields.disabled = 'circleDisabled';
         series.nodes.template.outerCircle.propertyFields.disabled = 'circleDisabled';

        // Configure icons
        var icon = series.nodes.template.createChild(am4plugins_bullets.PinBullet);
        icon.image = new am4core.Image();
        icon.image.propertyFields.href = "image";
        icon.circle.radius = 25;
        icon.circle.strokeWidth = 0;        
        icon.background.pointerLength = 0;
        icon.background.disabled = true;
        
        var outlineCircle = icon.createChild(am4core.Circle);
        outlineCircle.adapter.add("radius", function (radius, target) {
            var circleBullet = target.parent;
            return circleBullet.circle.radius + 2;
        });
        outlineCircle.propertyFields.disabled = 'imageDisabled';        

        // Configure All node icon
        var allNode = series.nodes.template.createChild(am4core.Circle);
        allNode.radius = 27;
        allNode.strokeOpacity = 1;
        allNode.strokeWidth = 9;
        allNode.stroke = am4core.color('black');
        allNode.fillOpacity = 1;
        allNode.fill = am4core.color('rgb(240,240,240)');
        allNode.propertyFields.disabled = 'isNotAll';              

        series.centerStrength = 0.55;
        series.manyBodyStrength = -38;
        series.links.template.strength = 0.5;
        series.links.template.strokeWidth = 5;

        var scope = this;

        series.links.template.interactionsEnabled = true;        
        series.links.template.clickable = true;
        series.links.template.distance = 8.5;
        series.links.template.events.on("hit", function (event) {                
            var link = event.target;            
            link.strokeWidth = 9;        
            if(scope.selectedLink)
                scope.selectedLink.strokeWidth = 5;
            scope.selectedLink = link;    
            scope.props.selectEdge(link.source.label.currentText, link.target.label.currentText);
        });

        series.nodes.template.events.on("hit", function (event) {                
            var node = event.target;      
            if(scope.selectedLink)
                scope.selectedLink.strokeWidth = 5;
            scope.selectedLink = null;    
            scope.props.selectNode(node.label.currentText);
        });

        this.chart =  chart;
    }


    componentDidMount() {
      this.generateAmForceDirectedGraph();
    }

    componentDidUpdate(){
        if(JSON.stringify(this.previousChart) != JSON.stringify(this.props.graph)){
            this.generateAmForceDirectedGraph();
            this.previousChart = JSON.parse(JSON.stringify(this.props.graph));
        }
    }

    render(){
        return(
            <div id="chartdiv" style={{ width: "100%", height: "100%" }}></div>
        );
    }
}
export default AmGraph;