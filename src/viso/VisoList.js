import React, { Component } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';
import TimelineIcon from '@material-ui/icons/Timeline';
import AcUnitIcon from '@material-ui/icons/AcUnit'; 
import GroupIcon from '@material-ui/icons/Group'; 
import BuildIcon from '@material-ui/icons/Build'; 
import CreateIcon from '@material-ui/icons/Create'; 
import DashboardIcon from '@material-ui/icons/Dashboard';
import SportsEsportsIcon from '@material-ui/icons/SportsEsports';
import ShareIcon from '@material-ui/icons/Share';
import Joyride from 'react-joyride';
import ListIcon from '@material-ui/icons/List';
import './VisoList.css';

class VisualizeOptionsListComponent extends React.Component {

    constructor(props){
      super(props);
      //role, dashboardTooltip

      this.state={
        shouldEnableMultipleContributors: true,
          tooltipText:{              
              dashboard:[
                  {
                    title: 'Click on \'Dashboard\' from the menu and visualise your work!',
                    target: '.dashboard-menu',
                    content: '',
                    disableBeacon: true,
                    placement: 'center'
                  }         
              ],
              shareStory:[
                    {
                        title: 'Click on \'Share my story\' and use the public link to share the dashboard.',
                        target: '.shareOption',
                        content: '',
                        disableBeacon: true,
                        placement: 'center'
                    }
              ]
          },
          showTooltip:{
              dashboard: JSON.parse(JSON.stringify(props.dashboardTooltip)),
              shareStory: JSON.parse(JSON.stringify(props.shareStoryTooltip))
          }
      }

      this.renderOptions = this.renderOptions.bind(this);


      /* Add later if needed
      <ListItem button
                    selected={this.props.selectedVisualisation == "list"}
                    onClick={() => { this.selectNewVisualisation("list")}}                    
                    >
                    <Avatar>
                        <ListIcon />
                        </Avatar>
                        <ListItemText primary="List" />
                    </ListItem>
                    */
    }

    selectNewVisualisation(newVisualisation){
        this.props.selectVisualisation(newVisualisation);
    }

    renderOptions(){
        return(
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
                    steps={this.state.tooltipText.shareStory}
                    run = {this.state.showTooltip.shareStory}                    
                    />
                <h3 style={{textAlign:"center"}}>OPTIONS</h3>
                <List className="">
                    <ListItem button 
                    selected={this.props.selectedVisualisation == "contributions"}
                    onClick={() => { this.selectNewVisualisation("contributions")}}
                    >
                    <Avatar>
                        <CreateIcon />
                    </Avatar>
                        <ListItemText primary="Contribute"/>
                    </ListItem>                                     

                    {this.props.permit == "CREATOR"?
                        <div className='shareOption'>
                            <ListItem button 
                                selected={this.props.selectedVisualisation == "publish_blockprobe"}
                                onClick={() => { this.selectNewVisualisation("publish_blockprobe")}}
                                >
                                <Avatar>
                                    <ShareIcon />
                                </Avatar>
                                    <ListItemText primary="Share"/>
                            </ListItem>
                        </div>
                        :
                        null}

                    {this.state.shouldEnableMultipleContributors?
                            <ListItem button 
                            selected={this.props.selectedVisualisation == "manage_blockprobe"}
                            onClick={() => { this.selectNewVisualisation("manage_blockprobe")}}
                            >
                            <Avatar>
                                <BuildIcon />
                            </Avatar>
                                <ListItemText primary="Settings"/>
                            </ListItem>
                            :
                            null
                        }  
                </List>
            </div>
        )
    }

    componentWillReceiveProps(nextProps) {
        // You don't have to do this check first, but it can help prevent an unneeded render
        var showTooltip = this.state.showTooltip;
        if (nextProps.dashboardTooltip !== this.state.showTooltip.dashboard) {           
            showTooltip.dashboard = JSON.parse(JSON.stringify(nextProps.dashboardTooltip));           
        }
        if (nextProps.shareStoryTooltip !== this.state.showTooltip.shareStory) {           
            showTooltip.shareStory = JSON.parse(JSON.stringify(nextProps.shareStoryTooltip));           
        }

        this.setState({ showTooltip: showTooltip });
    }

    render(){
        return(
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
                    steps={this.state.tooltipText.dashboard}
                    run = {this.state.showTooltip.dashboard}                    
                    />
                <h3 style={{textAlign:"center"}}>VISUALISE</h3>
                <List className="">
                    <div className='dashboard-menu'>
                                <ListItem button 
                                    selected={this.props.selectedVisualisation == "dashboard"}
                                    onClick={() => { this.selectNewVisualisation("dashboard")}}
                                    >
                                    <Avatar>
                                        <SportsEsportsIcon />
                                    </Avatar>
                                        <ListItemText primary="Game"/>
                                </ListItem>
                    </div>                    

                </List>

                {(!this.props.isViewOnly && this.props.permit != "VIEWER")? 
                    this.renderOptions()
                    :
                     null    
                }
            </div>
        );
    }


}
export default VisualizeOptionsListComponent;