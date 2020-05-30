import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import *  as firebase from 'firebase';

  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyBW_45Sz2fY7v5_obQr_WqXGLsLlfcjOGQ",
    authDomain: "blockprobe-32644.firebaseapp.com",
    databaseURL: "https://blockprobe-32644.firebaseio.com",
    projectId: "blockprobe-32644",
    storageBucket: "blockprobe-32644.appspot.com",
    messagingSenderId: "217518052082"
  };
  firebase.initializeApp(config);

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
