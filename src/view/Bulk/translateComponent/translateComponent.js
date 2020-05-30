import React, { Component } from 'react';
import Loader from 'react-loader-spinner';
import Textarea from 'react-textarea-autosize';
import * as firebase from 'firebase';
import * as Utils  from '../../../common/utilSvc';
import Checkbox from '../../Draft/Checkbox';
import  MultiSelectReact  from 'multi-select-react';
import * as Const from '../../../common/constants';
import  "./translateComponent.css";
import { isNullOrUndefined } from 'util';

class TranslateTextComponent extends React.Component {

    constructor(props){
        super(props);
        //text, translatedText

        this.state = {
            firstLangSelectList: [],
            selectedLang: String(this.props.lang),
            currentLangLabel: null,
            oldTexts: []
        }

        this.functions = firebase.functions();

        this.generateLangLists = this.generateLangLists.bind(this);
        this.canSubmit = this.canSubmit.bind(this);
        this.canPreview = this.canPreview.bind(this);
        this.canUndo = this.canUndo.bind(this);
        this.translateText = this.translateText.bind(this);
        this.previewText = this.previewText.bind(this);
        this.submitText = this.submitText.bind(this);
        this.undoAction = this.undoAction.bind(this);
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

    canPreview(){
        if(!isNullOrUndefined(this.state.selectedLang))
            return true;
        return false;
    }

    canSubmit(){
        if(!isNullOrUndefined(this.props.translatedText) && this.props.translatedText.length>0)
            return true;
        return false;
    }

    canUndo(){
        if(this.state.oldTexts.length>0)
            return true;
        return false;
    }

    async previewText(){
        let target = this.state.selectedLang;
        let text = this.props.text;
        let translatedText = await this.translateText(text,target);
        await this.props.setTranslatedText(translatedText);
    }

    async submitText(){
        await this.previewText();
        let text = this.props.translatedText;
        let currText = JSON.parse(JSON.stringify(this.props.text));
        let oldTexts = this.state.oldTexts;
        oldTexts.push(currText);
        this.setState({
            oldTexts: oldTexts
        });
        this.props.updateText(text);
    }

    undoAction(){
        let oldTexts = this.state.oldTexts;
        let oldText = oldTexts.pop();
        this.setState({
            oldTexts: oldTexts
        });
        this.props.updateText(oldText);
    }
    
    async translateText(text,target){
        var translateFunc = this.functions.httpsCallable('translateText');
        var result = {};
        try{
            result = await translateFunc({text: text, target: target});
        }
        catch(e){
            result = {
                data: []
            };
        }
        finally{
        }
        // console.log(result);
        let translatedText = "";
        for(let i=0; i<result.data.length; i++){
            translatedText += (result.data[i] + ' ');
        }
        return translatedText;
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

        return(
            <div className="translateTextContainer">
                <div className='translatepane-filter-container'>                
                    <div className="translatepane-dropdown-container">
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

                    {this.canPreview()?
                        <button className="translatePaneButton" onClick={this.previewText}>Preview</button>
                        :
                        null
                    }

                    {this.canSubmit()?
                        <button className="submitPaneButton" onClick={this.submitText}>Submit</button>
                        :
                        null
                    }

                    {this.canUndo()?
                        <button className="undoPaneButton" onClick={this.undoAction}>Undo</button>
                        :
                        null
                    }
                                
                </div>
            </div>
        )
    }
}
export default TranslateTextComponent;