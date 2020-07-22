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
import * as Utils from '../../common/utilSvc';
import * as DbUtils from "../../common/dbSvc";
import { isNullOrUndefined } from 'util';
import { timingSafeEqual } from 'crypto';
import Info from '@material-ui/icons/Info';
import Joyride,{ ACTIONS, EVENTS, STATUS } from 'react-joyride';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  });

  class LimitSharedUsersComponent extends React.Component {

    constructor(props){
      super(props);

      this.state={
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
        this.renderUserList = this.renderUserList.bind(this);
        this.renderUser = this.renderUser.bind(this);
        this.renderUserDialog = this.renderUserDialog.bind(this);
        this.clickUser = this.clickUser.bind(this);
        this.removeUser = this.removeUser.bind(this);
        this.toggleDialog = this.toggleDialog.bind(this);
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
            console.log(userId);
            console.log(uIdHash);

            // TODO change
            // await DbUtils.removeInviteStoryNotification(notification,userId,uIdHash);
            // await DbUtils.removeNotification(notification,userId);

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

    render(){
        return (
            <div>
                
            </div>
        );
    }
}
export default LimitSharedUsersComponent;