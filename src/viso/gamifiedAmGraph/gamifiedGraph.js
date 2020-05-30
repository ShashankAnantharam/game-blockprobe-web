import React, { Component } from 'react';
import ReactGA from 'react-ga';
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import * as am4plugins_forceDirected from "@amcharts/amcharts4/plugins/forceDirected"; 
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import * as am4plugins_bullets from "@amcharts/amcharts4/plugins/bullets";
import * as Const from '../../common/constants';
import { isNullOrUndefined } from 'util';

am4core.useTheme(am4themes_animated);

class GamifiedGraph extends React.Component {

    constructor(props){
      super(props);
      //graph, selectedNodes
      
      this.generateAmForceDirectedGraph = this.generateAmForceDirectedGraph.bind(this);
      this.prepareData = this.prepareData.bind(this);
      this.chart = {};
      this.data = [];
      this.refData = [];
      this.edgeList = [];
      this.selectedEdges={};
      this.selectedLink = null;
      this.prevNode = null;
      this.prevLinksWith = null;
      this.currIndex = 0;
      this.count = 0;
      this.totalCnt = 0;

      this.previousChart = JSON.parse(JSON.stringify(props.graph));

      this.getDesiredLink = this.getDesiredLink.bind(this);
      this.hasEdgeBeenSelected = this.hasEdgeBeenSelected.bind(this);

      ReactGA.initialize('UA-143383035-1');  
    }

    hideNode(list, index, shouldHide){
        list[index].nodeDisabled = shouldHide;
    }

    showOnlyNodes(list, nodes){
        for(let i=0; !isNullOrUndefined(list) && i<list.length; i++){
            if(list[i].label in nodes)
                this.hideNode(list,i,false);
            else
                this.hideNode(list,i,true);
        }
    }

    getNodesToBeDisplayed(){
        let edgeList = this.edgeList;
        let nodes = {};
        if(edgeList.length <= 0)
            return nodes;
        let len = edgeList.length;

        let totalCnt = 0;
        let i = (this.currIndex)%len;
        while(1){
            i = (i+1)%len;
            if(!this.hasEdgeBeenSelected(edgeList[i].f,edgeList[i].s)){
                nodes[edgeList[i].f]='';
                nodes[edgeList[i].s]='';   
                totalCnt++;
            }
            if(Object.keys(nodes).length == Const.nodesToBeDisplayed)
                break;            

            if(i==(this.currIndex%len))
                break;
        }
        this.currIndex = i;

        while((Object.keys(nodes).length < Const.nodesMinPossible))
        {
            i = (i+1)%len;
            //Dummy nodes                        
            if(this.hasEdgeBeenSelected(edgeList[i].f,edgeList[i].s)){
                nodes[edgeList[i].f]='';
                nodes[edgeList[i].s]='';                   
            }
            if(i==(this.currIndex%len))
                break;
        }
        this.count = 0;
        this.totalCnt = totalCnt;
        return nodes;
    }

    reshuffleGraphNodes(data){
        let nodeMap = this.getNodesToBeDisplayed();
        //console.log(nodeMap);
        this.showOnlyNodes(data,nodeMap);
    }

    getEdgeList(data){
        var edgeList = [];

        for(var i=0; data && i<data.length; i++){
            var newEntry = JSON.parse(JSON.stringify(data[i]));
            if(!(newEntry.label == 'ALL')){
                if(newEntry.link){
                    for(let j=0; j<newEntry.link.length; j++){
                        edgeList.push({
                            f: newEntry.label,
                            s: data[newEntry.link[j]].label,
                            selected: false
                        })
                    }
                }
            }
        }
        return edgeList;
    }

    prepareData(data, isRefData){
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

            newEntry.color = am4core.color(Const.edenColors[(i%(Const.edenColors.length))]);
            if(newEntry.label == 'ALL'){
                newEntry.isNotAll = false;
                newEntry.imageDisabled = true;
                newEntry.circleDisabled = true;
            }
            else{
                newEntry.isNotAll = true;
            }         
            
            if(!isRefData)
                delete newEntry['link'];

            if(!(newEntry.label == 'ALL')){
                newData.push(newEntry);
            }
        }

        return newData;
    }

    getDesiredLink(linksWithList, nodeA, nodeB){
        for(let i=0; !isNullOrUndefined(linksWithList) && i<linksWithList.length; i++){
            let linkList = linksWithList[i];
            if(!isNullOrUndefined(linkList)){
                for(let key in linkList){
                    let link = linkList[key];
                    let source = link.source.label.currentText; 
                    let target = link.target.label.currentText;
                    if(source != target && ((source==nodeA && target == nodeB) || (source==nodeB && target == nodeA))){
                        return link;
                    }
                }
            }
        }
        return null;
    }

    hasEdgeBeenSelected(nodeA, nodeB){
        if(isNullOrUndefined(nodeA) || isNullOrUndefined(nodeB))
            return;

        if((String(nodeA + ',_CCC_,' + nodeB) in this.selectedEdges) || (String(nodeB + ',_CCC_,' + nodeA) in this.selectedEdges))
            return true;
        return false;
    }

    addSelectedEdgeToMap(nodeA, nodeB){
        this.selectedEdges[String(nodeA + ',_CCC_,' + nodeB)] = true;
    }

    getCenterStrength(numberOfNodes){
        // Assume linear
        return (0.2772727 + (0.022727)*numberOfNodes);
    }

    getBodyStrength(numberOfNodes){
        //Assume linear
        return (0.170454*numberOfNodes - 40.04545); 
    }

    generateAmForceDirectedGraph(data){
        // Create chart
        var chart = am4core.create("chartdiv", am4plugins_forceDirected.ForceDirectedTree);

        // Create series
        var series = chart.series.push(new am4plugins_forceDirected.ForceDirectedSeries());

        let numberOfNodes = this.data.length;

       //console.log(graph);
        series.data = this.data;
 
        // Set up data fields
        series.dataFields.value = "value";
        series.dataFields.name = "label";
        series.dataFields.id = "id";
        series.dataFields.children = "children";
        series.dataFields.linkWith = "link";
        series.dataFields.color = "color";

        // Add labels
        series.nodes.template.label.text = "{name}";
        series.nodes.template.tooltipText = "{name}";
        series.nodes.template.id = "{id}";

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
        series.propertyFields.fill = "color";
        series.nodes.template.label.propertyFields.hidden = 'circleDisabled';
        series.nodes.template.togglable = false;
        series.nodes.template.propertyFields.disabled = "nodeDisabled";
        
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

        if(window.innerWidth > 600){
            icon.background.radius = 35;
            icon.circle.radius = 35;
        }
        
        var outlineCircle = icon.createChild(am4core.Circle);
        outlineCircle.propertyFields.fill = "color";
        outlineCircle.adapter.add("radius", function (radius, target) {
            var circleBullet = target.parent;
            return circleBullet.circle.radius + 2;
        });
        outlineCircle.propertyFields.disabled = 'imageDisabled';        

        // Configure All node icon
        var allNode = series.nodes.template.createChild(am4core.Rectangle3D);
        allNode.width = 35;
        allNode.height = 15;
        allNode.depth = 35;
        allNode.angle = 45;
        allNode.strokeOpacity = 1;
        allNode.strokeWidth = 1.25;
        allNode.stroke = am4core.color('black');
        allNode.fillOpacity = 0.85;
        allNode.fill = am4core.color('rgb(240,240,240)');
        allNode.propertyFields.disabled = 'isNotAll';          

        series.centerStrength = this.getCenterStrength(numberOfNodes);
        series.manyBodyStrength = this.getBodyStrength(numberOfNodes);
        series.links.template.strength = 0.5;
        series.links.template.strokeWidth = 5;

        var scope = this;

        series.links.template.interactionsEnabled = true;        
        series.links.template.clickable = true;
        series.links.template.distance = 8.5;
        series.links.template.events.on("hit", function (event) {                
            var link = event.target;  
            if(!scope.hasEdgeBeenSelected(link.source.label.currentText, link.target.label.currentText))
                return;
            link.strokeWidth = 9;        
            if(scope.selectedLink)
                scope.selectedLink.strokeWidth = 5;          
            scope.selectedLink = link;
            scope.props.selectEdge(link.source.label.currentText, link.target.label.currentText);            
        });

        

        series.nodes.template.events.on("hit", function (event) {
            if(scope.props.disabled){
                return;
            }

            if(scope.selectedLink)
                scope.selectedLink.strokeWidth = 5;
            let prevNode = scope.props.selectedNodes['f'];
            let currNode = scope.props.selectedNodes['s'];
            var node = event.target;
            if(currNode != null){
                //Something already  was selected. Clear the whole thing
                scope.props.setNodeVal('s',null);
                scope.props.setNodeVal('f',null);
                prevNode = null;
                currNode = null;
            }                
            let isEdgeSelected = false;
            if(!isNullOrUndefined(prevNode) && !isNullOrUndefined(prevNode.label))
                isEdgeSelected = scope.hasEdgeBeenSelected(node.label.currentText, prevNode.label.currentText);
            if(!isNullOrUndefined(prevNode) && !isEdgeSelected && prevNode != node){
                let linksWith = node.linksWith;
                if(!isNullOrUndefined(linksWith))
                    linksWith = linksWith._dictionary;
                else
                    linksWith = {};

                // console.log(linksWith); 
                // console.log(scope.prevLinksWith);  
                
                let link = scope.getDesiredLink([linksWith,scope.prevLinksWith], node.label.currentText, prevNode.label.currentText);
                // console.log(link);
                if(!isNullOrUndefined(link)){
                    link.strokeWidth = 5;
                }
                else{
                    //Wrong link
                    scope.connectEdge(node.label.currentText, prevNode.label.currentText);                  
                }
                scope.props.setNodeVal('s',node);
                //prevNode = null;
                scope.prevLinksWith = null;
            }
            else{
                if(prevNode == node){
                    //Tell user to pick another node!
                }
                                
                if(isEdgeSelected){
                    //Tell user that edge has already been made!
                    scope.props.setGameMessage('alreadySelected');
                    scope.props.setNodeVal('s',node);
                }
                else{
                    scope.props.setNodeVal('f',node);
                    scope.props.playNodeSound(node.label.currentText);
                }
                
                if(!isNullOrUndefined(node.linksWith))
                    scope.prevLinksWith = node.linksWith._dictionary;
                else
                    scope.prevLinksWith = {}; 
            }
        });

        this.chart =  chart;
    }


    componentDidMount() {
        this.data = this.prepareData(this.props.graph, false);
        this.edgeList = this.getEdgeList(this.props.graph);
        this.refData = this.prepareData(this.props.graph, true);
        if(Object.keys(this.data).length > Const.nodesToBeDisplayed)
            this.reshuffleGraphNodes(this.data);
        this.generateAmForceDirectedGraph();
    }

    componentDidUpdate(){
        if(JSON.stringify(this.previousChart) != JSON.stringify(this.props.graph)){
            this.generateAmForceDirectedGraph();
            this.previousChart = JSON.parse(JSON.stringify(this.props.graph));
        }
    }

    connectEdge(node1, node2){       
        let data = this.chart.series.values[0].data;
        let index1 =-1, index2 = -1;
        let canConnect = false;

        for(let i=0; i<data.length; i++){
            if(data[i].label == node1){
                index1 = i;
            }
            else if(data[i].label == node2){
                index2 = i;
            }
        }

        if(index1!=-1 && index2!=-1){
            for(let i=0; !isNullOrUndefined(this.refData) && !isNullOrUndefined(this.refData[index1].link) 
            && i<this.refData[index1].link.length; i++){
                if(this.refData[index1].link[i] == index2){
                    canConnect = true;                    
                }
            }

            for(let i=0; !isNullOrUndefined(this.refData) && !isNullOrUndefined(this.refData[index2].link) 
            && i<this.refData[index2].link.length; i++){
                if(this.refData[index2].link[i] == index1){
                    canConnect = true;                    
                }
            }
        }

        let scope = this;
        if(canConnect){
            if(!('link' in data[index1])){
                data[index1].link = [];
            }
            data[index1].link.push(index2);
            if(Object.keys(this.data).length > Const.nodesToBeDisplayed && this.count > Math.floor(Const.reshuffleCriteria*this.totalCnt))
                this.reshuffleGraphNodes(data);
            this.data = data;

            this.chart.series.values[0].invalidateData();
            if(!isNullOrUndefined(node1) && !isNullOrUndefined(node2)){
                scope.addSelectedEdgeToMap(node1, node2);
                scope.props.selectEdge(node1, node2);
                scope.props.setGameMessage('successLink');
                this.count = this.count+1; 
                ReactGA.event({
                    category: 'connect_edge',
                    action: 'Connect ' + String(node1) +  ", " + String(node2),
                    label: String(node1) + ", " + String(node2)
                  });               
            }
        }
        else{
            scope.props.setGameMessage('failLink');
            scope.props.setEntityStats(node1,false);
            scope.props.setEntityStats(node2,false);
        }
    }

    render(){
        return(
            <div id="chartdiv" style={{ width: "100%", height: "100%" }}></div>
        );
    }
}
export default GamifiedGraph;