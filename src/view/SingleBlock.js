import React, { Component } from 'react';
import * as firebase from 'firebase';
import './SingleBlock.css';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import DraftBlockComponent from './DraftBlock';
import { isNullOrUndefined } from 'util';

class SingleUserBlock extends React.Component {

    constructor(props){
        super(props);
        //props: isNewBlock, deleteNewBlcok, addDraftBlock, entityPane, draftBlockTooltip, finishTooltip, bId
        //changeSelectedBlock, bpDetails, isMultiSelect, multiSelectBlocks(block), isBlockSelectedInMultiselect

        this.state={
            isBlockClicked: false
        }
        this.BlockEntity = this.BlockEntity.bind(this);
        this.clickBlockInDraft = this.clickBlockInDraft.bind(this);
        this.revertBlockInDraft = this.revertBlockInDraft.bind(this);
        this.clickBlockNotInDraft = this.clickBlockNotInDraft.bind(this);
        this.updateDraftBlock = this.updateDraftBlock.bind(this);        
    }

    BlockEntity(entity){
        return(
        <span className="user-block-entity">
            {entity.title}
        </span>
        );  
    }

    clickBlockNotInDraft(block){
        if(!this.props.isMultiSelect)
            this.props.selectBlock(block);
    }

    renderViewOnlyBlock(){

        var renderBlockEntities = '';
        if(this.props.block.entities!=null && this.props.block.entities.length>0){            
            renderBlockEntities = this.props.block.entities.map((blockEntity) => 
               this.BlockEntity(blockEntity)
           );            
       }

       return(
            <ListItem button 
                onClick={() => { this.clickBlockNotInDraft(this.props.block)}}
                style={{width:'100%'}}
                >
                <ListItemText 
                 primary={this.props.block.title} 
                secondary={this.props.block.summary}/>
            </ListItem>                    
        );
        
    }

    clickBlockInDraft(){
        if(!this.props.isMultiSelect){
            if(!this.state.isBlockClicked){
                this.setState({
                    isBlockClicked: true
                });
            }
            if(this.props.block.key != this.props.selectedDraftBlockId){
                this.props.changeSelectedBlock(this.props.block.key);
            }
        }
        else{            
            let key = this.props.block.key;
            this.props.multiSelectBlocks(key);
        }
    }

    revertBlockInDraft(){
        if(this.state.isBlockClicked){
            this.setState({
                isBlockClicked: false
            });
        }
    }

    renderDraftBlock(){
        let actionType = '';
        if(this.props.block)
             actionType = this.props.block.actionType;
             
        return(
            <div>
                {this.props.selectedDraftBlockId == this.props.block.key?
                    <div>
                        <DraftBlockComponent 
                        draftBlock={this.props.block}
                        investigationGraph = {this.props.investigationGraph}
                        updateBlock = {this.updateDraftBlock}
                        entityPane = {this.props.entityPane}
                        draftBlockTooltip = {this.props.draftBlockTooltip}
                        finishTooltip = {this.props.finishTooltip}
                        bpDetails = {this.props.bpDetails}
                        bId = {this.props.bId}
                        uIdHash = {this.props.uIdHash}
                        />
                    </div>                    
                    :
                    <div className={(actionType =='MODIFY' && !this.props.isMultiSelect? 'user-block-color-MODIFY' : '') + 
                            (actionType =='ADD' && !this.props.isMultiSelect? 'user-block-color-ADD' : '') + 
                            (this.props.isMultiSelect && !this.props.isBlockSelectedInMultiselect? 'user-block-color-multiselect-UNSELECTED' : '') +
                            (this.props.isMultiSelect && this.props.isBlockSelectedInMultiselect? 'user-block-color-multiselect-SELECTED' : '')}>
                        <ListItem button 
                            onClick={() => { this.clickBlockInDraft()}}
                            style={{width:'100%'}}
                            >
                            <ListItemText 
                            primary={this.props.block.title} 
                            secondary={this.props.block.summary}/>
                        </ListItem>
                    </div>
                }
            </div>
        )
    }

    updateDraftBlock(newBlock, oldBlock, updateType){
        if(updateType=='SAVE'){
            //SAVE
            if(this.props.isNewBlock){
                this.props.addDraftBlock(newBlock);
            }
            else{
                this.props.updateDraftBlock(newBlock.key, newBlock);
            }

                this.setState({
                        isBlockClicked: false
                });
                this.props.changeSelectedBlock(null);                
            }
        else if(updateType=='COMMIT'){
            this.props.commitBlockToBlockprobe(newBlock);
        }
        else if(updateType=='SUBMIT'){
            //SUBMIT

            //Remove children
            delete newBlock["children"];
            this.props.submitDraftBlock(newBlock);

            this.setState({
                isBlockClicked: false
            });
            this.props.changeSelectedBlock(null);
        }
        else if(updateType=='CANCEL'){
            //CANCEL CHANGES
            if(!this.props.isNewBlock){
                
                //If block is an existing draft, then just revert to view state if changes cancelled
                this.setState({
                    isBlockClicked: false
                });
                this.props.changeSelectedBlock(null);                              
            }
            else{

                //If block is a new block, then delete it
                this.props.deleteNewBlock();
            }              
        }
        else if(updateType=='DELETE'){
            //DELETE CHANGES

            if(this.props.isNewBlock){

                //If block is a new block, then delete it
                this.props.deleteNewBlock();
            }
            else{
                this.props.deleteDraftBlock(newBlock.key)
                this.setState({
                    isBlockClicked: false
                });
                this.props.changeSelectedBlock(null);
            }
        }
    }

    render(){

        return(
            <div>
                {this.props.block.blockState=="DRAFT"?
                this.renderDraftBlock():
                this.renderViewOnlyBlock()
                }
            </div>
        )

    }
}
export default SingleUserBlock;