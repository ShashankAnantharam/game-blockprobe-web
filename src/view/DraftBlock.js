import React, { Component } from 'react';
import * as firebase from 'firebase';
import './DraftBlock.css';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Textarea from 'react-textarea-autosize';
import TextField from '@material-ui/core/TextField';
import  MultiSelectReact  from 'multi-select-react';
import DraftBlockEvidenceView from './Draft/DraftBlockEvidenceView';
import DraftBlockNumberView from './Draft/DraftBlockNumberView';
import Checkbox from './Draft/Checkbox';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';
import { isNullOrUndefined } from 'util';
import DatePicker from "react-datepicker";
import MonthPicker from './Draft/MonthPicker/MonthPicker';
import Timekeeper from 'react-timekeeper';
import Paper from '@material-ui/core/Paper';
import * as Utils from '../common/utilSvc';
import moment from 'moment';
import Joyride,{ ACTIONS, EVENTS, STATUS } from 'react-joyride';
import Info from '@material-ui/icons/Info';
import "react-datepicker/dist/react-datepicker.css";

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  });

class DraftBlockComponent extends React.Component {

    selectedOptionsStyles = {
        color: "white",
        backgroundColor: "rgb(117, 106, 214)",
        borderRadius:"20px",
        fontSize:'0.6em',
        padding:'5px',
        maxWidth: '92%',
        wordWrap: 'break-word'
    };
    optionsListStyles = {
        backgroundColor: "darkcyan",
        color: "white",

    };

    DAY = 24*60*60*1000;

    constructor(props){
        super(props);

        //props:draftBlock, bpId, uId, entityPane, draftBlockTooltip, finishTooltip, bpDetails
        this.state={
            newBlock: {},
            canSubmit: false,
            newEntity: '',
            multiSelectEntityList: [],
            addDate: false,
            addTime: false,
            deleteDraftBlockDialog: false,
            commitDraftBlockDialog: false,
            dialogType: null,
            dialogText:{
                delete:{
                    title: "Delete block",
                    desc: "You are about to delete this block. This action cannot be reversed.\nDo you confirm?"
                },
                commit:{
                    title: "Add block to story",
                    desc: "You are about to add this block to the story.\nDo you confirm?"
                },
                selected:{
                    title: null,
                    desc: null
                }
            },
            date: new Date(),
            time: undefined,
            selectedDateStyle: 'date',
            showTooltip:{
                draftBlockTour: JSON.parse(JSON.stringify(props.draftBlockTooltip))
            },
            tooltipText:{
                draftBlockTour:[
                    {                    
                        title: 'Edit your block!',
                        target: '.addDateTimeButton',
                        content: 'You can now edit each aspect of your block here. Click on the blue info icons to learn more about the various aspects of your block such as date-time, entities and evidences.',
                        disableBeacon: true,
                        placement: 'center'
                    },
                    {                    
                        title: 'Add block to your story after editing!',
                        target: '.commitBlockTooltip',
                        content: 'After editing, click this button to add to story!',
                        disableBeacon: true,
                        placementBeacon: 'left',
                        event: 'hover'
                    }
                ]
            },
            adhocTooltip:{
                datetime:{
                    flag: false,
                    text: [
                        {
                            title: 'Add date and time',
                            target: '.tooltipDatetime',
                            content: 'If the content of your block describes some event (someones birth, the creation of a company, a terrorist attack, etc.) that is associated with some date and time, then add that to the block. This enables your block to appear in the Timeline visualisation that shows the chronological view of your story.',
                            disableBeacon: true
                        }
                    ]
                },
                entities:{
                    flag: false,
                    text: [
                        {
                            title: 'Tag entities/characters!',
                            target: '.tooltipEntities',
                            content: 'Your block will be associated with some characters of the entire story. You can tag those characters (or entities) here. Typically, some entities are autodetected in the text and tagged when you create the block. The entities from these tags appear in the Graph visualisation of your story that show how your story\'s characters are connected with one-another. Your block will also show up in the Graph visualisation if the viewer clicks on the entities that are tagged.',
                            disableBeacon: true
                        }
                    ]
                },
                evidences:{
                    flag: false,
                    text: [
                        {
                            title: 'Add evidences!',
                            target: '.tooltipEvidences',
                            content: 'You may want to add authenticity to your block\'s content by adding evidences that is visible to any viewer. You have to provide a link to the actual evidence that viewers of the story can click and navigate to. If your evidence is a picture (a chart), then add the link of the picture here so that the viewers of the story can see it when they click on your block.',
                            disableBeacon: true
                        }
                    ]
                },
                numbers:{
                    flag: false,
                    text: [
                        {
                            title: 'Add relevant numbers!',
                            target: '.tooltipNumbers',
                            content: 'You may have some numbers, like money, headcount, etc., that you want to associate with this block.',
                            disableBeacon: true
                        }
                    ]
                }
            }
        }//

        this.handleChange = this.handleChange.bind(this);
        this.changeDateStatus = this.changeDateStatus.bind(this);
        this.changeTimeStatus = this.changeTimeStatus.bind(this);
        this.renderDate = this.renderDate.bind(this);
        this.renderTime = this.renderTime.bind(this);
        this.renderTimeOption = this.renderTimeOption.bind(this);
        this.generateMultiSelectEntityList = this.generateMultiSelectEntityList.bind(this);
        this.makeEntityUppercase = this.makeEntityUppercase.bind(this);
        this.addEntityToList = this.addEntityToList.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.updateEvidence = this.updateEvidence.bind(this);
        this.updateNumber = this.updateNumber.bind(this);
        this.addEvidence = this.addEvidence.bind(this);
        this.addNumber = this.addNumber.bind(this);
        this.singleBlockEvidence = this.singleBlockEvidence.bind(this);
        this.singleBlockNumber = this.singleBlockNumber.bind(this);
        this.commitDraftBlock = this.commitDraftBlock.bind(this);
        this.saveDraftBlock = this.saveDraftBlock.bind(this);
        this.submitDraftBlock = this.submitDraftBlock.bind(this);
        this.cancelDraftBlock = this.cancelDraftBlock.bind(this);
        this.removeDraftBlock = this.removeDraftBlock.bind(this);
        this.populateEntitiesAndEvidencesToBlock = this.populateEntitiesAndEvidencesToBlock.bind(this);
        this.showLocalTooltip = this.showLocalTooltip.bind(this);
        this.handleAdhocTooltipJoyrideCallback = this.handleAdhocTooltipJoyrideCallback.bind(this);
        this.isDateChecked = this.isDateChecked.bind(this);
        this.toggleDateStyle = this.toggleDateStyle.bind(this);
        this.toggleDeleteBlockDialog = this.toggleDeleteBlockDialog.bind(this);
        this.performAction = this.performAction.bind(this);
    }    

    changeDateStatus(){
        var addDate = this.state.addDate;
        var block = this.state.newBlock;
        var ts = new Date();

        if(!addDate){
            //Add date
            block.blockDate = {
                date: ts.getDate(),
                month: ts.getMonth(),
                year: ts.getFullYear()
            }
        }
        else{
            //Remove date
            delete block["blockDate"];
        }
        this.setState({
            addDate: !addDate,
            newBlock: block,
            date: ts
        });
    }

    changeTimeStatus(){
        var addTime = this.state.addTime;
        var block = this.state.newBlock
        var currDate = new Date();
        var ts = {
            hour:currDate.getHours(),
            minute: currDate.getMinutes()
        };

        if(!(addTime)){
            //Set to true, add time
            block.blockTime={
                hours: ts.hour,
                minutes: ts.minute,
                time: ts
            }
        }
        else{
            //Delete blockTime
            delete block["blockTime"];
        }
        this.setState({
            addTime: !addTime,
            newBlock: block,
            time: ts
        });
    }

    entityClicked(entityList) {
        this.setState({ multiSelectEntityList: entityList });
    }

    selectedBadgeClicked(entityList) {
        this.setState({ multiSelectEntityList: entityList });
    }

    generateMultiSelectEntityList(){
        var count = 1;
        var entityList = this.state.multiSelectEntityList;
        var oldEntities = this.props.draftBlock.entities;
        var oldEntitiesDict = {};
        var consideredEntitiesDict = {};
        

        for(var i=0;i<oldEntities.length;i++){
            entityList.push({
                value: true,
                label: oldEntities[i].title,
                id: count
            });
            count++;
            consideredEntitiesDict[oldEntities[i].title] = "";
            oldEntitiesDict[oldEntities[i].title]="";
        }

        //Enter investigation graph entities that are not selected
        Object.keys(this.props.investigationGraph).forEach(function(entityKey) {           
            if(!(entityKey in oldEntitiesDict)){
                entityList.push({
                    value: false,
                    label: entityKey,
                    id: count
                });
                count++;
                consideredEntitiesDict[entityKey] = "";           
            }
        });

        //Get from Entity pane extra entities not added
        var entityPane = this.props.entityPane;
        // console.log(entityPane);
        for(var i=0; i<entityPane.length; i++){
            var val = false;
            var entityLabel = entityPane[i].label;
            if(entityLabel in oldEntitiesDict){
                val = true;
            }
            if(!(entityLabel in consideredEntitiesDict)){
                entityList.push({                
                        value: val, 
                        label: entityLabel, 
                        id: count             
                });
                count++;
            }
        }

        entityList.sort(function(a,b){
            if(a.label.toLocaleLowerCase() < b.label.toLocaleLowerCase())
                return -1;
            return 1;
        });
        this.setState({
            multiSelectEntityList: entityList
        });        
    }

    handleKeyDown(event){
        if (event.key === 'Enter') {
            var totalStr= event.target.value;
            var entityArr = totalStr.split(',');
            for(var i=0; i<entityArr.length; i++){
                var str = entityArr[i].trim();
                if(str.length > 0)
                    this.addEntityToList(str);
            }
            str = '';
            this.setState({newEntity: str});                
          }
    }

    makeEntityUppercase(value){
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(); 
    }  

    addEntityToList(entityLabel){
        entityLabel = this.makeEntityUppercase(entityLabel);
        var isEntityAlreadyPresent = false;
        var entityList = this.state.multiSelectEntityList;
        var block = this.state.newBlock;
        let entityListIndex = -1;
        for( var i=0; i<entityList.length; i++){
            var entityItem = entityList[i]
            if(entityItem.label == entityLabel){
                isEntityAlreadyPresent=true;
                entityListIndex = i;
                break;
            }
        }
        if(!isEntityAlreadyPresent && entityLabel.toLowerCase()!='all' && entityLabel.toLowerCase()!='none'){
            var count = entityList.length;
            count = count + 1;
            entityList.push({                
                value: true, 
                label: entityLabel, 
                id: count             
            });
            if(isNullOrUndefined(block.entities)){
                block.entities=[];
            }
            block.entities.push({
                title:entityLabel
            });
            // console.log(block);
            this.setState({
                multiSelectEntityList: entityList,
                newBlock: block,
                newEntity: ''
            });
        }
        else if(isEntityAlreadyPresent && entityLabel.toLowerCase()!='all' && entityLabel.toLowerCase()!='none'){
                            
            entityList[entityListIndex].value = true;
            if(isNullOrUndefined(block.entities)){
                block.entities=[];
            }
            block.entities.push({
                title:entityList[entityListIndex].label
            });
            this.setState({
                multiSelectEntityList: entityList,
                newBlock: block,
                newEntity: ''
            });                                                      
        }       
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

    updateEvidence(oldEvidence, newEvidence, isUpdate, isDelete, index){
          var block = this.state.newBlock;

          if(isNullOrUndefined(block.evidences)){
              block.evidences=[];
          }
          if(isDelete){
              
                let newEv = [];
                for(let i=0;i<block.evidences.length;i++){
                    if(i != index){
                        newEv.push(block.evidences[i]);
                    }
                }
                block.evidences = newEv;                
          }
          else if(isUpdate){            
            block.evidences[index] = newEvidence;
        }

        this.setState({newBlock: block});
      }

    updateNumber(oldNumber, newNumber, isUpdate, isDelete, index){
        var block = this.state.newBlock;

        if(isNullOrUndefined(block.numbers)){
            block.numbers=[];
        }
        if(isDelete){
            
              let newNum = [];
              for(let i=0;i<block.numbers.length;i++){
                  if(i != index){
                      newNum.push(block.numbers[i]);
                  }
              }
              block.numbers = newNum;                
        }
        else if(isUpdate){            
          block.numbers[index] = newNumber;
      }

      block.numbers = Utils.coalesceNumbers(block.numbers);

      this.setState({newBlock: block});
    }

    addEvidence(){
        var block = this.state.newBlock;
        var newEvidence={
            evidenceLink:'',
            evidenceType:'',
            supportingDetails:''
        }

        if(isNullOrUndefined(block.evidences))
            block.evidences = [];
        block.evidences.push(newEvidence);
        this.setState({newBlock: block});
      }

    addNumber(){
        var block = this.state.newBlock;
        var newNumber={
            key: null,
            value: 0
        }

        if(isNullOrUndefined(block.numbers))
            block.numbers = [];
        block.numbers.push(newNumber);
        this.setState({newBlock: block});
    }

    singleBlockEvidence(blockEvidence, index){
        var isClicked = (blockEvidence.supportingDetails =='' && blockEvidence.evidenceLink == '');
        return(
                <DraftBlockEvidenceView
                    isClicked={isClicked}
                    evidence={blockEvidence}
                    updateEvidence = {this.updateEvidence}
                    index = {index} 
                    bId = {this.props.bId}
                    uIdHash = {this.props.uIdHash}
                />
        );
    }

    singleBlockNumber(blockNumber, index){
        var isClicked = (isNullOrUndefined(blockNumber.key));
        return (
            <DraftBlockNumberView
                isClicked={isClicked}
                index = {index}
                number = {blockNumber}
                updateNumber = {this.updateNumber}
            />
        );
    }

    populateEntitiesAndEvidencesToBlock(){
        var block = this.state.newBlock;
        block.entities = [];
        var list = this.state.multiSelectEntityList;
        for(var i=0; i<list.length; i++){
            if(list[i].value){
                block.entities.push({
                    title: list[i].label,
                    type:"None"
                });
            }
        }  

        if(isNullOrUndefined(block.evidences)){
            block.evidences=[];
        }
        
        this.setState({
            newBlock: block
        });
    }

    saveDraftBlock(){
        this.populateEntitiesAndEvidencesToBlock();
        this.props.updateBlock(this.state.newBlock, this.props.draftBlock,'SAVE');
    }

    commitDraftBlock(){
        this.populateEntitiesAndEvidencesToBlock();
        this.props.updateBlock(this.state.newBlock, this.props.draftBlock,'COMMIT');
    }

    submitDraftBlock(){
        this.populateEntitiesAndEvidencesToBlock();
        this.props.updateBlock(this.state.newBlock, this.props.draftBlock,'SUBMIT');
    }

    cancelDraftBlock(){
        // console.log(this.state.newBlock);
        // console.log(this.props.draftBlock);
        this.props.updateBlock(this.state.newBlock, this.props.draftBlock,'CANCEL');
    }

    removeDraftBlock(){
        this.props.updateBlock(this.state.newBlock, this.props.draftBlock,'DELETE');
    }

    isDateChecked(type){
        if(type == this.state.selectedDateStyle)
            return true;
        return false;
    }

    toggleDateStyle(type){
        let block = this.state.newBlock;
        let date = this.state.date;
        let addTime = this.state.addTime;
        if(type == 'month' && this.state.selectedDateStyle != 'month'){
            if(block.blockDate){
                block.blockDate['date'] = null;
                date.setFullYear(block.blockDate.year);
                date.setMonth(block.blockDate.month);
                date.setDate(0);
                date.setHours(0);
                date.setMinutes(0);
                delete block['blockTime'];
                addTime = false;                
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
            newBlock: block,
            addTime: addTime
        });
    }

    renderDate(){
        return (
            <div style={{marginBottom:'15px'}}>
                {this.state.addDate?
                    <div>
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
                    :
                    null
                }
            </div>
        );
    }

    renderTime(){
        return (
            <div>
                {this.state.addTime?
                    <div>
                        <Timekeeper
                            time={this.state.time}
                            onChange={(e)=> this.handleChange(e,"time")}
                            // ...
                        />
                    </div>
                    :
                    null
                }
            </div>
        )
    }

    renderTimeOption(){
        return (
                    <div style={{marginTop:'5px', marginBottom:'5px'}}>
                        <span style={{fontSize:'0.8em', fontWeight:'bold', marginRight: '1em'}}> Time: </span>
                        <Button
                            variant="contained"  
                            className="addDateTimeButton" 
                            onClick={this.changeTimeStatus}>
                            {!this.state.addTime?
                            <div>Add time</div>
                            :
                            <div>Remove time</div>
                            }
                        </Button>
                        {this.renderTime()}  
                    </div>
        );
    }

    showLocalTooltip(type){
        var adhocTooltip = this.state.adhocTooltip;
       if(type=='datetime'){
           adhocTooltip.datetime.flag = true;
       }
       else if(type=='entities'){
           adhocTooltip.entities.flag = true;
       }
       else if(type == 'evidences'){
           adhocTooltip.evidences.flag = true;
       }
       else if(type == 'numbers'){
            adhocTooltip.numbers.flag = true;
       }
       this.setState({adhocTooltip: adhocTooltip});
    }

    handleAdhocTooltipJoyrideCallback(data, tooltipType){
       const {action,index,status,type} = data;
       if([STATUS.FINISHED, STATUS.SKIPPED].includes(status)){
           var adhocTooltip = this.state.adhocTooltip;
           if(tooltipType=='datetime'){
               adhocTooltip.datetime.flag = false;
           }
           else if(tooltipType=='entities'){
               adhocTooltip.entities.flag = false;
           }
           else if(tooltipType == 'evidences'){
               adhocTooltip.evidences.flag = false;
           }
           else if(tooltipType == 'numbers'){
                adhocTooltip.numbers.flag = false;
            }
           this.setState({adhocTooltip: adhocTooltip});
       }
   }
      
    EditSingleBlock(listItem, index){

        var renderEvidenceList = "";
        if(!isNullOrUndefined(this.state.newBlock.evidences)){
            // console.log(this.state.newBlock.evidences);
            renderEvidenceList = this.state.newBlock.evidences.map((blockEvidence, index) => 
                this.singleBlockEvidence(blockEvidence, index)
            );            
        }

        var renderNumberList = "";
        if(!isNullOrUndefined(this.state.newBlock.numbers)){
            // console.log(this.state.newBlock.numbers);
            renderNumberList = this.state.newBlock.numbers.map((blockNumber, index) => 
                this.singleBlockNumber(blockNumber, index)
            );            
        }

        let actionType = '';
        if(this.state.newBlock.actionType)
            actionType = this.state.newBlock.actionType;

        return(

            <div className = {'draft-block-container ' + 
            (actionType =='MODIFY'? 'draft-block-color-MODIFY' : '') + 
            (actionType =='ADD'? 'draft-block-color-ADD' : '')}>
                {this.state.newBlock.actionType =='MODIFY'?
                    <div className='draftBlocksPaneTitle'>Modify block</div>
                    :
                    <div className='draftBlocksPaneTitle'>Edit block</div>
                }   
                
                {this.props.bpDetails.criterion == 0?
                                    <div>
                                        <p className="openTooltipTextContainer">
                                                Click on <a className='tooltip-selection' onClick={() => this.toggleDeleteBlockDialog(true,'commit')}>Add to story</a> to add your block to the story. <br/><br/>
                                        </p>
                                    </div>
                                    :
                                    null
                }       
                <div className="draft-options-container" style={{marginTop:'0.1em'}}>
                {this.props.bpDetails.criterion == 0?
                                    <div>
                                        <Button 
                                            variant="contained"
                                            className="commitBlockButton commitBlockTooltip" 
                                            onClick={() => this.toggleDeleteBlockDialog(true,'commit')}>
                                                <div className="buttonDraftGeneral">Add to story</div>
                                        </Button>
                                    </div>
                                    :
                                    null
                    }
                    <div>
                        <Button 
                            variant="contained"
                            className="saveBlockButton" 
                            onClick={this.saveDraftBlock}>
                                <div className="buttonDraftGeneral">Save as Draft</div>
                        </Button>
                    </div>
                    {this.state.canSubmit?
                        <div>
                            <Button
                                variant="contained" 
                                className="submitBlockButton" 
                                onClick={this.submitDraftBlock}>
                                    <div className="buttonDraftGeneral">Submit</div>
                            </Button>
                        </div>
                        :
                        null
                    }
                    <div>
                        <Button
                            variant="contained" 
                            className="cancelBlockBackButton" 
                            onClick={this.cancelDraftBlock}>
                                <div className="buttonDraftGeneral">Cancel</div>
                        </Button>
                    </div>
                    <div>
                        <Button 
                            variant="contained"
                            className="deleteBlockButton" 
                            onClick={() => this.toggleDeleteBlockDialog(true,'delete')}>
                                <div className="buttonDraftGeneral">Delete</div>
                        </Button>
                    </div>    
                </div>                    
                <form>
                <label>
                    <TextField 
                        type="text"
                        variant="outlined"
                        multiline
                        placeholder = "Title of your contribution."
                        value={this.state.newBlock.title}
                        onChange={(e) => { this.handleChange(e,"title")}}
                        rowsMax="2"
                        rowsMin="1"
                        style={{
                            background: 'white',
                            marginTop:'6px',
                            marginBottom:'6px',
                            width:'95%'
                            }}/>
                    <TextField 
                    type="text"
                    variant="outlined"
                    multiline
                    placeholder = "Content of your contribution."
                    value={this.state.newBlock.summary}
                    onChange={(e) => { this.handleChange(e,"summary")}}
                    rowsMax="13"
                    rows="3"
                    style={{
                        background: 'white',
                        marginTop:'6px',
                        marginBottom:'6px',
                        width:'95%'
                        }}/>
                </label>
                </form>

                <div className="draft-box-datetime-container"> 
                    <h6 style={{marginBottom:'3px', fontSize:'19px'}}>
                        Add relevant date/time
                        <a className='tooltipDatetime tooltips-draft' 
                        onClick={(e)=>{this.showLocalTooltip('datetime')}}>
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
                                    steps={this.state.adhocTooltip.datetime.text}
                                    run = {this.state.adhocTooltip.datetime.flag}
                                    callback={(data)=>{this.handleAdhocTooltipJoyrideCallback(data,'datetime')}}                    
                                    />
                    </h6>
                    <div style={{marginTop:'5px', marginBottom:'5px'}}>
                        <span style={{fontSize:'0.8em', fontWeight:'bold', marginRight: '1em'}}> Date: </span>
                        <Button
                            variant="contained" 
                            className="addDateTimeButton" 
                            onClick={this.changeDateStatus}>
                            {!this.state.addDate?
                            <div>Add Date</div>
                            :
                            <div>Remove date</div>
                            }
                        </Button>
                        {this.renderDate()}  
                    </div>
                    {this.state.addDate && this.state.selectedDateStyle == 'date'?
                        this.renderTimeOption()
                        :
                        null}
                                       
                </div>

                <div className="draft-box-entity-dropdown-container">
                    <h6 style={{marginBottom:'3px', fontSize:'19px'}}>
                        Tag entities/characters
                        <a className='tooltipEntities tooltips-draft' 
                            onClick={(e)=>{this.showLocalTooltip('entities')}}>
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
                                    steps={this.state.adhocTooltip.entities.text}
                                    run = {this.state.adhocTooltip.entities.flag}
                                    callback={(data)=>{this.handleAdhocTooltipJoyrideCallback(data,'entities')}}                    
                                    />
                    </h6>
                    <MultiSelectReact 
                        options={this.state.multiSelectEntityList}
                        optionClicked={this.entityClicked.bind(this)}
                        selectedBadgeClicked={this.selectedBadgeClicked.bind(this)}
                        selectedOptionsStyles={this.selectedOptionsStyles}
                        optionsListStyles={this.optionsListStyles} 
                        isTextWrap={false} 
                        />
                    <div className="draft-add-new-entity-container">
                        <TextField 
                                type="text"
                                variant="outlined"
                                multiline
                                value={this.state.newEntity}
                                onChange={(e) => { this.handleChange(e,"new-entity")}}
                                onKeyDown={(e) => { this.handleKeyDown(e)}}
                                placeholder = "Type entity tags seperated by commas and press 'Enter'"
                                rowsMax="2"
                                rows="1"
                                style={{
                                    background: 'white',
                                    marginTop:'6px',
                                    marginBottom:'6px',
                                    minWidth:'60%',
                                    maxWidth: '90%'
                                    }}/>                                   
                    </div> 
                    <div>
                        <p style={{fontSize:'12px'}}>
                            Type entity tags seperated by commas (eg: Black Widow,Thor,Ironman) and press 'Enter'
                        </p>
                    </div>      
                </div>

                <div className="draft-box-evidence-container">
                    <h6 style={{marginBottom:'3px',marginTop:'3px', fontSize:'19px'}}>
                        Add evidences
                        <a className='tooltipEvidences tooltips-draft' 
                            onClick={(e)=>{this.showLocalTooltip('evidences')}}>
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
                                    steps={this.state.adhocTooltip.evidences.text}
                                    run = {this.state.adhocTooltip.evidences.flag}
                                    callback={(data)=>{this.handleAdhocTooltipJoyrideCallback(data,'evidences')}}                    
                                    />
                    </h6>                    
                    <Button 
                        variant="contained"
                        className="addEvidenceButton" 
                        onClick={this.addEvidence}
                        >                    
                            <div>Add new evidence</div>
                        </Button>  
                    <div>
                        {renderEvidenceList}
                    </div> 
                </div>
                <div className="draft-box-number-container">
                    <h6 style={{marginBottom:'3px',marginTop:'3px', fontSize:'19px'}}>
                        Add relevant numbers
                        <a className='tooltipNumbers tooltips-draft' 
                            onClick={(e)=>{this.showLocalTooltip('numbers')}}>
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
                                    steps={this.state.adhocTooltip.numbers.text}
                                    run = {this.state.adhocTooltip.numbers.flag}
                                    callback={(data)=>{this.handleAdhocTooltipJoyrideCallback(data,'numbers')}}                    
                                    />                     
                    </h6>                    
                        <Button 
                        variant="contained"
                        className="addNumberButton" 
                        onClick={this.addNumber}
                        >                    
                            <div>Add new number</div>
                        </Button>  
                    <div>
                        {renderNumberList}
                    </div> 

                    
                </div>
                <div className="draft-options-container" style={{marginTop:'0.1em'}}>
                {this.props.bpDetails.criterion == 0?
                                    <Button 
                                        variant="contained"
                                        className="commitBlockButton" 
                                        onClick={() => this.toggleDeleteBlockDialog(true,'commit')}>
                                            <div className="buttonDraftGeneral">Add to story</div>
                                    </Button>
                                    :
                                    null
                    }
                    <Button 
                        variant="contained"
                        className="saveBlockButton" 
                        onClick={this.saveDraftBlock}>
                            <div className="buttonDraftGeneral">Save as Draft</div>
                    </Button>
                    {this.state.canSubmit?
                        <Button 
                            variant="contained"
                            className="submitBlockButton" 
                            onClick={this.submitDraftBlock}>
                                <div className="buttonDraftGeneral">Submit</div>
                        </Button>
                        :
                        null
                    }
                    <Button
                        variant="contained" 
                        className="cancelBlockBackButton" 
                        onClick={this.cancelDraftBlock}>
                            <div className="buttonDraftGeneral">Cancel</div>
                    </Button>
                    <Button
                        variant="contained"  
                        className="deleteBlockButton" 
                        onClick={() => this.toggleDeleteBlockDialog(true,'delete')}>
                            <div className="buttonDraftGeneral">Delete</div>
                    </Button>    
                </div>
                {this.props.bpDetails.criterion == 0?
                                    <div>
                                        <p className="openTooltipTextContainer">
                                                Click on <a className='tooltip-selection' onClick={() => this.toggleDeleteBlockDialog(true,'commit')}>Add to story</a> to add your block to the story. <br/><br/>
                                        </p>
                                    </div>
                                    :
                                    null
                }                                
            </div>

        );
    }

    componentDidMount(){
        this.generateMultiSelectEntityList();

        //Deepcopy props to state
        const blockStr = JSON.stringify(this.props.draftBlock);
        var block = JSON.parse(blockStr);
        var date = new Date();
        var time = undefined;
        var addDate = false;
        var addTime = false;
        let selectedDateStyle = 'date';

        if(("blockDate" in block) && block.blockDate!=null){
            date.setFullYear(block.blockDate.year);
            date.setMonth(block.blockDate.month);
            if(!isNullOrUndefined(block.blockDate.date))
                date.setDate(block.blockDate.date);
            else{
                date.setDate(0);
                selectedDateStyle = 'month';
            }
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
            date.setMilliseconds(0);

            addDate = true;

            if(("blockTime" in block) && block.blockTime!=null){
                time = {
                    hour: block.blockTime.hours,
                    minute: block.blockTime.minutes
                }
                addTime = true;
                // console.log("Blocktime");
                // console.log(time);
            }
        }
        this.setState({
            newBlock:JSON.parse(blockStr),
            date: date,
            addDate: addDate,
            addTime: addTime,
            time: time,
            selectedDateStyle: selectedDateStyle
        });
    }

    toggleDeleteBlockDialog(value, type){
        let dialogText = this.state.dialogText;
        if(type == 'delete'){
            dialogText.selected.title = dialogText.delete.title;
            dialogText.selected.desc = dialogText.delete.desc;
        }
        else if(type == 'commit'){
            dialogText.selected.title = dialogText.commit.title;
            dialogText.selected.desc = dialogText.commit.desc;
        }
        this.setState({
            deleteDraftBlockDialog: value,
            dialogType: type
        });
    }

    performAction(type){
        if(type == 'delete'){
            this.removeDraftBlock();
        }
        else if(type == 'commit'){
            this.commitDraftBlock();
        }
    }

    render(){
        return(
            <div>
                <Joyride
                styles={{
                    options: {
                      arrowColor: '#e3ffeb',
                      beaconSize: '3em',
                      primaryColor: '#05878B',
                      backgroundColor: '#e3ffeb',
                      overlayColor: 'rgba(10,10,10, 0.4)',
                      width: 900,
                      zIndex: 1000,
                    }
                  }}
                    steps={this.state.tooltipText.draftBlockTour}
                    run = {this.state.showTooltip.draftBlockTour}                    
                    /> 
                    <Dialog
                    open={this.state.deleteDraftBlockDialog}
                    TransitionComponent={Transition}
                    keepMounted
                    onClose={() => this.toggleDeleteBlockDialog(false,'delete')}
                    aria-labelledby="alert-dialog-slide-title"
                    aria-describedby="alert-dialog-slide-description">
                        <DialogTitle id="alert-dialog-slide-title">{this.state.dialogText.selected.title}</DialogTitle>
                        <DialogContent>
                        <DialogContentText id="alert-dialog-slide-description">
                            {this.state.dialogText.selected.desc}
                        </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                        <Button onClick={() => this.toggleDeleteBlockDialog(false,this.state.dialogType)} color="primary">
                            No
                        </Button>
                        <Button onClick={() => this.performAction(this.state.dialogType)} color="primary">
                            Yes
                        </Button>
                        </DialogActions>
                    </Dialog>
                {this.EditSingleBlock()}
            </div>
        );
    }

}
export default DraftBlockComponent;