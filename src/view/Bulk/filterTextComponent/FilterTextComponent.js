import React, { Component } from 'react';
import Loader from 'react-loader-spinner';
import Textarea from 'react-textarea-autosize';
import * as firebase from 'firebase';
import * as Utils  from '../../../common/utilSvc';
import Checkbox from '../../Draft/Checkbox';
import  "./FilterTextComponent.css";
import { isNullOrUndefined } from 'util';

class FilterTextComponent extends React.Component {

    constructor(props){
        super(props);
        //addText, text

        this.state={
            delimiters: '()',
            loadingText: false,
            oldText: [],
            canUndo: false,
            showPreview: false
        }

       this.handleChange = this.handleChange.bind(this);
       this.filterText = this.filterText.bind(this);
       this.isValidDelimter = this.isValidDelimter.bind(this);
       this.undoOperation = this.undoOperation.bind(this);
       this.toggleDelimiterPreview = this.toggleDelimiterPreview.bind(this);
    }

    handleChange(event, type){
        var shouldUpdate = true;
      
        shouldUpdate =Utils.isValidDelimiter(event.target.value)
        if(shouldUpdate){
            let delimiters = this.state.delimiters;
            if(type=="delimiters"){
                    delimiters = event.target.value;                    
                    this.setState({delimiters: delimiters});
                    this.props.setDelims(delimiters);
                }            
            }  
    }

    toggleDelimiterPreview(){
        let showPreview = !this.state.showPreview;
        this.props.setDelims(this.state.delimiters);
        this.props.togglePreview('delims',showPreview);
        this.setState({
            showPreview: showPreview      
        });
    }

    filterText(){
        let text  = this.props.text;
        let delimiters = this.state.delimiters;
        let oldText = this.state.oldText;
        oldText.push(text);
        this.setState({
            oldText:oldText,
            canUndo: true
        });
        text = Utils.filterTextBasedOnDelimter(text, delimiters[0], delimiters[1], true);
        this.props.addText(text);
    }

    undoOperation(){
        let oldText = this.state.oldText;
        let text = oldText.pop();
        let canUndo = true;
        if(oldText.length == 0)
            canUndo = false;

        this.setState({
            canUndo: canUndo,
            oldText: oldText
        });
        this.props.addText(text);
    }

    isValidDelimter(){
        let delimiters = this.state.delimiters;
        if(isNullOrUndefined(delimiters))
            return false;
        
        if(delimiters.length < 2)
            return false;

        return true;
    }

    render(){
        return (
            <div className="filterTextComponent">                
                <div>
                    <p>Delimiter</p>
                    <form>
                            <label>
                            <Textarea 
                                type="text"
                                value={this.state.delimiters}
                                onChange={(e) => { this.handleChange(e,"delimiters")}}
                                maxRows="1"
                                minRows="1"
                                style={{
                                    background: 'white',
                                    borderWidth:'2px', 
                                    borderStyle:'solid', 
                                    borderColor:'darkgrey',
                                    paddingTop:'6px',
                                    paddingBottom:'6px',
                                    width:'80px'
                                    }}/>                            
                            </label>
                    </form>

                    {this.isValidDelimter()?
                        <div style={{marginTop:'10px', marginBottom:'10px'}}>
                            <Checkbox 
                                value={'showPreview'}
                                isChecked={this.state.showPreview}
                                label={'Preview text with filter'}  
                                toggleChange = {this.toggleDelimiterPreview}                              
                                />
                        </div>
                        :
                        null
                    }

                    <div className="filterTextOptionsContainer">
                        {this.isValidDelimter()?
                            <button
                                className="filterTextDelimiterButton"
                                onClick={this.filterText}>
                                    <div>Filter</div>
                            </button>
                            :
                            false
                        }

                        {this.state.canUndo?
                            <button
                                className="undoFilterTextDelimiterButton"
                                onClick={this.undoOperation}>
                                    <div>Undo</div>
                            </button>
                            :
                            false
                        }
                    </div>
                    

                    {this.state.canUndo?
                    <p className="filterTextUndoOperation">
                        You have filter text based on the delimiters  <span className="filterTextDelimText">{this.state.delimiters}</span>.
                        To undo this action, please click <a className="filterTextUndoAction" onClick={() => this.undoOperation()}>Undo</a>.
                    </p>
                    :
                    null
                    }
                     
                </div>
            </div>
        );
    }
}
export default FilterTextComponent;