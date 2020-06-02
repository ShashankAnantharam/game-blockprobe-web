import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import * as firebase from 'firebase';
import 'firebase/firestore';
import ReactGA from 'react-ga';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import AddIcon from '@material-ui/icons/Add';
import ClearIcon from '@material-ui/icons/Clear';
import DoneAllIcon from '@material-ui/icons/DoneAll';
import Loader from 'react-loader-spinner';
import Textarea from 'react-textarea-autosize';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import  * as Utils from '../common/utilSvc';
import './UserBlockprobes.css';
import Joyride,{ ACTIONS, EVENTS, STATUS } from 'react-joyride';

class UserBlockprobesComponent extends React.Component {

    constructor(props){
        

        //Probs include blockprobes, selectBlockprobe, selectedBlockprobe
        super(props);


        this.maxBlockprobeTitleChar = 160;


        this.state={
            uIdHash:'',
            shajs:null,
            addBlockprobe: false,
            draftBlockprobe: {
                title:'',
                summary:''
            },
            toolTipSteps:{
                createStoryStep: [
                    {
                        title: 'Click on \'Create new story\' to get started!',
                        target: '.addBlockprobeButton',
                        content: '',
                        placement: 'center',
                        disableBeacon: true
                    }/*,
                    {
                        title: 'Get started!',
                        target: '.addBlockprobeButton',
                        content: 'Click to create new story and get started! A story could be an investigation of a crime, an article for a newspaper or a policy proposal.',
                        placementBeacon: 'left',
                        disableBeacon: true
                    } */                               
                ],
                clickOnStoryStep: [
                    {                    
                        title: 'Great! Now click on your new story!',
                        target: '.blockprobeListTooltip',
                        content: 'Let\'s go right to it!',
                        disableBeacon: true                    
                    }
                ]
            },
            showToolTips:{
                createStory: JSON.parse(JSON.stringify(props.buildStorytooltip)),
                addTitleAndSummary: false,
                clickOnStory: false,
                clickOnStoryEnabler: false,
                buildStory: JSON.parse(JSON.stringify(props.buildStorytooltip))
            },
            isBlockprobeBeingCreated: false
        };

        var shajs = require('sha.js');
        this.state.uIdHash = shajs('sha256').update(this.props.uId).digest('hex');
        this.state.shajs = shajs;

        ReactGA.initialize('UA-143383035-1');   
        ReactGA.pageview('/userBlockProbes');

        this.isValidBlockprobe = this.isValidBlockprobe.bind(this);
        this.renderSingleBlockprobeItem = this.renderSingleBlockprobeItem.bind(this);
        this.addCancelBlockprobe = this.addCancelBlockprobe.bind(this);
        this.renderDraftBlockprobe = this.renderDraftBlockprobe.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.startTooltipTour = this.startTooltipTour.bind(this);
        this.createBlockprobe = this.createBlockprobe.bind(this);
        this.handleCreateStoryJoyrideCallback = this.handleCreateStoryJoyrideCallback.bind(this);
        this.handleClickOnStoryJoyrideCallback = this.handleClickOnStoryJoyrideCallback.bind(this);
        this.convertBlockprobeMapToList = this.convertBlockprobeMapToList.bind(this);
    }

    selectBlockprobe(blockprobeId){
        ReactGA.event({
            category: 'blockprobe_opened',
            action: 'Blockprobe Opened',
            label: String(blockprobeId)
          });
        this.props.selectBlockprobe(blockprobeId, this.state.showToolTips.buildStory);
    }

    handleClickOnStoryJoyrideCallback(data){
        const {action,index,status,type} = data;
        if([STATUS.FINISHED, STATUS.SKIPPED].includes(status)){
            var showToolTips = this.state.showToolTips;
            showToolTips.createStory = false;
            showToolTips.addTitleAndSummary = false;
            showToolTips.clickOnStory = true;
            showToolTips.clickOnStoryEnabler = false;
            this.setState({ showToolTips: showToolTips });
            ReactGA.event({
                category: 'read_clickOnStory_tooltip',
                action: 'Closed clickOnStory tooltip',
                label: 'close clickOnStory tooltip'
              });
        }  
    }

    handleCreateStoryJoyrideCallback(data){
        const {action,index,status,type} = data;
        if([STATUS.FINISHED, STATUS.SKIPPED].includes(status)){
            var showToolTips = this.state.showToolTips;
            showToolTips.createStory = false;
            showToolTips.addTitleAndSummary = true;
            showToolTips.clickOnStory = false;
            this.setState({ showToolTips: showToolTips });
            ReactGA.event({
                category: 'read_initial_tooltip',
                action: 'Closed initial tooltip',
                label: 'close initial tooltip'
              });
        }
    }


    renderSingleBlockprobeItem(blockprobe, scope){
        //console.log(blockprobe);
        return (
                <ListItem button 
                    selected={scope.props.selectedBlockprobe == blockprobe.id}
                    onClick={() => { scope.selectBlockprobe(blockprobe.id)}}
                    style={{width:'100%'}}
                    >
                    <ListItemText primary={blockprobe.title} secondary={blockprobe.summary}/>
                </ListItem>
        );
    }

    async createBlockprobe(){

        this.setState({isBlockprobeBeingCreated: true});

        var timestamp = Date.now();

        var firstBlock = {
            key:'',
            title:this.state.draftBlockprobe.title,
            summary:this.state.draftBlockprobe.summary,
            entities:[],
            evidences:[],
            actionType:'genesis',
            previousKey: "0",
            referenceBlock: '',
            timestamp: timestamp,
            verificationHash: ''
        }

        var newBlockId = this.state.shajs('sha256').update(this.state.uIdHash+String(timestamp)).digest('hex');
        firstBlock.verificationHash = newBlockId;
        firstBlock.key = this.state.shajs('sha256').update(newBlockId + firstBlock.previousKey).digest('hex');
        var blockprobeId = firstBlock.key;

        var details = {
            active: true,
            criterion: 0,
            isActive: true,
            reviewers: [{ id: this.state.uIdHash, nick: 'creator'}],
            summary: this.state.draftBlockprobe.summary,
            title: this.state.draftBlockprobe.title
        }

        var softBlockprobe = {
            active: true,
            id: blockprobeId,
            isActive: true,
            permit:'CREATOR',
            summary: this.state.draftBlockprobe.summary,
            title: this.state.draftBlockprobe.title,
            timestamp: timestamp
        }

        var nickPhoneHash = {
        };
        nickPhoneHash["creator"]= this.props.uId;

        let userDetails = {
            id: this.props.uId,
            role: 'CREATOR'
        }

        // console.log('Blockprobes/'+ blockprobeId +'/isActive/');
        await firebase.database().ref('Blockprobes/'+ blockprobeId +'/users/'+this.state.uIdHash).set(userDetails); 

        // console.log('Blockprobes/'+ blockprobeId +'/fullBlocks/'+blockprobeId);
        // console.log(firstBlock);
        await firebase.firestore().collection('Blockprobes').doc(blockprobeId)
        .collection('fullBlocks').doc(blockprobeId).set(firstBlock);

        // console.log('Users/'+ this.props.uId +'/blockprobes/'+blockprobeId);
        // console.log(softBlockprobe);
        await firebase.firestore().collection('Users').doc(this.props.uId)
        .collection('blockprobes').doc(blockprobeId).set(softBlockprobe);
       
        // console.log('Blockprobes/'+blockprobeId);
        // console.log(details);
        await firebase.firestore().collection('Blockprobes').doc(blockprobeId).set(details);
       
       // console.log('Users/'+this.props.uId +"/blockprobes/"+blockprobeId+
       // "/privelegedInfo/nickPhoneHash");
       // console.log(nickPhoneHash);
        
        await firebase.firestore().collection('Users').doc(this.props.uId)
        .collection('blockprobes').doc(blockprobeId).
        collection('privelegedInfo').doc('nickPhoneHash').set(nickPhoneHash);        

        this.addCancelBlockprobe(true);

        ReactGA.event({
            category: 'blockprobe',
            action: 'Create blockprobe',
            label: blockprobeId
          });
        
          this.setState({isBlockprobeBeingCreated: false});
          this.selectBlockprobe(blockprobeId);
    }

    isValidBlockprobe(){
        if(this.state.draftBlockprobe.title.trim() == '')
            return false;
        return true;
    }

    renderDraftBlockprobe(){
        var draftBlockprobeSteps = [
            ];
        if(this.state.addBlockprobe){
            return (
                <div style={{}}>
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
                    steps={draftBlockprobeSteps}
                    run = {this.state.showToolTips.addTitleAndSummary}
                    />
                    <form className="newBlockprobeForm">
                        <label>
                            <TextField 
                                type="text"
                                label = "Game title"
                                variant="outlined"
                                value={this.state.draftBlockprobe.title}
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
                    {this.isValidBlockprobe()?
                        <Button
                        className="submitBlockprobeButton"
                        color="primary"
                        variant="contained"
                        onClick={this.createBlockprobe}>
                            Confirm
                        </Button>                    
                    :
                        null
                    }
                </div>
            );
        }

        return null;
    }

    handleChange(event, type) {

        var shouldUpdate = true;
      
        let newStr = event.target.value;
        if(!Utils.shouldUpdateText(newStr, '\n\t'))
            shouldUpdate=false;

        if(shouldUpdate){
            var blockProbe = this.state.draftBlockprobe;
            if(type=="title"){
                    blockProbe.title = event.target.value;
                    blockProbe.title = blockProbe.title.substring(0, this.maxBlockprobeTitleChar - 1);
                    this.setState({draftBlockprobe: blockProbe});
                }
            else if(type=="summary"){
                    blockProbe.summary = event.target.value;
                    this.setState({draftBlockprobe: blockProbe});
                }
            }
        
    }

    addCancelBlockprobe(isSubmit){
        var addBlockprobe = this.state.addBlockprobe;

        var draftBlockprobe = this.state.draftBlockprobe;
        var showToolTips = this.state.showToolTips;

        if(addBlockprobe){
            //cancel or submit pressed
            draftBlockprobe = {
                title:'',
                summary:''
            };
            if(showToolTips.addTitleAndSummary && isSubmit){
                showToolTips.createStory = false;
                showToolTips.addTitleAndSummary = false;
                showToolTips.clickOnStory = true;
                showToolTips.clickOnStoryEnabler = true;
            }
        }
        else{
            if(showToolTips.createStory){
                showToolTips.createStory = false;
                showToolTips.addTitleAndSummary = true;
                showToolTips.clickOnStory = false;
                showToolTips.clickOnStoryEnabler = false;
            }
            ReactGA.event({
                category: 'clicked_on_create_story',
                action: 'Clicked on create story',
                label: 'Clicked on create story'
              });
        }

        
        this.setState({
            addBlockprobe: !addBlockprobe,
            draftBlockprobe: draftBlockprobe,
            showToolTips: showToolTips
        });
        
    }

    startTooltipTour(){
        var showToolTips = this.state.showToolTips;
        if(!showToolTips.createStory && !showToolTips.clickOnStory){
            //start tooltips
            showToolTips.createStory = true;
            showToolTips.addTitleAndSummary = false;
            showToolTips.clickOnStory = false;
            showToolTips.buildStory = true;
            this.setState({
                showToolTips: showToolTips
            });
        }
        else if(showToolTips.clickOnStory){
            showToolTips.clickOnStoryEnabler = true;
            this.setState({
                showToolTips: showToolTips
            });
        }
    }

    componentWillReceiveProps(newProps){
        if(newProps.buildStorytooltip != this.props.buildStorytooltip){
            var showTooltips = this.state.showToolTips;
            showTooltips.createStory = JSON.parse(JSON.stringify(newProps.buildStorytooltip));
            this.setState({showToolTips:showTooltips});
        }
    }

    componentDidMount(){
        /*
        <!-- Event snippet for Blockprobe game Sign-up conversion page -->
            <script>
            gtag('event', 'conversion', {'send_to': 'AW-734513637/vgqMCLPGvdIBEOWTn94C'});
            </script>

        */
        const script = document.createElement("script");
        const scriptText = document.createTextNode("gtag('event', 'conversion', {'send_to': 'AW-734513637/vgqMCLPGvdIBEOWTn94C'});");
        script.appendChild(scriptText);
        document.head.appendChild(script);

        const scriptFb = document.createElement("script");
        const scriptFbText = document.createTextNode("fbq('track', 'ViewContent', {value: 1, content_type: 'login', currency: 'INR', content_id:'1', product:'none'});");
        scriptFb.appendChild(scriptFbText);
        document.head.appendChild(scriptFb);


    }

    convertBlockprobeMapToList(blockprobeMap){
        var blockprobeTempList = [];
        for (var blockprobeId in blockprobeMap) {
            // check if the property/key is defined in the object itself, not in parent
            if (blockprobeId in blockprobeMap) {           
                blockprobeTempList.push(blockprobeMap[blockprobeId]);
            }
        }
        blockprobeTempList.sort(function(a, b){if(a.title.toLowerCase()>b.title.toLowerCase()){return 1} return -1;});
        return blockprobeTempList;
    }

    render(){

        const scope = this;
        //console.log(this.props.blockprobes)

        var blockprobeTempList = this.convertBlockprobeMapToList(scope.props.blockprobes);

        const blockprobeListRender = blockprobeTempList.map((blockprobe) => 
                    (scope.renderSingleBlockprobeItem(blockprobe, scope)));

/*        const blockprobeListRender = Object.keys(this.props.blockprobes).
        map((blockprobeId) => (
            scope.renderSingleBlockprobeItem(blockprobe, scope)
        ));
*/
        return (
            <div>
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
                steps={this.state.toolTipSteps.createStoryStep}
                run = {this.state.showToolTips.createStory}                
                  callback = {this.handleCreateStoryJoyrideCallback}
                />
                <h2 style={{textAlign:'center'}}>My games</h2>
                {this.state.isBlockprobeBeingCreated?
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
                        <div>
                            <div style={{flexWrap: 'wrap',  display:'flex'}}>
                                <div>
                                    <Button 
                                            className="addBlockprobeButton" 
                                            color="primary"
                                            variant="contained"
                                            onClick={() => this.addCancelBlockprobe(false)}>
                                            {!this.state.addBlockprobe?
                                            <div>Create new game</div>
                                            :
                                            <div>Cancel</div>
                                            }
                                    </Button>
                                </div>
                                <div style={{display:'none'}}>
                                    <Button
                                        className="startTooltipsButton" 
                                        color="primary"
                                        variant="contained"
                                        onClick={() => this.startTooltipTour()}>
                                        Guided tutorial
                                    </Button>
                                </div>
                            </div>
                            {this.state.addBlockprobe?
                                this.renderDraftBlockprobe()
                                :
                                null
                            }
                        </div>

                        {Object.keys(this.props.blockprobes).length == 0?
                            <div>
                                    <div style={{padding:'15px'}}>
                                    <p className="emptyListText">
                                        Click on <span className="emptyListTextEmphasisStory">Create new game</span> and get started.<br/><br/>                                        
                                    </p>
                                    </div>
                            </div>                       
                            :
                            <List className="blockprobeListTooltip">  
                            <Joyride
                                styles={{
                                    options: {
                                    arrowColor: '#e3ffeb',
                                    beaconSize: '3em',
                                    primaryColor: '#05878B',
                                    backgroundColor: '#e3ffeb',
                                    overlayColor: 'rgba(10, 10, 10, 0.4)',
                                    width: 900,
                                    zIndex: 1000,
                                    }
                                }}
                                    steps={this.state.toolTipSteps.clickOnStoryStep}
                                    run = {false}//this.state.showToolTips.clickOnStory && this.state.showToolTips.clickOnStoryEnabler}
                                    callback = {this.handleClickOnStoryJoyrideCallback}                    
                                    />                                            
                                        {blockprobeListRender}                                                                                                
                            </List>
                            }
                    </div>
                }                
            </div>
        );
    }


}
export default UserBlockprobesComponent;