import React, { Component } from 'react';
import Slide from '@material-ui/core/Slide';
import Grid from '@material-ui/core/Grid';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import GridListTileBar from '@material-ui/core/GridListTileBar';
import * as Utils from '../../common/utilSvc';
import { Button } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import KeyboardArrowUp from "@material-ui/icons/KeyboardArrowUp";
import KeyboardArrowDown from "@material-ui/icons/KeyboardArrowDown";
import Speedometer from '../speedoMeter/Speedometer';
import Typography from '@material-ui/core/Typography';
import UIfx from 'uifx';
import WellDoneMp3 from  '../../media/well_done.mp3';
import TryAgainMp3 from '../../media/try_again.mp3';
import './GamifiedTimeline.css';
import Paper from '@material-ui/core/Paper';
import GamifiedGraphStats from '../gamifiedStats/gamifiedGraphStats';
import { isNullOrUndefined } from 'util';
import { time } from '@amcharts/amcharts4/core';

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

class GamifiedTimelineComponent extends React.Component {

    constructor(props){
      super(props);
      //timeline  should always  be there

      this.state = {
        currentTimelineIndex: 0,
        message: null,
        gameMessageFinished: 'Congratulations! You did it!',
        score: 0,
        totalScore: 0,
        finishedBlocks: {},
        stopGame: false,
        slideCard: true,
        stats: {
            score: 0,
            entityStats: {},
            totalScore: 0
        }
      }

      if(props.timeline){
          this.state.currentTimelineIndex = Math.floor(Math.random()*(props.timeline.length-1));
          this.state.totalScore = this.props.timeline.length;
      }

      this.incrementTimelineIndex = this.incrementTimelineIndex.bind(this);
      this.clickChevron = this.clickChevron.bind(this);
      this.removeHashedIndex = this.removeHashedIndex.bind(this);
      this.selectTime = this.selectTime.bind(this);
      this.incrementScore = this.incrementScore.bind(this);
      this.stopGame = this.stopGame.bind(this);
    }

    clickChevron(increment){
        this.incrementTimelineIndex();
    }

    seperateTimeline(timeline){
        let times = [];
        for(let i=0; i<timeline.length; i++){
            let newTime = {
                date: timeline[i].blockDate,
                time: timeline[i].blockTime,
                timeStr: Utils.getDateTimeString(timeline[i])
            };
            if(times.length==0 || (times[times.length-1].timeStr != newTime.timeStr)){
                times.push(newTime);
            }
        }
        return times;
    }

    incrementScore(timelineBlockIndex){
        let finishedBlocks = this.state.finishedBlocks;
        finishedBlocks[timelineBlockIndex] = true;
        let stopGame = this.state.stopGame;
        if(this.state.score + 1 >= this.state.totalScore)
            stopGame = true;
        else{
            this.setSlideAnimation(false);
        }
        this.setState({
            score: this.state.score + 1,
            finishedBlocks: finishedBlocks        
        });        
    }

    selectTime(time, index){
        let currBlock = this.props.timeline[this.state.currentTimelineIndex];
        if((JSON.stringify(currBlock.blockDate) != JSON.stringify(time.date)) || 
        (JSON.stringify(currBlock.blockTime) != JSON.stringify(time.time))){
            // Is false
            this.setState({
                message: 'Please try again!'
            });
            if(this.props.playSound)
                tryAgain.play();
        }
        else{
            this.setState({
                message: 'Well done'
            });
            this.incrementScore(this.state.currentTimelineIndex);
            if(this.props.playSound)
                wellDone.play();
        }
    }

    singleTimelineCard(time, index){
        return (
                <Paper className="singleTimeOption" elevation={8} onClick={() => this.selectTime(time,index)}>
                    <div style={{margin: 'auto', width:'50%'}}>
                        {time.timeStr}
                    </div>                    
                </Paper>
        )
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

    setSlideAnimation(value){
        this.setState({
            slideCard: value
        });
    }

    singleBlockCard(timelineBlock){
        return (
                <div className="gamifiedTimelineBlockContainer">
                    <Grid
                    container
                    direction="row-reverse"
                    justify="center"
                    alignItems="center">
                        <Grid
                        item
                        xs={10}
                        md={7}
                        lg={5}>
                            {!isNullOrUndefined(this.props.timeline) && this.props.timeline.length>1?
                                <div className="horizontallyCentered width-40">
                                    <KeyboardArrowUp className='gamifiedTimelineBlockNav' 
                                    onClick={() => { this.clickChevron(true)}}/>
                                </div>
                                :
                                null
                            }
                            
                            <Slide direction="up" in={this.state.slideCard} mountOnEnter unmountOnExit
                            onExited={() => {
                                this.setSlideAnimation(true);
                            }}
                            onEnter={() => {
                                if(!this.state.stopGame)
                                    this.incrementTimelineIndex();
                            }}>
                                <Card elevation={6}>
                                    <CardContent>
                                        {!isNullOrUndefined(timelineBlock.title)?
                                            <Typography variant="h5" component="h2">{this.removeHashedIndex(timelineBlock.title)}</Typography>
                                            :
                                            null
                                        }                                        
                                        <Typography variant="body2" component="p" gutterBottom>
                                            {timelineBlock.summary}
                                        </Typography>
                                        <Typography color="textSecondary">
                                        Select the correct date
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Slide>                            
                        </Grid>

                    </Grid>
                    <div className="gamifiedTimelineBlock horizontallyCentered">                        
                        
                    </div>
                </div>
        );
    }

    incrementTimelineIndex(){
        if(!isNullOrUndefined(this.props.timeline) && this.props.timeline.length>1){
            let increment= Math.floor(Math.random()*(this.props.timeline.length-1));
            if(increment == 0){
                increment ++;
            }
            let index = this.state.currentTimelineIndex;
            index = (index + increment)%(this.props.timeline.length);

            let finishedBlocks = this.state.finishedBlocks;
            while(index in finishedBlocks){
                index = (index + 1)%(this.props.timeline.length);
            }
            this.setState({
                currentTimelineIndex: index
            });
        }
    }

    componentWillReceiveProps(newProps){
        if(this.props.timeline != newProps.timeline){
            let index = Math.floor(Math.random()*(newProps.timeline.length-1));
            this.setState({
                currentTimelineIndex: index,
                totalScore: this.props.timeline.length
            });
        }
    }

    stopGame(value){
        if(value){
            let stats = this.state.stats;
            stats.score = this.state.score;
            stats.totalScore = this.state.totalScore;
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
        let times = this.seperateTimeline(this.props.timeline);
        let timeDisplay = times.map((time, index) => (this.singleTimelineCard(time,index)));

        return (
            <div>
                {this.state.stopGame?
                    <div>
                        <GamifiedGraphStats
                            stats = {this.state.stats}
                            bpId={this.props.bpId}
                            title={this.props.title}
                            canSave = {true}
                            type= {'timeline'}
                            id={'timeline_result'}
                            />
                    </div>
                    :
                    null
                }
                <div className="specialViewMargin">
                    {!this.state.stopGame?
                                <div>              
                                    <div className="gameButtonContainer">
                                        {this.state.score>0 && !this.state.stopGame && this.props.isPublic?
                                            <Button
                                            variant="contained" 
                                            className="stopGamebutton"
                                            onClick={() => { this.stopGame(true)}}
                                            > Stop Game</Button>
                                            :
                                            null
                                        }                                
                                    </div>              
                                    <div className="scoreAmchartContainer">
                                        <Speedometer 
                                            id="speedometer_timeline_ingame"
                                            val={this.state.score}
                                            min={0}
                                            max={this.state.totalScore}
                                            color={'#46237a'}/>
                                    </div>

                                    <div className="scoreText">Score: <span className="timelineScoreVal">{this.state.score}</span>
                                    <span className="totalScoreVal">/{this.state.totalScore}</span></div>
                                    {this.state.score == this.state.totalScore?
                                        <Alert severity="success" className="gameTimelineMessage">{this.state.gameMessageFinished}</Alert>
                                        :
                                        <div>
                                            {this.state.message == "Well done"?
                                                <Alert severity="success" className="gameTimelineMessage">{this.state.message}</Alert>
                                                :
                                                null 
                                            }
                                            {this.state.message == "Please try again!"?
                                                <Alert severity="error" className="gameTimelineMessage">{this.state.message}</Alert>
                                                :
                                                null
                                            }
                                        </div>
                                    }
                                    
                                </div>
                                :
                                null
                            }
                    {(this.props.timeline.length > this.state.score && !this.state.stopGame)?
                            <Grid
                            container
                            direction="row"
                            style={{border:'1px black solid'}}
                            >
                                <Grid xs={12} sm={6} item>
                                    {this.singleBlockCard(this.props.timeline[this.state.currentTimelineIndex])}
                                </Grid>
                                <Grid xs={12} sm={6} item>
                                    <div className="timelineTimesContainer">
                                        <Grid xs={12} className="timesViewGrid" id="gamifiedTimesViewGrid">
                                            {timeDisplay}
                                        </Grid>
                                    </div>
                                </Grid>
                            </Grid>
                        :
                        null
                    }                       
                </div>
            </div>
        )
    }
}
export default GamifiedTimelineComponent;

/*
                    <div>
                        <div className="specialViewMargin">
                            {this.singleBlockCard(this.props.timeline[this.state.currentTimelineIndex])}
                        </div>
                        <div className="specialViewMargin timelineTimesContainer">
                            <Grid xs={24} className="timesViewGrid" id="gamifiedTimesViewGrid">
                                {timeDisplay}
                            </Grid>
                        </div>
                    </div>

                    */