import React, { Component } from 'react';
import ReactGA from 'react-ga';
import Loader from 'react-loader-spinner';
import * as firebase from 'firebase';
import DissectPictureView from '../dissectPicture/dissectPicture';
import { Button } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import Slide from '@material-ui/core/Slide';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import KeyboardArrowUp from "@material-ui/icons/KeyboardArrowUp";
import KeyboardArrowDown from "@material-ui/icons/KeyboardArrowDown";
import Typography from '@material-ui/core/Typography';
import Speedometer from '../speedoMeter/Speedometer';
import { isNullOrUndefined } from 'util';
import './gamifiedPartsOfImage.css';
import GamifiedGraphStats from '../gamifiedStats/gamifiedGraphStats';
import GamifiedPartsOfImageChoicesView from './gamifiedPartsOfImageChoices';
import UIfx from 'uifx';
import WellDoneMp3 from  '../../media/well_done.mp3';
import TryAgainMp3 from '../../media/try_again.mp3';

const wellDone = new UIfx(
    WellDoneMp3,
    {
      volume: 0.65, // number between 0.0 ~ 1.0
      throttleMs: 100
    }
);
const tryAgain = new UIfx(
    TryAgainMp3,
    {
      volume: 0.65, // number between 0.0 ~ 1.0
      throttleMs: 100
    }
);

class GamifiedPartsOfImageView extends React.Component {

    constructor(props){
      super(props);
      //bpId, partsOfImageList

      this.state = {
        loadingImage: true,
        imageUrl: null,
        selectedLine: null,
        answerTitle: null,
        answerSummary: null,
        slideCard: true,
        correctAns: {},
        totalAns: {},
        wrongAns: {
            title: {},
            summary: {}
        },
        restrictedLines: {},
        score: 0,
        totalScore: 0,
        stats: {
            score: 0,
            gameStats: {},
            totalScore: 0
        },
        stopGame: false
      }

      ReactGA.initialize('UA-143383035-1');  

      this.getImageFromDb = this.getImageFromDb.bind(this);
      this.selectLine = this.selectLine.bind(this);
      this.getGamedPartsOfImageList = this.getGamedPartsOfImageList.bind(this);
      this.onClickChoice = this.onClickChoice.bind(this);
      this.incrementScore = this.incrementScore.bind(this);
      this.getAllAns = this.getAllAns.bind(this);
      this.resetScroll = this.resetScroll.bind(this);

      this.gameOptionsRef = React.createRef();
    }

    resetScroll(){
        let amount = null;
        if(this.gameOptionsRef){
            amount = this.gameOptionsRef.current.offsetTop;
        }
        if(this.props.setScrollToGraphList)
            this.props.setScrollToGraphList(amount);  
    }

    componentDidMount(){
        let totalScore = this.getTotalScore(this.props.partsOfImageList);
        this.setState({
            totalScore: totalScore
        });

        this.getImageFromDb();
    }

    async getImageFromDb(){
        let scope = this;
        scope.setState({
            loadingImage: true
        });
        let path = this.props.bpId + '/general/dissect_picture';
        let pathRef = firebase.storage().ref(path);
        try{
        
            let url = await pathRef.getDownloadURL();
                         
            scope.setState({
                imageUrl: url,
                loadingImage: false
            });
        }
        catch(error){
            scope.setState({
                imageUrl: null,
                loadingImage: false
            });
        }  
    }

    selectLine(lineDetails){
        if(JSON.stringify(this.state.selectedLine)!=JSON.stringify(lineDetails)){
            this.resetScroll();
            this.setState({
                selectedLine: lineDetails,
                answerTitle: null,
                answerSummary: null,
                slideCard: true
            });
        }

    }

    setSlideAnimation(value){
        this.setState({
            slideCard: value
        });
    }

    incrementScore(){

        let score = this.state.score;
        score++;
        this.setState({
            score: score
        });
        if(score==this.state.totalScore){
            let stats = this.state.stats;
            stats.score = score;
            stats.totalScore = this.state.totalScore;
            stats.gameStats = {
                correctAns: this.state.correctAns,
                totalAns: this.getAllAns(this.props.partsOfImageList),
                wrongAns: this.state.wrongAns
            }
            this.setState({
                stats: stats
            });
        }
    }

    singleBlockCard(block){
        return (
                <div className="gamifiedDissectBlockContainer">
                    <Grid
                    container
                    direction="row">
                        <Grid
                        item
                        xs={10}
                        md={7}
                        lg={5}>
                           
                            <Slide direction="up" in={this.state.slideCard} mountOnEnter unmountOnExit
                            onExited={() => {
                                this.setSlideAnimation(true);
                            }}
                            onEnter={() => {
                                
                            }}>
                                <Card elevation={6}>
                                    <CardContent>
                                        {!isNullOrUndefined(block.title)?
                                            <Typography variant="h5" component="h2">{block.answeredTitle}</Typography>
                                            :
                                            null
                                        }
                                        {!isNullOrUndefined(block.summary) && block.summary.trim().length>0?
                                            <Typography variant="body2" component="p" gutterBottom>
                                                {block.answeredSummary}
                                            </Typography>
                                            :
                                            null
                                        }                                                                                                                       
                                    </CardContent>
                                </Card>
                            </Slide>                            
                        </Grid>
                    </Grid>                    
                </div>
        );
    }

    onClickChoice(type,choice){
        if(this.state.selectedLine[type] == choice[type]){
            //Correct answer
            this.incrementScore();
            
            let correctAns = this.state.correctAns;
            if(!(this.state.selectedLine.key in correctAns)){
                correctAns[this.state.selectedLine.key] = {};                
            }
            correctAns[this.state.selectedLine.key][type] = true;
            let selectedLine = this.state.selectedLine;
            selectedLine[type] = choice[type];
            if(type=='title'){
                correctAns[this.state.selectedLine.key]['name'] = choice[type];
            }

            this.setState({
                correctAns: correctAns,
                selectedLine: selectedLine
            });

            if(type=='summary' || 
            (type=='title' && (isNullOrUndefined(this.state.selectedLine.summary) || 
            this.state.selectedLine.summary.trim().length==0))){
                let restrictedLines = this.state.restrictedLines;
                restrictedLines[this.state.selectedLine.key] = true;
                this.setState({
                    selectedLine: null,
                    restrictedLines: restrictedLines
                });
            }
            if(this.props.playSound)
                wellDone.play();
            ReactGA.event({
                category: String('partsOfImg_correct_'+type),
                action: String('partsOfImg_correct_'+type + " " + this.state.selectedLine.title),
                label: String('partsOfImg_correct_'+type + " " + this.state.selectedLine.title)
                });
        }
        else{
            //Wrong answer
            let wrongAns = this.state.wrongAns;
            if(type=='title'){
                if(!(this.state.selectedLine.key in wrongAns['title'])){
                    wrongAns['title'][this.state.selectedLine.key] = {
                        name: this.state.selectedLine.title,
                        mistakes: {}
                    };
                    let currWrongAns = choice[type];
                    if(!(currWrongAns in wrongAns['title'][this.state.selectedLine.key].mistakes)){
                        wrongAns['title'][this.state.selectedLine.key].mistakes[currWrongAns]=0;
                    }
                    wrongAns['title'][this.state.selectedLine.key].mistakes[currWrongAns]++;
                }
            }
            else if(type=='summary'){
                if(!(this.state.selectedLine.key in wrongAns['summary'])){
                    wrongAns['summary'][this.state.selectedLine.key] = {
                        name: this.state.selectedLine.title,
                        mistakes: 0
                    };
                }
                wrongAns['summary'][this.state.selectedLine.key].mistakes++;
            }
            this.setState({
                wrongAns: wrongAns
            });
            if(this.props.playSound)
                tryAgain.play();
        }
    }

    renderOptions(type, arr){
        //type is Name or Details
        //arr are choices
        return (
            <div>
                <GamifiedPartsOfImageChoicesView
                    choices = {arr}
                    type={type}
                    onClickChoice={this.onClickChoice}
                    />
            </div>
        )
    }

    getAllAns(list){
        let totalAns = this.state.totalAns;
        for(let i=0;list && i<list.length; i++){
            totalAns[list[i].key] = {
                name: list[i].title,
                title: true
            };
            if(!isNullOrUndefined(list[i].summary)){
                totalAns[list[i].key]['summary'] = true;
            }
        }
        return totalAns;
    }

    getGamedPartsOfImageList(list,correctAns){
        let  ans = [];
        for(let i=0;list && i<list.length;i++){
            let newElem = JSON.parse(JSON.stringify(list[i]));
            if(correctAns[newElem.key] && correctAns[newElem.key].title){
                newElem['answeredTitle'] = newElem.title;
            }
            else{
                newElem['answeredTitle'] = "";
            }
            if(!isNullOrUndefined(newElem.summary) && newElem.summary.trim().length>0){
                if(correctAns[newElem.key] && correctAns[newElem.key].summary){
                    newElem['answeredSummary'] = newElem.summary;
                }
                else{
                    newElem['answeredSummary'] = "";
                }
            }
            ans.push(newElem);
        }
        return ans;
    }

    getOptions(type){
        let unique = {};
        let partsOfImageList = this.props.partsOfImageList; 
        for(let i=0; partsOfImageList && i<partsOfImageList.length; i++){
            if(type in partsOfImageList[i] && String(partsOfImageList[i][type]).trim().length>0){
                unique[String(partsOfImageList[i][type]).trim()] = "";
            }            
        }
        let ans = [];
        for(let key in unique){
            let newEntry = {};
            newEntry[type]=key;
            ans.push(newEntry);
        }
        return ans;
    }

    getTotalScore(list){
        let totalScore = 0;
        for(let i=0; list && i<list.length; i++){
            if(!isNullOrUndefined(list[i].title) && list[i].title.trim().length>0){
                totalScore++;
            }
            if(!isNullOrUndefined(list[i].summary) && list[i].summary.trim().length>0){
                totalScore++;
            }
        }
        return totalScore;
    }

    componentWillReceiveProps(newProps){
        if(this.props.partsOfImageList != newProps.partsOfImageList){
            let totalScore = this.getTotalScore(newProps.partsOfImageList);
            this.setState({
                totalScore: totalScore
            });
        }
    }

    stopGame(value){
        if(value){
            let stats = this.state.stats;
            stats.score = this.state.score;
            stats.totalScore = this.state.totalScore;
            stats.gameStats = {
                correctAns: this.state.correctAns,
                totalAns: this.getAllAns(this.props.partsOfImageList),
                wrongAns: this.state.wrongAns
            }
            this.setState({
                stats: stats
            });
            //console.log(stats);
        }
        this.setState({
            stopGame: value
        });
    }

    render(){
        let lineCoord = null, lineKey = null;
        if(this.state.selectedLine && this.state.selectedLine.lineCoord){
            lineCoord = this.state.selectedLine.lineCoord;
            lineKey = this.state.selectedLine.key;
        }
        return (
            <div>
                {this.state.stopGame || this.state.score==this.state.totalScore?
                    <div>
                        <GamifiedGraphStats
                            stats = {this.state.stats}
                            bpId={this.props.bpId}
                            title={this.props.title}
                            canSave = {true}
                            saveImmediately = {true}
                            type= {'dissect_picture'}
                            id={'dissect_picture_result'}
                            />
                    </div>
                    :
                <div>   
                    <div>                         
                        {this.state.totalScore>0?
                            <div>
                                <div className="gameButtonContainer" style={{marginLeft:'1em'}}>
                                    {!this.state.stopGame?
                                        <Button
                                        variant="contained" 
                                        className="stopGamebutton"
                                        onClick={() => { this.stopGame(true)}}
                                        >Save Results</Button>
                                        :
                                        null
                                    }                                
                                </div>   
                                <div className="scoreAmchartContainer">
                                    <Speedometer 
                                        id="speedometer_dissect_picture_ingame"
                                        val={this.state.score}
                                        min={0}
                                        max={this.state.totalScore}
                                        color={'#75248a'}/>
                                </div>
                                <div className="scoreText">Score: <span className="dissectImageScoreVal">{this.state.score}</span>
                                <span className="totalScoreVal">/{this.state.totalScore}</span></div> 
                            </div>
                            :
                            null
                        }
                                                          
                    </div>
                    {!this.state.loadingImage?
                        <div>
                            <div ref={this.gameOptionsRef}></div>
                            <DissectPictureView
                                partsOfImageLines={this.getGamedPartsOfImageList(this.props.partsOfImageList,this.state.correctAns)}
                                imageUrl={this.state.imageUrl}
                                selectLine={this.selectLine}
                                viewSingleLine={!isNullOrUndefined(lineCoord)}
                                singleLineCoord={lineCoord}
                                selectedLineKey={lineKey}
                                restrictedLines={this.state.restrictedLines}
                            />                                                        
                            {!isNullOrUndefined(this.state.selectedLine)?
                                <div>                                
                                    {isNullOrUndefined(this.state.correctAns[this.state.selectedLine.key]) || 
                                    (isNullOrUndefined(this.state.correctAns[this.state.selectedLine.key].title)
                                    || !this.state.correctAns[this.state.selectedLine.key].title)?
                                        <div>
                                            <h3 style={{marginLeft:'1em', marginBottom:'5px'}}>What is the name of this part?</h3>
                                            {this.renderOptions('title',this.getOptions('title'))}
                                        </div>
                                        :
                                        null
                                    }
                                    {!isNullOrUndefined(this.state.correctAns[this.state.selectedLine.key]) && 
                                    this.state.correctAns[this.state.selectedLine.key].title &&
                                    isNullOrUndefined(this.state.correctAns[this.state.selectedLine.key].summary) &&
                                    !isNullOrUndefined(this.state.selectedLine.summary) && 
                                    this.state.selectedLine.summary.trim().length>0?
                                        <div>
                                            <h3 style={{marginLeft:'1em', marginBottom:'5px'}}>What is <span style={{fontWeight:'bold', color:'blue'}}>{this.state.selectedLine.title}</span>?</h3>
                                            {this.renderOptions('summary',this.getOptions('summary'))}
                                        </div>
                                        :
                                        null
                                    }
                                </div>
                                :
                                <p style={{marginLeft:'1em',marginBottom:'2.5em'}}>Select any part of the picture!</p>
                            }
                            
                        </div>
                        :
                        <div style={{margin:'auto',width:'50px'}}>
                            <Loader 
                            type="TailSpin"
                            color="#00BFFF"
                            height="50"	
                            width="50"
                            /> 
                        </div>
                    }                
                </div>
                }
            </div>
        )
    }
}
export default GamifiedPartsOfImageView;
