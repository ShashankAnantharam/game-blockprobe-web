import React, { Component } from 'react';
import ReactGA from 'react-ga';

class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);

      ReactGA.initialize('UA-143383035-1');  
    }
  
    componentDidCatch(error, info) {      
      let errorTitle = error.toString();
      let errorTotal = errorTitle +": "+ JSON.stringify(info);

      ReactGA.exception({
        description: errorTotal,
        fatal: true
      });

      ReactGA.event({
        category: 'error',
        action: errorTotal,
        label: errorTitle
      });
    }
  
    render() {
      return this.props.children;
    }
  }
  export default ErrorBoundary;