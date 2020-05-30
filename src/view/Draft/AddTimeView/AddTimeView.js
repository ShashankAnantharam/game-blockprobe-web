import React, { Component } from 'react';
import Checkbox from '../Checkbox';
import Button from '@material-ui/core/Button';
import DatePicker from "react-datepicker";
import MonthPicker from '../MonthPicker/MonthPicker';
import TextField from '@material-ui/core/TextField';
import { isNullOrUndefined } from 'util';
import Grid from '@material-ui/core/Grid';
import  * as Utils from '../../../common/utilSvc';
import './AddTimeView.css';
import DateFnsUtils from '@date-io/date-fns';
import {
  MuiPickersUtilsProvider,
  KeyboardTimePicker,
  KeyboardDatePicker,
} from '@material-ui/pickers';

class AddTimeView extends React.Component {

    constructor(props){
        super(props);

        this.state={
            date: new Date(),
            selectedDateStyle: 'date',
            newBlock: {
                title: '',
                summary: '',
                blockDate: {}
            }
        }
        this.state.newBlock.blockDate = {
            date: this.state.date.getDate(),
            month: this.state.date.getMonth(),
            year: this.state.date.getFullYear()
        }
        this.handleChange = this.handleChange.bind(this);
        this.isDateChecked = this.isDateChecked.bind(this);
        this.toggleDateStyle = this.toggleDateStyle.bind(this);
        this.getLatestIndex = this.getLatestIndex.bind(this);
        this.commitBlockToBlockprobe = this.commitBlockToBlockprobe.bind(this);
        this.confirmTime = this.confirmTime.bind(this);
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
        let index = this.getLatestIndex();
        index += 0.1;
        let fullBlock = {
            title: `#${index} ${this.state.newBlock.title.trim()}`,
            summary: this.state.newBlock.summary.trim(),
            entities: [],
            evidences: [],
            blockDate: this.state.newBlock.blockDate,
            referenceBlock: null,
            timestamp: Date.now(),
            actionType: 'ADD'
        };
        this.props.commitBlockToBlockprobe(fullBlock);
    }

    confirmTime(){
        //Confirm time
        this.commitBlockToBlockprobe();
    }

    toggleDateStyle(type){
        let block = this.state.newBlock;
        let date = this.state.date;
        if(type == 'month' && this.state.selectedDateStyle != 'month'){
            if(block.blockDate){
                block.blockDate['date'] = null;
                date.setFullYear(block.blockDate.year);
                date.setMonth(block.blockDate.month);
                date.setDate(0);
                date.setHours(0);
                date.setMinutes(0);
                delete block['blockTime'];
            }
        }
        else if(type == 'date' && this.state.selectedDateStyle != 'date'){
            if(block.blockDate){
                date = new Date();
                block.blockDate['date'] = 1;
                if(isNullOrUndefined(block.blockDate['month'])){
                    block.blockDate['month'] = 0;
                }
                date.setFullYear(block.blockDate.year);
                date.setMonth(block.blockDate.month);
                date.setDate(1);
            }
        }       

        this.setState({
            selectedDateStyle: type,
            date: date,
            newBlock: block
        });
    }

    isDateChecked(type){
        if(type == this.state.selectedDateStyle)
            return true;
        return false;
    }

    handleChange(event, type) {

        var shouldUpdate = true;
        if(type!="date" && type!="time"){
            let newStr = event.target.value;
            if(!Utils.shouldUpdateText(newStr, '\n\t')){
                shouldUpdate=false;
            }
        }

        if(shouldUpdate){
            var block = this.state.newBlock;
            if(type=="title"){
                block.title = event.target.value;
                this.setState({newBlock: block});
            }
            else if(type=="summary"){
                block.summary = event.target.value;
                this.setState({newBlock: block});
            }
            else if(type=="new-entity"){
                this.setState({newEntity: event.target.value});
            }
            else if(type == "date"){
                if(this.state.selectedDateStyle == 'date'){
                    block.blockDate = {
                        date: event.getDate(),
                        month: event.getMonth(),
                        year: event.getFullYear()
                    };    
                }
                else{
                    block.blockDate = {
                        date: null,
                        month: event.month,
                        year: event.year
                    }
                }
                // console.log(block.blockDate);
                this.setState({
                    date: event,
                    newBlock: block
                });
            }
            else if(type == "time"){
                block.blockTime = {
                    minutes: event.minute,
                    hours: event.hour24
                }
                // console.log(block.blockTime);
                this.setState({
                    time: event,
                    newBlock: block
                });
            }

        }
      }

    render(){

        return(
            <div>
                <h4 className="addTimeTitle"> Add timeline event</h4>
                <div style={{marginBottom:'15px'}}>
                    <div>
                        <div className="addTimelineBlockTextContainer">
                            <form>
                                <label>
                                    <TextField 
                                        type="text"
                                        variant="outlined"
                                        multiline
                                        label = "Add title"
                                        value={this.state.newBlock.title}
                                        onChange={(e) => { this.handleChange(e,"title")}}
                                        rowsMax="2"
                                        rowsMin="1"
                                        style={{
                                            background: 'white',
                                            marginTop:'6px',
                                            marginBottom:'6px',
                                            width:'100%'
                                            }}/>
                                    <TextField 
                                    type="text"
                                    variant="outlined"
                                    multiline
                                    label = "Add description"
                                    value={this.state.newBlock.summary}
                                    onChange={(e) => { this.handleChange(e,"summary")}}
                                    rowsMax="13"
                                    rows="3"
                                    style={{
                                        background: 'white',
                                        marginTop:'6px',
                                        marginBottom:'6px',
                                        width:'100%'
                                        }}/>
                                </label>
                            </form>
                        </div>
                        <div>
                            <Checkbox 
                                value={'date'}
                                isChecked={this.isDateChecked('date')}
                                label={'Complete date'}  
                                toggleChange = {this.toggleDateStyle}                              
                                />
                            <Checkbox 
                                value={'month'}
                                isChecked={this.isDateChecked('month')}
                                label={'Only month/year'}
                                toggleChange = {this.toggleDateStyle}
                                />
                        </div>
                        {this.state.selectedDateStyle == 'date'?
                            <div style={{marginTop:'5px'}}>
                                <DatePicker
                                selected={this.state.date}
                                onChange={(date) => {this.handleChange(date,"date")}}
                                />
                            </div>
                            :
                            null
                        }
                        {this.state.selectedDateStyle == 'month'?
                            <div style={{marginTop:'5px'}}>
                                <MonthPicker
                                date={this.state.newBlock.blockDate}
                                onChange = {(date) => {this.handleChange(date,"date")}}
                                />
                            </div>
                            :
                            null
                        }                                                
                    </div>
                    {!isNullOrUndefined(this.state.newBlock.blockDate)?
                        <Button
                            variant="contained" 
                            onClick={() => this.confirmTime()}
                            className="confirmTimeButton"
                            >Confirm</Button>
                            :
                            <p className="timeEntityMessage">*Select a date for the timeline event!</p>
                    }
                </div>
            </div>
        )
    }
}
export default AddTimeView;