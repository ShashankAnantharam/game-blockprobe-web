import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import ReactGA from 'react-ga';
import * as firebase from 'firebase';
import 'firebase/firestore';
import './ViewBlockprobePrivate.css';
import ShareBlockprobeComponent from './shareBlockprobe/ShareBlockprobeView';
import TimelineComponent from '../viso/TimelineComponent';
import GraphComponent from '../viso/GraphComponent';
import DashboardViewComponent from "../viso/dashboard/DashboardView";
import SummaryViewComponent from "../viso/summary/SummaryView";
import FindConnectionsComponent from '../viso/FindConnectionsComponent';
import BlockprobeSettingsComponent from './BlockprobeSettings/BlockprobeSettings';
import ViewBlockComponent from '../viso/ViewBlock';
import Sidebar from "react-sidebar";
import MenuIcon from '@material-ui/icons/Menu';
import SyncIcon from '@material-ui/icons/Sync';
import MoreIcon from '@material-ui/icons/More';
import VisualizeOptionsList from '../viso/VisoList';
import VisualizeOptionsListComponent from '../viso/VisoList';
import { red } from '@material-ui/core/colors';
import { timingSafeEqual } from 'crypto';
import { isNullOrUndefined } from 'util';
import UserBlocksComponent from '../user-session/UserBlocksComponent';
import Joyride from 'react-joyride';
import Loader from 'react-loader-spinner';
import BpDetail from './BpDetails/BpDetails';
import * as Utils from '../common/utilSvc';
import * as DbUtils from '../common/dbSvc';
import { utils } from '@amcharts/amcharts4/core';
import GamifiedDashboardViewComponent from '../viso/dashboard/GamifiedDashboardView';

class ViewBlockprobePrivateComponent extends React.Component {

    constructor(props){
        super(props);
        //permit, buildStorytooltip, uId, bId

        this.state={
            uIdHash: "",
            shajs: null,
            genesisBlockId: "",
            blockprobeTitle: null,
            bpDetailsLastTs: 0,
            blockprobeSummary: "",
            bpDetails: {},
            lang: 'en',
            langLoading: true,
            modifyRef: {},
            blockStatus: {},
            selectedBlock:"", 
            blockTree: {},
            investigationGraph: {},
            imageMapping: {},
            entityChanges: {},
            timeline: [],
            summaryList: [],
            latestBlock: null,
            selectedBlockSidebarOpen: false,
            menuBarOpen: false,
            selectedVisualisation: "contributions",
            lastTitleIndex: 0,
            coUsers: {},
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
            isloading: {
                bpDetails: true,
                blockprobe: true,
                images: true
            },
            tooltipText:{
                menuClickFirst:[
                    {
                        title: 'Let\'s see your story!',
                        target: '.menu-button',
                        content: 'Click on the menu icon.',
                        disableBeacon: true
                    }
                ],
                preShareStory:[
                    {
                        title: 'Let\'s share your story with friends!',
                        target: '.menu-button',
                        content: 'Click on the menu icon.',
                        disableBeacon: false,
                        placementBeacon: 'left',
                        event: 'hover'
                    }
                ]
            },
            showTooltip:{
                buildStory: JSON.parse(JSON.stringify(props.buildStorytooltip)),
                preCommitToStory: false,
                commitToStory: false,
                menuClickFirst: false,
                viewDashboardView: false,
                preShareStory: false,
                shareStory: false
            }
        }

        //props include bId, uId, posts, updatePosts
        var shajs = require('sha.js');
        this.state.uIdHash = shajs('sha256').update(this.props.uId).digest('hex');
        this.state.shajs = shajs;

        if(!isNullOrUndefined(props.permit) && props.permit == 'VIEWER' ){
            this.state.selectedVisualisation = 'dashboard';
        }

        this.bpDetailsDoc = null;
        this.bpUsersRef = null;
        this.bpLangRef = null;

        ReactGA.initialize('UA-143383035-1');   
        ReactGA.pageview('/userBlockprobePrivate');

        this.changeSelectedBlock = this.changeSelectedBlock.bind(this);
        this.onSetSelectedBlockSidebarOpen = this.onSetSelectedBlockSidebarOpen.bind(this);
        this.onSetMenuBlockSidebarOpen = this.onSetMenuBlockSidebarOpen.bind(this);
        this.renderVisualisation = this.renderVisualisation.bind(this);
        this.setNewVisualisation = this.setNewVisualisation.bind(this);
        this.addEdge = this.addEdge.bind(this);
        this.createInvestigationGraph = this.createInvestigationGraph.bind(this);
        this.closeSelectedBlockSidebar = this.closeSelectedBlockSidebar.bind(this);
        this.getImages = this.getImages.bind(this);
        this.refreshBlockprobe = this.refreshBlockprobe.bind(this);
        this.sortBlocks = this.sortBlocks.bind(this);
        this.isSummaryBlock = this.isSummaryBlock.bind(this);
        this.createSummaryList = this.createSummaryList.bind(this);
        this.generateMultiSelectEntityList = this.generateMultiSelectEntityList.bind(this);
        this.finishBuildingStoryTooltip = this.finishBuildingStoryTooltip.bind(this);
        this.startAddBlockToStoryTooltip = this.startAddBlockToStoryTooltip.bind(this);
        this.finishAddingBlockToStoryTooltip = this.finishAddingBlockToStoryTooltip.bind(this);
        this.finishOpenMenuForDashboard = this.finishOpenMenuForDashboard.bind(this);
        this.finishDashboardView = this.finishDashboardView.bind(this);
        this.startShowingShareStoryTooltip = this.startShowingShareStoryTooltip.bind(this);
        this.finishShareStoryTooltip = this.finishShareStoryTooltip.bind(this);
        
        this.writeShortBlocktree = this.writeShortBlocktree.bind(this);   
        this.getBlockTree = this.getBlockTree.bind(this);   
        this.getLatestTimestamp = this.getLatestTimestamp.bind(this);
        this.getLatestBlocks = this.getLatestBlocks.bind(this);
        this.buildBlocktree = this.buildBlocktree.bind(this);   

        this.commitBlockToBlockprobe = this.commitBlockToBlockprobe.bind(this);
        this.commitMultipleBlocksToBlockprobe = this.commitMultipleBlocksToBlockprobe.bind(this);
        this.commitSingleBlockToBlockprobe = this.commitSingleBlockToBlockprobe.bind(this);          
    }

    finishBuildingStoryTooltip(){
        var showTooltip = this.state.showTooltip;
        showTooltip.buildStory = false;
        showTooltip.preCommitToStory = true;
        showTooltip.commitToStory = false;
        showTooltip.menuClickFirst = false;
        showTooltip.viewDashboardView = false;
        this.setState({
            showTooltip: showTooltip
        });
    }

    startAddBlockToStoryTooltip(){
            var showTooltip = this.state.showTooltip;
            showTooltip.buildStory = false;
            showTooltip.preCommitToStory = false;
            showTooltip.commitToStory = true;
            showTooltip.menuClickFirst = false;
            showTooltip.viewDashboardView = false;
            this.setState({
                showTooltip: showTooltip
            });
    }

    finishAddingBlockToStoryTooltip(){
        var showTooltip = this.state.showTooltip;
        showTooltip.buildStory = false;
        showTooltip.preCommitToStory = false;
        showTooltip.commitToStory = false;
        showTooltip.menuClickFirst = true;
        showTooltip.viewDashboardView = false;
        this.setState({
            showTooltip: showTooltip
        });
        ReactGA.event({
            category: 'open_menu_tooltip',
            action: 'Open menu tooltip',
            label: this.props.bId
          });
    }

    finishOpenMenuForDashboard(){
        var showTooltip = this.state.showTooltip;
        showTooltip.buildStory = false;
        showTooltip.preCommitToStory = false;
        showTooltip.commitToStory = false;
        showTooltip.menuClickFirst = false;
        showTooltip.viewDashboardView = true;
        this.setState({
            showTooltip: showTooltip
        });
    }

    finishDashboardView(){
        var showTooltip = this.state.showTooltip;
        showTooltip.buildStory = false;
        showTooltip.commitToStory = false;
        showTooltip.menuClickFirst = false;
        showTooltip.viewDashboardView = false;
        showTooltip.preShareStory = true;
        showTooltip.shareStory = false;
        this.setState({
            showTooltip: showTooltip
        });
    }

    startShowingShareStoryTooltip(){
        var showTooltip = this.state.showTooltip;
        showTooltip.buildStory = false;
        showTooltip.commitToStory = false;
        showTooltip.menuClickFirst = false;
        showTooltip.viewDashboardView = false;
        showTooltip.preShareStory = false;
        showTooltip.shareStory = true;
        this.setState({
            showTooltip: showTooltip
        });
    }

    finishShareStoryTooltip(){
        var showTooltip = this.state.showTooltip;
        showTooltip.buildStory = false;
        showTooltip.commitToStory = false;
        showTooltip.menuClickFirst = false;
        showTooltip.viewDashboardView = false;
        showTooltip.shareStory = false;
        this.setState({
            showTooltip: showTooltip
        });
    }

    setNewVisualisation(newVisualisation){
        if(this.state.visualisation != newVisualisation){

            if(newVisualisation == 'publish_blockprobe'){
                if(this.state.showTooltip.shareStory){
                    this.finishShareStoryTooltip();
                }
            }
            else{
                if(this.state.showTooltip.shareStory){
                    this.finishDashboardView();
                }
            }

            if(newVisualisation == 'dashboard'){
                if(this.state.showTooltip.viewDashboardView){
                    this.finishDashboardView();
                }
            }
            else{
                if(this.state.showTooltip.viewDashboardView){
                    this.finishAddingBlockToStoryTooltip();
                }
            }            

            this.setState({
                selectedVisualisation: newVisualisation,
                menuBarOpen: false
            });
            // console.log(newVisualisation);
        }
    }

    onSetSelectedBlockSidebarOpen(open) {
        if(open){
            if(this.state.showTooltip.preCommitToStory){
                this.startAddBlockToStoryTooltip();
            }
        }
        else{
            if(this.state.showTooltip.commitToStory){
                this.finishBuildingStoryTooltip();
            }
        }
        this.setState({ selectedBlockSidebarOpen: open });
    }

    onSetMenuBlockSidebarOpen(open) {
        if(open){
            if(this.state.showTooltip.menuClickFirst){
                this.finishOpenMenuForDashboard();
            }
            else if(this.state.showTooltip.preShareStory){
                this.startShowingShareStoryTooltip();
            }
            ReactGA.event({
                category: 'open_menu',
                action: 'Opened menu',
                label: this.props.bId
              });
        }
        else{
            ReactGA.event({
                category: 'Open menu',
                action: 'Open menu '+ String(this.props.bId),
                label: 'Open menu '+ String(this.props.bId)
              });
            if(this.state.selectedVisualisation!='dashboard' && this.state.showTooltip.viewDashboardView){
                this.finishAddingBlockToStoryTooltip();
            }
            if(this.state.selectedVisualisation!='publish_blockprobe' && this.state.showTooltip.shareStory){
                this.finishDashboardView();
            }
        }

        this.setState({ menuBarOpen: open });
        // console.log(this.state.menuBarOpen);
    }

    addBlocksToProbe(block){      

        var tempState = this.state.blockTree;
        
        //If empty block exists
        if(block.key in tempState){

            //If children is not null or undefined, then add children to block
            if(!isNullOrUndefined(tempState[block.key].children)){        
                block.children = [...tempState[block.key].children];
            }
        }

        tempState[block.key] = block;
        

        
        //add parent if not there
        var prevBlockId = block.previousKey;
        if(prevBlockId in tempState){

            //If parent does not have list
            if(isNullOrUndefined(tempState[prevBlockId].children)){
                tempState[prevBlockId].children = [];
            }

        }
        else{
            tempState[prevBlockId]= {
                children:[]
            };
        }
        tempState[prevBlockId].children.push(block.key);

        var latestBlock = this.state.latestBlock;
        if(isNullOrUndefined(latestBlock) || 
        (latestBlock.timestamp < block.timestamp )){
            latestBlock = block;
        }

        //get Index
        let currIndex = Utils.extractBlockIndex(block);
        let latestIndex = this.state.lastTitleIndex;
        latestIndex = Math.max(currIndex,latestIndex);

        this.setState({
                 blockTree:tempState,
                 latestBlock: latestBlock,
                 lastTitleIndex: latestIndex
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
         
    }

    traverseBlockTree(nodeId, timelineList, timelineBlockStatus, blockList, blockStatus, modifyRef, entityChanges){
        var currBlock = this.state.blockTree[nodeId];

        if(isNullOrUndefined(currBlock))
            return;
            
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
            imageMapping[doc.data()['entity']] = doc.data()['url'];
        });
        this.setState({imageMapping: imageMapping});

        let allImages = Utils.getShortenedListOfImages(imageMapping);  
        if(allImages.length>0){

            firebase.firestore().collection("Blockprobes").doc(this.props.bId).
                        collection("users").doc(this.state.uIdHash).collection("shortImages").get().then((snapshot) => {
                    snapshot.forEach((doc) => {
                        var ref = firebase.firestore().collection("Blockprobes").doc(this.props.bId).
                        collection("users").doc(this.state.uIdHash).collection("shortImages").doc(doc.id).delete();
                    });
                    for(var i=0; i<allImages.length; i++){
                        firebase.firestore().collection("Blockprobes").doc(this.props.bId).
                        collection("users").doc(this.state.uIdHash).collection("shortImages").doc(String(i)).set(allImages[i]);        
                    }        
                });
        }      
    }

    createBlockprobe(snapshot){
        snapshot.forEach((singleBlock) => ( this.addBlocksToProbe(singleBlock)));        
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
                
                // console.log(this.props.prevTitle);
                // console.log(this.state.blockprobeTitle);                

                //sort entityChanges
                for(let entity in entityChanges){
                    entityChanges[entity].sort(function (a,b){
                        return a.ts - b.ts;
                    })
                }
                // console.log(entityChanges);
                let newBlockTree  = Utils.modifyBlockEntities(blockList,this.state.blockTree,entityChanges);
                // console.log(newBlockTree);

                if(this.props.prevTitle != this.state.blockprobeTitle){
                    let currBlockprobe = JSON.parse(JSON.stringify(this.props.currBlockprobe));
                    currBlockprobe.title = this.state.blockprobeTitle;
                    currBlockprobe.timestamp = this.state.bpDetailsLastTs;
                    this.props.modifyBlockprobe('update', currBlockprobe);

                    let posts = this.props.posts;
                    let index = -1;
                    for(let i=0; i<posts.length; i++){
                        if(posts[i].bp == this.props.bId){
                            index = i;
                            break;
                        }
                    }        
                    if(index > -1){
                        posts[index].title = this.state.blockprobeTitle;
                        this.props.updatePosts(posts,this.props.bId);
                    }
                
                }
        }
        catch{
        }

        // console.log(blockList);
        // console.log(blockStatus);
        
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

        // console.log(finalBlockList);               
    }

    writeShortBlocktree(){
        let allBlocks = Utils.getShortenedListOfBlockTree(this.state.blockTree);
        if(allBlocks &&  allBlocks.length>0){
            firebase.firestore().collection("Blockprobes").doc(this.props.bId).
            collection("users").doc(this.state.uIdHash).collection("shortBlockprobe").get().then((snapshot) => {
                    
                snapshot.forEach((doc) => {
                        var ref = firebase.firestore().collection("Blockprobes").doc(this.props.bId).
                        collection("users").doc(this.state.uIdHash).collection("shortBlockprobe").doc(doc.id).delete();
                    });
                for(var i=0; i<allBlocks.length; i++){
                        firebase.firestore().collection("Blockprobes").doc(this.props.bId).
                        collection("users").doc(this.state.uIdHash).collection("shortBlockprobe").
                        doc(String(i)).set(allBlocks[i]);        
                }       
                });
        }
    }

    changeSelectedBlock = (block) =>{
        //check if block is modified. Then show latest
        if(block.blockState == 'SUCCESSFUL' && this.state.modifyRef[block.key]){
            block = this.state.blockTree[this.state.modifyRef[this.state.modifyRef[block.key]]];
            block.blockState = 'SUCCESSFUL';
            block.bpID = this.props.bId;
    
        }
        this.setState({
            selectedBlock:block
        }); 
        this.onSetSelectedBlockSidebarOpen(true);
    }

    refreshBlockprobe(){
        var loadingState = this.state.isloading;
        loadingState.blockprobe = true;
        loadingState.images = true;
        this.setState({
            blockTree: {},
            investigationGraph: {},
            timeline: [],
            isloading: loadingState
        });

        this.getBlockTree();

        firebase.firestore().collection("Blockprobes").doc(this.props.bId)
        .collection("images").get().then((snapshot) => {
            this.getImages(snapshot);
            var loadingState = this.state.isloading;
            loadingState.images = false;
            this.setState({
                isloading: loadingState
            });
        });

        ReactGA.event({
            category: 'Refresh blockprobe',
            action: 'Refresh blockprobe '+ String(this.props.bId),
            label: 'Refresh blockprobe '+ String(this.props.bId)
          });
    }

    getLatestTimestamp(snapshot){
        let timestampLatest = 0;
        snapshot.forEach((doc) => { 
            let data = doc.data().blocks;
            for(let i=0; data && i<data.length; i++){
                if(data[i].timestamp)
                    timestampLatest = Math.max(timestampLatest, data[i].timestamp);
            }
        }); 
        return timestampLatest;
      }

      async getLatestBlocks(latestTimestamp, blockList){

        let currTs = Date.now();
        let latestBlocks = await firebase.firestore().collection("Blockprobes").doc(this.props.bId)
        .collection("fullBlocks").where("timestamp",">",latestTimestamp)
        .where("timestamp","<",currTs)
        .orderBy("timestamp").get();
        
        if(latestBlocks){
            latestBlocks.forEach((doc) => {
                let block = doc.data();
                blockList.push(block);
            });
        }
      }

      async buildBlocktree(snapshot){
            let latestTime = this.getLatestTimestamp(snapshot);
            let blockList = [];
            snapshot.forEach((doc) => {
                    let data =doc.data();
                    for(let i=0; data && data.blocks && i<data.blocks.length;i++){
                        blockList.push(data.blocks[i]);
                    }

                });
            await this.getLatestBlocks(latestTime,blockList);                   
            //console.log(blockList);

            this.createBlockprobe(blockList);

            this.writeShortBlocktree();
            var loadingState = this.state.isloading;
            loadingState.blockprobe = false;
            this.setState({
                isloading: loadingState
            });           
      }

    getBlockTree(){
        firebase.firestore().collection("Blockprobes").doc(this.props.bId).
        collection("users").doc(this.state.uIdHash).collection("shortBlockprobe").get().then((snapshot) => {
                this.buildBlocktree(snapshot);
        });
    }


    async componentDidMount(){        
        this.bpDetailsDoc = firebase.firestore().collection("Blockprobes").
        doc(this.props.bId);
        
        this.bpDetailsDoc.onSnapshot((snapshot) => {
            this.setState({
                bpDetails: snapshot.data()
            })
            // console.log(snapshot.data())
            var loadingState = this.state.isloading;
            loadingState.bpDetails = false;
            this.setState({
                isloading: loadingState
            });
        });

        this.getBlockTree();        

        firebase.firestore().collection("Blockprobes").doc(this.props.bId)
        .collection("images").get().then((snapshot) => {
            this.getImages(snapshot);
            var loadingState = this.state.isloading;
            loadingState.images = false;
            this.setState({
                isloading: loadingState
            });
        });

        let scope = this;
        this.bpUsersRef = firebase.database().ref('Blockprobes/'+this.props.bId +'/users');
        this.bpUsersRef.on('child_added', function(data){
            let userVal = data.val();
            let coUsers = scope.state.coUsers;
            coUsers[userVal['id']] = userVal;
            scope.setState({
                coUsers: coUsers 
            });
        });
        this.bpUsersRef.on('child_changed', function(data){
            let userVal = data.val();
            let coUsers = scope.state.coUsers;
            coUsers[userVal['id']] = userVal;
            scope.setState({
                coUsers: coUsers 
            });
        });
        this.bpUsersRef.on('child_removed', function(data){
            let userVal = data.val();
            let coUsers = scope.state.coUsers;
            delete coUsers[userVal['id']];
            scope.setState({
                coUsers: coUsers 
            });
        })

        this.bpLangRef = firebase.firestore().collection("blprobeLang").doc(this.props.bId);
        this.bpLangRef.onSnapshot((snapshot) => {
            let lang = 'en';
            if(snapshot.exists){
                if(!isNullOrUndefined(snapshot.data()) && !isNullOrUndefined(snapshot.data()['lang']))
                    lang = snapshot.data()['lang'];
            }
            scope.setState({
                lang: lang,
                langLoading: false
            });
        },
        (error) => {
            scope.setState({
                langLoading: false
            });
        });
    }

    componentWillUnmount(){
        var unsub = this.bpDetailsDoc.onSnapshot(() => {});
        unsub();

        if(!isNullOrUndefined(this.bpUsersRef))
            this.bpUsersRef.off();
        if(!isNullOrUndefined(this.bpLangRef)){
            var unsubLang = this.bpLangRef.onSnapshot(() => {})
            unsubLang();
        }
    }

    renderVisualisation(){
        /*
                            <SummaryViewComponent
                        summaryBlocks = {this.state.summaryList}/>
                        */
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
        else if(this.state.selectedVisualisation == "dashboard"){
            return(
                <div style={{marginBottom: '40px'}}>
                    <GamifiedDashboardViewComponent
                        summaryBlocks = {this.state.summaryList}
                        blockTree={this.state.blockTree} 
                        investigationGraph={this.state.investigationGraph}
                        imageMapping = {this.state.imageMapping}
                        selectBlock={this.changeSelectedBlock}
                        multiSelectEntityList = {this.state.multiSelectEntityList}
                        lang = {this.state.lang}
                        timeline={this.state.timeline}  
                        setNewVisualisation = {this.setNewVisualisation}                   
                    />
                </div>
            );
        }
        else if(this.state.selectedVisualisation == "graph"){
            return(
                <div>
                    <GraphComponent blockTree={this.state.blockTree} 
                        investigationGraph={this.state.investigationGraph}
                        selectBlock={this.changeSelectedBlock}
                        imageMapping = {this.state.imageMapping}
                        lang = {this.state.lang}
                        multiSelectEntityList = {this.state.multiSelectEntityList}/>
                </div>
            );
        }
        else if(this.state.selectedVisualisation == "find_connections"){
            return(
                <div>
                    <FindConnectionsComponent blockTree={this.state.blockTree} 
                        investigationGraph={this.state.investigationGraph}
                        selectBlock={this.changeSelectedBlock}
                        imageMapping = {this.state.imageMapping}
                    />
                </div>
            );
        }
        else if(this.state.selectedVisualisation == "contributions"){
            return(
                <div>
                    <UserBlocksComponent 
                    uId={this.props.uId}
                    bId={this.props.bId}
                    permit = {this.props.permit}
                    bpDetails = {this.state.bpDetails}    
                    selectBlock={this.changeSelectedBlock}
                    imageMapping = {this.state.imageMapping}
                    investigationGraph = {this.state.investigationGraph}
                    buildStory = {this.state.showTooltip.buildStory}
                    finishBuildingStoryTooltip = {this.finishBuildingStoryTooltip}
                    commitBlockToBlockprobe = {this.commitBlockToBlockprobe}
                    commitMultipleBlocksToBlockprobe = {this.commitMultipleBlocksToBlockprobe}
                    finishAddingBlockToStoryTooltip = {this.finishAddingBlockToStoryTooltip}
                    setNewVisualisation = {this.setNewVisualisation}   
                    refreshBlockprobe = {this.refreshBlockprobe}  
                    blockStatus = {this.state.blockStatus}  
                    blockTree={this.state.blockTree} 
                    multiSelectEntityList = {this.state.multiSelectEntityList}
                    timeline={this.state.timeline}  
                    summaryBlocks = {this.state.summaryList}
                    lastIndex = {this.state.lastTitleIndex} 
                    lang = {this.state.lang}          
                    />
                </div>
            );
        }
        else if(this.state.selectedVisualisation == "manage_blockprobe"){
            return(
                <div>
                    <BlockprobeSettingsComponent 
                    uId={this.props.uId}
                    bpId={this.props.bId}
                    details = {this.state.bpDetails}
                    permit = {this.props.permit}
                    coUsers = {this.state.coUsers}
                    lang = {this.state.lang}
                    />
                </div>
            )

        }
        else if(this.state.selectedVisualisation == "publish_blockprobe"){
            return(
                <div>
                    <ShareBlockprobeComponent 
                    uId={this.props.uId}
                    bpId={this.props.bId}
                    details = {this.state.bpDetails}
                    permit = {this.props.permit}
                    blockTree = {this.state.blockTree}
                    imageMapping = {this.state.imageMapping}
                    posts = {this.props.posts}
                    title = {this.state.blockprobeTitle}
                    updatePosts = {this.props.updatePosts}
                    setNewVisualisation = {this.setNewVisualisation}
                    />
                </div>
            )

        }

        //ShareBlockprobeComponent

        return (
            <div style={{textAlign:"center"}}>
                FEATURE TO BE IMPLEMENTED
            </div>
        );
    }

    closeSelectedBlockSidebar(){
        this.onSetSelectedBlockSidebarOpen(false)
    }

    componentWillReceiveProps(newProps){
        if(newProps.buildStorytooltip){
            var showTooltip = this.state.showTooltip;
            showTooltip.buildStory = JSON.parse(JSON.stringify(newProps.buildStorytooltip));
            this.setState({showTooltip:showTooltip});
        }
    }

    async commitMultipleBlocksToBlockprobe(blocks){
        let currTime = Date.now();
        var loadingState = this.state.isloading;
        loadingState.blockprobe = true;
        this.setState({            
            isloading: loadingState
        });

        let tasks = [];
        for(let i=0;!isNullOrUndefined(blocks) && i<blocks.length; i++){
            let block = blocks[i];
            let task = this.commitSingleBlockToBlockprobe(block,currTime);
            tasks.push(task);
            currTime = currTime + 10;
        }
        await Promise.all(tasks);
        this.refreshBlockprobe();
    }

    async commitSingleBlockToBlockprobe(block, timestamp){
        const oldKey = block.key;
        //Deepcopy of block
        const blockStr = JSON.stringify(block);
        var newBlock = JSON.parse(blockStr);
        //console.log(this.state);
        var newBlockId = this.state.shajs('sha256').update(this.state.uIdHash+String(newBlock.timestamp)).digest('hex');
        newBlock.timestamp = timestamp; 
        newBlock.verificationHash = newBlockId;
        newBlock.previousKey = this.state.latestBlock.key;
        if(!("bpID" in newBlock)){
            newBlock.bpID = this.props.bId;
        }
        if(!("entities" in newBlock)){
            newBlock.entities = [];
        }
        if(!("evidences" in newBlock)){
            newBlock.evidences = [];
        }
        if(newBlock.actionType == "ADD" || newBlock.actionType == "BpDetails"){
            newBlock.referenceBlock = null;
        }
        if(newBlock.actionType == "BpDetails"){
            if(!('title' in newBlock)){
                newBlock.title = this.state.blockprobeTitle;
            }
            if(!('summary' in newBlock)){
                newBlock.summary = this.state.blockprobeSummary;
            }
        }

        newBlock.key = this.state.shajs('sha256').update(newBlockId + newBlock.previousKey).digest('hex');            
        if(isNullOrUndefined(newBlock.blockDate)){
            newBlock.blockDate = null;
        }
        if(isNullOrUndefined(newBlock.blockTime)){
            newBlock.blockTime = null;
        }
        newBlock.blockState = "SUCCESSFUL";

        var committedBlock = JSON.parse(JSON.stringify(newBlock));
        delete committedBlock["blockState"];
        delete committedBlock["bpID"];
        delete committedBlock["children"];
        //console.log(newBlock);
        //console.log(committedBlock);
        
        if(oldKey){
            await firebase.database().ref("Blockprobes/"+newBlock.bpID
                +"/reviewBlocks/"+oldKey).remove();

            await firebase.firestore().collection("Blockprobes").
                doc(newBlock.bpID).
                collection("users").doc(this.state.uIdHash).
                collection("userBlocks").
                doc(oldKey).delete();
        }
        
        if(!(newBlock.actionType == "BpDetails")){
            await firebase.firestore().collection("Blockprobes").
                doc(newBlock.bpID).
                collection("users").doc(this.state.uIdHash).
                collection("userBlocks").
                doc(newBlock.key).set(newBlock);
        }
        
        await firebase.firestore().collection("Blockprobes").
            doc(newBlock.bpID).
            collection("fullBlocks").
            doc(committedBlock.key).set(committedBlock);
    }

    async commitBlockToBlockprobe(block){

        var loadingState = this.state.isloading;
        loadingState.blockprobe = true;
        this.setState({            
            isloading: loadingState
        });

        const oldKey = block.key;
            

        //Deepcopy of block
        const blockStr = JSON.stringify(block);
        var newBlock = JSON.parse(blockStr);
        //console.log(this.state);
        var newBlockId = this.state.shajs('sha256').update(this.state.uIdHash+String(newBlock.timestamp)).digest('hex');
        newBlock.timestamp = Date.now(); 
        newBlock.verificationHash = newBlockId;
        newBlock.previousKey = this.state.latestBlock.key;
        if(!("bpID" in newBlock)){
            newBlock.bpID = this.props.bId;
        }
        if(!("entities" in newBlock)){
            newBlock.entities = [];
        }
        if(!("evidences" in newBlock)){
            newBlock.evidences = [];
        }
        if(newBlock.actionType == "ADD" || newBlock.actionType == "BpDetails"){
            newBlock.referenceBlock = null;
        }
        if(newBlock.actionType == "BpDetails"){
            if(!('title' in newBlock)){
                newBlock.title = this.state.blockprobeTitle;
            }
            if(!('summary' in newBlock)){
                newBlock.summary = this.state.blockprobeSummary;
            }
        }

        newBlock.key = this.state.shajs('sha256').update(newBlockId + newBlock.previousKey).digest('hex');            
        if(isNullOrUndefined(newBlock.blockDate)){
            newBlock.blockDate = null;
        }
        if(isNullOrUndefined(newBlock.blockTime)){
            newBlock.blockTime = null;
        }
        newBlock.blockState = "SUCCESSFUL";

        var committedBlock = JSON.parse(JSON.stringify(newBlock));
        delete committedBlock["blockState"];
        delete committedBlock["bpID"];
        delete committedBlock["children"];
        //console.log(newBlock);
        //console.log(committedBlock);
        
        if(oldKey){
            await firebase.database().ref("Blockprobes/"+newBlock.bpID
                +"/reviewBlocks/"+oldKey).remove();

            await firebase.firestore().collection("Blockprobes").
                doc(newBlock.bpID).
                collection("users").doc(this.state.uIdHash).
                collection("userBlocks").
                doc(oldKey).delete();
        }
        
        if(!(newBlock.actionType == "BpDetails")){
            await firebase.firestore().collection("Blockprobes").
                doc(newBlock.bpID).
                collection("users").doc(this.state.uIdHash).
                collection("userBlocks").
                doc(newBlock.key).set(newBlock);
        }
        
        await firebase.firestore().collection("Blockprobes").
            doc(newBlock.bpID).
            collection("fullBlocks").
            doc(committedBlock.key).set(committedBlock);

        this.refreshBlockprobe();
    }

    render(){
        return (
            <div>

            <Sidebar
                sidebar={<div className="right-sidebar">
                <ViewBlockComponent 
                selectedBlock={this.state.selectedBlock}
                uId={this.props.uId}
                bpId={this.props.bId}
                closeSideBar = {this.closeSelectedBlockSidebar}
                bpDetails = {this.state.bpDetails}
                latestBlock ={this.state.latestBlock}
                refreshBlockprobe = {this.refreshBlockprobe}
                commitToStoryTooltip = {this.state.showTooltip.commitToStory}
                finishAddingBlockToStoryTooltip = {this.finishAddingBlockToStoryTooltip}
                />
                </div>}
                open={this.state.selectedBlockSidebarOpen}
                onSetOpen={this.onSetSelectedBlockSidebarOpen}
                pullRight={true}
                defaultSidebarWidth='200px'
                styles={{ sidebar: { background: "#fefefe", position:'fixed' } }}
            >

            </Sidebar>

            <Sidebar
                sidebar={<div className="left-sidebar">
                    <VisualizeOptionsListComponent 
                    selectVisualisation={this.setNewVisualisation}
                    selectedVisualisation={this.state.selectedVisualisation}
                    permit = {this.props.permit}
                    isViewOnly={false}
                    dashboardTooltip={this.state.showTooltip.viewDashboardView}
                    shareStoryTooltip={this.state.showTooltip.shareStory}/>
                </div>}
                open={this.state.menuBarOpen}
                onSetOpen={this.onSetMenuBlockSidebarOpen}
                pullRight={false}
                defaultSidebarWidth='200px'
                styles={{ sidebar: { background:"white", position:'fixed' } }}
            >

            <div style={{height:'100%',overflowY:'scroll'}}>
                <div className="blockprobe-options-container">
                    <Joyride
                        styles={{
                            options: {
                            arrowColor: '#e3ffeb',
                            beaconSize: '3em',
                            primaryColor: '#05878B',
                            backgroundColor: '#e3ffeb',
                            overlayColor: 'rgba(10,10,10, 0.4)',
                            width: 900,
                            zIndex: 1000,
                            }
                        }}
                        steps={this.state.tooltipText.menuClickFirst}
                        run = {this.state.showTooltip.menuClickFirst}                    
                        /> 
                    <Joyride
                        styles={{
                            options: {
                            arrowColor: '#e3ffeb',
                            beaconSize: '3em',
                            primaryColor: '#05878B',
                            backgroundColor: '#e3ffeb',
                            overlayColor: 'rgba(10,10,10, 0.4)',
                            width: 900,
                            zIndex: 1000,
                            }
                        }}
                        steps={this.state.tooltipText.preShareStory}
                        run = {this.state.showTooltip.preShareStory}                    
                        /> 
                    <button onClick={() => { this.onSetMenuBlockSidebarOpen(true)}}
                    className="menu-button">
                            <MenuIcon/>
                    </button>
                    <button onClick={() => { this.refreshBlockprobe()}}
                    className="sync-button">
                            <SyncIcon/>
                    </button>
                </div>
                <div className="blockprobe-header"> 
                       {!isNullOrUndefined(this.state.blockprobeTitle)?
                            <BpDetail 
                                type = "title"
                                value = {this.state.blockprobeTitle}
                                lastTs = {this.state.bpDetailsLastTs}
                                permit = {this.props.permit}
                                posts = {this.props.posts}
                                commitBlockToBlockprobe = {this.commitBlockToBlockprobe}></BpDetail>
                                :
                            null
                        }                                       
                    <h4>{this.state.blockprobeSummary}</h4>
                </div>

                {this.state.isloading.blockprobe || this.state.isloading.bpDetails || this.state.langLoading?
                    <div style={{width:'50px',margin:'auto'}}>
                        <Loader 
                        type="TailSpin"
                        color="#00BFFF"
                        height="50"	
                        width="50"              
                        /> 
                    </div>
                    :
                this.renderVisualisation()}
            </div>
            </Sidebar>


            </div>
        );
    }


}
export default ViewBlockprobePrivateComponent;