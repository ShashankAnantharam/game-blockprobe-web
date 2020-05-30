import React, { Component } from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import './SummaryView.css';
import ReactGA from 'react-ga';
import ChevronLeft from "@material-ui/icons/ChevronLeft";
import ChevronRight from "@material-ui/icons/ChevronRight";
import { isNullOrUndefined } from 'util';

class SummaryViewComponent extends React.Component {

    constructor(props){
      super(props);
      this.state = {
          summBlocks :[
            /*  {
                  title:"test 1",
                  summary:"This is the test1 stuff."
              },
              {
                title:"test 2",
                summary:"This is the test2 stuff."
            }*/
          ],
          summBlockIdx: 0,
          isContentActive: true
      }
      this.getTitle = this.getTitle.bind(this);
      this.getSummary = this.getSummary.bind(this);  
      this.removeHashedIndex = this.removeHashedIndex.bind(this);    
      this.clickChevron = this.clickChevron.bind(this);
      this.clickSummaryBlock = this.clickSummaryBlock.bind(this);
      
      ReactGA.initialize('UA-143383035-1');
    }

    removeHashedIndex(a){
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

  clickSummaryBlock(){
    if(this.props.summaryBlocks && this.state.summBlockIdx < this.props.summaryBlocks.length
       && this.state.summBlockIdx >=0){
        ReactGA.event({
          category: 'select_summaryBlock',
          action: 'Select ' + JSON.stringify(this.props.summaryBlocks[this.state.summBlockIdx]),
          label: JSON.stringify(this.props.summaryBlocks[this.state.summBlockIdx])
        });
        this.props.selectBlock(this.props.summaryBlocks[this.state.summBlockIdx]);
      }
  }
  

    componentDidMount() {
        this.timeout = setInterval(() => {
          if(!isNullOrUndefined(this.props.summaryBlocks)){
            let currentIdx = this.state.summBlockIdx;
            let currArrSize = Math.max(1,this.props.summaryBlocks.length);
            this.setState({isContentActive: false});
            const scope = this;
            this.timeout = setTimeout(function() {
              scope.setState({ 
                summBlockIdx: (currentIdx + 1)%(currArrSize),
                isContentActive: true
              });

          },500);
        }
        }, 11000);


      }

      getTitle(){
          if(isNullOrUndefined(this.props.summaryBlocks) || this.props.summaryBlocks.length==0)
            return '';
          return this.removeHashedIndex(this.props.summaryBlocks[this.state.summBlockIdx].title);
      }

      getSummary(){
        if(isNullOrUndefined(this.props.summaryBlocks) || this.props.summaryBlocks.length==0)
          return '';
        return this.props.summaryBlocks[this.state.summBlockIdx].summary;
    }

    clickChevron(forward){
      if(!isNullOrUndefined(this.props.summaryBlocks)){
        let currentIdx = this.state.summBlockIdx;
        let currArrSize = Math.max(1,this.props.summaryBlocks.length);
        if(forward){
          currentIdx = (currentIdx+1)%currArrSize;
        }
        else{
          currentIdx = (currentIdx+currArrSize-1)%currArrSize;
        }

        this.setState({summBlockIdx: currentIdx});
      }
    }

    render(){

        return (
          
          <div className="summary-container">
              <div style={{width:'5%', cursor:'pointer', transition:'0.5s'}} >
                  <ChevronLeft className='summaryContent-nav'
                  onClick={() => { this.clickChevron(false)}}/>
              </div>
              <div
              className = 'color-gradient summaryView-container' 
              onClick={() => { this.clickSummaryBlock()}}
              >
              <ReactCSSTransitionGroup transitionName="summaryContent"
                transitionAppear={true}
                transitionAppearTimeout={500}
                transitionEnter={true}
                transitionEnterTimeout={500}
                transitionLeave={true}
                transitionLeaveTimeout={500}
                >
                {this.state.isContentActive?
                        <div>
                                <div className='summaryView-title'>{this.getTitle()}</div>
                                <p className='summaryView-desc'>{this.getSummary()}</p>
                        </div>
                                :
                                null              
                }
              </ReactCSSTransitionGroup>
              </div>
              <div style={{width:'5%', cursor:'pointer', transition:'0.5s'}}>
                <ChevronRight className='summaryContent-nav' 
                onClick={() => { this.clickChevron(true)}}/>
              </div>
            </div>
        );
    }
}
export default SummaryViewComponent;