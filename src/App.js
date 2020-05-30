import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Switch, Link,Redirect } from "react-router-dom";
import ViewBlockprobePublicComponent from "./view/ViewBlockprobePublic";
import ViewBlockprobePublicWrapper from './wrapper/public/ViewBlockprobePublicWrapper';
import UserSession from "./user-session/UserSession";
import GamifiedResultsWrapper from './viso/gamifiedStats/gamifiedResultsWrapper';
import PublicWallComponent from './view/viewWall/PublicWall';
import GameListComponent from './viso/gameList/GameListComponent';

class App extends Component {
  render() {
    return (
      <div className="App">
        <Router>
          <Switch>
          <Route path="/wall/:userId"  
                        component={PublicWallComponent}
              />
            <Route path="/gameList/:gameListId"  
                      component={GameListComponent}
            />
           <Route path='/gameResults/:gameId'   
              component={GamifiedResultsWrapper}
              />
            <Route path="/:viewType/:bId"  
                        component={ViewBlockprobePublicWrapper}
              />           

            <Route exact path="/"  
                        component={UserSession}
              />

            <Redirect from="*" to="/" />
          </Switch>
        </Router>
      </div>
    );
  }
}

export default App;
