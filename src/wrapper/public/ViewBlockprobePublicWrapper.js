import React, { Component } from 'react';
import ErrorBoundary from '../errorBoundary/ErrorBoundary';
import ViewBlockprobePublicComponent from '../../view/ViewBlockprobePublic';
import  { Redirect } from 'react-router-dom'
import { isNullOrUndefined } from 'util';

class ViewBlockprobePublicWrapper extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        selectedVisualisation: null
      }

      if(props.match.params.viewType && 
        props.match.params.viewType == 'view'){
            this.state.selectedVisualisation = 'dashboard';
      }
      else if(props.match.params.viewType && 
        props.match.params.viewType == 'graph'){
            this.state.selectedVisualisation = 'graph';
      }
      else if(props.match.params.viewType && 
        props.match.params.viewType == 'tabs'){
          this.state.selectedVisualisation = 'tabs_all';
        }
      else if(props.match.params.viewType && 
          props.match.params.viewType == 'game'){
            this.state.selectedVisualisation = 'game';
          }    
    }
     
    render() {
      return (
        <ErrorBoundary>
          {!isNullOrUndefined(this.state.selectedVisualisation)?
            <ViewBlockprobePublicComponent 
              visulationType = {this.state.selectedVisualisation}
              bId = {this.props.match.params.bId}/>
              :
              <Redirect to="/" ></Redirect>
          }          
        </ErrorBoundary>
      );
    }
  }
  export default ViewBlockprobePublicWrapper;