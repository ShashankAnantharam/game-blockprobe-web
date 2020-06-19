import React, { Component } from 'react';
import  MultiSelectReact  from 'multi-select-react';
import { Button } from '@material-ui/core';
import Graph from "react-graph-vis";
import './GraphComponent.css';
import { timingSafeEqual } from 'crypto';
import { isNullOrUndefined } from 'util';
import { thatReturnsThis } from 'fbjs/lib/emptyFunction';
import Img from 'react-image';
import IsImageUrl from 'is-image-url';
import ReactGA from 'react-ga';
import AmGraph from './amGraph/amGraph';
import Expand from 'react-expand-animated';
import ExpandMore from '@material-ui/icons/ExpandMore';
import ExpandLess from '@material-ui/icons/ExpandLess';
import PlayArrow from '@material-ui/icons/PlayArrow';
import Pause from '@material-ui/icons/Pause';
import Stop from '@material-ui/icons/Stop';
import Speech from 'speak-tts';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import * as firebase from 'firebase';
import * as Utils from '../common/utilSvc';
import * as Locale from '../Localization/localizedStrings';

const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
const isIE = /*@cc_on!@*/false || !!document.documentMode;

class GraphComponent extends React.Component {

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
        testVar: -1,
        }

        this.graphHelperMap= {
            nodes:{

            },
            edges:{

            }
          };

        this.speech = null;

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
        this.playExistingSelection = this.playExistingSelection.bind(this);
        this.pauseExistingSelection = this.pauseExistingSelection.bind(this);
        this.resumeExistingSelection = this.resumeExistingSelection.bind(this);
        this.stopExistingSelection = this.stopExistingSelection.bind(this);
        this.timeoutFn = this.timeoutFn.bind(this);
        this.timeInFn = this.timeInFn.bind(this);
 
        this.graphRef = React.createRef();

        ReactGA.initialize('UA-143383035-1');  
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

        ReactGA.event({
            category: 'select_edge',
            action: 'Select Edge from ' + String(from) +  " to " + String(to),
            label: String(from) + " to " + String(to)
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

        ReactGA.event({
            category: 'select_node',
            action: 'Select Node '+ String(node),
            label: String(node)
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
            if(Object.keys(islands).length>1 && this.props.multiSelectEntityList[0].value){
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
                <AmGraph 
                        graph={newGraph}  
                        selectEdge = {this.selectEdge}    
                        selectNode = {this.selectNode}                    
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
        this.props.selectBlock(block);
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
            ReactGA.event({
                category: 'playSound',
                action: 'PlaySound ' + selectedNodesString,
                label: 'PlaySound ' + selectedNodesString
            });

            let toPlayText = '';
            let numbers = Utils.coalesceBlockNumbers(this.state.currentSelectedBlocks);
            if(!isNullOrUndefined(numbers) && numbers.length>0){
                toPlayText += 'Statistics for ' + selectedNodesString + '. ';
            }
            for(let i=0; !isNullOrUndefined(numbers) && i<numbers.length;i++){
                toPlayText += ('Total ' + numbers[i].key + ": " + String(numbers[i].value)+ ". ");
            }
            let currBlocks = Utils.deduplicateBlocks(this.state.currentSelectedBlocks);
            currBlocks.map((selectedBlock) => 
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

        let currBlocks = Utils.deduplicateBlocks(this.state.currentSelectedBlocks);

        var renderBlocks = currBlocks.map((selectedBlock) => 
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
                {this.props.isPublic == undefined || !this.props.isPublic?
                    <div className='filter-container'>                
                    
                        <div className="dropdown-container only-large-screen">
                            <MultiSelectReact 
                            options={this.props.multiSelectEntityList}
                            optionClicked={this.entityClicked.bind(this)}
                            selectedBadgeClicked={this.selectedBadgeClicked.bind(this)}
                            selectedOptionsStyles={selectedOptionsStyles}
                            optionsListStyles={optionsListStyles} 
                            isTextWrap={false} 
                            />
                        </div>

                    </div>
                    :
                    <div className="dropdown-container only-large-screen" style={{marginBottom: '1em', marginTop:'0'}}>
                        <MultiSelectReact 
                        options={this.props.multiSelectEntityList}
                        optionClicked={this.entityClicked.bind(this)}
                        selectedBadgeClicked={this.selectedBadgeClicked.bind(this)}
                        selectedOptionsStyles={selectedOptionsStyles}
                        optionsListStyles={optionsListStyles} 
                        isTextWrap={false} 
                        />
                    </div>

                }
                        {this.state.copiedText?
                            <div className="copiedTextContainer">
                                <p className="copiedTextValue">Text has been copied in the block format. Paste it in another story.</p>
                            </div>
                            :
                            null
                        }
                
                        {this.state.currentSelectedBlocks.length >= 0? 
                        <div className="graph-block-list" ref={this.graphRef}>
                            {selectedNodesString.length>0 && !isIE && !isNullOrUndefined(this.speech) && this.state.languageSupportedPlay?
                                <div className='graph-block-list-sound'>
                                        {this.state.playStatus == 'end'?
                                            <a onClick={this.playExistingSelection} className="soundIcon">
                                                <PlayArrow />
                                            </a>
                                            :
                                            null
                                        }                                       

                                        {(this.state.playStatus == 'start' || this.state.playStatus == 'paused')?
                                            <a onClick={this.stopExistingSelection} className="soundIcon">
                                                <Stop />
                                            </a>
                                            :
                                            null
                                        }
                                    
                                </div>
                                :
                                null
                            }
                            {(this.props.isPublic == undefined || !this.props.isPublic) && selectedNodesString.length>0?
                                    <CopyToClipboard text={Utils.getBlocksText(this.state.currentSelectedBlocks)}
                                    onCopy={() => this.setState({copiedText: true})}>
                                        <div className="copyBlockText">Copy the text as draft</div>
                                    </CopyToClipboard>
                                    :
                                    null
                                }
                            <div className='graph-block-list-title' onClick={this.toggleSelectedBlocksPane}>                                
                                {selectedNodesString.length>0?
                                    <span>{Locale.selections[lang]}</span>
                                    :
                                    <span>{Locale.selectEntity[lang]}</span>
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
                        :
                        null}
                        {this.generateAmGraph()/*this.generateGraph()*/}                        
                                        
            </div>
        );
    }

}  
export default GraphComponent;