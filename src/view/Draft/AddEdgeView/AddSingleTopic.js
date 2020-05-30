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
import { isNull, isNullOrUndefined } from 'util';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';

const filter = createFilterOptions();

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  });

class AddSingleTopicView extends React.Component {

    constructor(props){
        super(props);

        this.state ={
            summary: '',
            selectedEntities: []
        }

        this.confirmEdge = this.confirmEdge.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.getEntities = this.getEntities.bind(this);
    }

    handleChange(event, type) {
        let str = event.target.value;
        var shouldUpdate = true;
        shouldUpdate = Utils.shouldUpdateText(str, ['\n','\t']);
        if(shouldUpdate){
            if(type=="connection-description"){
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
                <h4 className="addEdgeTitle">Add topic</h4>
                <div className="addEdgeBlockTextContainer">
                    <TextField 
                                type="text"
                                variant="outlined"
                                value={this.state.summary}
                                onChange={(e) => { this.handleChange(e,"connection-description")}}
                                label = "Describe topic"
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
                            this.setState({
                                selectedEntities: newValue
                            });
                        }}
                        renderInput={(params) => (
                        <TextField {...params} variant="outlined" label="Add topics" />
                        )}
                    />
                </div>
                {this.state.selectedEntities.length == 1 && !isNullOrUndefined(this.state.summary)
                && this.state.summary.length > 0?
                    <Button
                        variant="contained" 
                        onClick={() => this.confirmEdge()}
                        className="confirmEdgeButton"
                        >Confirm</Button>
                        :
                        <p className="edgeEntityMessage">*Input exactly one topic and describe it!</p>
                }
                
            </div>
        )
    }
}
export default AddSingleTopicView;
