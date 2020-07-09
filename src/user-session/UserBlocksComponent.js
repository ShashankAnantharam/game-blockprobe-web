import React, { Component } from 'react';
import * as firebase from 'firebase';
import ReactGA from 'react-ga';
import SingleBlock from '../view/SingleBlock';
import BulkDraftBlockComponent from '../view/Bulk/BulkDraftBlockComponent';
import List from '@material-ui/core/List';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';
import IconButton from '@material-ui/core/IconButton';
import './UserBlocksComponent.css';
import { isNullOrUndefined } from 'util';
import EntityPaneView from "../view/EntityPane/EntityPane";
import ImagePaneView from "../view/ImagePane/ImagePane";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Paper from '@material-ui/core/Paper';
import GraphComponent from "../viso/GraphComponent";
import  TimelineComponent from "../viso/TimelineComponent";
import SummaryViewComponent from "../viso/summary/SummaryView";
import * as Utils from '../common/utilSvc';
import SingleEntityView from '../view/Draft/SingleEntityView/SingleEntityView';
import AddEdgeView from  '../view/Draft/AddEdgeView/AddEdgeView';
import AddStarEdgesView from  '../view/Draft/AddEdgeView/AddStarEdgesView';
import AddSingleTopicView from  '../view/Draft/AddEdgeView/AddSingleTopic';
import AddTimeView from '../view/Draft/AddTimeView/AddTimeView';

import Joyride from 'react-joyride';
import Checkbox from '../view/Draft/Checkbox';

////var uIdHash = crypto.createHash('sha256').update(`${userId}`).digest('hex');

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  });

class UserBlocksComponent extends React.Component {
    
    constructor(props){
        super(props);
        //props: finishBuildingStoryTooltip, bpDetails, finishAddingBlockToStoryTooltip, blockStatus, lastIndex

        this.state={            
            uIdHash:'',
            shajs:null,
            selectedDraftBlockId: null,
            displaySingleEntity: true,
            entityPaneList: [],
            draftBlocks:{},
            successBlocks:{},
            toReviewBlocks:{},
            inReviewBlocks:{},
            blockStateMap:{},
            lastIndexDraftBlocks: [0],
            newBlock: {
                title:'',
                summary:'',
                blockState:'DRAFT',
                entities:[]
            },
            graphViewAddType: 'single_connection',
            multiSelectedBlocks: {},
            dialogType: null,
            dialogText:{
                delete:{
                    title: "Delete blocks",
                    desc: "You are about to delete these blocks. This action cannot be reversed.\nDo you confirm?"
                },
                commit:{
                    title: "Add blocks to game",
                    desc: "You are about to add these blocks to the game.\nDo you confirm?"
                },
                selected:{
                    title: null,
                    desc: null
                }
            },
            dialog: false,
            imageUploading: false,
            blocksUploading: false,
            viewPublishLink: false,
            multiSelectDraftBlockStatus: false,
            isCreateBlockClicked:false,
            isCreateBulkBlockClicked: false,
            isEntityPaneOpen: false,
            isImagePaneOpen: false,
            urlPrefix: 'https://blprobe.com/view/',
            gameUrlPrefix: 'https://blprobe.com/game/',
            gameResultsUrlPrefix: 'https://blprobe.com/gameResults/',
            tooltipText:{
                entityPane:[                    
                    {                    
                        title: 'Your game is empty!',
                        target: '.entityPaneButtonTooltip',
                        content: 'First you have to define the entities or characters of your game. Click on this button to start defining the entities',
                        disableBeacon: true
                    }             
                ],
                addBlocks:[                    
                    {                    
                        title: 'Click on \'Contribute\' to start adding content to your game!',
                        target: '.addBulkBlockButton',
                        content: '',
                        disableBeacon: true
                    }             
                ],
                draftBlock:[
                    {
                        title: 'Click on any block (para) that you just added from the Draft list!',
                        target: '.draftBlocksList',
                        content: '',
                        disableBeacon: true
                    }
                ],
                commitBlock:[
                    {
                        title: 'Add your block to the game!',
                        target: '.inReviewBlockList',
                        content: 'Your block is in review. You can see it in this list. Since you are the creator of the game, you also get to review the block. But for now, you can skip the review and directly add it to the game. Click on your block in review.',
                        disableBeacon: true
                    }
                ]
            },
            showTooltip:{
                entityPane: false, //JSON.parse(JSON.stringify(props.buildStory)),
                addBlocks: JSON.parse(JSON.stringify(props.buildStory)), //false,
                draftBlock: false,
                commitBlock: false
            },
            selectedGraphNode: null
        }
        
        //props include bpId, uId
        var shajs = require('sha.js');
        this.state.uIdHash = shajs('sha256').update(this.props.uId).digest('hex');
        this.state.shajs = shajs;

        ReactGA.initialize('UA-143383035-1');   
        ReactGA.pageview('/userBlocks');

        this.modifyBlockList = this.modifyBlockList.bind(this);
        this.modifyBlockListWrapper = this.modifyBlockListWrapper.bind(this);
        this.selectBlock = this.selectBlock.bind(this);
        this.renderSingleBlock = this.renderSingleBlock.bind(this);
        this.renderSingleDraftBlock = this.renderSingleDraftBlock.bind(this);
        this.renderBlockOptions = this.renderBlockOptions.bind(this);
        this.createBlock = this.createBlock.bind(this);
        this.createBulkBlock = this.createBulkBlock.bind(this);
        this.cancelBulkBlock = this.cancelBulkBlock.bind(this);
        this.changeSelectedBlock = this.changeSelectedBlock.bind(this);
        this.openEntityPane = this.openEntityPane.bind(this);
        this.closeEntityPane = this.closeEntityPane.bind(this);
        this.openImagePane = this.openImagePane.bind(this);
        this.closeImagePane = this.closeImagePane.bind(this);
        this.deleteNewBlock = this.deleteNewBlock.bind(this);
        this.deleteMultipleDraftBlocks = this.deleteMultipleDraftBlocks.bind(this);
        this.commitMultipleDraftBlocks = this.commitMultipleDraftBlocks.bind(this);
        this.deleteDraftBlock = this.deleteDraftBlock.bind(this);
        this.addDraftBlock = this.addDraftBlock.bind(this);
        this.addDraftBlocksInBulk = this.addDraftBlocksInBulk.bind(this);
        this.updateStoryEntities = this.updateStoryEntities.bind(this);
        this.updateDraftBlock = this.updateDraftBlock.bind(this);
        this.getRandomReviewer = this.getRandomReviewer.bind(this);
        this.giveBlockToFirstReviewer = this.giveBlockToFirstReviewer.bind(this);
        this.submitDraftBlock = this.submitDraftBlock.bind(this);     
        this.updateEntityPaneList = this.updateEntityPaneList.bind(this);  
        this.initEntityPane = this.initEntityPane.bind(this); 
        this.finishTooltip = this.finishTooltip.bind(this);
        this.commitBlockToBlockprobe = this.commitBlockToBlockprobe.bind(this);
        this.setDashboardVisualisation = this.setDashboardVisualisation.bind(this);
        this.setShareVisualization = this.setShareVisualization.bind(this);
        this.convertBlockMapToList = this.convertBlockMapToList.bind(this);
        this.sortBlocks = this.sortBlocks.bind(this);
        this.isSummaryBlocksAvailable = this.isSummaryBlocksAvailable.bind(this);
        this.isGraphAvailable = this.isGraphAvailable.bind(this);
        this.isTimelineAvailable = this.isTimelineAvailable.bind(this);
        this.onSelectTab = this.onSelectTab.bind(this);
        this.toggleMultiSelect = this.toggleMultiSelect.bind(this);
        this.multiSelectBlocks = this.multiSelectBlocks.bind(this);
        this.toggleDialog = this.toggleDialog.bind(this);
        this.performAction = this.performAction.bind(this);
        this.toggleGraphOptionStyle = this.toggleGraphOptionStyle.bind(this);
        this.selectGraphNode = this.selectGraphNode.bind(this);
        this.publishStory = this.publishStory.bind(this);
    }

    toggleDialog(value, type){
        let dialogText = this.state.dialogText;
        if(type == 'delete'){
            dialogText.selected.title = dialogText.delete.title;
            dialogText.selected.desc = dialogText.delete.desc;
        }
        else if(type == 'commit'){
            dialogText.selected.title = dialogText.commit.title;
            dialogText.selected.desc = dialogText.commit.desc;
        }
        this.setState({
            dialog: value,
            dialogType: type
        });
    }

    updateEntityPaneList(list){
        this.setState({entityPaneList: list});
    }

    getRandomReviewer(reviewerList, revMap)
    {
        if(!isNullOrUndefined(reviewerList)){
            var val = (Date.now()%reviewerList.length);
            
            for(var i=0;i<reviewerList.length;i++)
            {
                var curr=(val+i)%(reviewerList.length);
                // console.log(reviewerList[i]);
                if(!(reviewerList[curr].id in revMap))
                {
                    return reviewerList[curr];
                }
            }
        }

        return null;
    }

    giveBlockToFirstReviewer(block)
    {
        var revMap={};

        //Deepcopy of reviewerList
        const reviewersStr = JSON.stringify(this.props.bpDetails.reviewers);
        var reviewersList = JSON.parse(reviewersStr);
        var randomReviewer = this.getRandomReviewer(reviewersList, revMap);

        if(randomReviewer!=null) {

            block.blockState = "TO REVIEW";

            revMap[randomReviewer.id]="-";
            firebase.firestore().collection("Blockprobes").
                doc(block.bpID).
                collection("users").doc(randomReviewer.id).
                collection("userBlocks").
                doc(block.key+"_r").set(block);

        }
        else{
            //console.log("No other reviewers left!");
        }



        var newBlock = {
            actionType: block.actionType,
            blockAuthor: this.state.uIdHash,
            entities: isNullOrUndefined(block.entities)?null:block.entities,
            evidences: isNullOrUndefined(block.evidences)?null:block.evidences,
            reviewers:revMap,
            summary: block.summary,
            timestamp: block.timestamp,
            title: block.title,
        }

        firebase.database().ref("Blockprobes/"+block.bpID
                        +"/reviewBlocks/"+block.key).set(newBlock);

    }


    modifyBlockList(block, add){
        if(block.blockState=="SUCCESSFUL" && 
            !(block.actionType=="entityChange") ){
            var currMap = this.state.successBlocks;
            if(add && this.props.blockStatus[block.key])
                currMap[block.key]=block;
            else
                delete currMap[block.key];
            this.setState({
                successBlocks:currMap
            });
        }
        else if(block.blockState=="UNDER REVIEW"){
            var currMap = this.state.inReviewBlocks;
            if(add)
                currMap[block.key]=block;
            else
                delete currMap[block.key];
            this.setState({
                inReviewBlocks:currMap
            });
        }
        else if(block.blockState=="TO REVIEW"){
            var currMap = this.state.toReviewBlocks;
            if(add)
                currMap[block.key]=block;
            else
                delete currMap[block.key];
            this.setState({
                toReviewBlocks:currMap
            });
        }
        else if(block.blockState=="DRAFT"){
            let lastIndex = this.state.lastIndexDraftBlocks;
            var currMap = this.state.draftBlocks;
            if(add){
                currMap[block.key]=block;

                //get index here
                let blockIndex = Utils.extractBlockIndex(block);                
                if(!isNullOrUndefined(blockIndex)){
                    lastIndex.push(blockIndex); 
                    lastIndex.sort();
                }
            }
            else{
                let blockIndex = Utils.extractBlockIndex(currMap[block.key]);
                delete currMap[block.key];                                
                if(!isNullOrUndefined(blockIndex)){                    
                    let newList = [], hasBeenRemoved = false;
                    for(let i=0; i<lastIndex.length; i++){
                        if(!hasBeenRemoved && lastIndex[i]==blockIndex){
                            hasBeenRemoved = true;
                        }
                        else{
                            newList.push(lastIndex[i]);
                        }
                    }
                    lastIndex = newList;
                }
            }
                        
            this.setState({
                draftBlocks: currMap,
                lastIndexDraftBlocks: lastIndex
            });           
        }
    }


    modifyBlockListWrapper(doc, add){
        var block = doc.data();
        var blockId = doc.id;
        var blockStateMap = this.state.blockStateMap;
        if(blockId in blockStateMap){
            var prevState = blockStateMap[blockId];
            var oldBlock = {
                key:block.key,
                blockState: prevState
            };
            //delete old block
            this.modifyBlockList(oldBlock,false);

            if(add){
                //add new block
                this.modifyBlockList(block,true);

                 //Update blockstate
               blockStateMap[blockId] = block.blockState;
            }
        }
        else if(add){
            //First time block gets added
            blockStateMap[blockId] = block.blockState;
            this.modifyBlockList(block,true);
        }
    }

    deleteMultipleDraftBlocks(){
        let multiSelectBlocks = this.state.multiSelectedBlocks;
        const scope = this;
        Object.keys(multiSelectBlocks).map((key) => {
            scope.deleteDraftBlock(key);
        });
        multiSelectBlocks = {};
        this.setState({
            multiSelectedBlocks: multiSelectBlocks
        });
    }

    commitMultipleDraftBlocks(){
        let multiSelectBlocks = this.state.multiSelectedBlocks;
        const scope = this;
        let blocks = [];
        Object.keys(multiSelectBlocks).map((key) => {
            if(key in this.state.draftBlocks){
                blocks.push(this.state.draftBlocks[key]);
            }
        });
        this.props.commitMultipleBlocksToBlockprobe(blocks);

        multiSelectBlocks = {};
        this.setState({
            multiSelectedBlocks: multiSelectBlocks
        });
    }

    deleteDraftBlock(blockKey){
        firebase.firestore().collection("Blockprobes").doc(this.props.bId)
        .collection("users").doc(this.state.uIdHash).collection("userBlocks").
        doc(blockKey).delete();
    }

    updateDraftBlock(blockKey, newBlock){
        firebase.firestore().collection("Blockprobes").doc(this.props.bId)
        .collection("users").doc(this.state.uIdHash).collection("userBlocks").
        doc(blockKey).set(newBlock);

        this.updateStoryEntities(newBlock);

    }

     addDraftBlocksInBulk(blocks){

        let latestIndex = 0 ;
        if(this.state.lastIndexDraftBlocks.length > 0)
            latestIndex = Math.max(latestIndex, this.state.lastIndexDraftBlocks[this.state.lastIndexDraftBlocks.length - 1]);

        if(this.props.lastIndex){
            latestIndex = Math.max(latestIndex, this.props.lastIndex);
        }

        var allEntitiesMap = {};
        var allEntities = [];
        for(var i=0; i<blocks.length; i++){
            if(blocks[i].entities){
                for(var j=0;j<blocks[i].entities.length;j++){
                    var currEntity = blocks[i].entities[j];
                    if(!(currEntity.title in allEntitiesMap)){
                        //new entity
                        allEntitiesMap[currEntity.title] = '';
                        allEntities.push(currEntity);
                    }
                }
            }

            if(!('title' in blocks[i])){
                blocks[i]['title'] = '';
            }
            let index = Utils.extractBlockIndex(blocks[i]);
            let isSummary = Utils.isTitleSummary(blocks[i].title);

            if(index == null){
                blocks[i].title = Utils.removeTitleHashtag(blocks[i].title);
                latestIndex += 0.1;
                blocks[i].title = '#' + String(latestIndex.toFixed(1)) + (isSummary? 's': '') 
                                    + ' ' + blocks[i].title;
            }
            else{
                if(index > latestIndex)
                    latestIndex = index;
            }
        }
        var dummyBlock = {entities:allEntities};
        this.updateStoryEntities(dummyBlock);

        var currTime = Date.now();
        for(var i =0;i<blocks.length; i++){
            blocks[i].timestamp = currTime + 1000*i;
            this.addDraftBlock(blocks[i], true);
        }
        this.setState({isCreateBulkBlockClicked: false});

        var args = {
            blockprobe: this.props.bId,
            count: blocks.length
        }    
    
        //console.log(blocks);
        if(blocks.length>0)
            this.finishTooltip('addBlocks');


        ReactGA.event({
            category: 'blocks',
            action: 'Add blocks in bulk',
            label: JSON.stringify(args)
          });
    }

    publishStory(){
        this.setState({
            blocksUploading: true,
            imageUploading: true
        });
        var bTree = this.props.blockTree;
        let allBlocks = Utils.getShortenedListOfBlockTree(bTree);
        if(allBlocks.length>0){

            firebase.firestore().collection("public").doc(this.props.bId)
                .collection("aggBlocks").get().then((snapshot) => {
                    snapshot.forEach((doc) => {
                        var ref = firebase.firestore().collection("public").doc(this.props.bId)
                            .collection("aggBlocks").doc(doc.id).delete();
                    });
                    for(var i=0; i<allBlocks.length; i++){
                        firebase.firestore().collection('public').doc(this.props.bId)
                        .collection('aggBlocks').doc(String(i)).set(allBlocks[i]);        
                    }
        
                }).then(
                    this.setState({
                        blocksUploading: false
                    })
                );
        }
        else{
            this.setState({
                blocksUploading: false
            });
        }

        //Add images
        var imageMap = this.props.imageMapping;
        let allImages = Utils.getShortenedListOfImages(imageMap);         
        if(allImages.length>0){

            //console.log(allImages);

            firebase.firestore().collection("public").doc(this.props.bId)
                .collection("images").get().then((snapshot) => {
                    snapshot.forEach((doc) => {
                        var ref = firebase.firestore().collection("public").doc(this.props.bId)
                            .collection("images").doc(doc.id).delete();
                    });
                    for(var i=0; i<allImages.length; i++){
                        firebase.firestore().collection('public').doc(this.props.bId)
                        .collection('images').doc(String(i)).set(allImages[i]);        
                    }
        
                }).then(
                    this.setState({
                        imageUploading: false
                    })
                );

        }
        else{
            this.setState({
                imageUploading: false
            });
        }

        this.setState({viewPublishLink: true});
    }

    updateStoryEntities(block){
        var entityPaneRef = firebase.firestore().collection("Blockprobes").doc(this.props.bId)
        .collection("users").doc(this.state.uIdHash).collection("session")
        .doc("entityPane");
        var entities = block.entities;
        
        let scope = this;
        if(entities){

            let transc = firebase.firestore().runTransaction(function(transaction){
                return transaction.get(entityPaneRef).then(function(doc){

                    //populate map
                    var entityMap = {};
                    for(var i=0; i<entities.length;i++){
                        entityMap[entities[i].title] = '';
                    }
                    //populate arr
                    var entityArr = [];
                    if(doc.exists){
                        entityArr = doc.data().entities;
                        for(var i=0;i<entityArr.length;i++){
                            if(entityArr[i].label in entityMap){
                                entityArr[i].canRemove = false;
                                delete entityMap[entityArr[i].label];
                            }
                        }
                    }
                    Object.keys(entityMap).forEach(function(entityLabel) {
                        entityArr.push({
                            label: entityLabel,
                            canRemove: false
                        });
                    });
                    
                    //commit array
                    if(doc.exists)
                         transaction.update(entityPaneRef, {entities: entityArr});
                    else
                        entityPaneRef.set({entities: entityArr});
                    scope.initEntityPane();
                });
            });
        }
    }

    addDraftBlock(block, isBulk=false){
        if(isNullOrUndefined(block.timestamp))
            block.timestamp = Date.now();
        var newDraftBlockId = this.state.shajs('sha256').update(this.state.uIdHash+String(block.timestamp)).digest('hex');

        if(isNullOrUndefined(block.blockState)){
            block.blockState = "DRAFT";
        }

        //(uidHash + time)
        block.key = newDraftBlockId;
        block.actionType = "ADD";
        block.bpID = this.props.bId;       
        firebase.firestore().collection("Blockprobes").doc(this.props.bId)
        .collection("users").doc(this.state.uIdHash).collection("userBlocks").
        doc(block.key).set(block);

        this.setState({isCreateBlockClicked:false});

        if(!isBulk){
            this.updateStoryEntities(block);
        }
    }

    submitDraftBlock(block){
        if(isNullOrUndefined(block.key)){
            block.timestamp = Date.now();
           var newDraftBlockId = this.state.shajs('sha256').update(this.state.uIdHash+String(block.timestamp)).digest('hex');

            //(uidHash + time)
            block.key = newDraftBlockId;
            block.actionType = "ADD";
        }
        block.bpID = this.props.bId;

        block.blockState = "UNDER REVIEW";
        firebase.firestore().collection("Blockprobes").doc(this.props.bId)
        .collection("users").doc(this.state.uIdHash).collection("userBlocks").
        doc(block.key).set(block);

        this.giveBlockToFirstReviewer(block);

        this.setState({isCreateBlockClicked:false});
        this.finishTooltip('draftBlock');
    }

    componentDidMount(){
        firebase.firestore().collection("Blockprobes").doc(this.props.bId)
        .collection("users").doc(this.state.uIdHash).collection("userBlocks").onSnapshot(
            querySnapshot => {
                querySnapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        this.modifyBlockListWrapper(change.doc,true);
                      }
                      if (change.type === 'modified') {
                        this.modifyBlockListWrapper(change.doc,true);
                      }
                      if (change.type === 'removed') {
                        this.modifyBlockListWrapper(change.doc,false);
                      }
                });

            
            }
        );  
        
        this.initEntityPane();
    }

    changeSelectedBlock(draftBlockId){
        this.setState({
            selectedDraftBlockId: draftBlockId
        });
    }

    renderSingleDraftBlock(block, scope, isNewBlock){
        if(isNullOrUndefined(block)){
            return null;
        }

        if(!isNullOrUndefined(block.blockState) && block.blockState=="DRAFT" && 
            !isNullOrUndefined(block.key) && !isNullOrUndefined(this.state.selectedDraftBlockId) 
                && this.state.selectedDraftBlockId==block.key){
            return (
                <SingleBlock 
                    block={block} 
                    bId={this.props.bId}
                    uIdHash={this.state.uIdHash}
                    selectBlock={this.selectBlock}
                    investigationGraph={this.props.investigationGraph}
                    isNewBlock={isNewBlock}
                    deleteNewBlock={this.deleteNewBlock}
                    deleteDraftBlock = {this.deleteDraftBlock}
                    addDraftBlock = {this.addDraftBlock}
                    updateDraftBlock = {this.updateDraftBlock}
                    submitDraftBlock = {this.submitDraftBlock}
                    commitBlockToBlockprobe = {this.commitBlockToBlockprobe}
                    entityPane = {this.state.entityPaneList}
                    draftBlockTooltip = {this.state.showTooltip.draftBlock}
                    finishTooltip = {this.finishTooltip}
                    selectedDraftBlockId = {this.state.selectedDraftBlockId}
                    changeSelectedBlock = {this.changeSelectedBlock} 
                    bpDetails = {this.props.bpDetails}
                    isMultiSelect = {false}
                    multiSelectBlocks = {this.multiSelectBlocks}
                    isBlockSelectedInMultiselect = {false}
                    />
            )

        }
        return null;
    }

    renderSingleBlock(block, scope, isNewBlock){

        if(isNullOrUndefined(block)){
            return null;
        }
        let isBlockSelectedInMultiselect = false;
        if(this.state.multiSelectedBlocks[block.key])
            isBlockSelectedInMultiselect = true;

        return(
            <SingleBlock 
            block={block} 
            bId={this.props.bId}
            uIdHash={this.state.uIdHash}
            selectBlock={this.selectBlock}
            investigationGraph={this.props.investigationGraph}
            isNewBlock={isNewBlock}
            deleteNewBlock={this.deleteNewBlock}
            deleteDraftBlock = {this.deleteDraftBlock}
            addDraftBlock = {this.addDraftBlock}
            updateDraftBlock = {this.updateDraftBlock}
            submitDraftBlock = {this.submitDraftBlock}
            commitBlockToBlockprobe = {this.commitBlockToBlockprobe}
            entityPane = {this.state.entityPaneList}
            draftBlockTooltip = {this.state.showTooltip.draftBlock}
            finishTooltip = {this.finishTooltip}
            selectedDraftBlockId = {null}
            changeSelectedBlock = {this.changeSelectedBlock} 
            bpDetails = {this.props.bpDetails}
            isMultiSelect = {this.state.multiSelectDraftBlockStatus}
            multiSelectBlocks = {this.multiSelectBlocks}
            isBlockSelectedInMultiselect = {isBlockSelectedInMultiselect}
            />
        );
    }

    selectBlock(block){
        this.props.selectBlock(block);
    }

    multiSelectBlocks(blockKey){
        let currMultiSelectedBlocks = this.state.multiSelectedBlocks;
        if(!(blockKey in currMultiSelectedBlocks)){
            currMultiSelectedBlocks[blockKey] = true;
        }
        else{
            delete currMultiSelectedBlocks[blockKey];
        }
        this.setState({
            multiSelectedBlocks: currMultiSelectedBlocks
        });
    }

    createBlock(){
        // var newDraftBlockId = this.state.shajs('sha256').update(this.props.uId+String(Date.now())).digest('hex');
        this.setState({isCreateBlockClicked:true});
    }

    openEntityPane(){
        ReactGA.event({
            category: 'entity pane',
            action: 'entity pane opened',
            label: 'entity pane opened'
          });
        this.setState({isEntityPaneOpen: true});
    }

    closeEntityPane(hasTooltipsFinished){
        if(hasTooltipsFinished)
            this.finishTooltip('entity');
        this.setState({isEntityPaneOpen: false});
    }

    openImagePane(){
        this.setState({isImagePaneOpen: true});
    }

    closeImagePane(){
        this.setState({isImagePaneOpen: false});
    }

    createBulkBlock(){
        ReactGA.event({
            category: 'bulk block pane',
            action: 'bulk block pane opened',
            label: 'bulk block pane opened'
          });
        this.setState({isCreateBulkBlockClicked:true});
    }

    cancelBulkBlock(){
        this.setState({isCreateBulkBlockClicked:false});
    }

    deleteNewBlock(){
        this.setState({isCreateBlockClicked:false});
    }

    initEntityPane(){        
        firebase.firestore().collection("Blockprobes").doc(this.props.bId)
        .collection("users").doc(this.state.uIdHash).collection("session")
        .doc("entityPane").get().then((snapshot) => {
            if(snapshot.exists)
                {
                    var entities = snapshot.data().entities;
                    // console.log(entities);
                    this.setState({entityPaneList:entities});
                }
        });
    }

    async commitBlockToBlockprobe(block){
        await this.props.commitBlockToBlockprobe(block);
        await this.updateStoryEntities(block);
        this.finishTooltip('commitBlock');
        ReactGA.event({
            category: 'commit_blocks',
            action: 'Committed blocks',
            label: this.props.bId
          });          
    }

    finishTooltip(tooltip){
        var showTooltip = this.state.showTooltip;
        if(tooltip == 'entity'){            
            if(showTooltip.entityPane){
                showTooltip.entityPane = false;
                showTooltip.addBlocks = true;
            }
        }
        else if(tooltip == 'addBlocks'){            
            if(showTooltip.addBlocks){
                showTooltip.entityPane = false;
                showTooltip.addBlocks = false;
                showTooltip.draftBlock = true;
            }
        }
        else if(tooltip == 'draftBlock'){            
            if(showTooltip.draftBlock){
                showTooltip.entityPane = false;
                showTooltip.addBlocks = false;
                showTooltip.draftBlock = false;
                showTooltip.commitBlock = true;
                this.props.finishBuildingStoryTooltip();
            }
        } 
        else if(tooltip == 'commitBlock'){
            if(showTooltip.draftBlock){
                showTooltip.entityPane = false;
                showTooltip.addBlocks = false;
                showTooltip.draftBlock = false;
                showTooltip.commitBlock = false;
                this.props.finishAddingBlockToStoryTooltip();
            }
        }

        this.setState({
            showTooltip: showTooltip
        })
    }

    renderBlockOptions(){

        if(this.state.isCreateBlockClicked){
            return(
                <div>
                    {this.renderSingleBlock(this.state.newBlock,this, true)}
                </div>
            );
        }
        if(this.state.isCreateBulkBlockClicked){
            return(
                <div>
                    <BulkDraftBlockComponent
                        cancelBulkDraftBlock = {this.cancelBulkBlock}
                        addDraftBlocksInBulk = {this.addDraftBlocksInBulk}
                        investigationGraph = {this.props.investigationGraph}
                        entityPane = {this.state.entityPaneList}
                        addBlocksTooltip = {this.state.showTooltip.addBlocks}
                        finishTooltip = {this.finishTooltip}
                        uIdHash = {this.state.uIdHash}
                        uId = {this.props.uId}
                        bId = {this.props.bId}
                        lang = {this.props.lang}
                    />
                </div>
            )
        }

        if(this.state.isEntityPaneOpen){
            return (
                <EntityPaneView
                    closeEntityPane = {this.closeEntityPane}
                    investigationGraph = {this.props.investigationGraph}
                    bId = {this.props.bId}
                    uIdHash={this.state.uIdHash}
                    updateEntityPaneList = {this.updateEntityPaneList}
                    entityPaneTooltip = {this.state.showTooltip.entityPane}
                    finishTooltip = {this.finishTooltip}/>
            );
        }

        if(this.state.isImagePaneOpen){
            return (
                <ImagePaneView
                    closeImagePane = {this.closeImagePane}
                    investigationGraph = {this.props.investigationGraph}
                    bId = {this.props.bId}
                    uIdHash={this.state.uIdHash}
                    imageMapping = {this.props.imageMapping}
                    permit = {this.props.permit}
                    refreshBlockprobe = {this.props.refreshBlockprobe}
                    />
            );
        }        

        return (
        <div className="userblocks-header-container">
                <div className="userblocks-options-container">   
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
                    steps={this.state.tooltipText.entityPane}
                    run = {this.state.showTooltip.entityPane}                    
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
                    steps={this.state.tooltipText.addBlocks}
                    run = {this.state.showTooltip.addBlocks}                    
                    />    

                    <div>
                        {Object.keys(this.props.investigationGraph).length > 0?
                            <Button 
                            color="primary"
                            variant="contained"
                            className="editEntitiesButton" 
                            onClick={this.openImagePane}>
                                <div>Manage game images</div>
                            </Button>
                                :
                            null}
                    </div>
                    
                    {this.state.successBlocks && Object.keys(this.state.successBlocks).length>0?
                        <div>
                            <Button
                            color="primary"
                            variant="contained"
                            className="editEntitiesButton" 
                            onClick={this.publishStory}>
                                <div>Publish game</div>
                            </Button>
                        </div>
                        :
                        null
                    }
                </div>

                {this.state.viewPublishLink?
                    <div className="userBlocks-renderShare">
                        {this.renderShareScreen()}
                    </div>
                    :
                    null
                }

                <div className="contributeOpenTooltipTextContainer_v1">
                {Object.keys(this.state.successBlocks).length>0?
                        <p className="contributeOpenTooltipText_v1">
                            Continue adding more connections to your mindmap. After that,<br/><br/>
                            Click on <a className='tooltip-selection' onClick={this.publishStory}>Publish Game</a> to share your game.<br/><br/>
                            Click on <a className='tooltip-selection' onClick={this.openImagePane}>Manage game images</a> to add images to your topics.
                        </p>                        
                        :
                        <p className="contributeOpenTooltipText_v1">
                            Start making your game by creating a connection.<br/>
                            <span className="contributeOpenTooltipText">Input two topics that you want to connect (eg: lion, animal).<br/>
                            Describe the connection (eg: Lion is an animal).<br/>
                            Click on <b>Confirm</b> when done.</span>
                        </p>
                        }
                </div>   
        </div>
        )
    }

    setDashboardVisualisation(){
        this.props.setNewVisualisation('dashboard');
    }

    setShareVisualization(){
        this.props.setNewVisualisation('publish_blockprobe');
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

    convertBlockMapToList(blockMap){
        var blockTempList = [];
        for (var blockId in blockMap) {
            // check if the property/key is defined in the object itself, not in parent
            if (blockId in blockMap) {           
                blockTempList.push(blockMap[blockId]);
            }
        }
        var scope = this;
        blockTempList.sort(function(a, b){return scope.sortBlocks(a.title,b.title,a.timestamp,b.timestamp);});
        return blockTempList;
    }

    isSummaryBlocksAvailable(){
        if(isNullOrUndefined(this.props.summaryBlocks) || this.props.summaryBlocks.length==0)
            return false;
        return true;
    }

    isGraphAvailable(){
        if(isNullOrUndefined(this.props.investigationGraph) || Object.keys(this.props.investigationGraph).length==0)
            return false;
        return true;
    }

    isTimelineAvailable(){
        if(this.props.timeline && this.props.timeline.length > 0)
            return true;
        return false;
    }

    onSelectTab(index, lastIndex, event){
        if(index==1){
            this.setState({
                multiSelectDraftBlockStatus: false
            });
        }
    }

    toggleMultiSelect(){
        let multiselectFlag = this.state.multiSelectDraftBlockStatus;
        if(multiselectFlag){
            this.setState({
                multiSelectDraftBlockStatus: false
            });
        }
        else{
            this.setState({
                multiSelectDraftBlockStatus: true,
                selectedDraftBlockId: ''
            });
        }
    }

    performAction(type){
        if(type == 'delete'){
            this.deleteMultipleDraftBlocks();
        }
        else if(type  == 'commit'){
            this.commitMultipleDraftBlocks();   
        }

        this.setState({
            dialog: false,
            dialogType: null
        });
    }

    selectGraphNode(node){
        let graphNode = {
            label: node
        };
        this.setState({
            selectedGraphNode: graphNode
        });
        // console.log(graphNode);
    }

    toggleGraphOptionStyle(type){
        this.setState({
            graphViewAddType: type
        });
    }


    renderShareScreen(){
        let url = this.state.urlPrefix + this.props.bId;
        let gameUrl = this.state.gameUrlPrefix + this.props.bId;
        let gameUrlResults = this.state.gameResultsUrlPrefix + this.props.bId;
        return (
            <Paper elevation={6}>
                <div className='userblocks-share-container'>                    
                    <div className='userblocks-share-section-heading'>
                        Public link to play game                     
                    </div>
                    <div className="userblocks-share-url-div">
                        <a href={gameUrl} target="_blank" className="userblocks-share-url">{gameUrl}</a>
                    </div>  
                    <div className='userblocks-share-section-heading'>
                        Public link to view game results                     
                    </div>
                    <div className="userblocks-share-url-div">
                        <a href={gameUrlResults} target="_blank" className="userblocks-share-url">{gameUrlResults}</a>
                    </div> 
                    <Button 
                        color="primary"
                        variant="contained"
                        className="userblocks-share-close"
                        onClick={() =>{
                            this.setState({
                                viewPublishLink: false
                            })
                    }}>
                        <div>Close</div>
                    </Button>  
                </div>
            </Paper>
        )
    }

    shouldShowBlocks(){
        /*
        If user has not made any contributions yet, then don't show!
        */
        if(Object.keys(this.state.draftBlocks).length>0 || Object.keys(this.state.successBlocks).length>0
        || Object.keys(this.state.toReviewBlocks).length>0 || Object.keys(this.state.inReviewBlocks).length>0){
            return true;
        }
        return false;
    }

    render(){

        const scope = this;

        var successBlocksList = this.convertBlockMapToList(this.state.successBlocks);
        let successBlocksListRender = successBlocksList.map((block) => 
                    (scope.renderSingleBlock(block, scope, false)));
        if(successBlocksList.length == 0){
            successBlocksListRender = 'No succesful contributions.';
        }            

        var toReviewBlocksList = this.convertBlockMapToList(this.state.toReviewBlocks);
        const toReviewBlocksListRender = toReviewBlocksList.map((block) => 
                                (scope.renderSingleBlock(block, scope, false)));

        var draftBlocksList = this.convertBlockMapToList(this.state.draftBlocks);
        let draftBlocksListRender = draftBlocksList.map((block) => 
                                            (scope.renderSingleBlock(block, scope, false)));

        let singleDraftBlocksListRender = draftBlocksList.map((block) => 
                                            (scope.renderSingleDraftBlock(block, scope, false)));                                            

        if(draftBlocksList.length == 0){
            draftBlocksListRender = 'Nothing to edit.';
        }
                        
        var inReviewBlocksList = this.convertBlockMapToList(this.state.inReviewBlocks);
        const inReviewBlocksListRender = inReviewBlocksList.map((block) => 
                                                        (scope.renderSingleBlock(block, scope, false)));      
                                        
        return(
            <div className="userBlocksDivContainer">
                     
                {this.renderBlockOptions()}                              

                <div>
                    <Dialog
                        open={this.state.dialog}
                        TransitionComponent={Transition}
                        keepMounted
                        onClose={() => this.toggleDialog(false,'delete')}
                        aria-labelledby="alert-dialog-slide-title"
                        aria-describedby="alert-dialog-slide-description">
                            <DialogTitle id="alert-dialog-slide-title">{this.state.dialogText.selected.title}</DialogTitle>
                            <DialogContent>
                            <DialogContentText id="alert-dialog-slide-description">
                                {this.state.dialogText.selected.desc}
                            </DialogContentText>
                            </DialogContent>
                            <DialogActions>
                            <Button onClick={() => this.toggleDialog(false,this.state.dialogType)} color="primary">
                                No
                            </Button>
                            <Button onClick={() => this.performAction(this.state.dialogType)} color="primary">
                                Yes
                            </Button>
                            </DialogActions>
                        </Dialog>
                    {this.shouldShowBlocks()?
                    <div>
                        <div className="visualization-tabs-title">My contributions</div>           
                        <Tabs className="blocksTab" onSelect={this.onSelectTab}>
                            <TabList>
                            <Tab>EDIT</Tab>

                            <Tab>EXISTING</Tab>

                            {Object.keys(this.state.inReviewBlocks).length>0?
                                <Tab>IN REVIEW</Tab>
                                    :
                                    null}

                            {Object.keys(this.state.toReviewBlocks).length>0?
                                <Tab>TO REVIEW</Tab>
                                    :
                                    null}                   
                            </TabList>
                        
                            <TabPanel>
                            {Object.keys(this.state.draftBlocks).length>0?
                                <div>
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
                                    steps={this.state.tooltipText.draftBlock}
                                    run = {this.state.showTooltip.draftBlock}                    
                                    />                                 
                                    <div className="multiselect-button-container">
                                        {this.state.multiSelectDraftBlockStatus?
                                            <Button
                                                variant="contained" 
                                                className="multiSelectBlockButton" 
                                                onClick={this.toggleMultiSelect}>
                                                    <div>Close multiselect</div>
                                            </Button>
                                            :
                                            <Button 
                                                variant="contained"
                                                className="multiSelectBlockButton" 
                                                onClick={this.toggleMultiSelect}>
                                                    <div>Multiselect</div>
                                            </Button>
                                        }

                                        {Object.keys(this.state.multiSelectedBlocks).length > 0 &&
                                            this.state.multiSelectDraftBlockStatus?
                                            <Button
                                                variant="contained" 
                                                className="multiSelectDeleteBlockButton" 
                                                onClick={() => {this.toggleDialog(true,'delete')}}>
                                                    <div>Delete</div>
                                            </Button>
                                            :
                                            null
                                        }

                                        {Object.keys(this.state.multiSelectedBlocks).length > 0 &&
                                            this.state.multiSelectDraftBlockStatus?
                                            <Button
                                                variant="contained" 
                                                className="multiSelectCommitBlockButton" 
                                                onClick={() => {this.toggleDialog(true,'commit')}}>
                                                    <div>Add to game</div>
                                            </Button>
                                            :
                                            null
                                        }
                                        
                                    </div>                                                               
                                    <Paper className="block-list-content draftBlocksList" elevation={3}>
                                        <List>{draftBlocksListRender}</List>
                                    </Paper>
                                    <div>
                                        {singleDraftBlocksListRender}
                                    </div> 
                                </div>
                                :
                                <div className="blocklist-message">{draftBlocksListRender}</div>
                                }
                            </TabPanel> 
                            
                            <TabPanel>
                                {Object.keys(this.state.successBlocks).length>0?
                                
                                        <div>
                                            <Paper className="block-list-content" elevation={3}>
                                                <List>{successBlocksListRender}</List>
                                            </Paper>
                                        </div>
                                    
                                    :
                                <div className="blocklist-message">{successBlocksListRender}</div>
                                }
                            </TabPanel>

                            {Object.keys(this.state.inReviewBlocks).length>0?
                                <TabPanel>
                                    <div>
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
                                        steps={this.state.tooltipText.commitBlock}
                                        run = {this.state.showTooltip.commitBlock}                    
                                        /> 
                                        <Paper className="block-list-content inReviewBlockList" elevation={3}>
                                            <List>{inReviewBlocksListRender}</List>
                                        </Paper>
                                    </div>
                                </TabPanel>
                                :
                                null
                                }
                                            
                            {Object.keys(this.state.toReviewBlocks).length>0?
                                <TabPanel>
                                    <div>
                                        <Paper className="block-list-content" elevation={3}>
                                            <List>{toReviewBlocksListRender}</List>
                                        </Paper>
                                    </div>
                                </TabPanel>
                                :
                                null
                                }
                            
                                            
                        </Tabs>
                    </div>
                    :
                    null
                }
                </div>

                <div className="contributionVisualizationContainer">
                    <Tabs style={{marginTop:'10px'}}>
                    <TabList>
                        <Tab>Mindmap</Tab>
                        <Tab>Timeline</Tab>
                    </TabList>

                    <TabPanel>
                        <div className="graphVisualizationSingleEntity">
                            <div style={{flexWrap: 'wrap',  display:'flex'}}>
                                <div>
                                    <Checkbox 
                                        value={'single_connection'}
                                        isChecked={this.state.graphViewAddType == 'single_connection'}
                                        label={'Single connection'}  
                                        toggleChange = {this.toggleGraphOptionStyle}                              
                                        />
                                </div>
                                <div>
                                    <Checkbox 
                                        value={'star_connections'}
                                        isChecked={this.state.graphViewAddType == 'star_connections'}
                                        label={'Multiple connections'}
                                        toggleChange = {this.toggleGraphOptionStyle}
                                        />
                                </div>   
                            </div>
                            {this.state.graphViewAddType == 'single_connection'?
                                <AddEdgeView
                                    entityPane = {this.state.entityPaneList}                                        
                                    commitBlockToBlockprobe = {this.props.commitBlockToBlockprobe}
                                    investigationGraph = {this.props.investigationGraph}
                                    lastIndexDraftBlocks = {this.state.lastIndexDraftBlocks}
                                    lastIndex = {this.props.lastIndex}
                                    bId = {this.props.bId}
                                />
                                :
                                null
                            }
                            {this.state.graphViewAddType == 'star_connections'?
                                <AddStarEdgesView
                                    entityPane = {this.state.entityPaneList}                                        
                                    commitBlockToBlockprobe = {this.props.commitBlockToBlockprobe}
                                    investigationGraph = {this.props.investigationGraph}
                                    lastIndexDraftBlocks = {this.state.lastIndexDraftBlocks}
                                    lastIndex = {this.props.lastIndex}
                                    commitMultipleBlocksToBlockprobe = {this.props.commitMultipleBlocksToBlockprobe}
                                    bId = {this.props.bId}
                                />
                                :
                                null
                            }
                            {this.state.graphViewAddType == 'single_topic'?
                                <AddSingleTopicView
                                    entityPane = {this.state.entityPaneList}                                        
                                    commitBlockToBlockprobe = {this.props.commitBlockToBlockprobe}
                                    investigationGraph = {this.props.investigationGraph}
                                    lastIndexDraftBlocks = {this.state.lastIndexDraftBlocks}
                                    lastIndex = {this.props.lastIndex}
                                    bId = {this.props.bId}
                                />
                                :
                                null
                            }                            
                        </div>
                        {this.isGraphAvailable()?
                            <div>                                
                                {!isNullOrUndefined(this.state.selectedGraphNode) && this.state.displaySingleEntity?
                                    <div className="graphVisualizationSingleEntity">
                                        <SingleEntityView                                        
                                        entity = {this.state.selectedGraphNode}
                                        commitBlockToBlockprobe = {this.props.commitBlockToBlockprobe}
                                        />
                                    </div>                                    
                                    :
                                    null
                                }
                                 
                                <GraphComponent blockTree={this.props.blockTree} 
                                    investigationGraph={this.props.investigationGraph}
                                    selectBlock={this.props.selectBlock}
                                    imageMapping = {this.props.imageMapping}
                                    multiSelectEntityList = {this.props.multiSelectEntityList}
                                    lang = {this.props.lang}
                                    selectNode = {this.selectGraphNode}/>                                                               
                            </div>
                            :
                            null
                            }
                    </TabPanel>

                    <TabPanel>
                        <div className="graphVisualizationSingleEntity">
                            <AddTimeView
                                commitBlockToBlockprobe = {this.props.commitBlockToBlockprobe}
                                lastIndexDraftBlocks = {this.state.lastIndexDraftBlocks}
                                lastIndex = {this.props.lastIndex}
                            />
                        </div>
                        {this.isTimelineAvailable()?
                            <div class="contributions-timeline-container">
                                <TimelineComponent 
                                    timeline={this.props.timeline} 
                                    selectBlock={this.props.selectBlock}/>
                            </div>
                            :
                            null
                            }
                    </TabPanel>
                </Tabs>
                </div>
            </div>
        );
    }


}
export default UserBlocksComponent;