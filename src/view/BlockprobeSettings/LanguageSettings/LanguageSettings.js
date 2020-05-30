import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import  MultiSelectReact  from 'multi-select-react';
import Button from '@material-ui/core/Button';
import * as DbUtils from '../../../common/dbSvc';
import * as Const from '../../../common/constants';

import './LanguageSettings.css';
import { isNullOrUndefined } from 'util';

class LanguageSettingsComponent extends React.Component {

    constructor(props){
        super(props);
        //bpId, lang

        this.state = {
            firstLangSelectList: [],
            selectedLang: String(this.props.lang),
            currentLangLabel: null
        }

        this.generateLangLists = this.generateLangLists.bind(this);
        this.canSubmit = this.canSubmit.bind(this);
        this.submitLanguage = this.submitLanguage.bind(this);
    }

    firstLangClicked(entityList) {
        var selectedEntity = null;
        for(var i=0; i<entityList.length; i++){
            if(entityList[i].value){
                selectedEntity = entityList[i].id;    
            }
        }
        this.setState({ 
            firstLangSelectList: entityList, 
            selectedLang: selectedEntity
        });
    }

    firstSelectedBadgeClicked(entityList) {
        var selectedEntity = null;
        for(var i=0; i<entityList.length; i++){
            if(entityList[i].value){
                selectedEntity = entityList[i].id;
            }
        }

        this.setState({ 
            firstLangSelectList: entityList, 
            selectedLang: selectedEntity
        });
    }

    generateLangLists(){
        var count = 1;
        var firstEntityList = this.state.firstLangSelectList;
        let selectedLangLabel = this.state.selectedLangLabel;
        
        for(let i=0; i<Const.langs.length; i++){
            let langSelected =  false;
            if(this.state.selectedLang == Const.langs[i].id){
                langSelected = true;
                selectedLangLabel = Const.langs[i].label;
            }
            firstEntityList.push({                
                value: langSelected, 
                label: Const.langs[i].label,
                id: Const.langs[i].id
            }); 
        }
               
        this.setState({
            firstLangSelectList: firstEntityList,
            currentLangLabel: selectedLangLabel
        });
    }

    componentDidMount(){
        this.generateLangLists();
    }

    canSubmit(){
        if(this.state.selectedLang != this.props.lang && !isNullOrUndefined(this.state.selectedLang))
            return true;
        return false;
    }

    submitLanguage(){
        let firstEntityList = this.state.firstLangSelectList;
        for(let i=0; i<firstEntityList.length; i++){
            if(this.state.selectedLang == firstEntityList[i].id){
                this.setState({
                    currentLangLabel: firstEntityList[i].label
                });
                break;
            }
        }
        DbUtils.setLanguage(this.props.bpId, this.state.selectedLang);
    }

    render(){

        const selectedOptionsStyles = {
            color: "white",
            backgroundColor: "rgb(117, 106, 214)",
            borderRadius:"20px",
            fontSize:'0.6em',
            padding:'10px',
            maxWidth: '92%',
            wordWrap: 'break-word'
        };
        const optionsListStyles = {
            backgroundColor: "darkcyan",
            color: "white",

        };

        return (
            <div>
                <div style={{marginLeft:'10px', marginTop:'1em'}}>
                    <h3>Language settings</h3>
                    {!isNullOrUndefined(this.state.currentLangLabel)?
                        <p>Current language: {this.state.currentLangLabel}</p>
                        :
                        null
                    }                    
                    <div className='langpane-filter-container'>                
                        <div className="langpane-dropdown-container">
                            <MultiSelectReact 
                            options={this.state.firstLangSelectList}
                            optionClicked={this.firstLangClicked.bind(this)}
                            selectedBadgeClicked={this.firstSelectedBadgeClicked.bind(this)}
                            selectedOptionsStyles={selectedOptionsStyles}
                            optionsListStyles={optionsListStyles} 
                            isSingleSelect={true}
                            isTextWrap={false} 
                            />
                            
                        </div>     

                        {this.canSubmit()?
                            <Button
                            variant="contained" 
                            color="primary" 
                            className="langPaneButton" onClick={this.submitLanguage}>
                                Save
                            </Button>
                            :
                            null
                        }
                                    
                    </div>
                </div>
            </div>
        )
    }
}
export default LanguageSettingsComponent;
