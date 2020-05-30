import React, { Component } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Loader from 'react-loader-spinner';
import TextField from '@material-ui/core/TextField';
import * as firebase from 'firebase';
import * as Utils from '../../common/utilSvc';
import * as Const from '../../common/constants';
import './UserGames.css';
import { isNullOrUndefined } from 'util';
import { Button } from '@material-ui/core';
import GameListPrivate from './GameListPrivate/GameListPrivate';

class UserGames extends React.Component {
    constructor(props) {
      super(props);
      //userId (has to be there)
      
      this.state = {
          shajs:null,
          areGameListsLoading: true,
          userGameLists: {},
          createGameList: false,
          draftGameList: {
              title: ''
          }
      }

        var shajs = require('sha.js');
        this.state.shajs = shajs;

        this.selectGame = this.selectGame.bind(this);
        this.addGameList = this.addGameList.bind(this);
        this.removeGameList = this.removeGameList.bind(this);
        this.getList = this.getList.bind(this);
        this.toggleCreateGameList = this.toggleCreateGameList.bind(this);
        this.createGameList = this.createGameList.bind(this);
        this.renderGameLists = this.renderGameLists.bind(this);
        this.renderNewGameForm = this.renderNewGameForm.bind(this);
        this.isValidGameList = this.isValidGameList.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.returnToGameLists = this.returnToGameLists.bind(this);

        this.getLatestTimestamp = this.getLatestTimestamp.bind(this);
        this.getGameLists = this.getGameLists.bind(this);
        this.getGameListsShort = this.getGameListsShort.bind(this);
        this.updateShortenedGameListsToDb = this.updateShortenedGameListsToDb.bind(this);
        this.getNewGameListsTillThisSession = this.getNewGameListsTillThisSession.bind(this);
        this.listenToGameListsDuringSession = this.listenToGameListsDuringSession.bind(this);
    }

    getLatestTimestamp(snapshot){
        let timestampLatest = 0;
        snapshot.forEach((doc) => { 
            let data = doc.data().gameLists;
            for(let i=0; data && i<data.length; i++){
                if(data[i].timestamp)
                    timestampLatest = Math.max(timestampLatest, data[i].timestamp);
            }
        }); 
        return timestampLatest;
    }

    getGameListsShort(){
        firebase.firestore().collection('Users').doc(this.props.userId)
            .collection('shortGameLists').get().then((snapshot) => {
        let latestTs = this.getLatestTimestamp(snapshot);                                 
        let allGameLists = [];
        snapshot.forEach((doc) => {
                let data = doc.data();
                if(data.gameLists){
                    for(let i=0; i<data.gameLists.length; i++){
                        allGameLists.push(data.gameLists[i]);
                        this.addGameList(data.gameLists[i]);
                    }
                }
            });
        this.getNewGameListsTillThisSession(latestTs);                                
        });  
    }

    updateShortenedGameListsToDb(){
        let allGameLists = Utils.getShortenedListOfGameLists(this.state.userGameLists);
        if(allGameLists &&  allGameLists.length>0){
            firebase.firestore().collection('Users').doc(this.props.userId)
            .collection('shortGameLists').get().then((snapshot) => {
                    
                snapshot.forEach((doc) => {
                        var ref = firebase.firestore().collection("Users").doc(this.props.userId)
                        .collection("shortGameLists").doc(doc.id).delete();
                    });
                    
                for(var i=0; i<allGameLists.length; i++){
                    firebase.firestore().collection("Users").doc(this.props.userId)
                    .collection("shortGameLists").doc(String(i)).set(allGameLists[i]);        
                }       
                });
        }
      }

    getNewGameListsTillThisSession(latestTimestamp){

        let currTime = Date.now();

        //Get short gamelists
        firebase.firestore().collection('Users').doc(this.props.userId)
        .collection('gameLists').where("timestamp", ">", latestTimestamp).where("timestamp", "<=", currTime)
        .orderBy("timestamp").get().then((snapshot) => {
                                
            snapshot.forEach((doc) => {
                let data = doc.data();
                if(data){
                    this.addGameList(data);
                }
            });

            this.updateShortenedGameListsToDb();
            this.setState({
                areGameListsLoading: false
            });
            this.listenToGameListsDuringSession(currTime);
        });          
    }

    listenToGameListsDuringSession(latestTimestamp){

        firebase.firestore().collection('Users').doc(this.props.userId)
        .collection('gameLists').where("timestamp", ">", latestTimestamp).orderBy("timestamp").onSnapshot(
            querySnapshot => {
                querySnapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        let data = change.doc.data();
                        if(data){
                            this.addGameList(data,true);
                        }
                        //console.log('New block: ', change.doc.data().timestamp);
                    }
                    else if (change.type == 'removed'){
                        let data = change.doc.data();
                        if(data){
                            this.removeGameList(data,false);
                        }
                    }
                }); 
            });
    }

    handleChange(event, type) {

        var shouldUpdate = true;
      
        let newStr = event.target.value;
        if(!Utils.shouldUpdateText(newStr, '\n\t'))
            shouldUpdate=false;

        if(shouldUpdate){
            var gameList = this.state.draftGameList;
            if(type=="title"){
                gameList.title = event.target.value;
                gameList.title = gameList.title.substring(0, Const.maxGameListChar - 1);
                this.setState({draftGameList: gameList});
            }
        }          
    }

    async createGameList(){
        let timestamp = Date.now();
        let title = this.state.draftGameList.title;
        let id = this.state.shajs('sha256').update(this.props.userId + "_" + String(timestamp)).digest('hex');

        let gameListSoft = {
            title: title,
            timestamp: timestamp,
            id: id
        };
        let gameListPublic = {
            title: title,
            games: [],
            timestamp: timestamp,
            id: id
        };
        await firebase.firestore().collection('Users').doc(this.props.userId)
        .collection('gameLists').doc(id).set(gameListSoft);

        await firebase.firestore().collection('publicGameList').doc(id).set(gameListPublic);

        this.setState({
            draftGameList: {
                title: ''
            },
            createGameList: false
        });
    }

    isValidGameList(){
        if(this.state.draftGameList.title.trim() == '')
            return false;
        return true;
    }

    renderNewGameForm(){

        return (
            <div>
                 <form className="newGameListForm">
                    <label>
                        <TextField 
                            type="text"
                            label = "Title"
                            variant="outlined"
                            value={this.state.draftGameList.title}
                            onChange={(e) => { this.handleChange(e,"title")}}
                            multiline
                            rowsMax="2"
                            rows="1"
                            style={{
                                background: 'white',
                                marginTop:'6px',
                                marginBottom:'6px',
                                textColor: 'black',
                                fontWeight: '600',
                                marginLeft: '1em',
                                width:'95%'
                                }}/>                            
                    </label>
                </form>
               
                <div className="createValidGameOptions">
                    {this.isValidGameList()?
                        <Button
                        className="submitGameListButton"
                        color="primary"
                        variant="contained"
                        onClick={this.createGameList}>
                            Confirm
                        </Button>
                        :
                        null
                    }
                        <Button 
                            className="createGameListButton"
                            color="primary"
                            variant="contained"
                            onClick={this.toggleCreateGameList}>
                                Close
                        </Button>
                        
                </div>                                                                
            </div>
        )
    }

    selectGame(id){
        this.props.selectGameList(id);
    }

    renderSingleUserGame(game){
        let scope = this;
        return (
            <ListItem button 
                selected={scope.props.selectedUserGame == game.id}
                onClick={() => { scope.selectGame(game.id)}}
                style={{width:'100%'}}
                >
                <ListItemText primary={game.title} secondary={''}/>
            </ListItem>
        );
    }

    addGameList(game){
        if(!isNullOrUndefined(game)){
            let userGameLists = this.state.userGameLists;
            userGameLists[game.id] = game;
            this.setState({
                userGameLists: userGameLists
            });
        }
    }

    removeGameList(game){
        if(!isNullOrUndefined(game)){
            let userGameLists = this.state.userGameLists;
            delete userGameLists[game.id];
            this.setState({
                userGameLists: userGameLists
            });
        }
    }

    getGameLists(){
        this.setState({
            areGameListsLoading: false
        });

        this.getGameListsShort();
    }

    componentDidMount(){
        this.getGameLists();
    }

    getList(gameMap){
        let list = [];
        for(let key in gameMap){
            list.push(gameMap[key]);
        }
        return list;
    }

    toggleCreateGameList(){
        this.setState({
            createGameList: !this.state.createGameList
        });
    }

    renderGameLists(){
        let scope = this;
        let userGamesTempList = this.getList(this.state.userGameLists);
        userGamesTempList.sort(function(a, b){if(a.title.toLowerCase()>b.title.toLowerCase()){return 1} return -1;});
        let userGamesRender = userGamesTempList.map((game) => {
            return scope.renderSingleUserGame(game);
        });

        return (
            <div className="gameListsViewContainer">
            <h2 style={{textAlign:'center'}}>My game lists</h2>
                <div className="createGameListOptions">
                {!this.state.createGameList?
                    <Button 
                        className="createGameListButton"
                        color="primary"
                        variant="contained"
                        onClick={this.toggleCreateGameList}>
                            <div>Create gamelist</div>
                    </Button>
                    :
                    null
                }                    
                </div>
                {this.state.createGameList?
                    <div>
                        {this.renderNewGameForm()}
                    </div>
                    :
                    null
                }
                <div>
                    <List>
                        {userGamesRender}
                    </List>
                </div>
            </div>
        )
    }

    returnToGameLists(){
        this.props.selectGameList(null);
    }

    render(){
        
        return (
            <div>
                {
                    isNullOrUndefined(this.props.selectedUserGame) || this.props.selectedUserGame==''?
                    <div>
                        {this.state.areGameListsLoading?
                                <div style={{margin:'auto',width:'50px'}}>
                                    <Loader 
                                    type="TailSpin"
                                    color="#00BFFF"
                                    height="50"	
                                    width="50"
                                    /> 
                                </div>
                                :
                                <div>
                                    {this.renderGameLists()}
                                </div>
                        }
                    </div>
                    :
                    <div>
                        <GameListPrivate
                            gameListId={this.props.selectedUserGame}
                            return={this.returnToGameList}
                        />
                    </div>
                }
            </div>
        )
    }
}
export default UserGames;