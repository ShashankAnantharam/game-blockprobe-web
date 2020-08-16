import React, { Component } from 'react';
import { Button, IconButton } from '@material-ui/core';
import VolumeUp from '@material-ui/icons/VolumeUp';
import VolumeOff from '@material-ui/icons/VolumeOff';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Joyride,{ ACTIONS, EVENTS, STATUS } from 'react-joyride';
import Info from '@material-ui/icons/Info';
import "react-tabs/style/react-tabs.css";
import './DashboardView.css';
import SummaryViewComponent from "../summary/SummaryView";
import GraphComponent from "../GraphComponent";
import GamifiedGraphComponent from "../GamifiedGraphComponent";
import GamifiedTimelineComponent from '../gamifiedTimeline/GamifiedTimeline';
import FindConnectionsComponent from "../FindConnectionsComponent";
import TimelineComponent from "../TimelineComponent";
import * as Locale from "../../Localization/localizedStrings";
import { isNullOrUndefined } from 'util';
import GamifiedPartsOfImageView from '../gamifiedPartsOfImage/gamifiedPartsOfImage';

class GamifiedDashboardViewComponent extends React.Component {

    constructor(props){
      super(props);
     //lang is necessary

      this.state={
          key: 'graph',
          adhocTooltip:{
            mindmap:{
                flag: false,
                text: [
                    {
                        title: Locale.gameifiedMindMapTooltips.title[props.lang],
                        target: '.tooltipMindmap',
                        content: Locale.gameifiedMindMapTooltips.desc[props.lang],
                        disableBeacon: true
                    }
                ]
            },
            timeline:{
                flag: false,
                text: [
                    {
                        title: Locale.gameifiedTimelineTooltips.title[props.lang],
                        target: '.tooltipTimeline',
                        content: Locale.gameifiedTimelineTooltips.desc[props.lang],
                        disableBeacon: true
                    }
                ]
            }            
        },
        playSound: true
      }
      this.isSummaryBlocksAvailable = this.isSummaryBlocksAvailable.bind(this);
      this.isGraphAvailable = this.isGraphAvailable.bind(this);
      this.isTimelineAvailable = this.isTimelineAvailable.bind(this);
      this.isDissectPictureAvailable = this.isDissectPictureAvailable.bind(this);
      this.showLocalTooltip = this.showLocalTooltip.bind(this);
      this.hideLocalTooltip = this.hideLocalTooltip.bind(this);
      this.handleAdhocTooltipJoyrideCallback = this.handleAdhocTooltipJoyrideCallback.bind(this);

    }

    showLocalTooltip(type){
        var adhocTooltip = this.state.adhocTooltip;
       if(type=='mindmap'){
           adhocTooltip.mindmap.flag = true;
       }
       else if(type=='timeline'){
        adhocTooltip.timeline.flag = true;
    }
       this.setState({adhocTooltip: adhocTooltip});
    }

    hideLocalTooltip(type){
        var adhocTooltip = this.state.adhocTooltip;
        if(type=='mindmap'){
            adhocTooltip.mindmap.flag = false;
        }
        else if(type=='timeline'){
            adhocTooltip.timeline.flag = false;
        }
        this.setState({adhocTooltip: adhocTooltip});
    }

    handleAdhocTooltipJoyrideCallback(data, tooltipType){
        const {action,index,status,type} = data;
        if([STATUS.FINISHED, STATUS.SKIPPED].includes(status)){
            this.hideLocalTooltip(tooltipType);
        }
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

    isBlockprobeEmpty(){
        if(!this.isTimelineAvailable() && !this.isGraphAvailable() && 
        !this.isSummaryBlocksAvailable() && !this.isDissectPictureAvailable()){
            return true;
        }
        return false;
    }

    isDissectPictureAvailable(){
        if(this.props.partsOfImageList && this.props.partsOfImageList.length > 0)
            return true;
        return false;
    }

    render(){
        let lang = this.props.lang;
        if(isNullOrUndefined(lang))
            lang = 'en';

        return (
            <div style={{paddingBottom:'15px'}}> 
                <div className="gamifiedDashboardOptionsContainer uniformMarginLeft">
                            {this.state.playSound?
                                <IconButton
                                    variant="contained" 
                                    className="soundSettingsbutton"
                                    onClick={() => { this.setState({playSound: false})}}> 
                                    <VolumeOff/>
                                </IconButton>
                                :
                                <IconButton
                                    variant="contained" 
                                    className="soundSettingsbutton"
                                    onClick={() => { this.setState({playSound: true})}}> 
                                    <VolumeUp/>
                                </IconButton>
                            }        
                </div>

                {this.isDissectPictureAvailable()?
                    <div>
                        <div className="dashboard-section-heading graph-heading">{"Parts of the picture"}</div>
                        <GamifiedPartsOfImageView
                            playSound = {this.state.playSound}
                            bpId={this.props.bpId}
                            title={this.props.title}
                            isPublic = {this.props.isPublic}
                            lang = {this.props.lang}
                            partsOfImageList={this.props.partsOfImageList}
                            setScrollToGraphList ={this.props.setScrollToGraphList}
                        />
                    </div>
                    :
                    null
                }

                {this.isGraphAvailable()?
                    <div style={{marginBottom: '50px'}}>
                        <div className="dashboard-section-heading graph-heading">{Locale.gameifiedMindMapTooltips.title[lang]}
                        <a className='tooltipMindmap tooltips-dashboard' 
                            onMouseEnter={() => this.showLocalTooltip('mindmap')}
                            onClick={(e)=>{this.showLocalTooltip('mindmap')}} >
                            <Info style={{fontSize:'19px'}}/>
                        </a>
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
                            steps={this.state.adhocTooltip.mindmap.text}
                            run = {this.state.adhocTooltip.mindmap.flag}
                            callback={(data)=>{this.handleAdhocTooltipJoyrideCallback(data,'mindmap')}}                    
                            />  
                        </div>                                                
                                <GamifiedGraphComponent 
                                    bpId={this.props.bpId}
                                    title={this.props.title}
                                    blockTree={this.props.blockTree} 
                                    investigationGraph={this.props.investigationGraph}
                                    selectBlock={this.props.selectBlock}
                                    imageMapping = {this.props.imageMapping}
                                    setScrollToGraphList ={this.props.setScrollToGraphList}
                                    multiSelectEntityList = {this.props.multiSelectEntityList}
                                    isPublic = {this.props.isPublic}
                                    playSound = {this.state.playSound}
                                    lang = {this.props.lang}/>
                       
                    </div>
                    :
                    null
                } 

                {this.isTimelineAvailable()?
                    <div>
                        <div className="dashboard-section-heading graph-heading">{Locale.gameifiedTimelineTooltips.title[lang]}
                        <a className='tooltipTimeline tooltips-dashboard' 
                            onMouseEnter={() => this.showLocalTooltip('timeline')}
                            onClick={(e)=>{this.showLocalTooltip('timeline')}} >
                            <Info style={{fontSize:'19px'}}/>
                        </a>
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
                            steps={this.state.adhocTooltip.timeline.text}
                            run = {this.state.adhocTooltip.timeline.flag}
                            callback={(data)=>{this.handleAdhocTooltipJoyrideCallback(data,'timeline')}}                    
                            />
                        </div>
                        <div>
                            <GamifiedTimelineComponent
                                timeline={this.props.timeline}
                                playSound = {this.state.playSound}
                                bpId={this.props.bpId}
                                title={this.props.title}
                                isPublic = {this.props.isPublic}
                                lang = {this.props.lang}
                                />
                        </div>
                    </div>
                    :
                    null
                }                

                {this.isBlockprobeEmpty()?
                    <div className="dashboard-section-heading graph-heading" style={{textAlign: 'center'}}>
                        {Locale.visualizationsNotFound[lang]}
                    </div>
                    :
                    null
                }         
                
            </div>
        );
    }
}
export default GamifiedDashboardViewComponent;

/*
 <TabPanel>
                        <FindConnectionsComponent blockTree={this.props.blockTree} 
                            investigationGraph={this.props.investigationGraph}
                            imageMapping = {this.props.imageMapping}
                            selectBlock={this.props.selectBlock}
                            setScrollToGraphList ={this.props.setScrollToGraphList}
                        />
                    </TabPanel>



                     


                {this.isGraphAvailable() || this.isTimelineAvailable()?
                    <div className="dashboard-section-heading graph-heading">Visualisations</div>
                    :
                    null
                }
                <Tabs style={{marginTop:'15px'}}>
                    <TabList>
                        {this.isGraphAvailable()?
                            <Tab>Mindmap</Tab>
                            :
                            null
                        }

                        {this.isTimelineAvailable()?
                            <Tab>Timeline</Tab>
                            :
                            null
                        }
                    </TabList>   
                    
                    {this.isGraphAvailable()?
                        <TabPanel>
                            <GraphComponent blockTree={this.props.blockTree} 
                                investigationGraph={this.props.investigationGraph}
                                selectBlock={this.props.selectBlock}
                                imageMapping = {this.props.imageMapping}
                                setScrollToGraphList ={this.props.setScrollToGraphList}
                                multiSelectEntityList = {this.props.multiSelectEntityList}/>
                        </TabPanel>
                        :
                        null}             

                    {this.isTimelineAvailable()?
                        <TabPanel>
                            <TimelineComponent 
                                timeline={this.props.timeline} 
                                selectBlock={this.props.selectBlock}/>
                        </TabPanel>
                        :
                        null}                     

                </Tabs>         

                    */