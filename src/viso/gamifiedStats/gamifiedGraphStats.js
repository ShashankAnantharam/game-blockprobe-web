import React, { Component } from 'react';
import ReactGA from 'react-ga';
import Speedometer from '../speedoMeter/Speedometer';
import { Button } from '@material-ui/core';
import GamifiedAuth from './gamifiedStatsAuth';
import Paper from '@material-ui/core/Paper';
import './gamifiedGraphStats.css';
import { isNull, isNullOrUndefined } from 'util';

class GamifiedGraphStats extends React.Component {
    constructor(props) {
      super(props);
      //stats, canSave, id, type
      this.state = {
          saveAuth: false,
          finishedSaving:  false,
          uId: null
      }

      this.renderSingleEntityMistakes = this.renderSingleEntityMistakes.bind(this);
      this.saveResults = this.saveResults.bind(this);
      this.finishSaving = this.finishSaving.bind(this);

      ReactGA.initialize('UA-143383035-1');
    }

    renderSingleEntityMistakes(entity, mistakes){
        return (
            <div className="statsEntityMistakesContainer"> 
                <span className="statsEntityText">{entity} : </span><span className="statsMistakes">{String(mistakes)}</span> 
            </div>
        )
    }

    saveResults(){
        ReactGA.event({
            category: 'saveResult',
            action: this.props.id + ' ' + this.props.bpId,
            label: this.props.id + ' ' + this.props.bpId
          }); 

        this.setState({
            saveAuth: true,
            finishedSaving: false,
            uId: null
        });
    }

    finishSaving(uId){
        this.setState({
            saveAuth: false,
            finishedSaving: true,
            uId: uId  
        });
    }

    componentDidMount(){
        if(this.props.stats){
            ReactGA.event({
                category: 'finishedGame',
                action: this.props.id + ' ' + this.props.bpId,
                label: 'Score:' + String(this.props.stats.score)
              }); 
        }
    }

    render(){
        let entityList = [];
        for(let entity in this.props.stats.entityStats){
            entityList.push({
                entity: entity,
                mistakes: this.props.stats.entityStats[entity]
            });
        }
        entityList.sort(function(a,b){ return a.mistakes - b.mistakes });

        let renderEntityList = entityList.map((entity) => {
            return this.renderSingleEntityMistakes(entity.entity, entity.mistakes);
        })

        let id = 'speedometer_rand';
        if(!isNullOrUndefined(this.props.id))
            id = this.props.id;

        let typeOfGame = 'graphGame';
        let color = '#556efd';
        if(!isNullOrUndefined(this.props.type) && this.props.type == "timeline"){
            typeOfGame = 'timeline';
            color = '#46237a';
        }

        return (
            <div class="statsContainer">
                <div className="statsTitle">Game results</div>
                <div className="statsAmchartContainer">
                                <Speedometer 
                                    id={id}
                                    val={this.props.stats.score}
                                    min={0}
                                    max={this.props.stats.totalScore}
                                    color={color}/>
                            </div>

                <div className="statsScoreText">Score: <span className={"statsScoreVal " + (typeOfGame == "graphGame"?"color-graph ":"")
                        + (typeOfGame == "timeline"?"color-timeline ":"")}>{this.props.stats.score}</span>
                <span className="statsTotalScoreVal">/{this.props.stats.totalScore}</span></div>

                {(isNullOrUndefined(this.props.type) || this.props.type=='graph') && entityList.length > 0?
                    <div className="statsMistakesContainer">
                        <div className="statsMistakesTitle">Mistakes</div>
                        <div className="statsMistakesContent">
                            {renderEntityList}
                        </div>
                    </div>
                    :
                    null
                }

                <div className="statsMistakesOptions">
                    {this.props.canSave && !this.state.finishedSaving?
                        <Button 
                        variant="contained" 
                        className="statsSaveButton"
                        onClick={() => { this.saveResults()}}
                        >Save results</Button>
                        :
                        null
                    }
                </div>
                <div>
                    {this.state.finishedSaving?
                        <p className="statsSavedMessage">Your results have been saved to the account {this.state.uId}!</p>
                        :
                        null
                    }                    
                </div>
                {this.state.saveAuth?
                    <GamifiedAuth 
                        stats={this.props.stats}
                        finishSaving={this.finishSaving}
                        bpId={this.props.bpId}
                        title={this.props.title}
                        type={typeOfGame}/>
                        :
                    null
                }

                                
            </div>
        );
    }
}
export default GamifiedGraphStats;