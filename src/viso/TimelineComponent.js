import React, { Component } from 'react';
import './TimelineComponent.css';
import { VerticalTimeline, VerticalTimelineElement }  from 'react-vertical-timeline-component';
import Img from 'react-image';
import ReactGA from 'react-ga';
import PlayArrow from '@material-ui/icons/PlayArrow';
import Pause from '@material-ui/icons/Pause';
import Stop from '@material-ui/icons/Stop';
import Speech from 'speak-tts';
import  * as  Utils from '../common/utilSvc';
import 'react-vertical-timeline-component/style.min.css';
import { isNullOrUndefined } from 'util';

const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
const isIE = /*@cc_on!@*/false || !!document.documentMode;

class TimelineComponent extends React.Component {

    constructor(props){
      super(props);

      this.state = {
          playStatus: 'end',
          isSpeechAvailable: false
      }

      this.speech = null;
      
      this.selectTimelineBlock = this.selectTimelineBlock.bind(this);
      this.removeHashedIndex = this.removeHashedIndex.bind(this);

    this.initSpeech = this.initSpeech.bind(this);
    this.playExistingSelection = this.playExistingSelection.bind(this);
    this.stopExistingSelection = this.stopExistingSelection.bind(this);
    this.timeoutFn = this.timeoutFn.bind(this);
    this.timeInFn = this.timeInFn.bind(this);

      ReactGA.initialize('UA-143383035-1');  
    }

    async timeoutFn(){  
        if(this.state.playStatus == 'start' && !isNullOrUndefined(this.speech) && isChrome){
            await this.speech.pause();
            await this.speech.resume();     
        }     
    }

    timeInFn(){
        const scope = this;
        this.timeout = setInterval(() => {            
            this.timeoutFn();                
          }, 8500);
    }

    async initSpeech(){
        try{
            this.speech = new Speech();
            if(this.speech.hasBrowserSupport()) { // returns a boolean
                // console.log("speech synthesis supported")
            }
            let data = await this.speech.init();  
            
            if(!isNullOrUndefined(data)){
                this.setState({
                    isSpeechAvailable: true
                });
            }
            
            let voices =  data.voices;
            let selectedVoice = -1;
            for(let i=0; !isNullOrUndefined(voices) && i<voices.length; i++){
                if(selectedVoice == -1)
                    selectedVoice = i;
                // firebase.database().ref('Testing/dataVal/'+String(i)).set(voices[i].name);
                let name = voices[i].name;
                if(name.toLowerCase().includes('eng') || name.toLowerCase().includes('catherine')) 
                {
                    selectedVoice = i;
                    break;
                }
            }
            if(selectedVoice != -1){
                //firebase.database().ref('Testing/dataVal').set(voices[selectedVoice].name);
                await this.speech.setVoice(voices[selectedVoice].name);
            }
        }
        catch{}
    }

    async stopExistingSelection(){
        if(!isNullOrUndefined(this.speech)){
            await this.speech.cancel();
            this.setState({
                playStatus: 'end'
            });    
        }
    }

    async playExistingSelection(){
        if(!isNullOrUndefined(this.speech)){
            if(this.speech.speaking())
                await this.speech.cancel();
          
            let selectedNodesString = 'timeline';
            ReactGA.event({
                category: 'playSound',
                action: 'PlaySound ' + selectedNodesString,
                label: 'PlaySound ' + selectedNodesString
            });

            let toPlayText = '';
            this.props.timeline.map((selectedBlock) => 
                {
                    let dateTimeStr = Utils.getDateTimeString(selectedBlock);
                    let title = this.removeHashedIndex(selectedBlock.title);
                    let summary = selectedBlock.summary;

                    if(!isNullOrUndefined(selectedBlock.blockDate) && isNullOrUndefined(selectedBlock.blockDate.month)){
                        dateTimeStr = 'Year ' + dateTimeStr;
                    }

                    if(!isNullOrUndefined(dateTimeStr) && dateTimeStr.length>0){
                        toPlayText += dateTimeStr + ". ";
                    }
                    if(!isNullOrUndefined(title) && title.length>0)
                        toPlayText += (Utils.correctTextForSpeech(title) + '. ');
                    toPlayText += Utils.correctTextForSpeech(summary);
                    toPlayText  += '. ';
                    for(let i=0; !isNullOrUndefined(selectedBlock.numbers) && i<selectedBlock.numbers.length;i++){
                        toPlayText += (selectedBlock.numbers[i].key + ": " + 
                            String(selectedBlock.numbers[i].value)+ ". ");
                    }
                }
            );
            this.setState({
                playStatus: 'start'
            });
            this.speech.speak({
                text: toPlayText,
                queue: false
            }).then(() => {
                this.setState({
                    playStatus: 'end'
                });
                //console.log('here');
            }).catch(e => {
                console.error("An error occurred :", e)
            });
            
        }
    }

    async componentDidMount(){
        await this.initSpeech();

        if(isChrome)
            this.timeInFn();
    }

    async componentWillUnmount(){
        if(!isNullOrUndefined(this.speech)){
            await this.speech.cancel();
        }
    }

    BlockEvidence(evidence, index){
        const WebView = require('react-electron-web-view');
        var evidenceList = [evidence.evidenceLink];
        return(
            <div >
                <Img src={evidenceList}
                style={{width:'80%',marginLeft: '10%', marginRight: '10%'}}></Img>
            </div>
        );
    } 

    BlockEntity(entity){
      return(
      <span className="timeline-block-entity">
          {entity.title}
      </span>
      );  
     }

     removeHashedIndex(a){
        if(a){        
            a = a.trim();
            var startI = 0;
            if(a.length>0 && a[0]=='#'){
                for(var i=1; i<a.length; i++){
                    startI = i;
                    if(a.charAt(i)==' '){
                        return a.substring(startI).trim();
                    }
                } 
                return '';   
            }
            return a;
        }
        return '';
    }

     selectTimelineBlock(block){
        //console.log(block);

        ReactGA.event({
            category: 'select_timeline_block',
            action: 'Select ' + JSON.stringify(block),
            label: JSON.stringify(block)
          });
          
        this.props.selectBlock(block);
     }
     
     renderTimeline(timelineBlock, index){
         /*
         Create render template for the entities
         */
        var renderBlockEntities = '';
        if(timelineBlock.entities!=null && timelineBlock.entities.length>0){            
             renderBlockEntities = timelineBlock.entities.map((blockEntity) => 
                this.BlockEntity(blockEntity)
            );            
        } 
        
        var renderBlockEvidences="";
        if(timelineBlock.evidences && timelineBlock.evidences.length>0){            
            renderBlockEvidences = timelineBlock.evidences.map((blockEvidence, index) => 
            this.BlockEvidence(blockEvidence, index)
        );            
        }

       //TODO add function here to get DateTime
       const blockDateTime = Utils.getDateTimeString(timelineBlock);
       var backgroundColor = 'rgb(33, 150, 243)';
   
       if(index%3===1)
       {
            backgroundColor = 'rgb(243, 33, 150)';
       }
       else if(index%3===2)
       {
            backgroundColor = 'rgb(243, 33, 25)';
       }

       let renderNumbers = null;
       if(!isNullOrUndefined(timelineBlock.numbers) && timelineBlock.numbers.length>0){
           let numbers = timelineBlock.numbers;
            renderNumbers = numbers.map((number) => 
            <span><span className="graph-content-number-key">{number.key}: </span> 
            <b className="graph-content-number-value">{number.value}</b> <br/></span>
        ); 
       }

       return (
         <VerticalTimelineElement
            className="vertical-timeline-element--work"
            date={blockDateTime}
            iconStyle={{ background: backgroundColor, color: '#fff' }}         
        >
       <div onClick={() => { this.selectTimelineBlock(timelineBlock)}} className="timeline-block-container">
            
            {this.removeHashedIndex(timelineBlock.title).length > 0? 
                        <h4 className="vertical-timeline-element-title timeline-block-title timeline-block-text">{this.removeHashedIndex(timelineBlock.title)}</h4>
                        :
                        null
            }
            <p className="timeline-block-text">
                {timelineBlock.summary}
            </p>
            <p className="timeline-block-text">
                {renderNumbers}
            </p>

            {renderBlockEvidences.length !== ''?
                        <div>
                            {renderBlockEvidences}
                        </div>
                        :
                        null}        

        </div>
          
       </VerticalTimelineElement>
       );
     }

    render() {

      const timelineView = this.props.timeline.map((timelineBlock, index) => 
      this.renderTimeline(timelineBlock, index)
    );
      return (
          <div>
              {!isIE && this.state.isSpeechAvailable?
                <div className='timeline-block-list-sound timeline-view-container-width'>
                    {this.state.playStatus == 'end'?
                        <a onClick={this.playExistingSelection} className="soundIcon">
                            <PlayArrow />
                        </a>
                        :
                        null
                    }                                       

                    {(this.state.playStatus == 'start' || this.state.playStatus == 'paused')?
                        <a onClick={this.stopExistingSelection} className="soundIcon">
                            <Stop />
                        </a>
                        :
                        null
                    }    
                </div>
                :
                null
            }
            
            <div style={{background:'lightblue'}} className="timeline-view-container timeline-view-container-width" id="timeline-view-container-id">
                <VerticalTimeline> 
                    {timelineView}
                    <VerticalTimelineElement
                        iconStyle={{ background: 'rgb(16, 204, 82)', color: '#fff' }}
                    />
                </VerticalTimeline>
            </div>
            <div className="dummyTimelineView timeline-view-container-width"></div>
          </div>
      );
    }
  }
  export default TimelineComponent;