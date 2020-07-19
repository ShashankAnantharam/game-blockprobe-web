import React, { Component } from 'react';
import Textarea from 'react-textarea-autosize';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Chip from '@material-ui/core/Chip';
import Slide from '@material-ui/core/Slide';
import  * as Utils from '../../../common/utilSvc';
import './AddEdgeView.css';
import * as firebase from 'firebase';
import 'firebase/firestore';
import ReactGA from 'react-ga';
import Joyride,{ ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { isNull, isNullOrUndefined } from 'util';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';

const filter = createFilterOptions();

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  });

class AddEdgeView extends React.Component {

    constructor(props){
        super(props);

        this.state ={
            summary: '',
            selectedEntities: [],
            adhocTooltip:{
                confirm:{
                    flag: false,
                    text: [
                        {
                            title: null,
                            target: '.confirmEdgeButtonGreyed',
                            content: "Input exactly two topics (Eg: Lion, Animal) and describe the connection. To input a topic, type the topic name and press Enter.",
                            disableBeacon: true
                        }
                    ]
                }
            }
        }

        ReactGA.initialize('UA-143383035-1');   
        ReactGA.pageview('/userBlocks');

        this.confirmEdge = this.confirmEdge.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.getEntities = this.getEntities.bind(this);
        this.showLocalTooltip = this.showLocalTooltip.bind(this);
        this.hideLocalTooltip = this.hideLocalTooltip.bind(this);
        this.handleAdhocTooltipJoyrideCallback = this.handleAdhocTooltipJoyrideCallback.bind(this);
    }

    showLocalTooltip(type){
        var adhocTooltip = this.state.adhocTooltip;
        if(type=='confirm'){
            adhocTooltip.confirm.flag = true;
        }
        console.log(adhocTooltip);
        this.setState({adhocTooltip: adhocTooltip});
    }

    hideLocalTooltip(type){
        var adhocTooltip = this.state.adhocTooltip;
        if(type=='confirm'){
            adhocTooltip.confirm.flag = false;
        }
        
        this.setState({adhocTooltip: adhocTooltip});
    }

    handleAdhocTooltipJoyrideCallback(data, tooltipType){
        const {action,index,status,type} = data;
        if([STATUS.FINISHED, STATUS.SKIPPED].includes(status)){
            this.hideLocalTooltip(tooltipType);
        }
    }

    handleChange(event, type) {
        let str = event.target.value;
        var shouldUpdate = true;
        shouldUpdate = Utils.shouldUpdateText(str, ['\n','\t']);
        if(shouldUpdate){
            if(type=="connection-description"){
                /*
                ReactGA.event({
                    category: 'Add single edge',
                    action: 'Add single edge desc '+ String(this.props.bId),
                    label: 'Add single edge desc '+ String(this.props.bId)
                  });
                  */
                this.setState({summary: event.target.value});
            }
            else  if(type=="entityA"){
                this.setState({entityA: event.target.value});
            }
        }
      }

    getEntities(investigationGraph, entityPane){
        var entities = [];
        // console.log(entities);
        var isEntityPresent = {};
        if(!isNullOrUndefined(investigationGraph)){
            Object.keys(investigationGraph).forEach(function(entityLabel) {
                if(!(entityLabel in isEntityPresent)){
                    entities.push({                
                        label: entityLabel, 
                    });
                }
                isEntityPresent[entityLabel] = false;
            });
        }
        if(!isNullOrUndefined(entityPane)){
            for(let i=0; i<entityPane.length; i++){
                if(!(entityPane[i].label in isEntityPresent)){
                    entities.push({
                        label: entityPane[i].label
                    });
                }
            }
        }
        // console.log(entities);
        return entities;
    }

    getLatestIndex(){
        let latestIndex = 0 ;
        if(this.props.lastIndexDraftBlocks.length > 0)
            latestIndex = Math.max(latestIndex, this.props.lastIndexDraftBlocks[this.props.lastIndexDraftBlocks.length - 1]);

        if(this.props.lastIndex){
            latestIndex = Math.max(latestIndex, this.props.lastIndex);
        }
        return latestIndex;
    }

    commitBlockToBlockprobe(){
        let entities = [];
        for(let i=0; i<this.state.selectedEntities.length; i++){
            entities.push({
                title: Utils.makeFirstLetterUppercase(this.state.selectedEntities[i]),
                type: 'None'
            });
        }
        let index = this.getLatestIndex();
        index += 0.1;
        let fullBlock = {
            title: `#${index} `,
            summary: this.state.summary,
            entities: entities,
            evidences: [],
            referenceBlock: null,
            timestamp: Date.now(),
            actionType: 'ADD'
        };
        this.props.commitBlockToBlockprobe(fullBlock);
    }

    confirmEdge(){
        // console.log(this.state.selectedEntities, this.state.summary);
        this.commitBlockToBlockprobe();
    }

    render(){
        let entityList = this.getEntities(this.props.investigationGraph, this.props.entityPane);
        return (
            <div>
                <h4 className="addEdgeTitle"> Add connection</h4>
                <div className="addEdgeBlockTextContainer">
                    <TextField 
                                type="text"
                                variant="outlined"
                                value={this.state.summary}
                                onChange={(e) => { this.handleChange(e,"connection-description")}}
                                label = "Describe connection"
                                placeholder = "Eg: lion is an animal"
                                multiline
                                rowsMax="3"
                                rows="2"
                                style={{
                                    background: 'white',
                                    marginTop:'6px',
                                    marginBottom:'6px',
                                    width:'100%',
                                    color: 'darkBlue',
                                    fontWeight:'600'
                                    }}/>
                </div>
                <div className="addEdgeEntityContainer">
                    <Autocomplete
                        multiple
                        id="tags-filled"
                        options={entityList.map((option) => option.label)}
                        freeSolo
                        renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                            <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                        ))
                        }
                        value={this.state.selectedEntities}
                        onChange = {(event, newValue) => {
                            ReactGA.event({
                                category: 'Add single edge type',
                                action: 'Add single edge type entites '+ String(this.props.bId),
                                label: 'Add single edge type entites '+ String(this.props.bId)
                              });
                            this.setState({
                                selectedEntities: newValue
                            });
                        }}
                        renderInput={(params) => (
                        <TextField {...params} 
                        variant="outlined" 
                        placeholder="Type and press enter."
                        label="Input two topics" />
                        )}
                    />
                </div>
                {this.state.selectedEntities.length == 2?
                    <Button
                        variant="contained" 
                        onClick={() => this.confirmEdge()}
                        className="confirmEdgeButton"
                        >Confirm</Button>
                        :
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
                                steps={this.state.adhocTooltip.confirm.text}
                                run = {this.state.adhocTooltip.confirm.flag}
                                callback={(data)=>{this.handleAdhocTooltipJoyrideCallback(data,'confirm')}}                    
                                /> 
                            <Button
                            variant="contained" 
                            onClick={() => this.showLocalTooltip('confirm')}
                            className="confirmEdgeButtonGreyed"
                            >Confirm</Button>                            
                            <p className="edgeEntityMessage">*Input exactly two topics (Eg: Lion, Animal) <br/>
                        To input a topic, type the topic name and press enter.</p>
                        </div>                        
                }
                
            </div>
        )
    }
}
export default AddEdgeView;
