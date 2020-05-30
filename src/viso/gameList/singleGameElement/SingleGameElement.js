import React, { Component } from 'react';
import { Button, Card, Grid } from '@material-ui/core';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import ViewBlockprobePublicComponent from '../../../view/ViewBlockprobePublic';
import * as Const from '../../../common/constants';
import * as firebase from 'firebase';
import './SingleGameElement.css';
import { isNullOrUndefined } from 'util';

class SingleGameListItemComponent extends React.Component {

    constructor(props){
      super(props);
      //title, id

      this.state = {
          playGame: false
      }
      this.playGame = this.playGame.bind(this);
      this.viewResults = this.viewResults.bind(this);
    }

    playGame(value){
 /*       this.setState({
            playGame: value
        });
        */
        let link = Const.blockprobeUrl + `/game/${this.props.id}`;
        window.open(link, "_blank");       
    }

    viewResults(){
        let link = Const.blockprobeUrl + `/gameResults/${this.props.id}`;
        window.open(link, "_blank")
    }

    render(){

        return (
            <Grid item xs={12} spacing={4}>
                <Card elevation={6}>
                    <CardContent>
                        <Typography variant="h6">{this.props.title}</Typography>
                        {!isNullOrUndefined(this.props.summary)?
                            <Typography variant="body2" component="p" gutterBottom>
                                {this.props.summary}
                            </Typography>    
                            :
                            null
                        }                                                            
                    </CardContent>
                    <CardActions>
                        <Button size="small" onClick={() => { this.playGame(true)}}>Play</Button>
                        <Button size="small" onClick={() => { this.viewResults()}}>View results</Button>
                        {this.props.isPrivate && this.props.removeGame?
                            <Button size="small" onClick={() => { this.props.removeGame(this.props.id)}}>Remove</Button>
                            :
                            null
                        }
                    </CardActions>
                </Card>
            </Grid>
        );
       /* return (
            <div className="singleGameElementContainer">
                <h4 style={{textAlign:'center'}}>{this.props.title}</h4>
                <div>
                    {this.state.playGame?
                    <Button
                        variant="contained" 
                        className="playGameListItembutton"
                        onClick={() => { this.playGame(false)}}> 
                        Close</Button>
                        :
                    <Button
                        variant="contained" 
                        className="playGameListItembutton"
                        onClick={() => { this.playGame(true)}}> 
                        Play Game</Button>
                    }

                    <Button
                        variant="contained" 
                        className="viewResultGameListItembutton"
                        onClick={() => { this.viewResults()}}> 
                        View Results</Button>
                
                </div>
                              
            </div>
        )
        */
    }
}
export default SingleGameListItemComponent;