import React, { Component } from 'react';
import  MultiSelectReact  from 'multi-select-react';
import { Button } from '@material-ui/core';
import Graph from "react-graph-vis";
import Alert from '@material-ui/lab/Alert';
import './GraphComponent.css';
import { timingSafeEqual } from 'crypto';
import { isNullOrUndefined } from 'util';
import { thatReturnsThis } from 'fbjs/lib/emptyFunction';
import Img from 'react-image';
import IsImageUrl from 'is-image-url';
import ReactGA from 'react-ga';
import AmGraph from './amGraph/amGraph';
import GamifiedGraph from './gamifiedAmGraph/gamifiedGraph';
import Speedometer from './speedoMeter/Speedometer';
import Expand from 'react-expand-animated';
import ExpandMore from '@material-ui/icons/ExpandMore';
import ExpandLess from '@material-ui/icons/ExpandLess';
import PlayArrow from '@material-ui/icons/PlayArrow';
import Pause from '@material-ui/icons/Pause';
import Stop from '@material-ui/icons/Stop';
import GamifiedGraphStats from './gamifiedStats/gamifiedGraphStats';
import Speech from 'speak-tts';
import UIfx from 'uifx';
import WellDoneMp3 from  '../media/well_done.mp3';
import TryAgainMp3 from '../media/try_again.mp3';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import * as firebase from 'firebase';
import * as Utils from '../common/utilSvc';
import * as Locale from '../Localization/localizedStrings';

const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
const isIE = /*@cc_on!@*/false || !!document.documentMode;

const wellDone = new UIfx(
    WellDoneMp3,
    {
      volume: 0.65, // number between 0.0 ~ 1.0
      throttleMs: 100
    }
);
const tryAgain = new UIfx(
    TryAgainMp3,
    {
      volume: 0.65, // number between 0.0 ~ 1.0
      throttleMs: 100
    }
);

class GamifiedGraphComponent extends React.Component {

    constructor(props){
        //props: isPublic, selectNode
      super(props);
      this.state={
        graph: {
            nodes: [
              ],
            edges: [
              ]
          },
        stopGame: false,
        stats: {
            score: 0,
            entityStats: {},
            totalScore: 0
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
        multiSelectEntityList: [
            {
                value: true, 
                label: "All", 
                id: 0
            },
            {
                value: false, 
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
        playStatus: 'end',
        languageSupportedPlay: true,
        copiedText: false,
        score: 0,
        totalScore: Utils.getTotalEdges(props.investigationGraph),
        gameMessageFinished: 'Congratulations! You did it!',
        testVar: -1,
        gameNodeSelections: {
            f: null,
            s: null   
        },
        gameMessage: null  //Edge selected or already selected or wrong
        }

        this.graphHelperMap= {
            nodes:{

            },
            edges:{

            }
          };

        this.entityStatistics = {};
        this.speech = null;
        this.prevNode = null;

        this.handleAllAndNoneOptions = this.handleAllAndNoneOptions.bind(this);
        this.initializeGraphEvents = this.initializeGraphEvents.bind(this);
        this.generateGraph = this.generateGraph.bind(this);
        this.onSelectGraph = this.onSelectGraph.bind(this);
        this.addBlocksForNodeCharacteristic = this.addBlocksForNodeCharacteristic.bind(this);
        this.addBlocksForEdge = this.addBlocksForEdge.bind(this);
        this.isValidBlock = this.isValidBlock.bind(this);
        this.clickBlockFromList = this.clickBlockFromList.bind(this);
        this.sortBlocks = this.sortBlocks.bind(this);
        this.removeHashedIndex = this.removeHashedIndex.bind(this);
        this.AgregateNumberDisplay = this.AgregateNumberDisplay.bind(this);

        this.generateAmGraph = this.generateAmGraph.bind(this);
        this.selectEdge = this.selectEdge.bind(this);
        this.selectNode = this.selectNode.bind(this);
        this.toggleSelectedBlocksPane = this.toggleSelectedBlocksPane.bind(this);
        this.resetScroll = this.resetScroll.bind(this);

        this.initSpeech = this.initSpeech.bind(this);
        this.playNodeSound = this.playNodeSound.bind(this);
        this.playExistingSelection = this.playExistingSelection.bind(this);
        this.pauseExistingSelection = this.pauseExistingSelection.bind(this);
        this.resumeExistingSelection = this.resumeExistingSelection.bind(this);
        this.stopExistingSelection = this.stopExistingSelection.bind(this);
        this.timeoutFn = this.timeoutFn.bind(this);
        this.timeInFn = this.timeInFn.bind(this);

        this.setNodeVal = this.setNodeVal.bind(this);
        this.clearGamifiedEntity = this.clearGamifiedEntity.bind(this);
        this.BlockEntity = this.BlockEntity.bind(this);
        this.setGameMessage = this.setGameMessage.bind(this);
        this.incrementScore = this.incrementScore.bind(this);
        this.setEntityStats = this.setEntityStats.bind(this);
        this.stopGame = this.stopGame.bind(this);
        
        this.graphRef = React.createRef();

        ReactGA.initialize('UA-143383035-1');  
    }

    incrementScore(){        
        this.setState({
            score: this.state.score + 1
        });
    }

    setEntityStats(entityName, isCorrect){
        if(!isCorrect){
            if(!(entityName in this.entityStatistics)){
                this.entityStatistics[entityName] = 0;
            }
            this.entityStatistics[entityName] = this.entityStatistics[entityName] + 1;
        }
    }

    setGameMessage(type){
        let message = null;
        if(type == 'alreadySelected')
        {
            if(this.props.playSound)
                tryAgain.play();
            message = "This connection has already been made. Try another one!";
        }
        else if(type == 'successLink'){
            if(this.props.playSound)
                wellDone.play();
            message = "Yes! You got it right!";
            this.incrementScore();
        }
        else if(type == 'failLink'){
            if(this.props.playSound)
                tryAgain.play();
            message = "No! You got it wrong! These topics are not connected";
        }
        this.setState({
            gameMessage: message
        });
    }

    setNodeVal(type,node){
        //type: f,s
        let gameNodeSelections = this.state.gameNodeSelections;
        gameNodeSelections[type] = node;
        if(node==null && this.state.gameMessage!=null){
            this.setState({
                gameMessage: null
            });
        }

        this.setState({
            gameNodeSelections:gameNodeSelections
        });
    }

    clearGamifiedEntity(type){
        //type: f,s
        let gameNodeSelections = this.state.gameNodeSelections;
        gameNodeSelections[type] = null;

        if(type=='f'){
            gameNodeSelections['f'] = gameNodeSelections['s'];
            gameNodeSelections['s'] = null;
        }

        this.setState({
            gameNodeSelections:gameNodeSelections,
            gameMessage: null
        });
    }

    resetScroll(){
        let amount = null;
        if(this.graphRef){
            amount = this.graphRef.current.offsetTop;
        }
        if(this.props.setScrollToGraphList)
            this.props.setScrollToGraphList(amount);

        let blocksDisplay = document.getElementById('graph-selected-block-list');
        blocksDisplay.scrollTop = 0;    
    }

    isValidBlock(block){
        if(isNullOrUndefined(block.title))
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
            selectedNodes: [from, to],
            copiedText: false
        });

        this.resetScroll();
    }

    //edg:from,to,
    addBlocksForEdge(edge, blocksToBeSelected, blocksAdded){
        if(isNullOrUndefined(this.props.investigationGraph[edge.from]) || 
            isNullOrUndefined(this.props.investigationGraph[edge.from]))
            return;
            
        var edgeBlockList = this.props.investigationGraph[edge.from].edges[edge.to];

        for(var i=0;i<edgeBlockList.length;i++){
            const blockKey = edgeBlockList[i];
            // console.log(blockKey);
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
        var blocksToBeSelected =[];
        var blocksAdded = {};

        this.setState({
            openSelectedBlocks: false
        });
        
        this.addBlocksForNodeCharacteristic(node, blocksToBeSelected, blocksAdded);

        if(this.props.investigationGraph[node]){
            var edges =  this.props.investigationGraph[node].edges;
            var scope = this;
            Object.keys(edges).forEach(function(edgeKey) {
                    var edge={
                        to: node,
                        from: edgeKey
                    };
                    scope.addBlocksForEdge(edge, blocksToBeSelected, blocksAdded);           
            });
        }

        if(node == "ALL"){
            let added = {};
            let invGraph = this.props.investigationGraph;
            if(!isNullOrUndefined(invGraph)){
                for(let key in invGraph){
                    for(let j=0; !isNullOrUndefined(invGraph[key].char) && j<invGraph[key].char.length; j++){
                        added[invGraph[key].char[j]] = true; 
                    }

                    for(let edgekey in invGraph[key].edges){

                        // console.log(invGraph[key].edges[edgekey]);
                        for(let j=0;!isNullOrUndefined(invGraph[key].edges[edgekey]) && 
                                        j<invGraph[key].edges[edgekey].length; j++)
                        {

                            added[invGraph[key].edges[edgekey][j]] = true;
                        }
                    }
                }

                for(let blockKey in added){
                    if(!isNullOrUndefined(this.props.blockTree) && !isNullOrUndefined(this.props.blockTree[blockKey]))
                        blocksToBeSelected.push(this.props.blockTree[blockKey]);
                }
            }
        }

        blocksToBeSelected.sort((a, b) => this.sortBlocks(a.title,b.title));
        
        this.setState({
            currentSelectedBlocks: blocksToBeSelected,
            openSelectedBlocks: true,
            selectedNodes: [node],
            copiedText: false
        });

        this.resetScroll();

        if((isNullOrUndefined(this.props.isPublic) || !this.props.isPublic) && this.props.selectNode && node!='ALL')
        {
            this.props.selectNode(node);
        }
    }

    addBlocksForNodeCharacteristic(node, blocksToBeSelected, blocksAdded){

        if(!isNullOrUndefined(this.props.investigationGraph[node])){
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
        
      /*  
        console.log("Selected nodes:");
        console.log(nodes);        
        console.log("Selected edges:");
        console.log(edges);
     */
       
        var blocksToBeSelected = [];
        var blocksAdded = {};

        if(!isNullOrUndefined(edges)){
            for(var i=0;i<edges.length;i++){
                var edgeKey = edges[i];
                var edge = this.graphHelperMap.edges[edgeKey];
                this.addBlocksForEdge(edge, blocksToBeSelected, blocksAdded);
            }
        }

        if(!isNullOrUndefined(nodes)){
            for(var i=0;i<nodes.length;i++){
                var nodeKey = nodes[i];
                var node = this.graphHelperMap.nodes[nodeKey];
                this.addBlocksForNodeCharacteristic(node, blocksToBeSelected, blocksAdded);
            }
        }
        //console.log(blocksToBeSelected);

        blocksToBeSelected.sort((a, b) => this.sortBlocks(a.title,b.title,a.timestamp,b.timestamp));

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

    generateAmGraph(){
        var isAllSelected = this.props.multiSelectEntityList[0].value;
        var newGraph = [];
        var nodesMap = {};

        if(!this.props.multiSelectEntityList[1].value)
        {
            //If None is not selected only display graph
            var selectedEntityLabels = {};

            var count=0;
            for(var i=2; i<this.props.multiSelectEntityList.length;i++){
                var currEntity = this.props.multiSelectEntityList[i];
                if(currEntity.value || isAllSelected){
                    //selected Node
                    selectedEntityLabels[currEntity.label]=count;
                    
                    var image = null;
                    if(this.props.imageMapping){
                        //Add image
                        if(currEntity.label in this.props.imageMapping){
                            image = this.props.imageMapping[currEntity.label];
                        }
                    }

                    if(this.props.investigationGraph[currEntity.label]){
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
            let islands = Utils.getGraphIslandsAndValues(this.props.investigationGraph);
            if(Object.keys(islands).length>0 && this.props.multiSelectEntityList[0].value){
                newGraph.push({
                    id:count,
                    label:'ALL',
                    link: [],
                    image: null
                });

                let revMap = {};
                for(let i=0; i<newGraph.length; i++){
                    revMap[newGraph[i].label] = newGraph[i].id;
                }

                for(let key in islands){
                    let newId = revMap[islands[key].node];
                    if(!isNullOrUndefined(newId)){
                        newGraph[count].link.push(newId);
                    } 
                }
                count++;
            }
            //console.log(newGraph);
        }

        var newGraphHelper = {
            nodes: nodesMap,
            edges: {}
        }

        return(
            <div className="graph-main">
                <GamifiedGraph 
                        graph={newGraph}  
                        selectEdge = {this.selectEdge}    
                        selectNode = {this.selectNode}
                        selectedNodes = {this.state.gameNodeSelections}
                        setNodeVal = {this.setNodeVal}  
                        setGameMessage = {this.setGameMessage}  
                        setEntityStats = {this.setEntityStats}
                        playNodeSound = {this.playNodeSound}
                        disabled = {this.state.stopGame}            
                        />
            </div>
        );

    }

    generateGraph(){
        var isAllSelected = this.props.multiSelectEntityList[0].value;
        var newGraph = {
            nodes: [],
            edges: []
        };
        var nodesMap = {};

        if(!this.props.multiSelectEntityList[1].value)
        {
            //If None is not selected only display graph
            var selectedEntityLabels = {};

            var count=0;
            for(var i=2; i<this.props.multiSelectEntityList.length;i++){
                var currEntity = this.props.multiSelectEntityList[i];
                if(currEntity.value || isAllSelected){
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

                    if(!isNullOrUndefined(this.props.investigationGraph)
                    && !isNullOrUndefined(this.props.investigationGraph[currEntityKey])){
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
                    }
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

        this.graphHelperMap= newGraphHelper 
        //console.log(this.state.graphHelperMap);

        const context = this;
        var graphEvents = {
            
            select: function(event) {
                context.onSelectGraph(event);
            }
    
        }

        return(
            <div className="graph-main">
                <Graph 
                        graph={newGraph} 
                        options={this.state.graphOptions} 
                        events={graphEvents} 
                        />
            </div>
        );
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

    AgregateNumberDisplay(numbers, selectedNodesString){

        let renderNumbers = '';
        if(!isNullOrUndefined(numbers) && numbers.length>0){
            renderNumbers = numbers.map((number) => 
             <span><span className="graph-content-number-key">Total {number.key}: </span> 
                <b className="graph-content-number-value">{number.value}</b> <br/></span>
            );   
        }

        if(!isNullOrUndefined(selectedNodesString))
            selectedNodesString = selectedNodesString.replace(':', '');
        if(renderNumbers != ''){
            return (
                <div className="graph-block-para-div">
                    <h4 className="graph-block-title">Statistics for {selectedNodesString}</h4>
                    <div className="graph-content-container">
                        <p className="graph-block-text">
                            {renderNumbers}
                        </p> 
                    </div>
                    
                </div>
            );    
        }

        return null;
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

       let renderNumbers = null;
       if(!isNullOrUndefined(singleBlock.numbers) && singleBlock.numbers.length>0){
           let numbers = singleBlock.numbers;
            renderNumbers = numbers.map((number) => 
            <span><span className="graph-content-number-key">{number.key}: </span> 
            <b className="graph-content-number-value">{number.value}</b> <br/></span>
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
                    <p className="graph-block-text">
                        {renderNumbers}
                    </p> 
                    <div class="graph-block-evidence-container">
                        {renderBlockEvidences}                       
                    </div>
                </div> 
            </div>
            );

     /*   return(
        <div className="graph-block-div"
        onClick={() => { this.clickBlockFromList(singleBlock)}}>
            <h4 className="graph-block-title">{this.removeHashedIndex(singleBlock.title)}</h4>
            <p className="graph-block-text">
                {singleBlock.summary}
            </p>                        
        </div>
        );
        */
    }

    handleAllAndNoneOptions(){
        var prevAllOption = this.state.wasAllOptionSelected;
        var prevNoneOption = this.state.wasNoneOptionSelected;
        var showAll = false;
        var showNone = false;
        var someOptionIsEnabled = false;
        var tempList = this.props.multiSelectEntityList;

        for(var i=0; i<tempList.length; i++){
            if(tempList[i].value==true){
                if(tempList[i].id == 0){
                    // All
                    showAll = true;
                }
                else if(tempList[i].id == -1){
                    //None
                    showNone = true;
                }
                else{
                    //Other element
                    someOptionIsEnabled = true;

                    if((showAll && prevAllOption) || (showNone && prevNoneOption)){
                        //All/None option selected before, so no need now
                        showAll = false;
                        showNone = false;
                        break;
                    }
                    else if(showNone || showAll){
                        //All/None option not selected before but selected now, 
                        // remove all other values
                        tempList[i].value=false;                        
                    }
                }
            }
        }

        if(showAll && !prevAllOption){
            showNone = false;
        }
        if(showNone && !prevNoneOption){
            showAll = false;
        }
        if(!showAll && !showNone && !someOptionIsEnabled){
            
            //No option is clicked
            showNone = true;
        }

        tempList[0].value = showAll;
        tempList[1].value = showNone;
        this.setState({
            multiSelectEntityList: tempList,
            wasAllOptionSelected: showAll,
            wasNoneOptionSelected: showNone
        });
    }

    entityClicked(entityList) {
        this.setState({ multiSelectEntityList: entityList });
        this.handleAllAndNoneOptions();
    }
    
    selectedBadgeClicked(entityList) {
        this.setState({ multiSelectEntityList: entityList });
        this.handleAllAndNoneOptions();
    }

    clickBlockFromList(block){
        //this.props.selectBlock(block);
    }

    async initSpeech(){
        try{
            this.speech = new Speech();
            if(this.speech.hasBrowserSupport()) { // returns a boolean
                // console.log("speech synthesis supported")
            }
            let data = await this.speech.init();            
            let voices =  data.voices;
            let selectedVoice = -1;
            // firebase.database().ref('Testing/lang/').set(this.props.lang);
            for(let i=0; !isNullOrUndefined(voices) && i<voices.length; i++){
                // firebase.database().ref('Testing/dataVal/'+String(i)).set(voices[i].name);
                let name = voices[i].name;
                if(Utils.languageCheck(this.props.lang, voices[i])) 
                {
                    selectedVoice = i;
                    break;
                }
            }
            if(selectedVoice != -1){
                //firebase.database().ref('Testing/selectedDataVal').set(voices[selectedVoice].name);
                await this.speech.setVoice(voices[selectedVoice].name);
                this.setState({
                    languageSupportedPlay: true
                });
            }
            else{
                this.setState({
                    languageSupportedPlay: false
                });
            }
        }
        catch{}
    }

    async timeoutFn(){  
        if(this.state.playStatus == 'start' && !isNullOrUndefined(this.speech) && isChrome){
            await this.speech.pause();
            await this.speech.resume();     
        }     
    }

    timeInFn(){
        const scope = this;
        this.timeout = setInterval(() => {            
            this.timeoutFn();                
          }, 8500);
    }

    async componentDidMount(){
        this.initializeGraphEvents();
        await this.initSpeech();

        if(isChrome)
            this.timeInFn();
    }

    toggleSelectedBlocksPane(){        
        this.setState({
            openSelectedBlocks: !this.state.openSelectedBlocks
        });        
    }

    async pauseExistingSelection(){
        if(!isNullOrUndefined(this.speech) && this.speech.speaking())
        {
            await this.speech.pause();
            this.setState({
                playStatus: 'paused'
            });
        }            
    }

    async resumeExistingSelection(){
        if(!isNullOrUndefined(this.speech)){
            await this.speech.resume();
            this.setState({
                playStatus: 'start'
            });
        }        
    }

    async stopExistingSelection(){
        if(!isNullOrUndefined(this.speech)){
            await this.speech.cancel();
            this.setState({
                playStatus: 'end'
            });    
        }
    }
    
    async playNodeSound(node){
        if(!isNullOrUndefined(this.speech) && this.props.playSound){
            if(this.speech.speaking())
                await this.speech.cancel();
          
            let selectedNodesString = node;
            for(let i=0; !isNullOrUndefined(this.state.selectedNodes) && i<this.state.selectedNodes.length; i++){
                selectedNodesString += this.state.selectedNodes[i] + ', ';
            }
            if(selectedNodesString.length > 0)
                selectedNodesString = selectedNodesString.substring(0,selectedNodesString.length - 2);

            let toPlayText = node;
            this.setState({
                playStatus: 'start'
            });
            this.speech.speak({
                text: toPlayText,
                queue: false// ,  // current speech will be interrupted,
                /* listeners: {
                    onstart: () => {
                        console.log("Start utterance")
                    },
                    onend: () => {
                        console.log("End utterance")
                    },
                    onresume: () => {
                        console.log("Resume utterance")
                    },
                    onboundary: (event) => {
                        console.log(event.name + ' boundary reached after ' + event.elapsedTime + ' milliseconds.')
                    }
                }*/
            }).then(() => {
                this.setState({
                    playStatus: 'end'
                });
                //console.log('here');
            }).catch(e => {
                console.error("An error occurred :", e)
            });
            
        }
    }


    async playExistingSelection(){
        if(!isNullOrUndefined(this.speech)){
            if(this.speech.speaking())
                await this.speech.cancel();
          
            let selectedNodesString = ': ';
            for(let i=0; !isNullOrUndefined(this.state.selectedNodes) && i<this.state.selectedNodes.length; i++){
                selectedNodesString += this.state.selectedNodes[i] + ', ';
            }
            if(selectedNodesString.length > 0)
                selectedNodesString = selectedNodesString.substring(0,selectedNodesString.length - 2);

            let toPlayText = '';
            let numbers = Utils.coalesceBlockNumbers(this.state.currentSelectedBlocks);
            if(!isNullOrUndefined(numbers) && numbers.length>0){
                toPlayText += 'Statistics for ' + selectedNodesString + '. ';
            }
            for(let i=0; !isNullOrUndefined(numbers) && i<numbers.length;i++){
                toPlayText += ('Total ' + numbers[i].key + ": " + String(numbers[i].value)+ ". ");
            }

            this.state.currentSelectedBlocks.map((selectedBlock) => 
                {
                    let title = this.removeHashedIndex(selectedBlock.title);
                    let summary = selectedBlock.summary;
                    if(!isNullOrUndefined(title) && title.length>0)
                        toPlayText += (Utils.correctTextForSpeech(title) + '. ');
                    toPlayText += Utils.correctTextForSpeech(summary);
                    toPlayText  += '. ';
                    for(let i=0; !isNullOrUndefined(selectedBlock.numbers) && i<selectedBlock.numbers.length;i++){
                        toPlayText += (selectedBlock.numbers[i].key + ": " + 
                            String(selectedBlock.numbers[i].value)+ ". ");
                    }
                }
            );
            this.setState({
                playStatus: 'start'
            });
            this.speech.speak({
                text: toPlayText,
                queue: false// ,  // current speech will be interrupted,
                /* listeners: {
                    onstart: () => {
                        console.log("Start utterance")
                    },
                    onend: () => {
                        console.log("End utterance")
                    },
                    onresume: () => {
                        console.log("Resume utterance")
                    },
                    onboundary: (event) => {
                        console.log(event.name + ' boundary reached after ' + event.elapsedTime + ' milliseconds.')
                    }
                }*/
            }).then(() => {
                this.setState({
                    playStatus: 'end'
                });
                //console.log('here');
            }).catch(e => {
                console.error("An error occurred :", e)
            });
            
        }
    }

    async componentWillUnmount(){
        if(!isNullOrUndefined(this.speech)){
            await this.speech.cancel();
        }
    }

    async componentWillReceiveProps(nextProps){
        if(this.props.lang != nextProps.lang && !isNullOrUndefined(this.speech)){
            let data = await this.speech.init();            
            let voices =  data.voices;
            let selectedVoice = -1;
            for(let i=0; !isNullOrUndefined(voices) && i<voices.length; i++){
                // firebase.database().ref('Testing/dataVal/'+String(i)).set(voices[i].name);
                let name = voices[i].name;
                if(Utils.languageCheck(this.props.lang, voices[i])) 
                {
                    selectedVoice = i;
                    break;
                }
            }
            if(selectedVoice != -1){
                //firebase.database().ref('Testing/dataVal').set(voices[selectedVoice].name);
                await this.speech.setVoice(voices[selectedVoice].name);
                this.setState({
                    languageSupportedPlay: true
                });
            }
            else{
                this.setState({
                    languageSupportedPlay: false
                });
            }
        }
        if((isNullOrUndefined(this.props.investigationGraph)) || 
        (JSON.parse(JSON.stringify(this.props.investigationGraph)) != JSON.parse(JSON.stringify(nextProps.investigationGraph)))){
            let score = Utils.getTotalEdges(nextProps.investigationGraph);
            this.setState({
                totalScore: score
            });
        }
    }

    stopGame(val){
        if(val){
            let stats = this.state.stats;
            stats.score = this.state.score;
            stats.totalScore = this.state.totalScore;
            stats.entityStats = this.entityStatistics;
            this.setState({
                stats: stats
            });
            //console.log(stats);
        }
        this.setState({
            stopGame: val
        });
    }

    BlockEntity(entity, type){
        return(
        <span className="gamified-block-entity">
            {entity}
            <a style={{marginLeft:'5px', color: 'black', cursor: 'pointer'}} 
            onClick={() => { this.clearGamifiedEntity(type)}}>X</a>
        </span>
        );   
    }

    render(){

        let lang = this.props.lang;
        if(isNullOrUndefined(lang))
            lang ='en';

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
           
        let blocksString = Utils.getBlocksText(this.state.currentSelectedBlocks);
        
        let selectedNodesString = ': ';
        for(let i=0; i<this.state.selectedNodes.length; i++){
            selectedNodesString += this.state.selectedNodes[i] + ', ';
        }
        if(selectedNodesString.length > 0)
            selectedNodesString = selectedNodesString.substring(0,selectedNodesString.length - 2);
        
        let numbers = Utils.coalesceBlockNumbers(this.state.currentSelectedBlocks);
        let aggrNums = this.AgregateNumberDisplay(numbers,selectedNodesString);

        let firstNode = this.state.gameNodeSelections['f'];
        if(!isNullOrUndefined(firstNode) && !isNullOrUndefined(firstNode.label)){
            firstNode = firstNode.label.currentText;
        }
        //console.log(firstNode);

        let secondNode = this.state.gameNodeSelections['s'];
        if(!isNullOrUndefined(secondNode) && !isNullOrUndefined(secondNode.label)){
            secondNode = secondNode.label.currentText;
        }
        //console.log(secondNode);
        //console.log(numbers);

        /*
            {this.state.playStatus == 'paused' && !isChrome?
                <a onClick={this.resumeExistingSelection} className="soundIcon">
                    <PlayArrow />
                </a>
                :
                null
            }

            {this.state.playStatus == 'start' && !isChrome? 
                <a onClick={this.pauseExistingSelection} className="soundIcon">
                    <Pause />
                </a>
                :
                null
            } 
        */

        
       
        return (
            <div>                      
                        <div ref={this.graphRef}></div>

                        <div className="specialViewMargin">
                            <div className="gameButtonContainer">
                                {this.state.score>0 && !this.state.stopGame && this.props.isPublic?
                                    <Button
                                    variant="contained" 
                                    className="stopGamebutton"
                                    onClick={() => { this.stopGame(true)}}
                                    > Stop Game</Button>
                                    :
                                    null
                                }                                
                            </div>
                        </div>
                        {!isNullOrUndefined(firstNode) && !this.state.stopGame?
                            <div className="specialViewMargin">                             
                                <div className="gamifiedNodeDisplay">
                                    <div className="gamifiedNodeSelectionsTitle">Selections: </div>
                                    <div>{this.BlockEntity(firstNode,'f')}</div>
                                    {!isNullOrUndefined(secondNode)?
                                        <div>{this.BlockEntity(secondNode,'s')}</div>
                                        :
                                        null
                                    }                                    
                                </div>     
                            </div>
                            :
                            null                        
                        }
                        {!this.state.stopGame?
                            <div className="specialViewMargin">                            
                                <div className="scoreAmchartContainer">
                                    <Speedometer 
                                        id="speedometer_mindmap_ingame"
                                        val={this.state.score}
                                        min={0}
                                        max={this.state.totalScore}/>
                                </div>

                                <div className="scoreText">Score: <span className="scoreVal">{this.state.score}</span>
                                <span className="totalScoreVal">/{this.state.totalScore}</span></div>
                                {this.state.score == this.state.totalScore?
                                    <Alert severity="success" className="gameMessage">{this.state.gameMessageFinished}</Alert>
                                    :
                                    <div>
                                        {this.state.gameMessage == "No! You got it wrong! These topics are not connected"?
                                            <Alert severity="error" className="gameMessage">{this.state.gameMessage}</Alert>
                                            :
                                            null
                                        }
                                        {this.state.gameMessage == "Yes! You got it right!"?
                                            <Alert severity="success" className="gameMessage">{this.state.gameMessage}</Alert>
                                            :
                                            null
                                        }
                                        {this.state.gameMessage == "This connection has already been made. Try another one!"?
                                            <Alert severity="info" className="gameMessage">{this.state.gameMessage}</Alert>
                                            :
                                            null
                                        }
                                    </div>
                                }
                                
                            </div>
                            :
                            <div>
                                <GamifiedGraphStats
                                    stats = {this.state.stats}
                                    bpId={this.props.bpId}
                                    title={this.props.title}
                                    canSave = {true}
                                    id={'mindmap_result'}
                                    />
                            </div>
                        }

                        {this.state.currentSelectedBlocks.length >= 0 && !this.state.stopGame?
                        <div> 
                            <div className="graph-block-list">                            
                                <div className='gamified-graph-block-list-title' onClick={this.toggleSelectedBlocksPane}>                                
                                    {selectedNodesString.length>0?
                                        <span>{Locale.selections[lang]}</span>
                                        :
                                        <span>{Locale.selectTwoEntities[lang]}</span>
                                    }                                                                
                                    <span>{selectedNodesString}</span>                                
                                    <span>
                                        {this.state.openSelectedBlocks?
                                            <ExpandLess className={selectedNodesString.length>0?"graph-block-list-title-icon":"displayNone"}/>
                                            :
                                            <ExpandMore className={selectedNodesString.length>0?"graph-block-list-title-icon":"displayNone"}/>
                                        }
                                    </span>
                                </div> 
                                <Expand 
                                    open={this.state.openSelectedBlocks}
                                    duration={400}
                                    transitions={transitions}>
                                    <div className='graph-block-list-container' id="graph-selected-block-list">
                                        {aggrNums}
                                        {renderBlocks}
                                    </div>
                                </Expand>
                            </div>
                            {this.generateAmGraph()/*this.generateGraph()*/}
                        </div>                      
                        :
                        null}                                                                                                  
            </div>
        );
    }

}  
export default GamifiedGraphComponent;