import React, { Component } from 'react';
import { isNullOrUndefined } from 'util';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import GamifiedResultsComponent from './gamifiedResults';
import * as Utils from '../../common/utilSvc';
import './gamifiedResults.css';

class GamifiedResultsWrapper extends React.Component {
    constructor(props) {
      super(props);
      //gameId 

      this.state = {
          userId: '',
          displayedUserId: ''
      }

      this.isValidUserId = this.isValidUserId.bind(this);
      this.handleChange = this.handleChange.bind(this);
      this.displayUserScore = this.displayUserScore.bind(this);
    }


    isValidUserId(userId){
        if(!isNullOrUndefined(userId) && userId.length>0)
            return true;
        return false;
    }

    handleChange(event, type) {

        var shouldUpdate = false;
        let str = event.target.value;
        if(type=='userId' && Utils.shouldUpdateText(str,['\n','\t'])){
            shouldUpdate = true;
        }

        if(shouldUpdate){
            
            if(type=="userId"){
                let id = event.target.value;
                this.setState({
                    userId: id
                });
            }
        }
      }

    displayUserScore(){
        this.setState({
            displayedUserId: this.state.userId.trim()
        });
    }

    render(){
        return (
            <div>
                 <div className="input-userId-getScore-container">
                     <h3>Input userId</h3>
                    <form>
                    <label>
                        <TextField 
                            type="text"
                            variant="outlined"
                            multiline
                            placeholder = "Enter userId"
                            value={this.state.userId}
                            onChange={(e) => { this.handleChange(e,"userId")}}
                            rowsMax="1"
                            rows="1"
                            style={{
                                background: 'white',
                                marginTop:'6px',
                                marginBottom:'6px',
                                width:'30%'
                                }}/>
                    </label>
                    </form>
                    <div className="viewGameResultsOptionsContainer">
                        {this.isValidUserId(this.state.userId)?                        
                            <Button 
                                variant="contained"
                                className="displayUserGameScoreButton" 
                                style={{marginTop:'1em'}}
                                onClick={(e) => this.displayUserScore("creator",true)}>
                                    <div>Confirm</div>
                            </Button>
                            :
                            null
                        }
                    </div>
                 </div>

                {!isNullOrUndefined(this.props.match.params.gameId) && this.isValidUserId(this.state.displayedUserId)? 
                    <GamifiedResultsComponent
                        gameId = {this.props.match.params.gameId}
                        userId = {this.state.displayedUserId}
                        />
                    :
                    null
                }                
            </div>
        )
    }
}
export default GamifiedResultsWrapper;