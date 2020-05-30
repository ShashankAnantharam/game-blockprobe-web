import React, { Component } from 'react';
import { isNullOrUndefined } from 'util';
import * as firebase from 'firebase';
import GamifiedGraphStats from './gamifiedGraphStats';
import Loader from 'react-loader-spinner';
import './gamifiedResults.css';

class GamifiedResultsComponent extends React.Component {
    constructor(props) {
      super(props);
      //gameId, userId 

      this.state={
          topPerformance: [],
          latestPerformances: [],
          topTimelinePerformance: [],
          title: null,
          isLoading: true
      }
      this.formatEntityStats = this.formatEntityStats.bind(this);
      this.renderSinglePerformance = this.renderSinglePerformance.bind(this);
      this.getData = this.getData.bind(this);

    }

    getData(userId){
        if(isNullOrUndefined(userId))
            return;

        let bpId = this.props.gameId;

        let db = firebase.firestore();
        let allScores = db.collection("Users").doc(userId)
        .collection('gameScores');

        let queryTop = allScores.where('bpId', '==', bpId).orderBy('score','desc').limit(1).get();
        let queryTimelineTop = allScores.where('bpId', '==', String(bpId + '_ts')).orderBy('score','desc').limit(1).get();
        let queryLatest = allScores.where('bpId', '==', bpId).orderBy('ts','desc').limit(5).get();

        let promises = [queryTop, queryLatest, queryTimelineTop];
        let scope = this;
        Promise.all(promises).then(results => {
            const [resultTop, resultLatest, resultTimelineTop] = results;
            let topScores = [];
            resultTop.forEach((doc) => {
                let scoreDetails = doc.data();
                topScores.push(scoreDetails);
            });

            let timelineTopScores = [];
            resultTimelineTop.forEach((doc) => {
                let scoreDetails = doc.data();
                timelineTopScores.push(scoreDetails);
            });

            let latestPerformances = [];
            resultLatest.forEach((doc) => {
                let scoreDetails = doc.data();
                latestPerformances.push(scoreDetails);
            }); 

            // console.log(topScores);
            // console.log(latestPerformances);
            if(latestPerformances.length > 0){
                let title = latestPerformances[0].bpTitle;
                scope.setState({
                    title: title
                });
            }

            scope.setState({
                topPerformance: topScores,
                topTimelinePerformance: timelineTopScores,
                latestPerformances: latestPerformances,
                isLoading: false
            });
        },
        error => {
            scope.setState({
                topPerformance: [],
                latestPerformances: [],
                isLoading: false
            });
        });
    }

    componentDidMount(){
        if(!isNullOrUndefined(this.props.userId))
            this.getData(this.props.userId);
    }

    componentWillReceiveProps(nextProps){
        if(this.props.userId != nextProps.userId){
            this.setState({
                isLoading: true
            });
            this.getData(nextProps.userId);
        }
    }

    formatEntityStats(entityStats){
        //Get rid  of  this function later
        let newEntityStats = {};
        if(isNullOrUndefined(entityStats))
            return {};
        for(let entity in entityStats){
            if(entityStats[entity])
                newEntityStats[entity] = entityStats[entity].mistakes;
        }
        return newEntityStats;
    }

    isEntityStatsNewType(entityStats){
        if(isNullOrUndefined(entityStats))
            return false;
        for(let key in entityStats){
            if(isNullOrUndefined(entityStats[key].mistakes))
                return false;
        }
        return true;
    }

    renderSinglePerformance(stats, type, gameType){
        if(this.isEntityStatsNewType(stats.entityStats))
            stats.entityStats = this.formatEntityStats(stats.entityStats);
        return (
            <div>
                <GamifiedGraphStats
                    stats = {stats}
                    bpId={this.props.gameId}
                    title={this.state.title}
                    id = {String(stats.ts) + "_" + type + "_"+ gameType}
                    ts = {stats.ts}
                    canSave = {false}
                    type = {gameType}
                    />
            </div>
        )
    }


    render(){
        let scope = this;
        let latestPerformanceRender = this.state.latestPerformances.map(performance => {
            return scope.renderSinglePerformance(performance,'latest','graphGame');
        })
        let topPerformanceRender = this.state.topPerformance.map(performance => {
            return scope.renderSinglePerformance(performance,'top','graphGame');
        })
        let topTimelinePerformanceRender = this.state.topTimelinePerformance.map(performance => {
            return scope.renderSinglePerformance(performance,'top','timeline');
        })
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
                    <div style={{paddingTop:'20px'}}>
                         {this.state.topPerformance.length==0?
                                <h4 className="gamePerformanceHeader">User has not played game yet</h4>
                                :
                                <div>
                                    {this.state.topPerformance.length > 0?
                                        <div>
                                            <h4 className="gamePerformanceHeader">Match the topics</h4>
                                            <div className="gamePerformanceContent">
                                                {topPerformanceRender}                            
                                            </div>
                                        </div>
                                        :
                                        null
                                    }
                                    {this.state.topTimelinePerformance.length > 0?
                                        <div>
                                            <h4 className="gamePerformanceHeader">Fill the dates</h4>
                                            <div className="gamePerformanceContent">
                                                {topTimelinePerformanceRender}                            
                                            </div>
                                        </div>
                                        :
                                        null
                                    }
                                </div>
                        }
                    </div>
                }
                
            </div>
        )
    }
}
export default GamifiedResultsComponent;