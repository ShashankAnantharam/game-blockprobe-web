import React, { Component } from 'react';
import './ShareBlockprobe.css';
import * as firebase from 'firebase';
import 'firebase/firestore';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Loader from 'react-loader-spinner';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';
import Input from '@material-ui/core/Input';
import * as XLSX from 'xlsx';
import * as Utils from '../../common/utilSvc';
import * as DbUtils from "../../common/dbSvc";
import { isNullOrUndefined } from 'util';
import { timingSafeEqual } from 'crypto';
import Info from '@material-ui/icons/Info';
import Joyride,{ ACTIONS, EVENTS, STATUS } from 'react-joyride';

const LIMIT = 100;

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  });

  class LimitSharedUsersComponent extends React.Component {

    constructor(props){
      super(props);
      //isUserLimited, userList, publicStatus

      this.state={
        addingUser: false,
        dialogType: null,
        dialog: false,
        userDialog: false,
        viewerId: '',
        selectedUser: null,
        dialogText:{
            selected:{
                title: null,
                desc: null
            }
        }
      }
        this.renderUserList = this.renderUserList.bind(this);
        this.renderUser = this.renderUser.bind(this);
        this.renderUserDialog = this.renderUserDialog.bind(this);
        this.renderAddViewersExcel = this.renderAddViewersExcel.bind(this);
        this.clickUser = this.clickUser.bind(this);
        this.removeViewer = this.removeViewer.bind(this);
        this.toggleDialog = this.toggleDialog.bind(this);
        this.changeUserLimitedState = this.changeUserLimitedState.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleChangeFile = this.handleChangeFile.bind(this);
        this.cancelUserCurrent = this.cancelUserCurrent.bind(this);
        this.addUserToViewList = this.addUserToViewList.bind(this);
        this.addUsersToViewerList = this.addUsersToViewerList.bind(this);
    }

    toggleDialog(value, type){
        let dialogText = this.state.dialogText;
        if(type == 'user'){
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

    renderUser(user){
        return(
            <ListItem button
                onClick={() => this.clickUser(user)}>                
                <ListItemText
                    primary={user.id}
                    />                
            </ListItem>
        )
    }

    async clickUser(user){
        await this.setState({
            selectedUser: user
        });
        this.toggleDialog(true,'user');
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
                <h4 style={{marginBottom:'0px'}}>Users who can view your public link</h4>
                <div className="shareViewerListContainer">
                    <List>
                        {renderStr}
                    </List>
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
                            <Button onClick={() => this.removeViewer()} color="primary">
                                Remove
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

    changeUserLimitedState(event){
        //Change db status here for user limited
        let publicStatus = JSON.parse(JSON.stringify(this.props.publicStatus));
        publicStatus.isUserLimited = event.target.checked;
        firebase.firestore().collection("publicStatus").doc(this.props.bpId).set(publicStatus);
    }

    handleChange(event, type) {

        var shouldUpdate = false;
        let str = event.target.value;
        if(type=='viewer' && Utils.shouldUpdateText(str,['\n','\t'])){
            shouldUpdate = true;
        }

        if(shouldUpdate){
            
            if(type=="viewer"){
                var id = event.target.value;
                this.setState({viewerId: id});
            }
        }
      }

    renderAddViewers(){
        return (
            <div>
                <div style={{marginLeft:'10px', marginTop:'1em'}}>
                    <h4 style={{marginBottom:'5px'}}>Add Users who can view your public link</h4>
                    <form>
                    <label>
                        <div className="settings-textfield-container">
                            <TextField 
                            type="text"
                            variant="outlined"
                            multiline
                            placeholder = "UserId (Email/phonenumber)"
                            value={this.state.viewerId}
                            onChange={(e) => { this.handleChange(e,"viewer")}}
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
                    {this.state.viewerId.trim()!='' && !this.state.addingUser?
                            <div className="blockprobe-settings-criterion-options-container">
                                <Button 
                                variant="contained"
                                className="saveBlockProbeSettingsButton" 
                                style={{marginTop:'1em'}}
                                onClick={(e) => {this.addUserToViewList()}}>
                                    <div>Confirm</div>
                                </Button>
                                <Button
                                variant="contained" 
                                className="cancelBlockProbeSettingsButton" 
                                style={{marginTop:'1em'}}
                                onClick={(e) => {this.cancelUserCurrent()}}>
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

    async removeViewer(){
        let user = this.state.selectedUser;
        let userId = user.id;
        if(!isNullOrUndefined(user) && !isNullOrUndefined(user.role) && user.role=="INVITED"){
            //console.log('remove invitation');

            let list = [{
                id: this.props.uId,
                role: "ADMIN"
            }]; 
            if(this.props.publicStatus.userList){
                list = this.props.publicStatus.userList;
            }
            let newList = [];
            for(let i=0; i<list.length; i++){
                if(list[i].id!=userId)
                {
                    newList.push(list[i]);
                }
            }

            let publicStatus = JSON.parse(JSON.stringify(this.props.publicStatus));
            publicStatus['userList'] = newList;
            this.setState({
                addingUser: true
            });
            await firebase.firestore().collection("publicStatus").doc(this.props.bpId).set(publicStatus);    
            this.setState({
                addingUser: false
            });

            this.setState({
                userDialog: false
            });
        }
    }

    async addUserToViewList(){
        let userId = this.state.viewerId;
        let list = [{
            id: this.props.uId,
            role: "ADMIN"
        }]; 
        if(this.props.publicStatus.userList){
            list = this.props.publicStatus.userList;
        }
        let isUserPresent = false;
        for(let i=0; i<list.length; i++){
            if(list[i].id==userId)
            {
                isUserPresent = true;
                break;
            }
        }
        if(!isUserPresent && list.length<LIMIT){
            list.push({
                id: userId,
                role: "INVITED"
            });
            let publicStatus = JSON.parse(JSON.stringify(this.props.publicStatus));
            publicStatus['userList'] = list;
            this.setState({
                addingUser: true
            });
            await firebase.firestore().collection("publicStatus").doc(this.props.bpId).set(publicStatus);    
            this.setState({
                viewerId: '',
                addingUser: false
            });
        }
        else{
            this.cancelUserCurrent();
        }

    }

    cancelUserCurrent(){        
        this.setState({
            viewerId: ''
        })
    }

    async addUsersToViewerList(users){
        let list = [{
            id: this.props.uId,
            role: "ADMIN"
        }]; 
        if(this.props.publicStatus.userList){
            list = this.props.publicStatus.userList;
        }
        for(let i=0; users && i<users.length && list.length<LIMIT;i++){
            let userId = users[i].trim();
            let isUserPresent = false;
            for(let j=0; j<list.length; j++){
                if(list[j].id==userId)
                {
                    isUserPresent = true;
                    break;
                }
            }

            if(!isUserPresent && userId.length>0){
                list.push({
                    id: userId,
                    role: "INVITED"
                });
            }
        }
        //console.log(list);
        let publicStatus = JSON.parse(JSON.stringify(this.props.publicStatus));
        publicStatus['userList'] = list;
        this.setState({
            addingUser: true
        });
        await firebase.firestore().collection("publicStatus").doc(this.props.bpId).set(publicStatus);    
        this.setState({
            addingUser: false
        });
    }

    handleChangeFile(event){
        let file = event.target.files[0];
        let reader = new FileReader();
        let scope = this;
        reader.onload = function() {
            const dataStr = reader.result;
            const wb = XLSX.read(dataStr, {type:'binary'});
            /* Get first worksheet */
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            /* Convert array of arrays */
            const data = XLSX.utils.sheet_to_csv(ws, {header:1});
            /* Update state */

            let userIdData = [];
            let dataArr = data.split('\n');
            for(let i=0;dataArr && i<dataArr.length; i++){
                let tempArr = dataArr[i].split(',');
                if(tempArr.length > 0 && !isNullOrUndefined(tempArr[0]) &&
                   tempArr[0].trim().length>0)
                {
                    userIdData.push(tempArr[0]);
                }
            }
            scope.addUsersToViewerList(userIdData);
            //scope.getFullTable(userIdData);
          };
        reader.readAsBinaryString(file);

        //Done to remove earlier file and update with new file.
        event.target.value = null;
    }

    renderAddViewersExcel(){
        return (
            <div style={{marginLeft:'10px', marginTop:'1em'}}>
                <h4 style={{marginBottom: '10px'}}>Upload excel file with viewer user-ids</h4>
                <h5 style={{marginTop: '0px'}}>User id must be the first column</h5>
                <form>
                    <label>
                        <Input 
                            type="file"
                            variant="outlined"
                            value={this.state.file}
                            onChange={(e) => { this.handleChangeFile(e) }}
                            rows="1"
                            style={{
                                background: 'white',
                                marginTop:'6px',
                                marginBottom:'6px',
                                width:'30%'
                                }}/>
                    </label>
                </form>                    
            </div>
        )
    }

    render(){
        let isUserLimited = false;
        let userList = [{
            id: this.props.uId,
            role: "ADMIN"
        }];
        if(this.props.publicStatus.isUserLimited){
            isUserLimited = this.props.publicStatus.isUserLimited;
            if(this.props.publicStatus.userList){
                userList = this.props.publicStatus.userList;
            }
        }

        return (
            <div>
                <div className="left-margin-0 share-section-heading">
                    Limit users who can play your game
                    <Switch
                        checked={!(!(isUserLimited))}
                        onChange={this.changeUserLimitedState}
                        name="isUserLimited"
                        color="primary"
                    />
                </div>

                {isUserLimited?
                    <div>
                        {this.renderUserDialog()}
                        {userList.length > 0?
                            <div>
                                {this.renderUserList(userList)}
                            </div>
                            :
                            null
                        }
                        {this.renderAddViewers()}
                        {this.renderAddViewersExcel()}
                    </div>
                    :
                    null
                }             
            </div>
        );
    }
}
export default LimitSharedUsersComponent;