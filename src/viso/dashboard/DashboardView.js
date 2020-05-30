import React, { Component } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Joyride,{ ACTIONS, EVENTS, STATUS } from 'react-joyride';
import Info from '@material-ui/icons/Info';
import "react-tabs/style/react-tabs.css";
import './DashboardView.css';
import SummaryViewComponent from "../summary/SummaryView";
import GraphComponent from "../GraphComponent";
import FindConnectionsComponent from "../FindConnectionsComponent";
import TimelineComponent from "../TimelineComponent";
import * as Locale from "../../Localization/localizedStrings";
import { isNullOrUndefined } from 'util';

class DashboardViewComponent extends React.Component {

    constructor(props){
      super(props);
     //lang is necessary

      this.state={
          key: 'graph',
          adhocTooltip:{
            timeline:{
                flag: false,
                text: [
                    {
                        title: Locale.timelineTooltips.title[props.lang],
                        target: '.tooltipTimeline',
                        content: Locale.timelineTooltips.desc[props.lang],
                        disableBeacon: true
                    }
                ]
            },
            mindmap:{
                flag: false,
                text: [
                    {
                        title: Locale.mindMapTooltips.title[props.lang],
                        target: '.tooltipMindmap',
                        content: Locale.mindMapTooltips.desc[props.lang],
                        disableBeacon: true
                    }
                ]
            }
        }
      }
      this.isSummaryBlocksAvailable = this.isSummaryBlocksAvailable.bind(this);
      this.isGraphAvailable = this.isGraphAvailable.bind(this);
      this.isTimelineAvailable = this.isTimelineAvailable.bind(this);
      this.showLocalTooltip = this.showLocalTooltip.bind(this);
      this.hideLocalTooltip = this.hideLocalTooltip.bind(this);
      this.handleAdhocTooltipJoyrideCallback = this.handleAdhocTooltipJoyrideCallback.bind(this);

    }

    showLocalTooltip(type){
        var adhocTooltip = this.state.adhocTooltip;
       if(type=='timeline'){
           adhocTooltip.timeline.flag = true;
       }
       else if(type=='mindmap'){
           adhocTooltip.mindmap.flag = true;
       }
       this.setState({adhocTooltip: adhocTooltip});
    }

    hideLocalTooltip(type){
        var adhocTooltip = this.state.adhocTooltip;
        if(type=='timeline'){
           adhocTooltip.timeline.flag = false;
       }
        else if(type=='mindmap'){
           adhocTooltip.mindmap.flag = false;
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
        if(!this.isTimelineAvailable() && !this.isGraphAvailable() && !this.isSummaryBlocksAvailable()){
            return true;
        }
        return false;
    }

    render(){
        let lang = this.props.lang;
        if(isNullOrUndefined(lang))
            lang = 'en';

        return (
            <div style={{paddingBottom:'15px'}}>

                {this.props.setNewVisualisation?
                    <div className="shareTooltipTextContainer">
                        <p className='contributeOptionText'>Click on the menu (top-left) and choose <a className='tooltip-selection' onClick={() => this.props.setNewVisualisation('contributions')}>Contribute</a> to resume working.</p>
                        <p className='contributeOptionText'>Click on the menu (top-left) and choose <a className='tooltip-selection' onClick={() => this.props.setNewVisualisation('publish_blockprobe')}>Share</a> to share.</p>
                    </div>
                    :
                    null
                }

                {this.isSummaryBlocksAvailable()?
                    <div>
                        <SummaryViewComponent
                                summaryBlocks = {this.props.summaryBlocks}
                                selectBlock={this.props.selectBlock}/>
                    </div>
                            :
                    null
                }
                
                {this.isGraphAvailable()?
                    <div>
                        <div className="dashboard-section-heading graph-heading">{Locale.mindMap[lang]}
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
                                                
                                <GraphComponent blockTree={this.props.blockTree} 
                                    investigationGraph={this.props.investigationGraph}
                                    selectBlock={this.props.selectBlock}
                                    imageMapping = {this.props.imageMapping}
                                    setScrollToGraphList ={this.props.setScrollToGraphList}
                                    multiSelectEntityList = {this.props.multiSelectEntityList}
                                    isPublic = {this.props.isPublic}
                                    lang = {this.props.lang}/>
                       
                    </div>
                    :
                    null
                } 



                {this.isTimelineAvailable()?

                    <div>
                        <div className="dashboard-section-heading timeline-heading" style={{marginBottom:'0 !important'}}>{Locale.timeline[lang]}
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
                            <TimelineComponent 
                                timeline={this.props.timeline} 
                                selectBlock={this.props.selectBlock}/>
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
export default DashboardViewComponent;

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