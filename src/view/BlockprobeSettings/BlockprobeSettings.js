import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import * as firebase from 'firebase';
import 'firebase/firestore';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import AddIcon from '@material-ui/icons/Add';
import ClearIcon from '@material-ui/icons/Clear';
import DoneAllIcon from '@material-ui/icons/DoneAll';
import Textarea from 'react-textarea-autosize';
import Slider from '@material-ui/core/Slider';
import * as Utils from '../../common/utilSvc';
import * as Constants from '../../common/constants';
import * as DbUtils from '../../common/dbSvc';
import Loader from 'react-loader-spinner';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';
import LanguageSettingsComponent from './LanguageSettings/LanguageSettings';
import './BlockprobeSettings.css';
import { isNullOrUndefined } from 'util';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  });

const styles = {
    root: {
      width: 300,
    },
    slider: {
      padding: '22px 0px',
    },
  };

class BlockprobeSettingsComponent extends React.Component {

    constructor(props){
        super(props);
        //details, permit, uId, coUsers

        this.state={
            uIdHash:'',
            shajs:null,
            newCriterion: JSON.parse(JSON.stringify(props.details.criterion)),
            step: 1,
            min: 0,
            viewerId: '',
            contributorId: '',
            creatorId: '',
            prevCreatorId: '',
            selectedUser: null,
            creatorMessageId: null,
            addingUser: false,
            dialogType: null,
            dialog: false,
            userDialog: false,
            dialogText:{
                selected:{
                    title: null,
                    desc: null
                }
            }
        }

        var shajs = require('sha.js');
        this.state.uIdHash = shajs('sha256').update(this.props.uId).digest('hex');
        this.state.shajs = shajs;

        this.changeCriterion = this.changeCriterion.bind(this);
        this.renderBlockprobeSettings = this.renderBlockprobeSettings.bind(this);
        this.modifyBlockProbeSettings = this.modifyBlockProbeSettings.bind(this);
        this.renderAddViewers = this.renderAddViewers.bind(this);
        this.renderAddContributors = this.renderAddContributors.bind(this);
        this.renderAddCreators = this.renderAddCreators.bind(this);
        this.renderAccountSettings = this.renderAccountSettings.bind(this);
        this.renderUserList = this.renderUserList.bind(this);
        this.renderUser = this.renderUser.bind(this);
        this.renderUserDialog = this.renderUserDialog.bind(this);
        this.clickUser = this.clickUser.bind(this);
        this.removeUser = this.removeUser.bind(this);
        this.getMessage = this.getMessage.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.toggleDialog = this.toggleDialog.bind(this);
        this.performAction = this.performAction.bind(this);
    }

    toggleDialog(value, type){
        let dialogText = this.state.dialogText;
        if(type == 'exitBlockprobe'){
            dialogText.selected.title = `Exit story "${this.props.details.title}"`;
            dialogText.selected.desc = "You will no longer be able to contribute or participate in building this story. Do you want to exit?";
        }
        else if(type == 'user'){
            let selectedUser = this.state.selectedUser;
            let selectedUserId = null, role = null;
            if(!isNullOrUndefined(selectedUser)){
                selectedUserId = selectedUser.id;
                role = selectedUser.role;
            }
            dialogText.selected.title = `${selectedUserId}`;
            dialogText.selected.desc = null;
            this.setState({
                userDialog: value,
                dialog: false,
                dialogText: dialogText
            });
            return;
        }
        else if(type=='all'){
 
        }
        
        this.setState({
            dialog: value,
            dialogType: type,
            dialogText: dialogText
        });
    }

    async performAction(value){
        let type = this.state.dialogType;
        if(type=="exitBlockprobe" && value){
            let bId = this.props.bpId;
            let userId = this.props.uId;
            let userIdHash = this.state.uIdHash;

            let ts = Date.now();
            var softBlockprobeToRemove = {
                active: true,
                id: this.props.bpId,
                isActive: true,
                permit:"EXIT",
                summary: this.props.details.summary,
                title: this.props.details.title,
                timestamp: ts
            };
            
            if(!isNullOrUndefined(this.props.coUsers) && Object.keys(this.props.coUsers).length<=1){
                let defunctBlockprobe = {
                    id: bId,
                    timestamp: ts
                };
                firebase.firestore().collection('defunctBlockprobes').doc(bId).set(defunctBlockprobe);                
            }
            firebase.database().ref('Blockprobes/'+ bId +'/users/'+userIdHash).remove();
            await firebase.firestore().collection('Users').doc(userId)
            .collection('blockprobes').doc(bId).set(softBlockprobeToRemove);
        }

        this.setState({
            dialog: false
        });
    }

    getMessage(type){
        let id = this.state.prevCreatorId;
        if(!isNullOrUndefined(type)){
            if(type == 'alreadyPresent'){
                return (
                    <p className="messageUserTextGeneral">User <span className="messageUserTextUid">{id}</span> is already contributing to the story.</p>
                );
            }
            else if(type == 'notExist'){
                return (
                    <p className="messageUserTextGeneral">User <span className="messageUserTextUid">{id}</span> does not exist.</p>
                );
            }
            else if(type == 'alreadySent'){
                return (
                    <p className="messageUserTextGeneral">User <span className="messageUserTextUid">{id}</span> has already been invited.</p>
                );
            }
            else if(type == 'sent'){
                return (
                    <p className="messageUserTextGeneral">Invitation sent to <span className="messageUserTextUid">{id}</span>.</p>
                );
            }
            else if(type =="maxUserLimitReached"){
                return (
                    <p className="messageUserTextGeneral">Cannot add <span className="messageUserTextUid">{id}</span> because each story has {Constants.maxUsers} contributors!</p>
                );
            }
        }
        return null;
    }

    changeCriterion = (event, value) => {
        this.setState({ newCriterion: value });
    };

    modifyBlockProbeSettings(change, shouldModify){
        var val = "";
        if(shouldModify){
            //Modify change in db

            var permit = "";
            if(change == "viewer"){
                val = this.state.viewerId;
                permit = "VIEWER";
            }
            else if(change == "contributor"){
                val = this.state.contributorId;
                permit = "CONTRIBUTOR";
            }
            else if(change == 'reviewer'){
                permit = "REVIEWER";
            }
            else if(change == 'creator'){
                val = this.state.creatorId.trim();
                permit = "CREATOR";
                this.setState({
                    prevCreatorId: val,
                    addingUser: true
                });
            }

            if(change != 'criterion'){
                
                var softBlockprobeToAdd = {
                    active: true,
                    id: this.props.bpId,
                    isActive: true,
                    permit:permit,
                    summary: this.props.details.summary,
                    title: this.props.details.title,
                    timestamp: 0
                };
                // console.log(softBlockprobeToAdd);

                var scope = this;
               let coUsers = this.props.coUsers;
               let currMem = 1;
               if(!isNullOrUndefined(coUsers)){
                   currMem = Math.max(Object.keys(coUsers).length,1);
               } 
               if(currMem < Constants.maxUsers){
                    firebase.firestore().collection("Users").doc(val).get().then(function(doc) {
                        if(doc.exists){
                            // console.log("Debug exists:" + val);
                            firebase.firestore().collection("Users").doc(val).
                            collection("blockprobes").doc(scope.props.bpId).get().then(
                                function(bpSnapshot){
                                    if(bpSnapshot.exists && bpSnapshot.data().permit!="EXIT"){

                                        // console.log("Blockprobe exist for user");

                                    /*  var existingBlockprobe = bpSnapshot.data();
                                        softBlockprobeToAdd.timestamp = existingBlockprobe.timestamp;
                                        if(change == "contributor" 
                                            && existingBlockprobe.permit == "VIEWER"){
                                                
                                                firebase.firestore().collection("Users").
                                                doc(val).collection("blockprobes").
                                                    doc(scope.props.bpId).set(softBlockprobeToAdd);
                                            }
                                        else if(change == "reviewer" && 
                                            !(existingBlockprobe.permit != "PRIVILEGED")){

                                                firebase.firestore().collection("Users").
                                                doc(val).collection("blockprobes").
                                                    doc(scope.props.bpId).set(softBlockprobeToAdd);
                                            }
                                            */
                                                
                                            scope.setState({
                                                creatorMessageId: 'alreadyPresent',
                                                addingUser: false
                                            });
                                            //console.log("User already present");

                                    }
                                    else{

                                        // console.log("adding blockprobe first time");

                                        firebase.firestore().collection("Users").
                                            doc(val).collection("notifications").
                                                doc(scope.props.bpId).get().then(
                                                    function(notifSnapshot){
                                                        if(notifSnapshot.exists){
                                                            //notification sent
                                                            scope.setState({
                                                                creatorMessageId: 'alreadySent',
                                                                addingUser: false
                                                            });
                                                            //console.log("User already sent");
                                                        }
                                                        else{
                                                            firebase.firestore().collection("Users").
                                                                doc(val).collection("notifications").
                                                                    doc(scope.props.bpId).set(softBlockprobeToAdd);

                                                            let userDetails = {
                                                                id: val,
                                                                role: 'INVITED'
                                                            }
                                                            
                                                            // console.log('Blockprobes/'+ blockprobeId +'/isActive/');
                                                            let shaVal = scope.state.shajs('sha256').update(val).digest('hex');
                                                            firebase.database().ref('Blockprobes/'+ scope.props.bpId +'/users/'+shaVal).set(userDetails); 
                                                            scope.setState({
                                                                creatorMessageId: 'sent',
                                                                addingUser: false
                                                            });
                                                        }
                                                    }
                                                )

                                        /*if(change != "creator"){
                                            firebase.firestore().collection("Users").
                                            doc(val).collection("blockprobes").
                                                doc(scope.props.bpId).set(softBlockprobeToAdd);
                                        }
                                        else{
                                            firebase.firestore().collection("Users").
                                            doc(val).collection("notifications").
                                                doc(scope.props.bpId).set(softBlockprobeToAdd)
                                        }*/
                                    }
                                }
                            )
                        }
                        else{
                            //console.log("User does not exist");
                            scope.setState({
                                creatorMessageId: 'notExist',
                                addingUser: false
                            });
                        }
                    });
               }
               else{
                scope.setState({
                    creatorMessageId: 'maxUserLimitReached',
                    addingUser: false
                });
               }
               
                
            }
            else if(change == 'criterion'){

                var newDetails = JSON.parse(JSON.stringify(this.props.details));

                newDetails['criterion'] = this.state.newCriterion;


                // console.log(newDetails);

                firebase.firestore().collection('Blockprobes').doc(this.props.bpId).set(newDetails);
            }

        }
        

        if(change == "viewer"){
            this.setState({viewerId: ''});
        }
        else if(change == "contributor"){
            this.setState({contributorId: ''});
        }
        else if(change == "creator"){
            this.setState({creatorId: ''});
        }
        else if(change == "criterion"){

            if(!shouldModify){
                val = this.props.details.criterion;
            }
            else{
                val = this.state.newCriterion;
            }

            this.setState({
                newCriterion: val
            });
        }
    }

    renderBlockprobeSettings(){

        const { classes } = this.props;

        if(this.props.permit == 'CREATOR'){
            return (
                <div style={{marginLeft:'10px', marginBottom:'5em'}}>
                    <h3>Upvote Criteria</h3>
                    <h5>Number of reviewer upvotes for any block to accepted. ({this.state.newCriterion})</h5>
                    <div style={{width:'30%', marginLeft:'15px'}}>
                        <Slider
                            value={this.state.newCriterion}
                            min={0}
                            max={this.props.details.reviewers.length}
                            onChange={this.changeCriterion}
                            step = {this.state.step}
                            />
                    </div>
                    {this.state.newCriterion!=this.props.details.criterion?
                        <div className="blockprobe-settings-criterion-options-container">
                            <Button 
                            variant="contained"
                            className="saveBlockProbeSettingsButton" 
                            onClick={(e) => this.modifyBlockProbeSettings("criterion",true)}>
                                <div>Confirm settings</div>
                            </Button>
                            <Button 
                            variant="contained"
                            className="cancelBlockProbeSettingsButton" 
                            onClick={(e) => this.modifyBlockProbeSettings("criterion",false)}>
                                <div>Cancel</div>
                            </Button>
                        </div>
                        :
                        null
                    }
                </div>
            );
        }
        return null;
    }

    handleChange(event, type) {

        var shouldUpdate = false;
        let str = event.target.value;
        if(type=='creator' && Utils.shouldUpdateText(str,['\n','\t'])){
            shouldUpdate = true;
        }

        if(shouldUpdate){
            
            if(type=="viewer"){
                var id = event.target.value;
                this.setState({viewerId: id});
            }
            else if(type == "contributor"){
                var id = event.target.value;
                this.setState({contributorId: id});
            }
            else if(type=="creator"){
                let id = event.target.value;
                this.setState({
                    creatorId: id,
                    creatorMessageId: null
                });
            }

        }
      }

      renderAddContributors(){
          if(this.props.permit == "PRIVILEGED" || this.props.permit == "CREATOR"){
            return (
                <div style={{marginLeft:'10px', marginTop:'1em'}}>
                    <h3>Add Contributors</h3>
                    <form>
                    <label>
                        <TextField 
                            type="text"
                            variant="outlined"
                            multiline
                            placeholder = "Phone number"
                            value={this.state.contributorId}
                            onChange={(e) => { this.handleChange(e,"contributor")}}
                            rowsMax="1"
                            rows="1"
                            style={{
                                background: 'white',
                                marginTop:'6px',
                                marginBottom:'6px',
                                width:'30%'
                                }}/>
                    </label>
                    </form>
                    {this.state.contributorId!=''?
                            <div className="blockprobe-settings-criterion-options-container">
                                <Button 
                                variant="contained"
                                className="saveBlockProbeSettingsButton" 
                                style={{marginTop:'1em'}}
                                onClick={(e) => this.modifyBlockProbeSettings("contributor",true)}>
                                    <div>Confirm contributor</div>
                                </Button>
                                <Button 
                                variant="contained"
                                className="cancelBlockProbeSettingsButton" 
                                style={{marginTop:'1em'}}
                                onClick={(e) => this.modifyBlockProbeSettings("contributor",false)}>
                                    <div>Cancel</div>
                                </Button>
                            </div>
                            :
                            null
                        }           
                </div>
                )
                    }

            return null;        
    }

    renderAddViewers(){
        return (
            <div style={{marginLeft:'10px', marginTop:'1em'}}>
                <h3>Add Viewers</h3>
                <form>
                <label>
                    <TextField 
                        type="text"
                        variant="outlined"
                        multiline
                        placeholder = "Phone number"
                        value={this.state.viewerId}
                        onChange={(e) => { this.handleChange(e,"viewer")}}
                        rowsMax="1"
                        rows="1"
                        style={{
                            background: 'white',
                            marginTop:'6px',
                            marginBottom:'6px',
                            width:'30%'
                            }}/>
                 </label>
                 </form>
                 {this.state.viewerId!=''?
                        <div className="blockprobe-settings-criterion-options-container">
                            <Button 
                            variant="contained"
                            className="saveBlockProbeSettingsButton" 
                            style={{marginTop:'1em'}}
                            onClick={(e) => this.modifyBlockProbeSettings("viewer",true)}>
                                <div>Confirm viewer</div>
                            </Button>
                            <Button 
                            variant="contained"
                            className="cancelBlockProbeSettingsButton" 
                            style={{marginTop:'1em'}}
                            onClick={(e) => this.modifyBlockProbeSettings("viewer",false)}>
                                <div>Cancel</div>
                            </Button>
                        </div>
                        :
                        null
                    }           
            </div>
        )
    }

    renderAddCreators(){
        return (
            <div>
                <div style={{marginLeft:'10px', marginTop:'1em'}}>
                    <h3>Add Users</h3>
                    <form>
                    <label >
                        <div className="settings-textfield-container">
                            <TextField 
                            type="text"
                            variant="outlined"
                            multiline
                            placeholder = "Email or phonenumber"
                            value={this.state.creatorId}
                            onChange={(e) => { this.handleChange(e,"creator")}}
                            rowsMax="1"
                            rows="1"
                            style={{
                                background: 'white',
                                marginTop:'6px',
                                marginBottom:'6px',
                                width: '100%'
                                }}/>
                        </div>                        
                    </label>
                    </form>
                    {this.getMessage(this.state.creatorMessageId)}
                    {this.state.creatorId.trim()!='' && !this.state.addingUser?
                            <div className="blockprobe-settings-criterion-options-container">
                                <Button 
                                variant="contained"
                                className="saveBlockProbeSettingsButton" 
                                style={{marginTop:'1em'}}
                                onClick={(e) => this.modifyBlockProbeSettings("creator",true)}>
                                    <div>Confirm</div>
                                </Button>
                                <Button
                                variant="contained" 
                                className="cancelBlockProbeSettingsButton" 
                                style={{marginTop:'1em'}}
                                onClick={(e) => this.modifyBlockProbeSettings("creator",false)}>
                                    <div>Cancel</div>
                                </Button>
                            </div>
                            :
                            null
                        }
                    {this.state.addingUser?
                        <div style={{width:'50px'}}>
                            <Loader 
                            type="TailSpin"
                            color="#00BFFF"
                            height="50"	
                            width="50"
                            /> 
                        </div>
                        :
                        null
                    }           
                </div>
            </div>
        )
    }

    async removeUser(){
        let user = this.state.selectedUser;
        if(!isNullOrUndefined(user.role) && user.role=="INVITED"){
            //console.log('remove invitation');

            let notification = {
                id: this.props.bpId,
                permit: 'INVITED'
            }
            let userId = user.id;
            let uIdHash = this.state.shajs('sha256').update(userId).digest('hex');
            //console.log(notification);
            //console.log(userId);
            //console.log(uIdHash);
            await DbUtils.removeInviteStoryNotification(notification,userId,uIdHash);
            await DbUtils.removeNotification(notification,userId);

            this.setState({
                userDialog: false
            });
        }
    }

    async clickUser(user){
        await this.setState({
            selectedUser: user
        });
        this.toggleDialog(true,'user');
    }

    renderUser(user){
        return(
            <ListItem button
                onClick={() => this.clickUser(user)}>                
                <ListItemText
                    primary={user.id}
                    secondary={user.role}                    
                    />                
            </ListItem>
        )
    }

    renderUserList(coUsers){
        let renderStr = null;
        if(!isNullOrUndefined(coUsers)){
            renderStr = Object.keys(coUsers).map((key) => {
                let user = coUsers[key];
                return this.renderUser(user);
            });
        }
        return (
            <div style={{marginLeft:'10px', marginTop:'1em'}}>
                <h3>User list</h3>
                <div className="userListContainer">
                    <List>
                        {renderStr}
                    </List>
                </div>
            </div>
        )

    }

    renderAccountSettings(){
        return (
            <div>
                <div style={{marginLeft:'10px', marginTop:'1em'}}>
                    <h3 style={{marginBotton:'0.5em !important'}}>Account settings</h3>
                    <div className="blockprobe-settings-criterion-options-container">
                        <Button
                            variant="contained"  
                            className="saveBlockProbeSettingsButton" 
                            onClick={(e) => this.toggleDialog(true,"exitBlockprobe")}>
                            <div>Exit story</div>
                        </Button>                                
                    </div>
                </div>
            </div>
        );
    }

    renderUserDialog(){
        let selectedUser = this.state.selectedUser;
        return (
            <Dialog
                    open={this.state.userDialog}
                    TransitionComponent={Transition}
                    keepMounted
                    onClose={() => this.toggleDialog(false,'user')}
                    aria-labelledby="alert-dialog-slide-title"
                    aria-describedby="alert-dialog-slide-description">
                        <DialogTitle id="alert-dialog-slide-title">{this.state.dialogText.selected.title}</DialogTitle>
                        <DialogContent>
                        <DialogContentText id="alert-dialog-slide-description">
                            {this.state.dialogText.selected.desc}
                        </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                        {!isNullOrUndefined(selectedUser) && selectedUser.role == "INVITED"?
                            <Button onClick={() => this.removeUser()} color="primary">
                                Delete
                            </Button>
                            :
                            null
                        }                        
                        <Button onClick={() => this.toggleDialog(false,'user')} color="primary">
                            Cancel
                        </Button>                        
                        </DialogActions>
                </Dialog>
        );
    }


    //{this.renderBlockprobeSettings()}
    //{this.renderAddContributors()}
    //{this.renderAddViewers()}
    render(){
        return (
            <div>                
                {this.renderUserList(this.props.coUsers)}
                <LanguageSettingsComponent
                    lang={this.props.lang}
                    bpId={this.props.bpId}
                />
                {this.renderAddCreators()}
                {this.renderAccountSettings()}
                {this.renderUserDialog()}
                <Dialog
                    open={this.state.dialog}
                    TransitionComponent={Transition}
                    keepMounted
                    onClose={() => this.toggleDialog(false,'all')}
                    aria-labelledby="alert-dialog-slide-title"
                    aria-describedby="alert-dialog-slide-description">
                        <DialogTitle id="alert-dialog-slide-title">{this.state.dialogText.selected.title}</DialogTitle>
                        <DialogContent>
                        <DialogContentText id="alert-dialog-slide-description">
                            {this.state.dialogText.selected.desc}
                        </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                        <Button onClick={() => this.performAction(true)} color="primary">
                            Yes
                        </Button>
                        <Button onClick={() => this.performAction(false)} color="primary">
                            No
                        </Button>
                        <Button onClick={() => this.toggleDialog(false,'all')} color="primary">
                            Cancel
                        </Button>                        
                        </DialogActions>
                </Dialog>
            </div>
        );
    }


}
export default BlockprobeSettingsComponent;