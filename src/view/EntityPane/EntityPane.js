import React, { Component } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import AddIcon from '@material-ui/icons/Add';
import ClearIcon from '@material-ui/icons/Clear';
import Textarea from 'react-textarea-autosize';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Joyride from 'react-joyride';
import './EntityPane.css';
import * as firebase from 'firebase';
import 'firebase/firestore';

class EntityPaneView extends React.Component {

    constructor(props){
        super(props);
        // closeEntityPane, this.props.investigationGraph, bId, uIdHash, finishTooltip

        this.state={
            entities:[],
            haveEntitiesLoaded: false,
            newEntity: '',
            entityPresent: {},
            tooltipText:{
                entityPane:[                    
                    {                    
                        title: 'Let us add characters (entities) to your story',
                        target: '.createNewEntitiesPane',
                        content: 'Copy paste the text in red and press enter',
                        disableBeacon: true
                    }             
                ],
                cancelButton:[                    
                    {                    
                        title: 'Well done! Your entities have been defined!',
                        target: '.cancelEntityPaneButton',
                        content: 'Click on close. We are done here!',
                        disableBeacon: false,
                        placementBeacon: 'left',
                        event: 'hover'
                    }             
                ]
            },
            showTooltip:{
                cancel: false
            }
        }

        this.addEntityToList = this.addEntityToList.bind(this);
        this.makeEntityUppercase = this.makeEntityUppercase.bind(this);
        this.initEntities = this.initEntities.bind(this);
        this.getEntities = this.getEntities.bind(this);
        this.removeEntity = this.removeEntity.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.clickOkayButton = this.clickOkayButton.bind(this);
        this.addEntitiesInBulk = this.addEntitiesInBulk.bind(this);
        this.closeEntityPane = this.closeEntityPane.bind(this);
    }

    componentDidUpdate(){

    }

    initEntities(snapshot, scope){
        var entities = snapshot.data().entities;        
        var isEntityPresent = scope.state.entityPresent;
        for(var i=0; i<entities.length;i++){
            isEntityPresent[entities[i].label] = entities[i].canRemove;
        }
        
        scope.props.updateEntityPaneList(entities);
        scope.setState({
            entityPresent: isEntityPresent,
            entities: entities,
            haveEntitiesLoaded: true
        });         
    }

    componentDidMount(){
        //Get data for entities
        var scope = this;
        firebase.firestore().collection("Blockprobes").doc(this.props.bId)
        .collection("users").doc(this.props.uIdHash).collection("session")
        .doc("entityPane").get().then((snapshot) => {
            if(snapshot.exists)
                scope.initEntities(snapshot,scope);
        });
    }

    addEntitiesInBulk(totalStr){
        var entityArr = totalStr.split(',');
        for(var i=0; i<entityArr.length; i++){
            var str = entityArr[i].trim();
            if(str.length > 0)
                this.addEntityToList(str);
        }
        str = '';
        var showTooltip = this.state.showTooltip;

        if(totalStr.trim() != ''){
            if(this.props.entityPaneTooltip){                   
                showTooltip.cancel = true;
            }                
        }             
        this.setState({
            newEntity: str,
            showTooltip: showTooltip
        }); 

    }

    clickOkayButton(){
        var totalStr = this.state.newEntity;
        this.addEntitiesInBulk(totalStr);
    }

    handleKeyDown(event){
        if (event.key === 'Enter') {
            var totalStr= event.target.value;
            this.addEntitiesInBulk(totalStr);
          }
    }


    handleChange(event, type) {

        var shouldUpdate = true;
        if(type!="date" && type!="time"){            
            event.target.value = event.target.value.replace(/(\r\n|\n|\r)/gm, "");
            event.target.value = event.target.value.replace('\t','');
            event.target.value.trim();          
        }

        if(shouldUpdate){
            if(type=="new-entity"){
                this.setState({newEntity: event.target.value});
            }

        }
      }
    makeEntityUppercase(value){
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(); 
    }  

    addEntityToList(entityLabel){
        var entityList = this.state.entities;
        var isEntityPresent = this.state.entityPresent;
        entityLabel = this.makeEntityUppercase(entityLabel);
        if(!(entityLabel in isEntityPresent) && entityLabel.toLowerCase()!='all' && entityLabel.toLowerCase()!='none'){
            entityList.push({                
                canRemove: true, 
                label: entityLabel, 
            });
            isEntityPresent[entityLabel] = true;

            firebase.firestore().collection("Blockprobes").doc(this.props.bId)
            .collection("users").doc(this.props.uIdHash).collection("session")
            .doc("entityPane").set({
                entities:entityList
            });

            this.props.updateEntityPaneList(this.getEntities());
            this.setState({
                entities: entityList,
                newEntity: '',
                entityPresent: isEntityPresent
            });
        }       
    }

    removeEntity(entity){
        var entityList = this.state.entities.filter(e => e.label!=entity.label);
        var isEntityPresent = this.state.entityPresent;
        delete isEntityPresent[entity.label];
        firebase.firestore().collection("Blockprobes").doc(this.props.bId)
            .collection("users").doc(this.props.uIdHash).collection("session")
            .doc("entityPane").set({
                entities:entityList
            });
        this.setState({
            entities: entityList,
            entityPresent: isEntityPresent
        });
    }

    BlockEntity(entity){
        return(
        <span className="block-entity">
            {entity.label}
            {entity.canRemove? 
            <a style={{marginLeft:'5px', color: 'black', cursor: 'pointer'}} 
            onClick={() => { this.removeEntity(entity)}}>X</a>
            : 
            null}
        </span>
        );   
    }

    getEntities(){

        var entities = this.state.entities;
        // console.log(entities);
        var isEntityPresent = {};
        for(var i=0; i<entities.length; i++){
            isEntityPresent[entities[i].label]=entities[i].canRemove;
        }
        if(this.props.investigationGraph !=null){
            Object.keys(this.props.investigationGraph).forEach(function(entityLabel) {
                if(!(entityLabel in isEntityPresent)){
                    entities.push({                
                        canRemove: false, 
                        label: entityLabel, 
                    });
                }
                isEntityPresent[entityLabel] = false;
            });
        }

        
        for(var i=0;i<entities.length;i++){
            entities[i].canRemove = isEntityPresent[entities[i].label];
        }
        // console.log(entities);
        return entities;
    }

    closeEntityPane(){
        var shouldFinishTooltips = false;
        if(this.state.showTooltip.cancel)
            shouldFinishTooltips = true;
        this.props.closeEntityPane(shouldFinishTooltips);
    }

    render(){

        /*
         Create render template for the entities
         */
        var renderBlockEntities = '';
        var entities = this.getEntities();
        if(entities!=null && entities.length>0){            
            renderBlockEntities = entities.map((blockEntity) => 
               this.BlockEntity(blockEntity)
           );            
       }

        return(
            <div className='entityPaneContainer'>
                <div className='entityPaneTitle'>Entities of your story</div>
                <div>
                    {renderBlockEntities}
                </div>
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
                    steps={this.state.tooltipText.entityPane}
                    run = {this.props.entityPaneTooltip}                    
                    /> 
                 
                <TextField 
                                type="text"
                                variant="outlined"
                                multiline
                                className="createNewEntitiesPane"
                                value={this.state.newEntity}
                                onChange={(e) => { this.handleChange(e,"new-entity")}}
                                onKeyDown={(e) => { this.handleKeyDown(e)}}
                                placeholder = "Input your entity names seperated by ',' and press 'Enter key' or 'Ok button'"
                                rowsMax="2"
                                rows="1"
                                style={{
                                    background: 'white',
                                    marginTop:'6px',
                                    marginBottom:'6px',
                                    minWidth:'60%',
                                    maxWidth: '80%',
                                    marginLeft:'1em',
                                    color: 'darkBlue',
                                    fontWeight:'600'
                                    }}/>
                <div style={{marginLeft:'1em'}}>
                    <span style={{fontSize:'14px', color:'grey', fontStyle:'italic'}}>**Input your entity names seperated by comma and press 'Enter key' or 'Ok button'. For example, copy-paste the text below shown in red as input. <a href='https://youtu.be/SCDA-rUVdMA?t=122' target='blank'>Learn More</a><br/></span> 
                    <span style={{fontSize:'14px', fontWeight:'bold', color:'red', background:'rgba(255,0,0,0.3)', fontStyle:'italic'}}>Ironman, Thor, Rogers, Asgard, Thanos</span>
                </div>
                <Joyride
                styles={{
                    options: {
                      arrowColor: '#e3ffeb',
                      beaconSize: '4em',
                      primaryColor: '#05878B',
                      backgroundColor: '#e3ffeb',
                      overlayColor: 'rgba(10,10,10, 0.4)',
                      width: 900,
                      zIndex: 1000
                    }
                  }}
                    steps={this.state.tooltipText.cancelButton}
                    run = {this.state.showTooltip.cancel}                    
                    />                                     
                <div className="draft-add-new-entity-container">                                       
                        <Button
                            color="primary" 
                            variant="contained" 
                            className="cancelBlockButton cancelEntityPaneButton" 
                            onClick={this.closeEntityPane}>
                                <div>Close</div>
                        </Button>  
                        {this.state.newEntity != ''?
                            <Button 
                                color="primary" 
                                variant="contained"
                                className="addEntityButton" 
                                onClick={this.clickOkayButton}>
                                    <div>Ok</div>
                            </Button>        
                                :
                            null}
                </div>   
            </div>
        );
    }
}
export default EntityPaneView;