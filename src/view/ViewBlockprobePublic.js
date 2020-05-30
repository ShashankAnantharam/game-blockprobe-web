import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import * as firebase from 'firebase';
import 'firebase/firestore';
import './ViewBlockprobePublic.css';
import ReactGA from 'react-ga';
import DashboardViewComponent from "../viso/dashboard/DashboardView";
import MiniDashboardViewComponent from "../viso/dashboard/MiniDashboardView";
import GamifiedDashboardViewComponent from "../viso/dashboard/GamifiedDashboardView";
import TimelineComponent from '../viso/TimelineComponent';
import GraphComponent from '../viso/GraphComponent';
import FindConnectionsComponent from '../viso/FindConnectionsComponent';
import ViewBlockComponent from '../viso/ViewBlock';
import Sidebar from "react-sidebar";
import GoogleFontLoader from 'react-google-font-loader';
import MenuIcon from '@material-ui/icons/Menu';
import MoreIcon from '@material-ui/icons/More';
import VisualizeOptionsList from '../viso/VisoList';
import VisualizeOptionsListComponent from '../viso/VisoList';
import { red } from '@material-ui/core/colors';
import { timingSafeEqual } from 'crypto';
import { isNullOrUndefined } from 'util';
import Loader from 'react-loader-spinner';
import * as Utils from '../common/utilSvc';
import * as DbUtils from '../common/dbSvc';


// /view/3a30893249f6952e26de1ce709094e6952731beb9e37c244c07e542e81f52227
// /view/d2160725641bbdbcc2d46bb0a278b44e6176e977c61b53fcde4299dcf1ac1184
// /view/ad9e355e747a6a11741fdfdd62b2c040aa8d985afddc43fbfa8202d21d7d986e

class ViewBlockprobePublicComponent extends React.Component {

    constructor(props){
        super(props);
        this.state={
            genesisBlockId: "",
            blockprobeTitle: "",
            bpDetailsLastTs: 0,
            blockprobeSummary: "",
            lang: 'en',
            selectedBlock:"", 
            blockTree: {},
            modifyRef: {},
            blockStatus: {},
            investigationGraph: {},
            imageMapping: {},
            entityChanges: {},
            timeline: [],
            summaryList: [],
            selectedBlockSidebarOpen: false,
            menuBarOpen: false,
            selectedVisualisation: "dashboard",
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
            testList: [],
            isPageLoading: true        
        }

        ReactGA.initialize('UA-143383035-1');           

        if(this.props.visulationType == 'graph'){
            this.state.selectedVisualisation = 'graph';
            ReactGA.pageview('/viewBlockprobePublic');
        }
        else if(this.props.visulationType == 'tabs_all'){
            this.state.selectedVisualisation = 'tabs_all';
        }
        else if(this.props.visulationType == 'game'){
            this.state.selectedVisualisation = 'game';
            ReactGA.pageview('/openedGame');
        }

        this.changeSelectedBlock = this.changeSelectedBlock.bind(this);
        this.onSetSelectedBlockSidebarOpen = this.onSetSelectedBlockSidebarOpen.bind(this);
        this.onSetMenuBlockSidebarOpen = this.onSetMenuBlockSidebarOpen.bind(this);
        this.renderVisualisation = this.renderVisualisation.bind(this);
        this.setNewVisualisation = this.setNewVisualisation.bind(this);
        this.addEdge = this.addEdge.bind(this);
        this.createInvestigationGraph = this.createInvestigationGraph.bind(this);
        this.sortBlocks = this.sortBlocks.bind(this);
        this.isSummaryBlock = this.isSummaryBlock.bind(this);
        this.createSummaryList = this.createSummaryList.bind(this);
        this.generateMultiSelectEntityList = this.generateMultiSelectEntityList.bind(this);
        this.setScrollToGraphList = this.setScrollToGraphList.bind(this);
        this.getDataWrapper = this.getDataWrapper.bind(this);
    }

    setNewVisualisation(newVisualisation){
        if(this.state.visualisation != newVisualisation){
            this.setState({
                selectedVisualisation: newVisualisation,
                menuBarOpen: false
            });
            // console.log(newVisualisation);
        }
    }

    onSetSelectedBlockSidebarOpen(open) {
        this.setState({ selectedBlockSidebarOpen: open });
    }

    onSetMenuBlockSidebarOpen(open) {
        this.setState({ menuBarOpen: open });
        // console.log(this.state.menuBarOpen);
    }

    addBlocksToProbe(doc){      
         doc.data().blocks.forEach(block => {
             var tempState = this.state.blockTree;
             tempState[block.key] = block;
             this.setState({
                 blockTree:tempState
             });
             if(block.actionType == "genesis"){
                document.title = block.title;
                 this.setState({
                     genesisBlockId: block.key,
                     blockprobeTitle: block.title,
                     bpDetailsLastTs: 0,
                     blockprobeSummary: block.summary
                 })
             }
         });
    }

    traverseBlockTree(nodeId, timelineList, timelineBlockStatus, blockList, blockStatus, modifyRef, entityChanges){
        var currBlock = this.state.blockTree[nodeId];

        if(isNullOrUndefined(currBlock)){
            return ;
        }

        try{
            // console.log(nodeId);
            if(currBlock.actionType=="entityChange"){
                //contains entityMap
                if(!isNullOrUndefined(currBlock.entityMap)){
                    let currEntity = currBlock.entityMap.curr;
                    let newEntity = currBlock.entityMap.new;
                    let ts = currBlock.timestamp;
                    if(!(currEntity in entityChanges)){
                        entityChanges[currEntity] = [];
                    }
                    entityChanges[currEntity].push({
                        ts: ts,
                        change: newEntity
                    });
                }
            }

            //ONLY TITLE OR SUMMARY CHANGE
            if(currBlock.actionType=="BpDetails"){
                let currTs = currBlock.timestamp;
                let prevTs = this.state.bpDetailsLastTs;

                if(!isNullOrUndefined(currTs) && currTs > prevTs){
                    this.setState({
                        blockprobeTitle: currBlock.title,
                        blockprobeSummary: currBlock.summary,
                        bpDetailsLastTs: currTs
                    })
                }
            }

            //Generic block
            if(currBlock.actionType!="REMOVE"){
                blockList.push(currBlock.key);
                blockStatus[currBlock.key]=true;            
            }
            else{
                blockStatus[currBlock.referenceBlock]=false;
                
                // If block is modified, then remove latest modification also
                if(modifyRef[currBlock.referenceBlock]!=null && modifyRef[currBlock.referenceBlock]!=undefined){
                    blockStatus[modifyRef[currBlock.referenceBlock]]=false
                }
            }
            

            if(currBlock.blockDate!=null || currBlock.blockTime!=null){
                if(currBlock.actionType!="REMOVE"){
                    timelineList.push(currBlock.key);
                    timelineBlockStatus[currBlock.key]=true;
                    // console.log("ADD "+ nodeId);
                }
                else{
                    timelineBlockStatus[currBlock.referenceBlock]=false;
                    // console.log("REM "+ nodeId);
                }
            }

            if(currBlock.actionType == "MODIFY"){
                let prevKey = modifyRef[currBlock.referenceBlock]; 
                let currKey = currBlock.key;
                let prevTs = this.state.blockTree[modifyRef[currBlock.referenceBlock]].timestamp;
                let currTs = currBlock.timestamp;
                if(!blockStatus[prevKey]){
                    //The modified block has already been removed
                    //Remove current block also
                    blockStatus[currBlock.key] = false;
                    timelineBlockStatus[currBlock.key] = false;
                    modifyRef[currKey] = currBlock.referenceBlock;
                }
                else if(currTs > prevTs){
                    //remove the older block; Also save the older version with later one 
                    blockStatus[prevKey] = false;
                    timelineBlockStatus[prevKey] = false;
                    modifyRef[prevKey] = currBlock.referenceBlock;
                    modifyRef[currBlock.referenceBlock] = currKey;   
                    modifyRef[currKey] = currKey;          
                }
                else{
                    //remove the new block
                    blockStatus[currKey] = false;
                    timelineBlockStatus[currKey] = false;
                    modifyRef[currKey] = currBlock.referenceBlock;
                    modifyRef[currBlock.referenceBlock] = prevKey;                
                }
            }
            else{
                //Set current block as modify reference
                modifyRef[currBlock.key] = currBlock.key;
            }

            this.setState({
                timeline:timelineList
            });
        }
        catch{
        }
        
        var checkedChildren = {};
        if(!isNullOrUndefined(currBlock.children)){
            currBlock.children.forEach((childBlockId) => {
                
                // Check for false children and duplicate children 
                if(this.state.blockTree[childBlockId].previousKey == nodeId && !(childBlockId in checkedChildren)){
                    try{
                        this.traverseBlockTree(childBlockId,timelineList,timelineBlockStatus,blockList,blockStatus,modifyRef,entityChanges);
                    }
                    catch{
                    }
                }                    
                checkedChildren[childBlockId] = true;
            });
        }
    }

    

    addEdge(graph, block, entity_i, entity_j){

        // edge from i to j
        if(!(entity_j in graph[entity_i].edges)){
            graph[entity_i].edges[entity_j]=[];
        }
        graph[entity_i].edges[entity_j].push(block.key);
    }

    sortBlocks(a, b){
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
  
        if(a > b)
            return 1;
  
        return -1;
    }
  

    isSummaryBlock(block){
        let a = block.title;
        a = a.trim();

        if(a.length>0 && a.charAt(0)==='#'){
            var num = '';
            for(var i=1; i<a.length; i++){
                if(a.charAt(i)==' ')
                    return false;
                else if(a.charAt(i)=='s' || a.charAt(i)=='S')
                    return true;
            }
        }

        return false;
    }

    createSummaryList(blockList){
        var sList = [];

        blockList.forEach((blockKey) => {
            var block = this.state.blockTree[blockKey];
            if(this.isSummaryBlock(block)){
                sList.push(block);
            }
        });
        sList.sort((a, b) => this.sortBlocks(a.title,b.title));
        this.setState({summaryList: sList});
    }

    createInvestigationGraph(blockList){
        var graph = {};

        blockList.forEach((blockKey) => {
            var block = this.state.blockTree[blockKey];
            if(block.entities!=null){

                for(var i=0;i<block.entities.length;i++){
                    var entityKey = block.entities[i].title;
                    if(!(entityKey in graph)){
                        graph[entityKey]={
                            char: [],
                            edges: {}
                        }
                    }
                }

                if(block.entities.length == 1){

                    var entityKey = block.entities[0].title;
                    graph[entityKey].char.push(block.key);
                }
                else if(block.entities.length > 1){

                    for(var i=0;i<block.entities.length;i++){
                        for(var j=i+1;j<block.entities.length;j++){
                            this.addEdge(graph, block, 
                                block.entities[i].title, block.entities[j].title);
                            this.addEdge(graph, block, 
                                block.entities[j].title, block.entities[i].title);
                        }
                    }
                    
                }
            }
        });
 
        this.setState({
            investigationGraph: graph
        });

        this.generateMultiSelectEntityList();

        // console.log(this.state.investigationGraph);
    }

    generateMultiSelectEntityList(){
        var count = 1;
        var entityList = this.state.multiSelectEntityList;

        var existingEntities = {};
        for(var i=2;i<entityList.length; i++){
            existingEntities[entityList[i].label] = true;
            if(entityList[i].id >= count)
                count = entityList[i].id + 1;
        }

        Object.keys(this.state.investigationGraph).forEach(function(entityLabel) {
            if(!(entityLabel in existingEntities)){
                entityList.push({                
                        value: false, 
                        label: entityLabel, 
                        id: count             
                });
                count++;
            }
        });

        // console.log(entityList);
        entityList.sort(function(a,b){
            if(a.label.toLocaleLowerCase() == 'all')
                return -1;
            if(b.label.toLocaleLowerCase() == 'all')
                return 1;
            if(a.label.toLocaleLowerCase() == 'none')
                return -1;
            if(b.label.toLocaleLowerCase() == 'none')
                return 1;
            if(a.label.toLocaleLowerCase() < b.label.toLocaleLowerCase())
                return -1;
            return 1;
        });
        this.setState({
            multiSelectEntityList: entityList
        });
    }

    getImages(snapshot){
        var imageMapping = this.state.imageMapping;
        snapshot.forEach((doc) => {
            doc.data().images.forEach(image => {
                imageMapping[image.entity] = image.url;
            });            
        });
        this.setState({imageMapping: imageMapping});
    }

    createBlockprobe(snapshot){
        snapshot.forEach((doc) => ( this.addBlocksToProbe(doc)));        
        var timelineList = [];
        var timelineBlockStatus = {};
        var blockList = [];
        var blockStatus = {};
        var modifyRef = {};
        let entityChanges = {};

        try{
            this.traverseBlockTree(
                this.state.genesisBlockId, 
                timelineList, 
                timelineBlockStatus,
                blockList,
                blockStatus,
                modifyRef,
                entityChanges);    
        }
        catch{
        }

        // console.log(blockList);
        // console.log(blockStatus);

        //sort entityChanges
        for(let entity in entityChanges){
            entityChanges[entity].sort(function (a,b){
                return a.ts - b.ts;
            })
        }
        // console.log(entityChanges);
        let newBlockTree  = Utils.modifyBlockEntities(blockList,this.state.blockTree,entityChanges);
        // console.log(newBlockTree);

        var finalTimelineList = [];
        timelineList.forEach((id) => {
            if(timelineBlockStatus[id] && blockStatus[id])
            {
                finalTimelineList.push(this.state.blockTree[id]);
            }
        });
        Utils.sortTimeline(finalTimelineList);
        this.setState({
            timeline:[...finalTimelineList],
            modifyRef: modifyRef,
            blockStatus: blockStatus,
            entityChanges: entityChanges
        });

        var finalBlockList = [];
        blockList.forEach((id) => {
            if(blockStatus[id])
            {                
                finalBlockList.push(id);
            }
        });

        this.createInvestigationGraph(finalBlockList);
        this.createSummaryList(finalBlockList);

        if(this.props.visulationType == 'game'){
            ReactGA.event({
                category: 'game',
                action: 'Play game',
                label: this.props.bId
              });    
        }
        else{
            ReactGA.event({
                category: 'public_view',
                action: 'View blockprobe publicly',
                label: this.props.bId
              });    
        }
    }

    changeSelectedBlock = (block) =>{
        this.setState({
            selectedBlock:block
        }); 
        this.onSetSelectedBlockSidebarOpen(true);
    }

    async getDataWrapper(){
        let getBlockprobe = firebase.firestore().collection("public").doc(this.props.bId)
        .collection("aggBlocks").get();
        let images = firebase.firestore().collection("public").doc(this.props.bId)
        .collection("images").get();
        let langPromise = DbUtils.getLanguageDb(this.props.bId);

        return Promise.all([getBlockprobe, images,langPromise]).then(results => {
            const [blockprobeSnapshot, imagesSnapshot, langSnapshot] = results;
            
            this.createBlockprobe(blockprobeSnapshot);
            if(imagesSnapshot && !imagesSnapshot.empty){
                this.getImages(imagesSnapshot);
            }

            let lang = DbUtils.getLanguageLogic(langSnapshot);
            this.setState({
                lang: lang,
                isPageLoading: false
            })    
            return null;   
        });
    }

    componentDidMount(){         
        this.getDataWrapper();
    }

    renderVisualisation(){
        if(this.state.selectedVisualisation == "timeline")
        {
            return (
                <div className="blockprobe-body">
                    <TimelineComponent 
                    timeline={this.state.timeline} 
                    selectBlock={this.changeSelectedBlock}/>
                </div>
            );
        }
        else if(this.state.selectedVisualisation == "graph"){
            return(
                <div>
                    <GraphComponent blockTree={this.state.blockTree} 
                        investigationGraph={this.state.investigationGraph}
                        selectBlock={this.changeSelectedBlock}
                        multiSelectEntityList = {this.state.multiSelectEntityList}
                        isPublic = {true}
                        setScrollToGraphList ={this.setScrollToGraphList}  
                        lang = {this.state.lang}               
                        imageMapping={this.state.imageMapping}/>
                </div>
            );
        }
        else if(this.state.selectedVisualisation == "find_connections"){
            return(
                <div>
                    <FindConnectionsComponent blockTree={this.state.blockTree} 
                        investigationGraph={this.state.investigationGraph}
                        selectBlock={this.changeSelectedBlock}
                        setScrollToGraphList ={this.setScrollToGraphList}                 
                        imageMapping={this.state.imageMapping}
                    />
                </div>
            );
        }
        else if(this.state.selectedVisualisation == "tabs_all"){
            return(
                <div>
                    <MiniDashboardViewComponent
                                summaryBlocks = {this.state.summaryList}
                                blockTree={this.state.blockTree} 
                                investigationGraph={this.state.investigationGraph}
                                selectBlock={this.changeSelectedBlock}
                                multiSelectEntityList = {this.state.multiSelectEntityList}
                                timeline={this.state.timeline}    
                                imageMapping={this.state.imageMapping}
                                setScrollToGraphList ={this.setScrollToGraphList}  
                                isPublic = {true}
                                lang = {this.state.lang}               
                            />
                </div>
            );
        }
        else if(this.state.selectedVisualisation == "game"){
            return(
                <div>
                    <div className="blockprobe-header"> 
                        <GoogleFontLoader
                                fonts={[                             
                                    {
                                        font:'Lora',
                                        weights: [400]
                                    }
                                ]}
                                subsets={['cyrillic-ext', 'greek']}
                                />   
                            <h2 style={{fontFamily: 'Lora, bold-italic', textAlign:'center', fontSize: '26px', fontWeight:'bold'}}>{this.state.blockprobeTitle}</h2>
                            <h4>{this.state.blockprobeSummary}</h4>
                    </div>
                    <GamifiedDashboardViewComponent
                                summaryBlocks = {this.state.summaryList}
                                title={this.state.blockprobeTitle}
                                blockTree={this.state.blockTree}
                                bpId={this.props.bId} 
                                investigationGraph={this.state.investigationGraph}
                                selectBlock={this.changeSelectedBlock}
                                multiSelectEntityList = {this.state.multiSelectEntityList}
                                timeline={this.state.timeline}    
                                imageMapping={this.state.imageMapping}
                                lang = {this.state.lang}
                                setScrollToGraphList ={this.setScrollToGraphList}     
                                isPublic = {true}            
                            />
                </div>
            );
        }

        return (
            <div style={{textAlign:"center"}}>
                FEATURE TO BE IMPLEMENTED
            </div>
        );
    }

    renderSingularPage(){
        return (
            <div>
                {this.state.isPageLoading?
                <div style={{width:'50px',margin:'auto'}}>
                    <Loader 
                    type="TailSpin"
                    color="#00BFFF"
                    height="50"	
                    width="50"              
                    /> 
                </div>
                :    
                <div>
                <Sidebar
                    sidebar={<div className="right-sidebar">
                    <ViewBlockComponent 
                        selectedBlock={this.state.selectedBlock}
                        isPublicView={true}/>
                    </div>}
                    open={this.state.selectedBlockSidebarOpen}
                    onSetOpen={this.onSetSelectedBlockSidebarOpen}
                    pullRight={true}
                    defaultSidebarWidth='200px'
                    styles={{ sidebar: { background: "#fefefe", position:'fixed' } }}
                >
                    <div id="main_body">
                        {this.renderVisualisation()}
                    </div>

                </Sidebar>
                </div>      
                }
            </div>
        )
    }

    setScrollToGraphList(value){
        if(value)
            document.getElementById('main_body').parentElement.scrollTop = value;
        else    
            document.getElementById('main_body').parentElement.scrollTop = 200;
    }

    renderFullDashboard(){
        return (
            <div>
            {this.state.isPageLoading?
            <div style={{width:'50px',margin:'auto'}}>
                <Loader 
                type="TailSpin"
                color="#00BFFF"
                height="50"	
                width="50"              
                /> 
            </div>
            :
            <div>
                <Sidebar
                    sidebar={<div className="right-sidebar">
                    <ViewBlockComponent selectedBlock={this.state.selectedBlock}
                                        isPublicView={true}/>
                    </div>}
                    open={this.state.selectedBlockSidebarOpen}
                    onSetOpen={this.onSetSelectedBlockSidebarOpen}
                    pullRight={true}
                    defaultSidebarWidth='200px'
                    styles={{ sidebar: { background: "#fefefe", position:'fixed' } }}
                >
                   

                    <div id="main_body">
                        <div className="blockprobe-header"> 
                        <GoogleFontLoader
                                fonts={[                             
                                    {
                                        font:'Lora',
                                        weights: [400]
                                    }
                                ]}
                                subsets={['cyrillic-ext', 'greek']}
                                />   
                            <h2 style={{fontFamily: 'Lora, bold-italic', textAlign:'center', fontSize: '26px', fontWeight:'bold'}}>{this.state.blockprobeTitle}</h2>
                            <h4>{this.state.blockprobeSummary}</h4>
                        </div>
                        
                        <DashboardViewComponent
                                summaryBlocks = {this.state.summaryList}
                                blockTree={this.state.blockTree} 
                                investigationGraph={this.state.investigationGraph}
                                selectBlock={this.changeSelectedBlock}
                                multiSelectEntityList = {this.state.multiSelectEntityList}
                                timeline={this.state.timeline}    
                                imageMapping={this.state.imageMapping}
                                lang = {this.state.lang}
                                setScrollToGraphList ={this.setScrollToGraphList}     
                                isPublic = {true}            
                            />
                    </div>
                </Sidebar>
                </div>            
            }
            </div>
            );
    }

    render(){
        return (
            <div>
                {this.state.selectedVisualisation == 'dashboard'?
                    this.renderFullDashboard()
                    :
                    this.renderSingularPage()
                }
            </div>
        )
    }


}

export default ViewBlockprobePublicComponent;