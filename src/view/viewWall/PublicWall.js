import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import * as firebase from 'firebase';
import { isNullOrUndefined } from 'util';
import UserWall from '../../user-session/userWall/UserWall';
import GoogleFontLoader from 'react-google-font-loader';
import Loader from 'react-loader-spinner';
import './PublicWall.css';

class PublicWallComponent extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            userId: '',
            posts: [],
            doesNotExist: false,
            isLoading: true
        }

        if(!isNullOrUndefined(props.match.params.userId)){
                this.state.userId = JSON.parse(JSON.stringify(props.match.params.userId));
          }

        this.getUserWall = this.getUserWall.bind(this);
        this.buildUserWall = this.buildUserWall.bind(this);
    }


    getUserWall(){
        firebase.firestore().collection("publicWall").doc(this.state.userId).
        collection("userPosts").get().then((snapshot) => {
                this.buildUserWall(snapshot);
        },
        (error) => {
            this.setState({
                posts: [],
                doesNotExist: true,
                isLoading: false
            }); 
        });
    }
    
    buildUserWall(snapshot){
        let postList = [];
        snapshot.forEach((doc) => {
                let data =doc.data();
                for(let i=0; data && data.posts && i<data.posts.length;i++){
                    postList.push(data.posts[i]);
                }
            });   
        
        let doesNotExist = this.state.doesNotExist;
        if(postList.length == 0)
            doesNotExist = true;
        this.setState({
            posts: postList,
            doesNotExist: doesNotExist,
            isLoading: false
        });        
    }

    componentDidMount(){
        this.getUserWall();
    }

    render(){
        return(
            <div>
                <GoogleFontLoader
                                fonts={[                             
                                    {
                                        font:'Lora',
                                        weights: [400]
                                    }
                                ]}
                                subsets={['cyrillic-ext', 'greek']}
                />
                <h2 style={{fontFamily: 'Lora, bold-italic', textAlign:'center', fontSize: '26px'}}>{this.state.userId}</h2>
                
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
                    <div>
                        {!this.state.doesNotExist?
                            <UserWall
                                posts = {this.state.posts}
                                isPrivate = {false}
                            />
                            :
                            <div className='noWallInfoMessage'>
                                <p>This user either does not exist or does not have any posts on their wall!</p>
                            </div>
                        }
                    </div>
                }                
            </div>
        );
    }
}
export default PublicWallComponent;