import React, { Component } from 'react';
import * as firebase from 'firebase';
import { isNullOrUndefined } from 'util';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import * as Utils from '../../../common/utilSvc';
import * as Const from '../../../common/constants';
import Loader from 'react-loader-spinner';
import SingleGameListItemComponent from '../../../viso/gameList/singleGameElement/SingleGameElement';
import './GameListPrivate.css';

class GameListPrivate extends React.Component {

    constructor(props) {
      super(props);
      //gameListId

      this.state={
          list: [],
          title: null,
          isLoading: true,
          currGameList: {},
          addGameList: false,
          newGame: {
              title: '',
              id: ''
          }
      }

      this.removeGame = this.removeGame.bind(this);
      this.addGame = this.addGame.bind(this);
      this.writeToDb = this.writeToDb.bind(this);
      this.singleGameListItem = this.singleGameListItem.bind(this);
      this.renderGameListFull = this.renderGameListFull.bind(this);
      this.confirmGame = this.confirmGame.bind(this);
      this.handleChange = this.handleChange.bind(this);
      this.isValidGame = this.isValidGame.bind(this);
    }

    removeGame(gameId){
        let list = this.state.list;
        let ans = [];
        for(let i=0; i<list.length; i++){
            if(list[i].id != gameId){
                ans.push(list[i]);
            }
        }
        this.writeToDb(ans,this.state.title);
    }

    addGame(game){
        let list = this.state.list;
        if(list.length < Const.maxLengthOfGamelist){
            list.push(game);
            this.writeToDb(list,this.state.title);
        }
    }

    async writeToDb(list, title){
        let currGameList = this.state.currGameList;
        currGameList['games'] = list;
        delete currGameList['list'];
        currGameList['title'] = title;
        await firebase.firestore().collection('publicGameList').doc(this.props.gameListId).set(currGameList);
    }

    singleGameListItem(game){
        return (
            <div className="singleGameListItemContainer">
                <SingleGameListItemComponent
                    title={game.title}
                    id={game.id}
                    isPrivate={true}
                    removeGame={this.removeGame}
                />
            </div>
        )
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
            var game = this.state.newGame;
            if(type=="title"){
                game.title = event.target.value;
                this.setState({newGame: game});
            }
            else if(type=="id"){
                game.id = event.target.value;
                this.setState({newGame: game});
            }
        }
    }

    componentDidMount(){
        if(!isNullOrUndefined(this.props.gameListId)){
            //get gameList

            let scope = this;
            firebase.firestore().collection('publicGameList').doc(this.props.gameListId).onSnapshot(doc => {
                if(doc.exists){
                    let title = doc.data().title;
                    let list = doc.data().games;
                    let currGameList = doc.data();
    
                    scope.setState({
                        list: list,
                        title: title,
                        currGameList: currGameList
                    });
                }
                scope.setState({
                    isLoading: false
                });
            },
            error =>{
                scope.setState({
                    isLoading: false
                });
            });
        }
    }

    confirmGame(){
        let newGame = this.state.newGame;
        this.addGame(newGame);
        this.setState({
            addGameList: false,
            newGame: {
                title: '',
                id: ''
            }
        })
    }

    isValidGame(){
        if(isNullOrUndefined(this.state.newGame.id) || this.state.newGame.id.trim()=='')
            return false;
        if(isNullOrUndefined(this.state.newGame.title) || this.state.newGame.title.trim()=='')
            return false;
        return true;
    }

    returnNewGame(){
        return (
            <div>
                <Grid xs={12}>
                    <div className="newGameFormContainer">
                        <form>
                            <label>
                                <TextField 
                                    type="text"
                                    variant="outlined"
                                    multiline
                                    label = "Game title"
                                    value={this.state.newGame.title}
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
                                label = "Game ID"
                                value={this.state.newGame.id}
                                onChange={(e) => { this.handleChange(e,"id")}}
                                rowsMax="2"
                                rows="1"
                                style={{
                                    background: 'white',
                                    marginTop:'6px',
                                    marginBottom:'6px',
                                    width:'95%'
                                    }}/>
                            </label>
                        </form>
                        <div className="newGamePrivateOptionsContainer">
                            {
                                this.isValidGame()?
                                <Button
                                    className="addGameButton"
                                    color="primary"
                                    variant="contained"
                                    onClick={() => { this.confirmGame() }}>
                                        Add
                                </Button>
                                :
                                null
                            }
                            <Button
                                className="addGameButton"
                                color="primary"
                                variant="contained"
                                onClick={() => { 
                                    this.setState({
                                        addGameList: false,
                                        newGame: {
                                            title: '',
                                            id: ''
                                        }})
                                    }}>
                                    Close
                            </Button>
                        </div>                       
                    </div>
                </Grid>
            </div>
        )
    }

    renderGameListFull(){
        let list = this.state.list;
        let displayList = list.map(game => {
            return this.singleGameListItem(game);
        });
        let shareUrl = Const.blockprobeUrl + '/gameList/' + this.props.gameListId;
        
        return (
            <div>
                <h2 className="gameListTitle">{this.state.title}</h2>

                <div className="gameListPrivateOptionsContainer">
                    <Button
                        className="addGameButton"
                        color="primary"
                        variant="contained"
                        onClick={() => { this.props.return()}}>
                            Back to gameLists
                    </Button>
                    {!this.state.addGameList?
                        <Button
                            className="addGameButton"
                            color="primary"
                            variant="contained"
                            onClick={() => { this.setState({addGameList: true})}}>
                                Add new game
                        </Button>
                            : 
                        null 
                    }
                </div>

                {this.state.addGameList?
                    this.returnNewGame()
                    :
                    null
                }

                <div className="shareUrlContainer">
                    <p>
                        Public link to view game list: <br />                        
                    </p>
                    <div className="shareUrlDiv">
                        <a href={shareUrl} target="_blank">{shareUrl}</a>
                    </div>
                </div>

                {this.state.list.length > 0?
                    <div style={{marginBottom:'40px'}}>{displayList}</div>
                    :
                    null
                }                
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
        );
    }

}
export default GameListPrivate;