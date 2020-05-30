import React, { Component } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import DeleteIcon from '@material-ui/icons/Delete';
import DoneIcon from '@material-ui/icons/Done'
import Textarea from 'react-textarea-autosize';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Loader from 'react-loader-spinner';
import ImageUploader from 'react-images-upload';
import imageCompression from 'browser-image-compression';
import * as firebase from 'firebase';
import 'firebase/firestore';
import Img from 'react-image';
import * as Utils from '../../common/utilSvc';
import './DraftBlockNumberView.css';
import { isNullOrUndefined } from 'util';

class DraftBlockNumberView extends React.Component {

    constructor(props){
        super(props);
        //isClicked, index, number, updateNumber

        this.state={
            isClicked: JSON.parse(JSON.stringify(this.props.isClicked)),
            newNumber: JSON.parse(JSON.stringify(this.props.number))
        }

        this.renderViewOnlyNumber = this.renderViewOnlyNumber.bind(this);
        this.getNumberDraft = this.getNumberDraft.bind(this);
        this.handleChange = this.handleChange.bind(this);

        this.clickNumberNotInDraft = this.clickNumberNotInDraft.bind(this);
        this.cancelNumber = this.cancelNumber.bind(this);
        this.removeNumber = this.removeNumber.bind(this);
        this.updateNumber = this.updateNumber.bind(this);
    }

    renderViewOnlyNumber(){
        return(
            <div className="draftBlockNumberViewDiv">
                <span className="draftBlockNumberViewContainer" onClick={this.clickNumberNotInDraft}>
                    <span className="draftBlockNumberViewKey">{this.props.number.key}:   </span>
                    <b className="draftBlockNumberViewValue">{this.props.number.value}</b>
                </span>
            </div>
        )
    }

    handleChange(event, type) {
        var shouldUpdate = true;
        
        //TODO Handle change here too!
        let str = event.target.value;
        if(!Utils.shouldUpdateText(str, ['\n','\t'])){
            shouldUpdate = false;
        }
        if(shouldUpdate && type == 'number' && !Utils.isNumber(str)){
            shouldUpdate = false;
        }
        if(shouldUpdate){
            var number = this.state.newNumber;
            if(type=="key"){
                number.key = event.target.value;
                this.setState({newNumber: number});
            }
            else if(type=="number"){
                number.value = event.target.value;
                this.setState({newNumber: number});
            }
        }
      }

    clickNumberNotInDraft(){
        this.setState({
            isClicked: true,
            newNumber: JSON.parse(JSON.stringify(this.props.number))
        });
    }

    cancelNumber(){
        if(!isNullOrUndefined(this.props.number) && this.props.number.key == null){
            this.removeNumber();
        }
        else{
            this.setState({
                isClicked: false
            });    
        }
    }

    async removeNumber(){
        // console.log(this.state.newEvidence);
        // console.log(this.props.evidence);
        this.props.updateNumber(this.props.number, null, false, true, this.props.index);
        this.setState({
            isClicked: false
        });
    }

    async updateNumber(){
        let newNumber = this.state.newNumber;
        newNumber.value = parseFloat(newNumber.value);
        if(isNaN(newNumber.value))
            newNumber.value = 0;        
        newNumber.key = Utils.makeFirstLetterUppercase(newNumber.key);
        if(newNumber.key.length == 0)
            newNumber.key = 'Unknown key';
        this.props.updateNumber(this.props.number, this.state.newNumber, true, false, this.props.index);
        this.setState({
            isClicked: false,
            newNumber: newNumber
        });
    }

    getNumberDraft(){
        return(
            <div>           
                <div class='draft-number-edit-container'>
                    <form className="draft-number-key-edit">
                        <label>
                                <Textarea 
                                type="text"
                                placeholder="Key"
                                value={this.state.newNumber.key}
                                onChange={(e) => { this.handleChange(e,"key")}}
                                minRows="1"
                                style={{
                                    background: 'white',
                                    borderWidth:'2px', 
                                    borderStyle:'solid', 
                                    borderColor:'darkgrey',
                                    paddingTop:'6px',
                                    paddingBottom:'6px',
                                    width:'100%'
                                    }}/>    
                        </label>
                    </form>
                    <form className="draft-number-value-edit">
                        <label>
                                <Textarea 
                                type="text"
                                placeholder="Number"
                                value={this.state.newNumber.value}
                                onChange={(e) => { this.handleChange(e,"number")}}
                                minRows="1"
                                style={{
                                    background: 'white',
                                    borderWidth:'2px', 
                                    borderStyle:'solid', 
                                    borderColor:'darkgrey',
                                    paddingTop:'6px',
                                    paddingBottom:'6px',
                                    width:'100%'
                                    }}/>    
                        </label>
                    </form>
                </div>

                <div className='draft-number-button-container'>
                    <button
                    className="updateNumberButton"
                    onClick={this.updateNumber}>
                        <div>Confirm</div>
                    </button>
                    <button
                    className="removeNumberButton"
                    onClick={this.removeNumber}>
                        <div>Remove</div>
                    </button>
                    <button
                    className="removeNumberButton"
                    onClick={this.cancelNumber}>
                        <div>Cancel</div>
                    </button>
                </div>
            </div>
        );
    }

    render(){
        return(
            <div>
                {this.state.isClicked?
                    <div>
                        {this.getNumberDraft()}
                    </div>
                    :
                    <div>
                        {this.renderViewOnlyNumber()}
                    </div>
                }
            </div>
        )
    }
}
export default DraftBlockNumberView;