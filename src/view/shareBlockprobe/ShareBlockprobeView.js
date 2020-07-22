import React, { Component } from 'react';
import './ShareBlockprobe.css';
import * as firebase from 'firebase';
import 'firebase/firestore';
import Loader from 'react-loader-spinner';
import LimitSharedUsersComponent from './LimitSharedUsers';
import Button from '@material-ui/core/Button';
import * as Utils from '../../common/utilSvc';
import * as DbUtils from "../../common/dbSvc";
import {
    FacebookShareButton,
    LinkedinShareButton,
    TwitterShareButton,
    TelegramShareButton,
    WhatsappShareButton,
    PinterestShareButton,
    VKShareButton,
    OKShareButton,
    RedditShareButton,
    TumblrShareButton,
    LivejournalShareButton,
    MailruShareButton,
    ViberShareButton,
    WorkplaceShareButton,
    LineShareButton,
    PocketShareButton,
    InstapaperShareButton,
    EmailShareButton,
  } from 'react-share';
  import {
    FacebookIcon,
    TwitterIcon,
    TelegramIcon,
    WhatsappIcon,
    LinkedinIcon,
    PinterestIcon,
    VKIcon,
    OKIcon,
    RedditIcon,
    TumblrIcon,
    LivejournalIcon,
    MailruIcon,
    ViberIcon,
    WorkplaceIcon,
    LineIcon,
    PocketIcon,
    InstapaperIcon,
    EmailIcon,
  } from 'react-share';
import { timingSafeEqual } from 'crypto';
import Info from '@material-ui/icons/Info';
import Joyride,{ ACTIONS, EVENTS, STATUS } from 'react-joyride';


class ShareBlockprobeComponent extends React.Component {

    constructor(props){
      super(props);
      this.state = {
          urlPrefix: 'https://blprobe.com/view/',
          gameUrlPrefix: 'https://blprobe.com/game/',
          gameResultsUrlPrefix: 'https://blprobe.com/gameResults/',
          blocksUploaded: true,
          imageUploaded: true,
          didPublishBlocksInSession: false,
          didPublishImagesInSession: false,
          unpublishingBlocks: false,
          unpublishingImages: false,
          isBlockprobeAlreadyPublished: false,          
          adhocTooltip:{
            publicLink:{
                flag: false,
                text: [
                    {
                        title: 'Link to share with public',
                        target: '.share-url',
                        content: 'Share your dashboard with the general public using this link so that they can also engage with your game.',
                        disableBeacon: true
                    }
                ]
            },
            socialMedia:{
                flag: false,
                text: [
                    {
                        title: 'Share link on social media',
                        target: '.shareContainer',
                        content: 'You can directly open social media (Facebook and Whatsapp) and share your game\'s public link.',
                        disableBeacon: true
                    }
                ]
            }
        }
      }

        this.renderShareScreen = this.renderShareScreen.bind(this);
        this.showLocalTooltip = this.showLocalTooltip.bind(this);
        this.unpublishStory = this.unpublishStory.bind(this);
        this.publishStory = this.publishStory.bind(this);  
        this.addStoryToWall = this.addStoryToWall.bind(this);    
        this.removeStoryFromWall = this.removeStoryFromWall.bind(this);
        this.isAnyOptionClicked = this.isAnyOptionClicked.bind(this);
        this.isStoryAlreadyAdded = this.isStoryAlreadyAdded.bind(this);        
        this.handleAdhocTooltipJoyrideCallback = this.handleAdhocTooltipJoyrideCallback.bind(this);            
    }

    isStoryAlreadyAdded(){
        let posts = this.props.posts;
        for(let i=0; posts && i < posts.length; i++){
            if(posts[i].bp == this.props.bpId)
                return true;
        }
        return false;
    }

    showLocalTooltip(type){
        var adhocTooltip = this.state.adhocTooltip;
       if(type=='publicLink'){
           adhocTooltip.publicLink.flag = true;
       }
       else if(type=='socialMedia'){
           adhocTooltip.socialMedia.flag = true;
       }
       this.setState({adhocTooltip: adhocTooltip});
    }

    handleAdhocTooltipJoyrideCallback(data, tooltipType){
       const {action,index,status,type} = data;
       if([STATUS.FINISHED, STATUS.SKIPPED].includes(status)){
           var adhocTooltip = this.state.adhocTooltip;
           if(tooltipType=='publicLink'){
               adhocTooltip.publicLink.flag = false;
           }
           else if(tooltipType=='socialMedia'){
               adhocTooltip.socialMedia.flag = false;
           }
           this.setState({adhocTooltip: adhocTooltip});
       }
   }

   async addStoryToWall(){
       let posts = this.props.posts;

       if(!this.isStoryAlreadyAdded()){
           posts.push({
               title: this.props.title,
               bp: this.props.bpId
           });           
           this.props.updatePosts(posts);
       }
   }

   async removeStoryFromWall(){
    let posts = this.props.posts;

    if(this.isStoryAlreadyAdded()){
        let newPosts = [];
        for(let i=0; i<posts.length; i++){
            if(posts[i].bp != this.props.bpId){
                newPosts.push(posts[i]);
            }
        }        
        this.props.updatePosts(newPosts);
    }
   }

    renderShareScreen(){
        let url = this.state.urlPrefix + this.props.bpId;
        let gameUrl = this.state.gameUrlPrefix + this.props.bpId;
        let gameUrlResults = this.state.gameResultsUrlPrefix + this.props.bpId;
        return (
            <div>                
                {this.state.didPublishBlocksInSession && this.state.didPublishImagesInSession?
                    <div className="shareTooltipTextContainer">
                        <p className='contributeOptionText'>Click on the menu (top-left) and choose <a className='tooltip-selection' onClick={() => this.props.setNewVisualisation('contributions')}>Contribute</a> to resume working.</p>
                    </div>
                    :
                    null
                }

                {this.isAnyOptionClicked()?
                    <div style={{width:'50px',margin:'auto'}}>
                        <Loader 
                            type="TailSpin"
                            color="#00BFFF"
                            height="50"	
                            width="50"
                        />   
                    </div>
                    :
                    <div style={{display:'flex', flexWrap:'wrap'}}> 
                        <div style={{marginBottom: '10px'}}>                           
                            <Button
                            variant="contained" 
                            className="publishBlockprobeButton"
                            onClick={this.publishStory}>
                                <div>Publish latest game</div>
                            </Button>
                        </div>
                            {this.state.isBlockprobeAlreadyPublished?
                                <div style={{marginBottom: '10px'}}>
                                    <Button
                                    variant="contained" 
                                    className="unpublishBlockprobeButton"
                                    onClick={this.unpublishStory}>
                                        <div>Unpublish game</div>
                                    </Button>
                                </div>
                                :
                                null
                            }
                    </div>
                }   

                {this.state.isBlockprobeAlreadyPublished?
                <div>
                    {this.state.didPublishBlocksInSession && this.state.didPublishImagesInSession?
                        <div>
                            <p className='publish-story-message'>Your latest game has been succesfully published!</p>
                        </div>
                        :
                        null
                    }                                        
                    <div className='share-section-heading'>
                        Public link to play game                     
                    </div>
                    <div className="share-url-div">
                        <a href={gameUrl} target="_blank" className="share-url">{gameUrl}</a>
                    </div>  
                    <div className='share-section-heading'>
                        Public link to view game results                  
                    </div>
                    <div className="share-url-div">
                        <a href={gameUrlResults} target="_blank" className="share-url">{gameUrlResults}</a>
                    </div>              
                    <div className='share-section-heading'>
                        Share Link on Social Media
                        <a className='share-tooltips tooltipSocialMedia' onClick={(e)=>{this.showLocalTooltip('socialMedia')}} >
                                <Info style={{fontSize:'19px'}}/>
                                <Joyride
                                    styles={{
                                        options: {
                                        arrowColor: '#e3ffeb',
                                        beaconSize: '4em',
                                        primaryColor: '#05878B',
                                        backgroundColor: '#e3ffeb',
                                        overlayColor: 'rgba(10,10,10, 0.4)',
                                        width: 400,
                                        zIndex: 1000,
                                        }
                                        }}
                                        steps={this.state.adhocTooltip.socialMedia.text}
                                        run = {this.state.adhocTooltip.socialMedia.flag}
                                        callback={(data)=>{this.handleAdhocTooltipJoyrideCallback(data,'socialMedia')}}                    
                                        /> 
                        </a> 
                    </div>
                        
                    <div className='left-margin-10'>
                        <LimitSharedUsersComponent
                        />
                    </div>
                    <div className='shareContainer'>
                        <div className='shareIcons'>
                            <FacebookShareButton                        
                                children={<FacebookIcon round={true}/>} 
                                url={gameUrl} 
                                hashtag = '#blockprobe'/>
                        </div>
                        <div className='shareIcons'>
                            <WhatsappShareButton
                                children={<WhatsappIcon round={true}/>} 
                                url={gameUrl} 
                            />
                        </div>
                    </div>
                </div>
                    :
                null
                }       

                
            </div>
        )

    }

    componentDidMount(){
        let scope = this;
        firebase.firestore().collection("public").doc(this.props.bpId)
                .collection("aggBlocks").get().then((snapshot) => {
                    
                    if(Object.keys(snapshot.docs).length==0){
                        scope.setState({
                            isBlockprobeAlreadyPublished: false
                        });
                    }
                    else{
                        scope.setState({
                            isBlockprobeAlreadyPublished: true
                        });
                    }                            
                });
    }

    publishStory(){
        var bTree = this.props.blockTree;
        let allBlocks = Utils.getShortenedListOfBlockTree(bTree);
        if(allBlocks.length>0){

            firebase.firestore().collection("public").doc(this.props.bpId)
                .collection("aggBlocks").get().then((snapshot) => {
                    snapshot.forEach((doc) => {
                        var ref = firebase.firestore().collection("public").doc(this.props.bpId)
                            .collection("aggBlocks").doc(doc.id).delete();
                    });
                    for(var i=0; i<allBlocks.length; i++){
                        firebase.firestore().collection('public').doc(this.props.bpId)
                        .collection('aggBlocks').doc(String(i)).set(allBlocks[i]);        
                    }
        
                }).then(
                    this.setState({
                        blocksUploaded: true,
                        didPublishBlocksInSession: true
                    })
                );
        }
        else{
            this.setState({
                blocksUploaded: true,
                didPublishBlocksInSession: true
            });
        }

        //Add images
        var imageMap = this.props.imageMapping;
        let allImages = Utils.getShortenedListOfImages(imageMap);         
        if(allImages.length>0){

            //console.log(allImages);

            firebase.firestore().collection("public").doc(this.props.bpId)
                .collection("images").get().then((snapshot) => {
                    snapshot.forEach((doc) => {
                        var ref = firebase.firestore().collection("public").doc(this.props.bpId)
                            .collection("images").doc(doc.id).delete();
                    });
                    for(var i=0; i<allImages.length; i++){
                        firebase.firestore().collection('public').doc(this.props.bpId)
                        .collection('images').doc(String(i)).set(allImages[i]);        
                    }
        
                }).then(
                    this.setState({
                        imageUploaded: true,
                        didPublishImagesInSession: true
                    })
                );

        }
        else{
            this.setState({
                imageUploaded: true,
                didPublishImagesInSession: true
            });
        }

        this.setState({isBlockprobeAlreadyPublished: true});
    }

    unpublishStory(){
            this.setState({
                unpublishingBlocks: true,
                unpublishingImages: true
            });
            let scope = this;

            firebase.firestore().collection("public").doc(this.props.bpId)
                .collection("aggBlocks").get().then((snapshot) => {
                    snapshot.forEach((doc) => {
                        var ref = firebase.firestore().collection("public").doc(this.props.bpId)
                            .collection("aggBlocks").doc(doc.id).delete();
                    });        
                }).then(
                    scope.setState({
                        unpublishingBlocks: false,
                        didPublishBlocksInSession: false
                    })
                );
            firebase.firestore().collection("public").doc(this.props.bpId)
                .collection("images").get().then((snapshot) => {
                    snapshot.forEach((doc) => {
                        var ref = firebase.firestore().collection("public").doc(this.props.bpId)
                            .collection("images").doc(doc.id).delete();
                    }); 
        
                }).then(
                    scope.setState({
                        unpublishingImages: false,
                        didPublishImagesInSession: false
                    })
                );       

                this.setState({isBlockprobeAlreadyPublished: false});
    }

    isAnyOptionClicked(){
        if(this.state.unpublishingBlocks || this.state.unpublishingImages)
            return true;
        return false;
    }

    render(){
        return (
            <div>
                {this.state.blocksUploaded && this.state.imageUploaded?
                    this.renderShareScreen()
                    :
                    <div style={{width:'50px',margin:'auto'}}>
                        <Loader 
                            type="TailSpin"
                            color="#00BFFF"
                            height="50"	
                            width="50"
                        />   
                    </div>
                }                
            </div>
        );
    }
}
export default ShareBlockprobeComponent;