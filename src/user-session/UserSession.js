import React, { Component } from 'react';
import * as firebase from 'firebase';
import StyleFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";
import { isNullOrUndefined } from 'util';
import * as Utils from '../common/utilSvc';
import * as DbUtils from "../common/dbSvc";
import './UserSession.css';
import UserBlockprobesComponent from './UserBlockprobes';
import ViewBlockprobePrivateComponent from '../view/ViewBlockprobePrivate';
import Loader from 'react-loader-spinner';
import GoogleFontLoader from 'react-google-font-loader';
import Img from 'react-image';
import JournalistBackground from "./backgrounds/Journalist.jpg";
import TeacherBackground from "./backgrounds/Teacher.jpg";
import LawmakerBackground from "./backgrounds/lawmaker.jpg";
import MainLogo from "./icons/BlockprobeLogo.png";
import UserWall from "./userWall/UserWall";
import UserNotifications from "./userNotif/UserNotifications";
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Badge from '@material-ui/core/Badge';
import Paper from '@material-ui/core/Paper';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import SchoolIcon from '@material-ui/icons/School';
import PolicyIcon from '@material-ui/icons/Policy';
import PersonPinIcon from '@material-ui/icons/PersonPin';
import HomeIcon from '@material-ui/icons/Home';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import SportsEsportsIcon from '@material-ui/icons/SportsEsports';
import NotificactionsIcon from '@material-ui/icons/Notifications';
import UserGames from './userGames/UserGames';

class UserSession extends React.Component {

    constructor(props){
        super(props);
        this.state={
            isUserSignedIn: this.getItemWrapper('isUserSignedIn',false), //false,
            showLogin: true,
            isWallOpened: false,
            isGameListOpened: false,
            isNotificationsOpened: false,
            selectedBlockprobeId: '',
            selectedGameListId: null,
            userId: this.getItemWrapper('userId',''),//'',
            providerId: this.getItemWrapper('providerId',''),//'',
            blockprobes: {},
            posts: [],
            notifications: {},
            areBlockprobesLoading: false,
            tooltip:{
                buildStory: false
            },
            landingPage:{
                journalist:{
                    logo: '',
                    text: 'As a student, you can build games to revise complex subjects and share the game with friends.',
                    background: TeacherBackground
                },
                police:{
                    logo: '',
                    text: 'As a law enforcement agent, detective or police officer, you can build your investigation using blockprobe, visualise your investigation and better engage the general public with your investigation.'
                },
                politician:{
                    logo: '',
                    text: 'As a lawmaker, you can visualise your proposals and laws using blockprobe, and better engage your constituents with your proposals.',
                    background: LawmakerBackground
                },
                teacher:{
                    logo: '',
                    text: 'As a teacher, you can build games for students to enhance the teaching experience in subjects such as history and science using blockprobe.',
                    background: TeacherBackground
                }
            },
            currBackgroundIndex: 0,
            allBackgrounds: [
                'teacher',
                'journalist',
                'politician'
            ],
            tabValue: 0 
        }

        if(this.state.userId == ''){
            this.state.isUserSignedIn = false;
        }
        
        this.getUiConfig = this.getUiConfig.bind(this);
        this.getItemWrapper = this.getItemWrapper.bind(this);
        this.getAndSetUser = this.getAndSetUser.bind(this);
        this.loggedInView = this.loggedInView.bind(this);
        this.loggedInContent = this.loggedInContent.bind(this);
        this.loggedOutView = this.loggedOutView.bind(this);
        this.clickLoginOption = this.clickLoginOption.bind(this);
        this.getBlockprobes = this.getBlockprobes.bind(this);
        this.getBlockprobesShort = this.getBlockprobesShort.bind(this);
        this.getNewBlockprobesTillThisSession = this.getNewBlockprobesTillThisSession.bind(this);
        this.listenToBlockprobesDuringSession = this.listenToBlockprobesDuringSession.bind(this);
        this.updateShortenedBlockprobesListToDb = this.updateShortenedBlockprobesListToDb.bind(this);
        this.selectBlockprobe = this.selectBlockprobe.bind(this);
        this.createBlockprobeList = this.createBlockprobeList.bind(this);
        this.addBlockprobeToList = this.addBlockprobeToList.bind(this);
        this.addNotificationToList = this.addNotificationToList.bind(this);
        this.removeBlockprobeFromList = this.removeBlockprobeFromList.bind(this);
        this.cueCardViewV2 = this.cueCardViewV2.bind(this);
        this.getLatestTimestamp = this.getLatestTimestamp.bind(this);
        this.returnToViewBlockprobes = this.returnToViewBlockprobes.bind(this);
        this.modifyBlockprobe = this.modifyBlockprobe.bind(this);
        this.getUserWall = this.getUserWall.bind(this);
        this.getUserNotifications = this.getUserNotifications.bind(this);
        this.buildUserWall = this.buildUserWall.bind(this);
        this.viewWall = this.viewWall.bind(this);
        this.viewNotifications = this.viewNotifications.bind(this);
        this.viewGameList = this.viewGameList.bind(this);
        this.updatePosts = this.updatePosts.bind(this);
        this.renderGeneralLoggedInView = this.renderGeneralLoggedInView.bind(this);
        this.handleTabChange = this.handleTabChange.bind(this);
        this.changeOpacity = this.changeOpacity.bind(this);
        this.selectGameList = this.selectGameList.bind(this);
        this.onBackButtonPressed = this.onBackButtonPressed.bind(this);
    }

    onBackButtonPressed(){
        if(this.state.selectedBlockprobeId != '' || this.state.isNotificationsOpened){
            this.returnToViewBlockprobes();
        }

        if(this.state.isGameListOpened){
            if(this.state.selectedGameListId == null){
                this.returnToViewBlockprobes();
            }
            else{
                //Go to all game lists only
                this.setState({
                    selectedGameListId: null
                })
            }
        }
    }

    selectGameList(listId){
        this.setState({
            selectedGameListId: listId
        });
    }

    getItemWrapper(key, defaultVal){
        if(!isNullOrUndefined(localStorage.getItem(key))){
            return localStorage.getItem(key);
        }
        return defaultVal;
    }

    getUiConfig(){
        let uiConfig = {
            signInFlow: "popup",
            signInOptions: [
                {
                    provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
                    defaultCountry: 'IN'                
                }            
            ],
            callbacks:{
              signInSuccess: () => false,
              signInSuccessWithAuthResult: function(authResult, redirectUrl) {
                
                //...
              }      
            }
          }

        if(window.innerWidth > 768){
            uiConfig.signInOptions.push(firebase.auth.GoogleAuthProvider.PROVIDER_ID);
            uiConfig.signInOptions.push(firebase.auth.EmailAuthProvider.PROVIDER_ID);
        }
        return uiConfig;
    }

      clickLoginOption(){
          this.setState({
              showLogin: true
          });
      }

      returnToViewBlockprobes(){
          this.setState({
              selectedBlockprobeId: '',
              isWallOpened: false,
              isNotificationsOpened: false,
              isGameListOpened: false
          });
      }

      viewWall(){
          this.setState({
              isWallOpened: true,
              isNotificationsOpened: false,
              selectedBlockprobeId: '',
              isGameListOpened: false
          });
      }

      viewNotifications(){
            this.setState({
                isWallOpened: false,
                isNotificationsOpened: true,
                selectedBlockprobeId: '',
                isGameListOpened: false
            });
      }

      viewGameList(){
        this.setState({
            isWallOpened: false,
            isNotificationsOpened: false,
            selectedBlockprobeId: '',
            isGameListOpened: true
        });
      }

      addBlockprobeToList(doc){
        var blockprobeDic = this.state.blockprobes;
        var newBlockprobe = {
            id: doc.id,
            title: doc.title,
            summary: doc.summary,
            timestamp: doc.timestamp,
            isActive: doc.isActive,
            active: doc.active,
            permit: doc.permit
        };
        if(newBlockprobe.permit ==  "EXIT")
        {
            delete blockprobeDic[doc.id];
        }
        else
            blockprobeDic[doc.id]=newBlockprobe;
        this.setState({
            blockprobes:blockprobeDic
        });
      }

      removeBlockprobeFromList(doc){
        var blockprobeDic = this.state.blockprobes;
        if(doc.id in blockprobeDic)
        {
            delete blockprobeDic[doc.id];
        }
        this.setState({
            blockprobes:blockprobeDic
        });
      }

      createBlockprobeList(snapshot){
          snapshot.forEach((doc) => ( this.addBlockprobeToList(doc))); 
      }

      getBlockprobes(){
        if(this.state.isUserSignedIn && (this.state.selectedBlockprobeId == '')){
            this.setState({areBlockprobesLoading: true});                       
                this.getBlockprobesShort();
        }
      }

    getLatestTimestamp(snapshot){
        let timestampLatest = 0;
        snapshot.forEach((doc) => { 
            let data = doc.data().blockprobe;
            for(let i=0; data && i<data.length; i++){
                if(data[i].timestamp)
                    timestampLatest = Math.max(timestampLatest, data[i].timestamp);
            }
        }); 
        return timestampLatest;
      }

    addNotificationToList(notification, shouldAdd){
        let notifications = this.state.notifications;
        let id = notification['id'];
        if(isNullOrUndefined(id))
            return;
        if(shouldAdd){
            //notification.add(notification);
            notifications[id] = notification;
        }
        else{
            if(id in notifications)
                delete notifications[id];            
        }
        this.setState({
            notifications: notifications
        });
    }

    getUserNotifications(){
        let scope = this;
        firebase.firestore().collection("Users").doc(this.state.userId)
        .collection("notifications").onSnapshot(
            querySnapshot => {
                querySnapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        let data = change.doc.data();
                        if(data){
                            this.addNotificationToList(data,true);
                        }
                        //console.log('New block: ', change.doc.data().timestamp);
                    }
                    else if (change.type == 'removed'){
                        let data = change.doc.data();
                        if(data){
                            this.addNotificationToList(data,false);
                        }
                    }
                }); 
            });
    }

    getUserWall(){
        firebase.firestore().collection("publicWall").doc(this.state.userId).
        collection("userPosts").get().then((snapshot) => {
                this.buildUserWall(snapshot);
        });
    }
    
    buildUserWall(snapshot){
        let postList = [];
        snapshot.forEach((doc) => {
                let data =doc.data();
                for(let i=0; data && data.posts && i<data.posts.length;i++){
                    postList.push(data.posts[i]);
                }
            });   
        this.setState({
            posts: postList
        });        
    }

      updateShortenedBlockprobesListToDb(){
        let allBlockprobes = Utils.getShortenedListOfBlockprobes(this.state.blockprobes);
        if(allBlockprobes &&  allBlockprobes.length>0){
            firebase.firestore().collection("Users").doc(this.state.userId)
                    .collection("shortBlockprobes").get().then((snapshot) => {
                    
                snapshot.forEach((doc) => {
                        var ref = firebase.firestore().collection("Users").doc(this.state.userId)
                        .collection("shortBlockprobes").doc(doc.id).delete();
                    });
                    
                for(var i=0; i<allBlockprobes.length; i++){
                    firebase.firestore().collection("Users").doc(this.state.userId)
                    .collection("shortBlockprobes").doc(String(i)).set(allBlockprobes[i]);        
                }       
                });
        }
      }

      listenToBlockprobesDuringSession(latestTimestamp){
            firebase.firestore().collection("Users").doc(this.state.userId)
            .collection("blockprobes").where("timestamp", ">", latestTimestamp).orderBy("timestamp").onSnapshot(
                querySnapshot => {
                    querySnapshot.docChanges().forEach(change => {
                        if (change.type === 'added') {
                            let data = change.doc.data();
                            if(data){
                                this.addBlockprobeToList(data);
                            }
                            //console.log('New block: ', change.doc.data().timestamp);
                        }
                        else if (change.type == 'modified'){
                            let data = change.doc.data();
                            if(data){
                                this.addBlockprobeToList(data);
                            }
                        }
                    }); 
                });
      }

     getNewBlockprobesTillThisSession(latestTimestamp){

        let currTime = Date.now();
        //Get short blockprobes
        firebase.firestore().collection("Users").doc(this.state.userId)
        .collection("blockprobes").where("timestamp", ">", latestTimestamp).where("timestamp", "<=", currTime).
        orderBy("timestamp").get().then((snapshot) => {
                                
            snapshot.forEach((doc) => {
                let data = doc.data();
                if(data){
                    this.addBlockprobeToList(data);
                }
            });

            this.updateShortenedBlockprobesListToDb();
            this.setState({
                areBlockprobesLoading: false
            });
            this.listenToBlockprobesDuringSession(currTime);
        });          
    }

      getBlockprobesShort(){         
        //Get short blockprobes
        firebase.firestore().collection("Users").doc(this.state.userId)
                                    .collection("shortBlockprobes").get().then((snapshot) => {

                                let latestTs = this.getLatestTimestamp(snapshot);                                 
                                let allBlockprobes = [];
                                snapshot.forEach((doc) => {
                                        let data = doc.data();
                                        if(data.blockprobe){
                                            for(let i=0; i<data.blockprobe.length; i++){
                                                allBlockprobes.push(data.blockprobe[i]);
                                                this.addBlockprobeToList(data.blockprobe[i]);
                                            }
                                        }
                                    });
                                this.getNewBlockprobesTillThisSession(latestTs);                                
                                });                                                      
      }

      selectBlockprobe(blockprobeId, buildStory){
          var tooltip = this.state.tooltip;
          tooltip.buildStory = buildStory;
          this.setState({
              selectedBlockprobeId: blockprobeId,
              isWallOpened: false,
              isNotificationsOpened: false,
              isGameListOpened: false,
              tooltip: tooltip
          })

      }

      getAndSetUser(){
        if(this.state.isUserSignedIn){
            var uId = this.state.userId;
            var scope = this;
            firebase.firestore().collection("Users").
                doc(this.state.userId).get().then(function(doc) {
                    if (!doc.exists) {
                        
                        var userData = {
                            ID: uId
                        };
                        firebase.firestore().collection("Users").
                                doc(uId).set(userData);
                        var tooltip = scope.state.tooltip;

                        //Toggle tooltip here for new logins
                        tooltip.buildStory = false; //true;
                        scope.setState({tooltip: tooltip});
                    }
                    else{
                        // console.log(doc.data());
                       /* var tooltip = scope.state.tooltip;
                        tooltip.buildStory = true;
                        console.log(tooltip);
                        scope.setState({tooltip: tooltip});
                        */
                    }
                });
        }
      }

      async logout(){
        await firebase.auth().signOut();
        await localStorage.setItem('isUserSignedIn',false);
        await localStorage.removeItem('userId');
        await localStorage.removeItem('providerId');
        await this.setState({
            isUserSignedIn: false,
            isWallOpened: false,
            isNotificationsOpened: false,
            isGameListOpened: false
        });        
        window.location.href = "/";
      }

      componentDidMount(){

        if(this.state.isUserSignedIn){
            this.getAndSetUser();
            this.getBlockprobes();
            this.getUserWall();
            this.getUserNotifications();
        }

            firebase.auth().onAuthStateChanged(user =>{

                var oldState = this.state.isUserSignedIn;
                this.setState({
                    isUserSignedIn: !!user
                });
                localStorage.setItem('isUserSignedIn',!!user);

                var providerId = '';
                var uId = '';
                
                if(!isNullOrUndefined(firebase.auth().currentUser) && 
                !isNullOrUndefined(firebase.auth().currentUser.providerData) &&
                firebase.auth().currentUser.providerData.length>0){
                    providerId = firebase.auth().currentUser.providerData[0].providerId;
                }
                if(providerId=="phone"){
                    uId = firebase.auth().currentUser.phoneNumber;
                }
                else if(providerId=='google.com'){
                    uId = firebase.auth().currentUser.email;
                }
                else if(providerId=='password'){
                    uId = firebase.auth().currentUser.email;
                }

                this.setState({
                    providerId: providerId,
                    userId: uId
                });
                localStorage.setItem('providerId',providerId);
                localStorage.setItem('userId',uId);
            // console.log(firebase.auth().currentUser);

                if(!!user && !isNullOrUndefined(firebase.auth().currentUser) && !oldState){
                    
                    this.getAndSetUser();
                    this.getBlockprobes();
                    this.getUserWall();
                    this.getUserNotifications();
                }
            });

      }

      updatePosts(posts){
         DbUtils.writePostListToDb(posts, this.state.userId);
          this.setState({
              posts: posts
          });
      }

      async modifyBlockprobe(type, blockprobe){
          if(type=='update'){
             // console.log('Users/'+ this.state.userId +'/blockprobes/'+blockprobe.id);
             // console.log(blockprobe);
                await firebase.firestore().collection('Users').doc(this.state.userId)
                    .collection('blockprobes').doc(blockprobe.id).set(blockprobe);
          }
      }

      renderGeneralLoggedInView(){
          if(this.state.isWallOpened){
              return (
                  <UserWall
                    posts = {this.state.posts}
                    isPrivate = {true}
                    updatePosts={this.updatePosts}
                  />
              );
          }
          else if(this.state.isNotificationsOpened){
              return (
                  <UserNotifications
                    notifications = {this.state.notifications}
                    userId = {this.state.userId}
                    />
              );
          }
          else if(this.state.isGameListOpened){
              return (
                <UserGames 
                    userId = {this.state.userId}
                    selectedUserGame = {this.state.selectedGameListId}
                    selectGameList = {this.selectGameList}
                />
              );
          }

          return(
            <UserBlockprobesComponent 
                blockprobes={this.state.blockprobes}
                selectedBlockprobe = {this.state.selectedBlockprobeId}
                selectBlockprobe = {this.selectBlockprobe}
                uId={this.state.userId}
                buildStorytooltip={this.state.tooltip.buildStory}
                />
          );
      }

      loggedInContent(){
         // console.log(this.state.blockprobes);
         if(this.state.userId!=''){
            return (
                <div className="blockprobe-list-container">
                    {this.state.blockprobes?
                    <div>
                        {this.state.areBlockprobesLoading?
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
                                    {this.renderGeneralLoggedInView()}
                                </div>
                        }
                    </div>
                        : 
                    null                  
                }
                </div>
            );
        }

        return null;
      }


      //<Button color="inherit" onClick={() => this.viewWall()}>Wall</Button>
      loggedInView(){
          
        let notificationNumber = null;
        if(Object.keys(this.state.notifications).length > 0)
            notificationNumber = Object.keys(this.state.notifications).length;

          return (
            <div>
                <div style={{display: 'block'}}>
                <header className="toolbar">
                    <AppBar position="static">
                        <Toolbar> 
                            {this.state.selectedBlockprobeId != '' || this.state.isGameListOpened || this.state.isNotificationsOpened?
                                <IconButton color="inherit" onClick={() => this.onBackButtonPressed()}>
                                    <ArrowBackIcon/>
                                </IconButton> 
                                :
                                null 
                            } 
                        <Typography className="toolbar__logo">
                            Blockprobe
                        </Typography>                      
                        <div style={{flexGrow: '1'}}></div>
                        <IconButton color="inherit" onClick={() => this.returnToViewBlockprobes()}>
                            <HomeIcon/>
                        </IconButton>  
                        <IconButton color="inherit" onClick={() => this.viewGameList()}>
                            <SportsEsportsIcon/>
                        </IconButton>                      
                        <IconButton color="inherit" onClick={() => this.viewNotifications()}>
                            <Badge badgeContent={notificationNumber} color="secondary">
                                <NotificactionsIcon />
                            </Badge>                           
                        </IconButton>                        
                        <Typography className="userName">
                            {this.state.userId}
                        </Typography>
                        <Button color="inherit" onClick={() => this.logout()}>Logout</Button>
                        </Toolbar>
                    </AppBar>                   
                </header>
                </div>
                <div>
                <div className="logged-in-content">
                    {this.state.selectedBlockprobeId == '' || !(this.state.selectedBlockprobeId in this.state.blockprobes)?
                        this.loggedInContent()
                        :
                        <div className="blockprobe-list-container">
                        <ViewBlockprobePrivateComponent 
                            bId={this.state.selectedBlockprobeId} 
                            uId={this.state.userId}
                            permit={this.state.blockprobes[this.state.selectedBlockprobeId].permit}
                            buildStorytooltip={this.state.tooltip.buildStory}
                            prevTitle={this.state.blockprobes[this.state.selectedBlockprobeId].title}
                            currBlockprobe={this.state.blockprobes[this.state.selectedBlockprobeId]}
                            modifyBlockprobe={this.modifyBlockprobe}
                            posts={this.state.posts}
                            updatePosts={this.updatePosts}/>
                        </div>    
                    }
                </div>
                </div>
            </div>
          );
      }

      cueCardViewV2(icon, content){
        return(
            <div className="cue-card-container-v2" style={{width:'100%', display:'flex'}}>
                <div style={{padding:'10px 10px 10px 10px'}}>
                    <div className="cue-card-text" style={{fontFamily: 'Lora, bold-italic', textAlign:'justify'}}>
                            {content}
                    </div>
                </div>
            </div>              
            );
      }

      handleTabChange(event, newValue){
        this.setState({
            tabValue: newValue,
            currBackgroundIndex: newValue
        });
      }

      /*
      OLD TEXT
      <div style={{fontFamily: 'Lora, bold-italic', textAlign:'justify', marginTop:'20px'}}>
                                    For example, a story on Nirav Modi has been built using the tool. You can view it <a href='https://blprobe.com/view/6790279f4c45b5c9ff7e4f90f2b398eca2a3eb296bcc82604a3def599865b782' target='blank'>here</a>.
                                </div>
                                <div style={{fontFamily: 'Lora, bold-italic', textAlign:'justify', marginTop:'20px'}}>
                                    A brief history of Otto von Bismarck has been built using the tool. You can view it <a href='https://blprobe.com/view/09f190bf8d3e2f71ea2463c8ce98e68639080fd3ce3d3021fb04d17e62215ead' target='blank'>here</a>.
                                </div>
                                <div style={{fontFamily: 'Lora, bold-italic', textAlign:'justify', marginTop:'20px'}}>
                                    To use blockprobe, login with your mobile and get started!
                                </div>
      */

      changeOpacity(index){  
        try{
            document.querySelector(".teacherImage").style.opacity = 0;
            document.querySelector(".journalistImage").style.opacity = 0;
            document.querySelector(".politicianImage").style.opacity = 0;

            let selectedStr ="." + this.state.allBackgrounds[index] + "Image";
            document.querySelector(selectedStr).style.opacity = 1;
        }
        catch(e){

        }
      }

      loggedOutView(){
          var url = 'https://blockprobe-32644.firebaseapp.com/';
          var mainLogoList = [MainLogo]
          let imgUrl = this.state.landingPage[this.state.allBackgrounds[this.state.currBackgroundIndex]].background;
          let currDetails = this.state.landingPage[this.state.allBackgrounds[this.state.currBackgroundIndex]];
          this.changeOpacity(this.state.currBackgroundIndex);
          return (
              <div>                
                <main style={{height:'100vh',overflow:'hidden'}}>
                
                    <div style={{height:'100vh',overflow:'auto'}}>
                        <img class="background-image teacherImage" src={TeacherBackground}></img>
                        <img class="background-image journalistImage" src={TeacherBackground}></img>
                        <img class="background-image politicianImage" src={LawmakerBackground}></img>
                        <GoogleFontLoader
                            fonts={[
                                {
                                font: 'Roboto',
                                weights: [400, '400i'],
                                },
                                {
                                font: 'Roboto Mono',
                                weights: [400, 700],
                                },
                                {
                                    font: 'Bungee Inline',
                                    weights: [400]
                                },
                                {
                                    font:'Lora',
                                    weights: [400]
                                }
                            ]}
                            subsets={['cyrillic-ext', 'greek']}
                            />                        

                        <div className="landing-view-container">                       
                        <div style={{paddingTop:'10px', textAlign:'center'}}>
                                    <Img src={mainLogoList}
                                    style={{width:'180px', marginTop:'-20px'}}></Img>
                                </div>
                                <div style={{fontFamily: 'Lora, bold-italic', textAlign:'center', fontSize: '18px', fontWeight:'bold', marginTop:'-20px'}}><span>Enhance the learning experience by creating games!</span></div>
                                <div className="lpTabContainer">
                                    <Paper square className="lpTabPaper">
                                        <Tabs
                                            value={this.state.tabValue}
                                            onChange={this.handleTabChange}
                                            variant="fullWidth"
                                            indicatorColor="primary"
                                            textColor="primary"
                                            aria-label="icon tabs example"
                                        >
                                            <Tab icon={<SchoolIcon />} value={0} aria-label="phone" label="TEACHERS"/>
                                            <Tab icon={<PersonPinIcon />} value={1} aria-label="person" label="STUDENTS"/>                                            
                                        </Tabs>
                                    </Paper>
                                </div>
                                <div style={{marginTop:'16px'}}>
                                    {this.cueCardViewV2(currDetails.logo, currDetails.text)}
                                </div>                        
                                {this.state.showLogin?
                                <div className="user-session-login-container-v2">                                     
                                    <div className='user-session-shadow-view-v2'>
                                        <div>
                                            <span className="userSessionLoginHeader">Login</span>
                                        </div>                                        
                                        <StyleFirebaseAuth
                                        uiConfig={this.getUiConfig()}
                                        firebaseAuth={firebase.auth()}                            
                                        />
                                    </div>
                                </div> : 
                                    null 
                                }
                                <div style={{marginTop:'3%'}}>
                                    <a style={{fontFamily: 'Roboto, sans-serif', margin:'3%'}} href="https://sites.google.com/view/blockprobe/quickstart" target="blank">Quickstart</a>
                                    <a style={{fontFamily: 'Roboto, sans-serif', margin:'3%'}} href="https://sites.google.com/view/blockprobe/home" target="blank">About</a>
                                    <a style={{fontFamily: 'Roboto, sans-serif', margin:'3%'}} href="https://sites.google.com/view/blockprobe/privacy-policy" target="blank">Privacy Policy</a>
                                    <a style={{fontFamily: 'Roboto, sans-serif', margin:'3%'}} href="https://sites.google.com/view/blockprobe/terms-of-service" target="blank">Terms of Service</a>                                    
                                </div>                                
                            </div>
                            <div>                                                    
                            </div>
                        </div>
                        
                </main>
              </div>
          );
      }
      /*
      <div className='shareContainer'>
                                    <div className='shareIcons'>
                                        <FacebookShareButton                        
                                            children={<FacebookIcon round={true}/>} 
                                            url={url} 
                                            hashtag = '#blockprobe'/>
                                    </div>
                                    <div className='shareIcons'>
                                        <WhatsappShareButton
                                            children={<WhatsappIcon round={true}/>} 
                                            url={url} 
                                        />
                                    </div>
                                </div>
                                */
    render(){
        return (
            <div>
                {this.state.isUserSignedIn?
                    this.loggedInView()
                        :
                    this.loggedOutView()
                }
            </div>
        );
    }


}
export default UserSession;