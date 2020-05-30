import React, { Component } from 'react';
import * as firebase from 'firebase';
import * as Const from '../../common/constants';
import SingleGameListItemComponent from './singleGameElement/SingleGameElement';
import YouTube from 'react-youtube';
import Paper from '@material-ui/core/Paper';
import Loader from 'react-loader-spinner';
import './GameListComponent.css';
import { isNullOrUndefined } from 'util';
import Grid from '@material-ui/core/Grid';

const opts = {
    height: '390',
    width: '100%',
    playerVars: {
      // https://developers.google.com/youtube/player_parameters
      autoplay: 0,
    },
};

class GameListComponent extends React.Component {
    
    constructor(props){
      super(props);

      this.state = {
          gameListId: this.props.match.params.gameListId,
          list: [],
          title: null,
          isLoading: true
      }

      this.singleGameListItem = this.singleGameListItem.bind(this);
      this.renderGameListFull = this.renderGameListFull.bind(this);
    }

    async componentDidMount(){
        if(!isNullOrUndefined(this.state.gameListId)){
            //get gameList

            let docs = await firebase.firestore().collection('publicGameList').doc(this.state.gameListId).get();
            if(docs.exists){
                let title = docs.data().title;
                let list = docs.data().games;

                this.setState({
                    list: list,
                    title: title,
                    isLoading: false
                });
            }
            else{
                this.setState({
                    isLoading: false
                });
            }
        }
    }

    singleGameListItem(game){
        return (
            <div className="singleGameListItemContainer">
                <SingleGameListItemComponent
                    title={game.title}
                    id={game.id}
                />
            </div>
        )
    }

    renderGameListFull(){
        let list = this.state.list;

        let displayList = list.map(game => {
            return this.singleGameListItem(game);
        })
        return (
            <div>
                <h2 className="gameListTitle">{this.state.title}</h2>

                {this.state.list.length > 0?
                    <div style={{marginBottom:'40px'}}>{displayList}</div>
                    :
                    null
                }
                                
                <div className="gameVideoLink">
                    <h3>Create your own game</h3>
                    <p>Follow the steps in this video tutorial to create your own visualized game using <a href={Const.blockprobeUrl} target="_blank">Blockprobe</a>.</p>
                    <div className="gameVideoContainer">
                        <Grid item xs={12} md={6} className="videoPadding">
                            <Paper elevation={3}>
                                <YouTube videoId="esZCwWauxV4" opts={opts} onReady={this._onReady} />
                            </Paper>
                        </Grid> 
                        <Grid item xs={12} md={6} className="videoPadding">
                            <Paper elevation={3}>
                                <YouTube videoId="AY74YJ697Ec" opts={opts} onReady={this._onReady} />
                            </Paper>
                        </Grid>                        
                    </div>                    
                </div>
            </div>
        );
    }

    render(){
        return (
            <div>
                {this.state.isLoading?
                    <div style={{width:'50px',margin:'auto'}}>
                        <Loader 
                        type="TailSpin"
                        color="#00BFFF"
                        height="50"	
                        width="50"              
                        /> 
                    </div>
                    :
                    this.renderGameListFull()
                }
            </div>
        )
    }
}
export default GameListComponent;