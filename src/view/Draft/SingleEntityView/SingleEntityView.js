import React, { Component } from 'react';
import Textarea from 'react-textarea-autosize';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';
import  * as Utils from '../../../common/utilSvc';
import './SingleEntityView.css';
import * as firebase from 'firebase';
import 'firebase/firestore';
import { isNull, isNullOrUndefined } from 'util';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  });

class SingleEntityView extends React.Component {

    constructor(props){
        super(props);
        //entity, bpId, uIdHash

        this.state={
            entityName: null,
            label: null,
            dialogType: null,
            dialogText:{
                delete:{
                    title: "Delete entity",
                    desc: "You are about to delete this entity. This action cannot be reversed.\nDo you confirm?"
                },
                rename:{
                    title: "Rename entity",
                    desc: "You are about to rename this entity. This action cannot be reversed.\nDo you confirm?"
                },
                selected:{
                    title: null,
                    desc: null
                }
            },
            dialog: false,
        }

        if(!isNullOrUndefined(props.entity) && !isNullOrUndefined(props.entity.label)){
            this.state.entityName = JSON.parse(JSON.stringify(props.entity.label));
            this.state.label = JSON.parse(JSON.stringify(props.entity.label));
        }

        this.handleChange = this.handleChange.bind(this);
        this.isEntityNameChanged = this.isEntityNameChanged.bind(this);
        this.renameEntity = this.renameEntity.bind(this);
        this.deleteEntity = this.deleteEntity.bind(this);
        this.createBlockForEntityChange = this.createBlockForEntityChange.bind(this);
        this.toggleDialog = this.toggleDialog.bind(this);
        this.performAction = this.performAction.bind(this);
    }

    toggleDialog(value, type){
        let dialogText = this.state.dialogText;
        if(type == 'delete'){
            dialogText.selected.title = dialogText.delete.title;
            dialogText.selected.desc = dialogText.delete.desc;
        }
        else if(type == 'rename'){
            dialogText.selected.title = dialogText.rename.title;
            dialogText.selected.desc = dialogText.rename.desc;
        }
        this.setState({
            dialog: value,
            dialogType: type
        });
    }

    performAction(type){
        if(type == 'delete'){
            this.deleteEntity();
        }
        else if(type  == 'rename'){
            this.renameEntity();   
        }

        this.setState({
            dialog: false,
            dialogType: null
        });
    }

    handleChange(event, type) {
        let str = event.target.value;
        var shouldUpdate = true;
        shouldUpdate = Utils.shouldUpdateText(str, ['\n','\t']);
        if(shouldUpdate){
            if(type=="entity-name"){
                this.setState({entityName: event.target.value});
            }
        }
      }

    isEntityNameChanged(){
        let entityName = this.state.entityName;
        if(!isNullOrUndefined(entityName) && !isNullOrUndefined(this.props.entity.label) 
            && entityName.length>0 && entityName!=this.props.entity.label)
            return true;
        return false;
    }

    componentWillReceiveProps(newProps){
        if(newProps.entity != this.props.entity){
            let entityName = JSON.parse(JSON.stringify(newProps.entity.label));
            let label = JSON.parse(JSON.stringify(newProps.entity.label));
            this.setState({
                entityName:entityName,
                label: label}
            );
        }
    }

    createBlockForEntityChange(currEntity, newEntity){
        let entityMap = {
            curr: currEntity,
            new: newEntity
        };

        let fullBlock = {
            title: '',
            summary: '',
            entities: [],
            evidences: [],
            referenceBlock: null,
            timestamp: Date.now(),
            actionType: 'entityChange',
            entityMap: entityMap
        };

        this.props.commitBlockToBlockprobe(fullBlock);

    }

    renameEntity(){
        let newName = this.state.entityName;
        let oldName = JSON.parse(JSON.stringify(this.props.entity.label));

        this.createBlockForEntityChange(oldName,newName);
    }

    deleteEntity(){
        let newName = null;
        let oldName = JSON.parse(JSON.stringify(this.props.entity.label));

        this.createBlockForEntityChange(oldName,newName);
    }

    render(){
        return(
            <div>
                <h4 className="manageSingleEntityTitle"> Manage entity {this.state.label}</h4>
                <Dialog
                    open={this.state.dialog}
                    TransitionComponent={Transition}
                    keepMounted
                    onClose={() => this.toggleDialog(false,'delete')}
                    aria-labelledby="alert-dialog-slide-title"
                    aria-describedby="alert-dialog-slide-description">
                    <DialogTitle id="alert-dialog-slide-title">{this.state.dialogText.selected.title}</DialogTitle>
                    <DialogContent>
                    <DialogContentText id="alert-dialog-slide-description">
                        {this.state.dialogText.selected.desc}
                    </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => this.toggleDialog(false,this.state.dialogType)} color="primary">
                            No
                        </Button>
                        <Button onClick={() => this.performAction(this.state.dialogType)} color="primary">
                            Yes
                        </Button>
                    </DialogActions>
                </Dialog>                
                <div className="entityEditLabelContainer">
                    <div style={{marginBottom:'6px'}}>Edit Name</div>
                    <TextField 
                                type="text"
                                variant="outlined"
                                value={this.state.entityName}
                                onChange={(e) => { this.handleChange(e,"entity-name")}}
                                placeholder = "Entity name"
                                multiline
                                rowsMax="3"
                                rows="1"
                                style={{
                                    background: 'white',
                                    marginTop:'6px',
                                    marginBottom:'6px',
                                    minWidth:'40%',
                                    maxWidth: '50%',
                                    color: 'darkBlue',
                                    fontWeight:'600'
                                    }}/>
                </div>
                <div className="entityOptionsContainer">
                    {this.isEntityNameChanged()?
                        <Button
                            variant="contained" 
                            className="renameEntityButton" 
                            onClick={() => {this.toggleDialog(true,'rename')}}>
                                <div>Rename</div>
                        </Button>
                        :
                        null
                    }

                    <Button
                        variant="contained" 
                        className="deleteEntityButton" 
                        onClick={() => {this.toggleDialog(true,'delete')}}>
                            <div>Delete</div>
                    </Button>
                        
                </div>

            </div>
        )
    }
}
export default SingleEntityView;