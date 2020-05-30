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
import { isNullOrUndefined } from 'util';

class MiniDashboardViewComponent extends React.Component {

    constructor(props){
      super(props);
      this.state={
          key: 'graph',
          adhocTooltip:{
            timeline:{
                flag: false,
                text: [
                    {
                        title: 'Timeline view',
                        target: '.tooltipTimeline',
                        content: 'Visualise the story as a timeline!',
                        disableBeacon: true
                    }
                ]
            },
            mindmap:{
                flag: false,
                text: [
                    {
                        title: 'Mindmap view',
                        target: '.tooltipMindmap',
                        content: 'Visualise the story as a mindmap! Select any topic from the mindmap to read all about that topic.',
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
        return (
            <div style={{paddingBottom:'15px'}}>

                <Tabs style={{marginTop:'10px'}}>
                    <TabList>
                        {this.isGraphAvailable()?
                            <Tab>Mindmap</Tab>
                            :
                            null}
                        {this.isTimelineAvailable()?
                            <Tab>Timeline</Tab>
                            :
                            null}

                        {this.isSummaryBlocksAvailable()?
                            <Tab>Summary</Tab>
                            :
                            null}
                    </TabList>

                    
                        {this.isGraphAvailable()?
                           <TabPanel>
                            <div>
                                    <GraphComponent blockTree={this.props.blockTree} 
                                        investigationGraph={this.props.investigationGraph}
                                        selectBlock={this.props.selectBlock}
                                        imageMapping = {this.props.imageMapping}
                                        setScrollToGraphList ={this.props.setScrollToGraphList}
                                        multiSelectEntityList = {this.props.multiSelectEntityList}
                                        isPublic = {this.props.isPublic}
                                        lang = {this.props.lang}/>
                                </div>
                            </TabPanel>
                            :
                            null
                             }


                    
                        {this.isTimelineAvailable()?
                            <TabPanel>
                                <div>
                                    <TimelineComponent 
                                        timeline={this.props.timeline} 
                                        selectBlock={this.props.selectBlock}/>
                                </div>
                            </TabPanel>
                            :
                            null
                            }
                    

                    
                        {this.isSummaryBlocksAvailable()?
                            <TabPanel>
                                <div>                            
                                    <SummaryViewComponent
                                        summaryBlocks = {this.props.summaryBlocks}
                                        selectBlock={this.props.selectBlock}/>
                                </div>
                            </TabPanel>
                            :
                            null
                            }             
                </Tabs>               
                              

                {this.isBlockprobeEmpty()?
                    <div className="dashboard-section-heading graph-heading" style={{textAlign: 'center'}}>
                        Visualizations not found
                    </div>
                    :
                    null
                }         
                
            </div>
        );
    }
}
export default MiniDashboardViewComponent;

/*
 <TabPanel>
                        <FindConnectionsComponent blockTree={this.props.blockTree} 
                            investigationGraph={this.props.investigationGraph}
                            imageMapping = {this.props.imageMapping}
                            selectBlock={this.props.selectBlock}
                            setScrollToGraphList ={this.props.setScrollToGraphList}
                        />
                    </TabPanel>
                    */