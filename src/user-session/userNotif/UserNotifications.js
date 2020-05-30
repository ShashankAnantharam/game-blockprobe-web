import React, { Component } from 'react';
import './UserNotifications.css';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';
import * as DbUtils from '../../common/dbSvc';
import { isNullOrUndefined } from 'util';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  });


class UserNotifications extends React.Component {
    constructor(props) {
      super(props);
      //notifications,userId
      //console.log(props.notifications);

      this.state = {
        dialogType: null,
        dialog: false,
        dialogText:{
            selected:{
                title: null,
                desc: null
            }
        },
        selectedNotificationId: null,
        uIdHash: null,
        shajs: null
      }

        var shajs = require('sha.js');
        this.state.uIdHash = shajs('sha256').update(this.props.userId).digest('hex');
        this.state.shajs = shajs;

      this.renderSingleNotification = this.renderSingleNotification.bind(this);
      this.renderStoryInviteNotifications = this.renderStoryInviteNotifications.bind(this);
      this.clickOnNotification = this.clickOnNotification.bind(this);
      this.toggleDialog = this.toggleDialog.bind(this);
      this.performAction = this.performAction.bind(this);
    }

    toggleDialog(value, type, notification){
        let dialogText = this.state.dialogText;
        if(type == 'storyInvite'){
            dialogText.selected.title = `Contribute to story \n"${notification.title}"`;
            dialogText.selected.desc = "You have been invited to contribute to this story. Do you accept?";
        }
        else if(type=='all'){
 
        }
        
        this.setState({
            dialog: value,
            dialogType: type,
            dialogText: dialogText
        });
    }

    renderStoryInviteNotifications(notifications){

        let renderStr = null;
        if(!isNullOrUndefined(notifications)){
            renderStr = Object.keys(notifications).map((key) => {
                let notification = notifications[key];
                let title = notification.title;
                let summary = "You have been invited to contribute to this story as admin."
                return this.renderSingleNotification(title, summary, 'storyInvite', notification);
            });
        }
        return (
            <div>
                {renderStr}
            </div>
        )
    }

    async clickOnNotification(type, notification){
        let notificationId = notification.id;
        await this.setState({
            selectedNotificationId: notificationId
        });
        this.toggleDialog(true,'storyInvite',notification);
    }

    renderSingleNotification(title, summary, type, notification){
        let notif = {title:title,  id:notification.id}
       return(
            <ListItem button 
                onClick={() => { this.clickOnNotification(type,notif)}}
                style={{width:'100%'}}
                >
                <ListItemText 
                 primary={title} 
                 secondary={summary}/>
            </ListItem>                    
        );
        
    }

    async performAction(value){
        let type = this.state.dialogType;
        if(type == 'storyInvite' && !isNullOrUndefined(this.state.selectedNotificationId)){        
            let notification = this.props.notifications[this.state.selectedNotificationId];
            let userId = this.props.userId;
            if(value){
                //Add user to story    
                //console.log('Add user ',this.state.selectedNotificationId);
                let addUserToBlockprobe = DbUtils.addUserToBlockprobe(notification,userId,this.state.uIdHash);
                await Promise.all(addUserToBlockprobe);
                await DbUtils.removeNotification(notification,userId);
            }
            else{
                //Remove notification
                await DbUtils.removeInviteStoryNotification(notification,userId,this.state.uIdHash);
                await DbUtils.removeNotification(notification,userId);
            }
        }

        this.toggleDialog(false,'all',null);
    }

    render(){

        return (
            <div>
                <h2 style={{textAlign:'center'}}>Notifications</h2>
                <Tabs className="notificationsTab">
                    <TabList>
                        <Tab>Invites</Tab>
                    </TabList>

                    <TabPanel>
                        <List>{this.renderStoryInviteNotifications(this.props.notifications)}</List>
                    </TabPanel>
                </Tabs>
                <Dialog
                    open={this.state.dialog}
                    TransitionComponent={Transition}
                    keepMounted
                    onClose={() => this.toggleDialog(false,'all',null)}
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
                        <Button onClick={() => this.toggleDialog(false,'all',null)} color="primary">
                            Cancel
                        </Button>                        
                        </DialogActions>
                </Dialog>
            </div>
        )
    }
}
export default UserNotifications;
