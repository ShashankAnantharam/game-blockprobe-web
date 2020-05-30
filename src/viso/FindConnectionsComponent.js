import React, { Component } from 'react';
import  MultiSelectReact  from 'multi-select-react';
import { Button, withStyles } from '@material-ui/core';
import Graph from "react-graph-vis";
import Img from 'react-image';
import './GraphComponent.css';
import { timingSafeEqual } from 'crypto';
import { isNullOrUndefined } from 'util';
import { thatReturnsThis } from 'fbjs/lib/emptyFunction';
import IsImageUrl from 'is-image-url';

import AmGraph from './amGraph/amGraph';
import Expand from 'react-expand-animated';

class FindConnectionsComponent extends React.Component {

    constructor(props){
      super(props);
      this.state={
        amGraph:{},
        graph: {
            nodes: [
              ],
            edges: [
              ]
          },
        graphHelperMap: {
            nodes:{

            },
            edges:{

            }
          },
        graphOptions: {
            layout: {
                hierarchical: false
            },
            edges: {
                arrows: {
                    to:     {enabled: false, scaleFactor:1, type:'arrow'},
                    middle: {enabled: false, scaleFactor:1, type:'arrow'},
                    from:   {enabled: false, scaleFactor:1, type:'arrow'}
                  },
                color: "#000000"
            }        
        },
        graphEvents: {
        },
        firstEntitySelectList: [
            {
                value: true, 
                label: "None", 
                id: -1
            }
        ],
        secondEntitySelectList: [
            {
                value: true, 
                label: "None", 
                id: -1
            }
        ],
        currentSelectedBlocks: [
        ],
        selectedNodes:[],
        openSelectedBlocks: false,
        wasAllOptionSelected: true,
        wasNoneOptionSelected:false,
        testVar: -1
        }

        this.initializeGraphEvents = this.initializeGraphEvents.bind(this);
        this.generateEntityLists = this.generateEntityLists.bind(this);
        this.generateGraph = this.generateGraph.bind(this);
        this.getPathViaBfs = this.getPathViaBfs.bind(this);
        this.findConnections = this.findConnections.bind(this);
        this.onSelectGraph = this.onSelectGraph.bind(this);
        this.addBlocksForNodeCharacteristic = this.addBlocksForNodeCharacteristic.bind(this);
        this.addBlocksForEdge = this.addBlocksForEdge.bind(this);
        this.isValidBlock = this.isValidBlock.bind(this);
        this.clickBlockFromList = this.clickBlockFromList.bind(this);
        this.sortBlocks = this.sortBlocks.bind(this);
        this.removeHashedIndex = this.removeHashedIndex.bind(this);

        this.generateAmGraph = this.generateAmGraph.bind(this);
        this.selectEdge = this.selectEdge.bind(this);
        this.selectNode = this.selectNode.bind(this);
        this.toggleSelectedBlocksPane = this.toggleSelectedBlocksPane.bind(this);
        this.resetScroll = this.resetScroll.bind(this);

        this.findConnectionRef = React.createRef();
    }

    resetScroll(){
        let amount = null;
        if(this.findConnectionRef){
            amount = this.findConnectionRef.current.offsetTop;
        }
        if(this.props.setScrollToGraphList)
            this.props.setScrollToGraphList(amount);
    }

    isValidBlock(block){
        if(isNullOrUndefined(block.title) || block.title=='')
            return false;
        return true;
    }

    selectEdge(from, to){
        this.setState({
            openSelectedBlocks: false
        });

        var blocksToBeSelected =[];
        var blocksAdded = {};
        var edge={
            to: to,
            from: from
        };
        this.addBlocksForEdge(edge, blocksToBeSelected, blocksAdded);
        blocksToBeSelected.sort((a, b) => this.sortBlocks(a.title,b.title,a.timestamp,b.timestamp));

        this.setState({
            currentSelectedBlocks: blocksToBeSelected,
            openSelectedBlocks: true,
            selectedNodes: [from, to]
        });

        this.resetScroll();
    }

    addBlocksForEdge(edge, blocksToBeSelected, blocksAdded){
        var edgeBlockList = this.props.investigationGraph[edge.from].edges[edge.to];

        for(var i=0;i<edgeBlockList.length;i++){
            const blockKey = edgeBlockList[i];
            if(!(blockKey in blocksAdded)){

                // Add block if it is not already in list
                const newBlock = this.props.blockTree[blockKey];

                if(this.isValidBlock(newBlock))
                {
                    blocksToBeSelected.push(newBlock);
                }
                blocksAdded[blockKey]=true;
            }
        }

    }

    selectNode(node){

        this.setState({
            openSelectedBlocks: false
        });

        var blocksToBeSelected =[];
        var blocksAdded = {};
        
        this.addBlocksForNodeCharacteristic(node, blocksToBeSelected, blocksAdded);

        var edges =  this.props.investigationGraph[node].edges;
        var scope = this;
        Object.keys(edges).forEach(function(edgeKey) {
                var edge={
                    to: node,
                    from: edgeKey
                };
                scope.addBlocksForEdge(edge, blocksToBeSelected, blocksAdded);           
        });

        blocksToBeSelected.sort((a, b) => this.sortBlocks(a.title,b.title,a.timestamp,b.timestamp));

        this.setState({
            currentSelectedBlocks: blocksToBeSelected,
            openSelectedBlocks: true,
            selectedNodes: [node]
        });

        this.resetScroll();
    }

    addBlocksForNodeCharacteristic(node, blocksToBeSelected, blocksAdded){
        var charBlockList = this.props.investigationGraph[node].char;

        for(var i=0;i<charBlockList.length;i++){
            const blockKey = charBlockList[i];

            if(!(blockKey in blocksAdded)){

                // Add block if it is not already in list
                const newBlock = this.props.blockTree[blockKey];

                if(this.isValidBlock(newBlock))
                {
                    blocksToBeSelected.push(newBlock);
                }
                blocksAdded[blockKey]=true;
            }
        }
    }

    sortBlocks(a, b, a_ts = 0, b_ts = 0){
        a = a.trim();        
        b = b.trim();

        var aIndex = 0, bIndex = 0, isAExist = false, isBExist = false;
        if(a.length>0 && a.charAt(0)==='#'){
            var num = '';
            for(var i=1; i<a.length; i++){
                
                if((!isNaN(parseInt(a.charAt(i), 10))) || a[i]==='.'){
                    num += a.charAt(i);
                }
                else{
                    if(num.length > 0){
                        aIndex = parseFloat(num);
                        isAExist = true;
                    }
                }
            }
            if(num.length > 0){
                aIndex = parseFloat(num);
                isAExist = true;
            }    
        }

        if(b.length>0 && b.charAt(0)==='#'){
            var num = '';
            for(var i=1; i<b.length; i++){
                
                if((!isNaN(parseInt(b.charAt(i), 10))) || b[i]==='.'){
                    num += b.charAt(i);
                }
                else{
                    if(num.length > 0){
                        bIndex = parseFloat(num);
                        isBExist = true;
                    }
                }
            }    
            if(num.length > 0){
                bIndex = parseFloat(num);
                isBExist = true;
            }
        
        }

        // A comes after b
        if(!isAExist && isBExist)
            return 1;

        // A comes before b
        if(isAExist && !isBExist)
            return -1;

        // A comes before b
        if(isAExist && isBExist){
            if(aIndex > bIndex)
                return 1;
            return -1;
        }

        if(a_ts > b_ts)
            return 1;
        else if(b_ts > a_ts)
            return -1;

        if(a > b)
            return 1;

        return -1;
    }

    onSelectGraph(event){

        this.setState({
            openSelectedBlocks: false
        });
        
        var { nodes, edges } = event;
        var blocksToBeSelected = [];
        var blocksAdded = {};

        if(!isNullOrUndefined(edges)){
            for(var i=0;i<edges.length;i++){
                var edgeKey = edges[i];
                var edge = this.state.graphHelperMap.edges[edgeKey];
                this.addBlocksForEdge(edge, blocksToBeSelected, blocksAdded);
            }
        }

        if(!isNullOrUndefined(nodes)){
            for(var i=0;i<nodes.length;i++){
                var nodeKey = nodes[i];
                var node = this.state.graphHelperMap.nodes[nodeKey];
                this.addBlocksForNodeCharacteristic(node, blocksToBeSelected, blocksAdded);
            }
        }

        this.setState({
            currentSelectedBlocks: blocksToBeSelected,
            openSelectedBlocks: true
        });
    }

    initializeGraphEvents(){
        const context = this;
        var events = {
            
            select: function(event) {
                context.onSelectGraph(event);
            }
    
        }

        this.setState({
            graphEvents: events
        })
    }

    getPathViaBfs(startNode, destNode){
        
        //st has attributes 
        var st=[];

        //blocksVisited has detail here such as blockCount, hops and prevDetail
        var blocksVisited = {};

        //init map and st
        blocksVisited[startNode]={
            id: startNode,
            blockCount: 0,
            hops: 0,
            prevNode: ''
        };
        st.push(startNode);

        var invGraph = this.props.investigationGraph;
        var i =0;
        while(1){
            if(i >= st.length || st[i]==destNode)
                break;

            
            var currNodeKey = st[i];
            var currNode = blocksVisited[currNodeKey];
            var currHops = currNode.hops;
            var currblockCount = currNode.blockCount;

            //get edges
            var edgeMap = invGraph[currNodeKey].edges;
            Object.keys(edgeMap).forEach(function(edgeKey) {

                var shouldUpdateEdgeNode = false;

                if(!(edgeKey in blocksVisited)){
                    shouldUpdateEdgeNode = true;

                    //first time visiting Node. push to stack 
                    st.push(edgeKey);
                }
                else{
                    if( (
                        //New hops is lesser than existing
                        blocksVisited[edgeKey].hops > currHops+1
                        ) || 
                        (
                            //Hops equal but new block count more than existing
                            (blocksVisited[edgeKey].hops == currHops+1)
                            &&
                            (currblockCount + 
                                invGraph[currNodeKey].edges[edgeKey].length 
                                > blocksVisited[edgeKey].blockCount) 
                        )
                    ){
                        shouldUpdateEdgeNode = true;
                    }
                }

                if(shouldUpdateEdgeNode){
                    blocksVisited[edgeKey] = {
                        id: edgeKey,
                        blockCount: currblockCount + invGraph[currNodeKey].edges[edgeKey].length,
                        hops: currHops + 1,
                        prevNode: currNodeKey
                    };
                }
                
            });
            
            i++;
        }

        var pathNodeKeys = {};;
        var curr = destNode;
        while((curr in blocksVisited) && (curr!=startNode)){
            pathNodeKeys[curr]=true;
            curr = blocksVisited[curr].prevNode;
        }

        //console.log("PathNodeKeys");
        //console.log(pathNodeKeys);

        var list=[];
        if(curr==startNode){
            //path found

            pathNodeKeys[startNode]=true;

            for(var i=1; i<this.state.firstEntitySelectList.length;i++){
                if(this.state.firstEntitySelectList[i].label in pathNodeKeys){
                    //Entity in path
                    var pathEntity = {
                        value: true,
                        label: this.state.firstEntitySelectList[i].label,
                        id: this.state.firstEntitySelectList[i].id
                    };
                    list.push(pathEntity);
                }
            }
        }

        return list;

    }

    findConnections(){

        var rootElement = {};
        var destElement = {};
        var list = [];
        for(var i=1; i<this.state.firstEntitySelectList.length;i++){
            if(this.state.firstEntitySelectList[i].value){
                rootElement = this.state.firstEntitySelectList[i];
            }
        }

        for(var i=1; i<this.state.secondEntitySelectList.length;i++){
            if(this.state.secondEntitySelectList[i].value){
                destElement = this.state.secondEntitySelectList[i];
            }
        }

        //do bfs here
        list = this.getPathViaBfs(rootElement.label, destElement.label);

        if(list.length == 0){
            list.push(rootElement);
            list.push(destElement);
        }

        return list;

    }

    async generateAmGraph(){
        var newGraph = [];
        var nodesMap = {};

        var selectedEntityList = this.findConnections();
        //console.log(selectedEntityList);

        if(selectedEntityList.length >= 2)
        {
            //If None is not selected only display graph
            var selectedEntityLabels = {};

            var count=0;
            for(var i=0; i<selectedEntityList.length;i++){
                var currEntity = selectedEntityList[i];
                if(currEntity.value){
                    //selected Node
                    selectedEntityLabels[currEntity.label]=count;

                    var image = null;
                    if(this.props.imageMapping){
                        //Add image
                        if(currEntity.label in this.props.imageMapping){
                            image = this.props.imageMapping[currEntity.label];
                        }
                    }
                    
                    //Add Node
                    newGraph.push({
                        id:count,
                        label:currEntity.label,
                        link: [],
                        image: image
                    });
                    nodesMap[count] = currEntity.label;

                    //Add edge
                    var currEntityKey = currEntity.label;

                    if(!isNullOrUndefined(this.props.investigationGraph)
                    && !isNullOrUndefined(this.props.investigationGraph[currEntityKey])){
                        var edgeMap = this.props.investigationGraph[currEntityKey].edges;
                        Object.keys(edgeMap).forEach(function(edgeKey) {
                            if(edgeKey in selectedEntityLabels){
                                //edge is a selection, add it
                                //console.log(nodesMap[selectedEntityLabels[edgeKey]]);
                                newGraph[selectedEntityLabels[edgeKey]].link.push(count);
                            }
                        });
                    }
                    count++;
                }
            }
        }        

        var newGraphHelper = {
            nodes: nodesMap,
            edges: {}
        }

        this.setState({amGraph:newGraph});
    }

    async generateGraph(){
        var newGraph = {
            nodes: [],
            edges: []
        };
        var nodesMap = {};

        var selectedEntityList = this.findConnections();

        if(selectedEntityList.length >= 2)
        {
            //If None is not selected only display graph
            var selectedEntityLabels = {};

            var count=0;
            for(var i=0; i<selectedEntityList.length;i++){
                var currEntity = selectedEntityList[i];
                if(currEntity.value){
                    //selected Node
                    selectedEntityLabels[currEntity.label]=count;
                    
                    //Add Node
                    newGraph.nodes.push({
                        id:count,
                        label:currEntity.label
                    });
                    nodesMap[count] = currEntity.label;

                    //Add edge
                    var currEntityKey = currEntity.label;
                    var edgeMap = this.props.investigationGraph[currEntityKey].edges;
                    Object.keys(edgeMap).forEach(function(edgeKey) {
                        if(edgeKey in selectedEntityLabels){
                            //edge is a selection, add it
                            newGraph.edges.push({
                                from: selectedEntityLabels[edgeKey],
                                to: count,
                                id: selectedEntityLabels[edgeKey]+'-'+count
                            });
                        }
                    });
                    count++;
                }
            }
        }

        var newGraphHelper = {
            nodes: nodesMap,
            edges: {}
        }

        for(var i=0;i<newGraph.edges.length;i++){
            var edge = newGraph.edges[i];
            var to_id = nodesMap[edge.to];
            var from_id = nodesMap[edge.from];
            newGraphHelper.edges[edge.id] = {from:from_id, to:to_id};
        }

        await this.setState({
            graph: newGraph,
            graphHelperMap: newGraphHelper 
        });

    }

    generateEntityLists(){
        var count = 1;
        var firstEntityList = this.state.firstEntitySelectList;
        var secondEntityList = this.state.secondEntitySelectList;
        Object.keys(this.props.investigationGraph).forEach(function(entityLabel) {
            firstEntityList.push({                
                    value: false, 
                    label: entityLabel, 
                    id: count             
            });
            secondEntityList.push({                
                value: false, 
                label: entityLabel, 
                id: count             
            });
            count++;
        });

        firstEntityList.sort(function(a,b){
            if(a.label.toLocaleLowerCase() == 'none')
                return -1;
            if(b.label.toLocaleLowerCase() == 'none')
                return 1;
            if(a.label.toLocaleLowerCase() < b.label.toLocaleLowerCase())
                return -1;
            return 1;
        });
        secondEntityList.sort(function(a,b){
            if(a.label.toLocaleLowerCase() == 'none')
                return -1;
            if(b.label.toLocaleLowerCase() == 'none')
                return 1;
            if(a.label.toLocaleLowerCase() < b.label.toLocaleLowerCase())
                return -1;
            return 1;
        });


        this.setState({
            firstEntitySelectList: firstEntityList,
            secondEntitySelectList: secondEntityList
        });
    }

    removeHashedIndex(a){
        a = a.trim();
        var startI = 0;
        if(a.length>0 && a[0]=='#'){
            for(var i=1; i<a.length; i++){
                startI = i;
                if(a.charAt(i)==' '){
                    return a.substring(startI).trim();
                }
            } 
            return '';   
        }
        return a;
    }

    BlockEntity(entity){
        return(
        <span className="graph-block-entity">
            {entity.title}
        </span>
        );  
    }

    BlockEvidence(evidence, index){
        const WebView = require('react-electron-web-view');
        let evidenceList = [evidence.evidenceLink];
        let isImageUrl = IsImageUrl(evidence.evidenceLink);
        if(isImageUrl){
            return (
                <div className='graph-block-evidence'>
                        <Img src={evidenceList} className="graph-block-evidence-image"></Img>
                </div>
            );
        }
        return(
                    null
        );
    } 

    SingleBlock(singleBlock){
        
        /*
         Create render template for the entities
         */
        var renderBlockEntities = '';
        if(singleBlock.entities!=null && singleBlock.entities.length>0){            
            renderBlockEntities = singleBlock.entities.map((blockEntity) => 
               this.BlockEntity(blockEntity)
           );            
       }

       var renderBlockEvidences="";
       if(singleBlock.evidences!=null && singleBlock.evidences.length>0){            
        renderBlockEvidences = singleBlock.evidences.map((blockEvidence, index) => 
           this.BlockEvidence(blockEvidence, index)
       );            
       }

       return(
        <div className="graph-block-para-div"
        onClick={() => { this.clickBlockFromList(singleBlock)}}>
            <h4 className="graph-block-title">{this.removeHashedIndex(singleBlock.title)}</h4>
            <div className="graph-content-container">
                    <p className="graph-block-text">
                        {singleBlock.summary}
                    </p> 
                    <div class="graph-block-evidence-container">
                        {renderBlockEvidences}                       
                    </div>
            </div>                    
        </div>
        );
    }



    firstEntityClicked(entityList) {
        this.setState({ firstEntitySelectList: entityList });
    }
    
    firstSelectedBadgeClicked(entityList) {
        this.setState({ firstEntitySelectList: entityList });
    }

    secondEntityClicked(entityList) {
        this.setState({ secondEntitySelectList: entityList });
    }
    
    secondSelectedBadgeClicked(entityList) {
        this.setState({ secondEntitySelectList: entityList });
    }

    clickBlockFromList(block){
        this.props.selectBlock(block);
    }

    componentDidMount(){
        this.initializeGraphEvents();
        this.generateEntityLists();
        this.generateGraph();

    }

    toggleSelectedBlocksPane(){
        this.setState({
            openSelectedBlocks: !this.state.openSelectedBlocks
        });        
    }

    render(){


        const selectedOptionsStyles = {
            color: "white",
            backgroundColor: "rgb(117, 106, 214)",
            borderRadius:"20px",
            fontSize:'0.6em',
            padding:'10px',
            maxWidth: '92%',
            wordWrap: 'break-word'
        };
        const optionsListStyles = {
            backgroundColor: "darkcyan",
            color: "white",

        };
        const transitions = ["height", "opacity", "background"];

        var renderBlocks = this.state.currentSelectedBlocks.map((selectedBlock) => 
               this.SingleBlock(selectedBlock)
           );     
           
        let selectedNodesString = ': ';
        for(let i=0; i<this.state.selectedNodes.length; i++){
            selectedNodesString += this.state.selectedNodes[i] + ', ';
        }
        if(selectedNodesString.length > 0)
            selectedNodesString = selectedNodesString.substring(0,selectedNodesString.length - 2);
        
        return (
            <div>
                <div className='filter-container'>                
                
                    <div className="find-connections-dropdown-container">
                        <MultiSelectReact 
                        options={this.state.firstEntitySelectList}
                        optionClicked={this.firstEntityClicked.bind(this)}
                        selectedBadgeClicked={this.firstSelectedBadgeClicked.bind(this)}
                        selectedOptionsStyles={selectedOptionsStyles}
                        optionsListStyles={optionsListStyles} 
                        isSingleSelect={true}
                        isTextWrap={false} 
                        />
                        
                    </div>

                    <div className="find-connections-dropdown-container">
                        <MultiSelectReact 
                        options={this.state.secondEntitySelectList}
                        optionClicked={this.secondEntityClicked.bind(this)}
                        selectedBadgeClicked={this.secondSelectedBadgeClicked.bind(this)}
                        selectedOptionsStyles={selectedOptionsStyles}
                        optionsListStyles={optionsListStyles} 
                        isSingleSelect={true}
                        isTextWrap={false} 
                        />    
                    </div>

                    <button className="filterButton" onClick={this.generateAmGraph}>Find Connection</button>
                </div>
                                           
                    {this.state.currentSelectedBlocks.length >= 0? 
                        <div className="graph-block-list">
                            <div className='graph-block-list-title' onClick={this.toggleSelectedBlocksPane} ref={this.findConnectionRef}>
                                <span>Graph selections</span>  
                                <span>{selectedNodesString}</span>
                            </div> 
                            <Expand 
                                open={this.state.openSelectedBlocks}
                                duration={1000}
                                transitions={transitions}>
                                <div className='graph-block-list-container' id="graph-selected-block-list">
                                    {renderBlocks}
                                </div>
                            </Expand>
                        </div>                      
                        :
                        null}                      
                    <div className="graph-main">
                        <AmGraph 
                                graph={this.state.amGraph}  
                                selectEdge = {this.selectEdge}    
                                selectNode = {this.selectNode}                    
                                />
                    </div>  
            </div>
        );
    }

}
export default FindConnectionsComponent;


/* <div className="graph-main">
                        <Graph 
                                 graph={this.state.graph} 
                                 options={this.state.graphOptions} 
                                 events={this.state.graphEvents} 
                                />
                    </div> */