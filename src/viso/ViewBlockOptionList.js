import React, { Component } from 'react';
import * as firebase from 'firebase';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';
import PeopleIcon from '@material-ui/icons/People';
import UndoIcon from '@material-ui/icons/Undo'; 
import ThumbUpIcon from '@material-ui/icons/ThumbUp'; 
import DoneAllIcon from '@material-ui/icons/DoneAll';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import Joyride,{ ACTIONS, EVENTS, STATUS } from 'react-joyride';
import './ViewBlock.css';
import { isNullOrUndefined } from 'util';

class ViewBlockListComponent extends React.Component {

    constructor(props){
        super(props);
        //props: blockState, selectOption, canCommit, uId, selectedBlock, latestBlock, bpId,
        //reviewersMap, commitToStoryTooltip, bpDetails

        this.state={
            shajs: '',
            uIdHash: '',
            tooltipText:{
                addToStory:[
                    {
                        title: 'Add your first block to the story!',
                        target: '.commitBlock',
                        content: 'Click on \'Commit block to story\' from the options!',
                        disableBeacon: true,
                        placement: 'center',
                        event: 'hover'   
                    }
                ]
            },
            showTooltip:{
                addToStory:false
            }
        };

        if(props.commitToStoryTooltip){
            this.state.showTooltip={
                addToStory: true
            }
        }

        var shajs = require('sha.js');
        this.state.uIdHash = shajs('sha256').update(this.props.uId).digest('hex');
        this.state.shajs = shajs;

        this.selectOption = this.selectOption.bind(this);
        this.renderReviewOptionList = this.renderReviewOptionList.bind(this);
        this.renderSubmitterOptionList = this.renderSubmitterOptionList.bind(this);
        this.getRandomReviewer = this.getRandomReviewer.bind(this);
        this.giveBlockToNextReviewer = this.giveBlockToNextReviewer.bind(this);
        this.renderSuccessfulOptionList = this.renderSuccessfulOptionList.bind(this);
        this.handleCommitJoyrideCallback = this.handleCommitJoyrideCallback.bind(this);
    }

    selectOption(option){

        if(option == "revert"){

            //Deepcopy props to var
            const blockStr = JSON.stringify(this.props.selectedBlock);
            var newBlock = JSON.parse(blockStr);
            newBlock.blockState = "DRAFT";

           // console.log(newBlock);
           // console.log("Blockprobes/"+newBlock.bpID);

            firebase.firestore().collection("Blockprobes").doc(newBlock.bpID)
            .collection("users").doc(this.state.uIdHash).collection("userBlocks").
            doc(newBlock.key).set(newBlock);
            
            firebase.database().ref("Blockprobes/"+newBlock.bpID
                        +"/reviewBlocks/"+newBlock.key).remove();

            
        }
        else if(option == "upvote"){
            

            //Deepcopy of block
            const blockStr = JSON.stringify(this.props.selectedBlock);
            var newBlock = JSON.parse(blockStr);
            this.giveBlockToNextReviewer(newBlock);

            
            firebase.database().ref("Blockprobes/"+this.props.selectedBlock.bpID
                        +"/reviewBlocks/"+this.props.selectedBlock.key 
                        +"/reviewers/"+this.state.uIdHash).set("1");

            firebase.firestore().collection("Blockprobes").
                doc(this.props.selectedBlock.bpID).
                collection("users").doc(this.state.uIdHash).
                collection("userBlocks").
                doc(this.props.selectedBlock.key+"_r").delete();

                        
        }
        else if(option == "reassign_reviewer"){

            //Deepcopy of block
            const blockStr = JSON.stringify(this.props.selectedBlock);
            var newBlock = JSON.parse(blockStr);
            this.giveBlockToNextReviewer(newBlock);
        }
        else if(option == "can_commit"){
            //console.log(this.props.latestBlock);

            const oldKey = this.props.selectedBlock.key;
            

            //Deepcopy of block
            const blockStr = JSON.stringify(this.props.selectedBlock);
            var newBlock = JSON.parse(blockStr);
            var newBlockId = this.state.shajs('sha256').update(this.state.uIdHash+String(newBlock.timestamp)).digest('hex');
            newBlock.timestamp = Date.now();
            newBlock.verificationHash = newBlockId;
            newBlock.previousKey = this.props.latestBlock.key;
            if(newBlock.actionType == "ADD"){
                newBlock.referenceBlock = null;
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

            firebase.database().ref("Blockprobes/"+newBlock.bpID
            +"/reviewBlocks/"+oldKey).remove();

            firebase.firestore().collection("Blockprobes").
                doc(newBlock.bpID).
                collection("users").doc(this.state.uIdHash).
                collection("userBlocks").
                doc(oldKey).delete();
            
            firebase.firestore().collection("Blockprobes").
                doc(newBlock.bpID).
                collection("users").doc(this.state.uIdHash).
                collection("userBlocks").
                doc(newBlock.key).set(newBlock);
            
            firebase.firestore().collection("Blockprobes").
                doc(newBlock.bpID).
                collection("fullBlocks").
                doc(committedBlock.key).set(committedBlock);

            
        }
        else if(option == 'remove'){

            var timestamp = Date.now();
            var newTitle = "CHALLENGE TO {" + this.props.selectedBlock.title +"}";
            let blockToRemove = this.props.selectedBlock.key;
            if(this.props.selectedBlock.referenceBlock != null && this.props.selectedBlock.referenceBlock != undefined){
                //If this is a modified block, remove the original reference
                blockToRemove = this.props.selectedBlock.referenceBlock;
            }
            var committedBlock = {
                key:'',
                title: newTitle,
                summary:this.props.selectedBlock.summary || '',
                entities:this.props.selectedBlock.entities || [],
                blockDate: this.props.selectedBlock.blockDate || {},
                blockTime: this.props.selectedBlock.blockTime || {},
                evidences:[],
                actionType:'REMOVE',
                previousKey: this.props.selectedBlock.key,
                referenceBlock: blockToRemove,
                timestamp: timestamp,
                verificationHash: ''
            }
            
            committedBlock.actionType = "REMOVE";

            var softBlock = JSON.parse(JSON.stringify(this.props.selectedBlock));
            softBlock.actionType = 'REMOVE';
            softBlock.referenceBlock = this.props.selectedBlock.key;
            softBlock.previousKey = this.props.selectedBlock.key;
            softBlock.title = newTitle;
            softBlock.timestamp = timestamp;
            
            var newBlockId = this.state.shajs('sha256').update(this.state.uIdHash+String(timestamp)).digest('hex');
            committedBlock.verificationHash = newBlockId;
            softBlock.verificationHash = newBlockId;
            var newKey = this.state.shajs('sha256').update(newBlockId + committedBlock.previousKey).digest('hex');
            committedBlock.key = newKey;
            softBlock.key = newKey;
            softBlock.bpID = this.props.bpId;

            delete softBlock["children"];
            delete committedBlock["children"];

            //console.log(committedBlock);
            //console.log(softBlock);

            firebase.firestore().collection("Blockprobes").
                doc(softBlock.bpID).
                collection("users").doc(this.state.uIdHash).
                collection("userBlocks").
                doc(softBlock.key).set(softBlock);
            
            firebase.firestore().collection("Blockprobes").
                doc(softBlock.bpID).
                collection("fullBlocks").
                doc(committedBlock.key).set(committedBlock);
            
            option = "can_commit";

        }
        else if(option == 'modify'){
            var timestamp = Date.now();
            var softBlock = JSON.parse(JSON.stringify(this.props.selectedBlock));
            softBlock.actionType = 'MODIFY';
            softBlock.referenceBlock = this.props.selectedBlock.key;
            if(this.props.selectedBlock.referenceBlock != undefined && this.props.selectedBlock.referenceBlock != null){
                softBlock.referenceBlock = this.props.selectedBlock.referenceBlock;
            }
            softBlock.previousKey = this.props.selectedBlock.key;
            softBlock.timestamp = timestamp;
            softBlock.blockState = 'DRAFT';
            softBlock.bpID = this.props.bpId;

            var newBlockId = this.state.shajs('sha256').update(this.state.uIdHash+String(timestamp)).digest('hex');
            softBlock.verificationHash = newBlockId;
            var newKey = this.state.shajs('sha256').update(newBlockId + softBlock.previousKey).digest('hex');
            softBlock.key = newKey;
            delete softBlock["children"];
            firebase.firestore().collection("Blockprobes").
                doc(softBlock.bpID).
                collection("users").doc(this.state.uIdHash).
                collection("userBlocks").
                doc(softBlock.key).set(softBlock);
        }

        this.props.selectOption(option);
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

    giveBlockToNextReviewer(block)
    {
        //Deepcopy of reviewerList
        const reviewersStr = JSON.stringify(this.props.bpDetails.reviewers);
        var reviewersList = JSON.parse(reviewersStr);
        var randomReviewer = this.getRandomReviewer(reviewersList, this.props.reviewersMap);

        if(randomReviewer!=null) {

            block.blockState = "TO REVIEW";

            firebase.firestore().collection("Blockprobes").
                doc(block.bpID).
                collection("users").doc(randomReviewer.id).
                collection("userBlocks").
                doc(block.key+"_r").set(block);

            firebase.database().ref("Blockprobes/"+block.bpID
                        +"/reviewBlocks/"+block.key 
                        +"/reviewers/"+randomReviewer.id).set("-");

        }
        else{
            //console.log("No other reviewers left!");
        }

    }

    renderReviewOptionList(){
        return(
            <div>
                <h3 style={{textAlign:"center"}}>OPTIONS</h3>
                <List className="view-block-option-list">
                    <ListItem button 
                    onClick={() => { this.selectOption("upvote")}}
                    >
                    <Avatar >
                        <ThumbUpIcon/>
                    </Avatar>
                        <ListItemText primary="Upvote and Pass On"/>
                    </ListItem>

                </List>
            </div>
        );
    }

    renderSuccessfulOptionList(){
        return(
            <div>
                <h3 style={{textAlign:"center"}}>OPTIONS</h3>
                <List className="view-block-option-list">

                    
                    <ListItem button 
                        onClick={() => { this.selectOption("remove")}}
                    >
                        <Avatar>
                            <DeleteIcon />
                        </Avatar>
                            <ListItemText primary="Remove"/>
                    </ListItem>

                    <ListItem button 
                        onClick={() => { this.selectOption("modify")}}
                    >
                        <Avatar>
                            <EditIcon />
                        </Avatar>
                            <ListItemText primary="Edit"/>
                    </ListItem>
                        
                </List>
            </div>
        );
    }

    renderSubmitterOptionList(){
        return(
            <div>                
                <h3 style={{textAlign:"center"}}>OPTIONS</h3>
                <List className="view-block-option-list">

                    {this.props.canCommit?
                        <div>
                            <Joyride
                                styles={{
                                    options: {
                                    arrowColor: '#e3ffeb',
                                    beaconSize: '4em',
                                    primaryColor: '#05878B',
                                    backgroundColor: '#e3ffeb',
                                    overlayColor: 'rgba(10,10,10, 0.4)',
                                    width: 900,
                                    zIndex: 1000,
                                    }
                                }}
                                callback = {this.handleCommitJoyrideCallback}
                                steps={this.state.tooltipText.addToStory}
                                run = {this.props.commitToStoryTooltip}                    
                                /> 
                             <div className='commitBlock'>
                             <ListItem button                                 
                                onClick={() => { this.selectOption("can_commit")}}
                                >
                            <Avatar>
                                <DoneAllIcon />
                            </Avatar>
                                <ListItemText primary="Commit block to story"/>
                            </ListItem>
                            </div>   
                        </div>

                        :
                        null}

                    <ListItem button 
                    onClick={() => { this.selectOption("revert")}}
                    >
                    <Avatar>
                        <UndoIcon />
                    </Avatar>
                        <ListItemText primary="Revert to Draft"/>
                    </ListItem>

                    <ListItem button 
                    onClick={() => { this.selectOption("reassign_reviewer")}}
                    >
                    <Avatar>
                        <PeopleIcon />
                    </Avatar>
                        <ListItemText primary="Reassign Reviewer"/>
                    </ListItem>

                </List>
            </div>
        );
    }

    componentWillReceiveProps(newProps){
        if(newProps.commitToStoryTooltip){
            var showTooltip = this.state.showTooltip;
            showTooltip.addToStory = true;
            this.setState({showTooltip: showTooltip});
        }
    }

    handleCommitJoyrideCallback(data){
        const {action,index,status,type} = data;
        if([STATUS.FINISHED, STATUS.SKIPPED].includes(status)){
            var showTooltip = this.state.showTooltip;
            showTooltip.addToStory = false;
            this.setState({showTooltip: showTooltip});
        }
    }

    render(){
        return (
            <div>
                {this.props.blockState == 'TO REVIEW'?
                this.renderReviewOptionList():
                null}

                {this.props.blockState == 'UNDER REVIEW'?
                this.renderSubmitterOptionList():
                null}

                {this.props.blockState == 'SUCCESSFUL' && (this.props.selectedBlock.actionType == "ADD"|| this.props.selectedBlock.actionType == "MODIFY")?
                this.renderSuccessfulOptionList():
                null}

            </div>
        );
    }


}
export default ViewBlockListComponent;