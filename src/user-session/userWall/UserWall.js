import React, { Component } from 'react';
import './UserWall.css';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import Expand from 'react-expand-animated';
import Textarea from 'react-textarea-autosize';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { version } from 'punycode';
import { isNullOrUndefined } from 'util';

class UserWall extends React.Component {
    constructor(props) {
      super(props);
      //posts

      this.state = {
          visualizedBps: {},
          isEditSummary: {},
          newSummary: {}
      }

      this.renderSinglePost = this.renderSinglePost.bind(this);
      this.clickOnVisualizeButton = this.clickOnVisualizeButton.bind(this);
      this.clickOnEdit = this.clickOnEdit.bind(this);
      this.isValid = this.isValid.bind(this);
    }

    clickOnVisualizeButton(bp, val){
        let visMap = this.state.visualizedBps;
        visMap[bp] = val;
        this.setState({
            visualizedBps: visMap
        });
    }

    clickOnEdit(type, value, post){
        if(type == 'summary'){
            let isEditSummary = this.state.isEditSummary;
            isEditSummary = {};
            isEditSummary[post.bp] = value;
            let newSummary = this.state.newSummary;
            newSummary[post.bp] = '';
            if(!isNullOrUndefined(post.summary)){
                newSummary[post.bp] = post.summary;
            }
            this.setState({
                isEditSummary: isEditSummary,
                newSummary: newSummary
            });
        }
    }

    isValid(newValue){
        if(isNullOrUndefined(newValue) || newValue.trim() == '')
            return false;
        return true;
    }

    clickOnSave(type, post){
        if(type == 'summary'){
            let newSummary = this.state.newSummary;
            let value = newSummary[post.bp];

            //update db using value
            let posts = this.props.posts;
            for(let i=0; i<posts.length; i++){
                if(posts[i].bp == post.bp){
                    posts[i]['summary'] = value;
                    break;
                }
            }
            this.props.updatePosts(posts);

            this.clickOnEdit('summary', false, post);
        }
    }

    handleChange(event, type, post) {

        var shouldUpdate = true;
      
        var lastChar = event.target.value[event.target.value.length-1];
        if(lastChar=='\n' || lastChar=='\t')
            shouldUpdate=false;
        
        if(shouldUpdate){
            if(type=="summary" && event.target.value.length <= 288){
                    let value = event.target.value;
                    let newSummary = this.state.newSummary;
                    newSummary[post.bp] = value;
                    this.setState({newSummary: newSummary});
                }
            }        
    }

    renderSinglePost(post, scope){

        const transitions = ["height", "opacity", "background"];
        let link = '';
        if(post && post.bp){
            link = "https://blprobe.com/tabs/" + post.bp;
        }
        return (
            <div className="wallPostContainer">
                <h5 className="wallPostTitle">{post.title}</h5>
                {this.state.isEditSummary[post.bp] && this.props.isPrivate?
                    <div>
                        <form className="newBlockprobeForm">
                                <label>
                                    <TextField 
                                        type="text"
                                        variant="outlined"
                                        multiline
                                        placeholder = {"Enter details about this story"}
                                        value={this.state.newSummary[post.bp]}
                                        onChange={(e) => { this.handleChange(e,"summary",post)}}
                                        rowsMax="4"
                                        rows="2"
                                        style={{
                                            background: 'white',
                                            marginTop:'6px',
                                            marginBottom:'6px',
                                            textColor: 'black',
                                            fontWeight: '600',
                                            marginLeft: '1em',
                                            width:'95%'
                                            }}/>                            
                                </label>
                        </form>
                        <div style={{display: 'flex'}}>
                            {this.isValid(this.state.newSummary[post.bp])?
                                <Button
                                variant="contained" 
                                className="summarySaveWallbutton"
                                onClick={() => { this.clickOnSave('summary', post)}}>
                                    <div>Confirm</div>
                                </Button>                    
                            :
                                null
                            }
                            <Button className="summaryCancelWallbutton" 
                                variant="contained" 
                                    onClick = {(e) => this.clickOnEdit('summary', false, post)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                    
                    :
                    null
                }
                {!this.state.isEditSummary[post.bp] && this.props.isPrivate?
                    <div>
                        {post.summary && post.summary.length > 0? 
                            <p className="wallPostSummary">{post.summary}</p>
                            :
                            <p className="wallPostSummaryPrompt">Add a summary!</p> 
                            }
                            <Button className="summaryChangeWallbutton" 
                                onClick = {(e) => this.clickOnEdit('summary', true, post)}
                                variant="contained" >
                                    Edit summary
                            </Button>
                    </div>
                    :
                    null
                }

                {!this.props.isPrivate && post.summary && post.summary.length > 0?
                    <p className="wallPostSummary">{post.summary}</p>
                    :
                    null
                }

                <div className="wallPostBody">                           
                    {
                        this.state.visualizedBps[post.bp]?
                        <div className="wallShowViso">
                            <div>
                                <Button className="visualizeWallBpButton" 
                                onClick = {(e) => this.clickOnVisualizeButton(post.bp, false)}
                                variant="contained" >
                                    Close
                                </Button>
                            </div>
                        </div>                  
                        :
                        <div className="wallHideViso">
                            <Button className="visualizeWallBpButton" 
                            onClick = {(e) => this.clickOnVisualizeButton(post.bp, true)}
                            variant="contained">
                                Visualize
                            </Button>
                        </div>
                    }
                        <Expand 
                                open={this.state.visualizedBps[post.bp]}
                                duration={400}
                                transitions={transitions}>
                                <div className="wallPostVisoContainer">
                                    {this.state.visualizedBps[post.bp]?
                                        <iframe src={link} className="wallPostViso"></iframe>
                                            :
                                            null
                                    }                                    
                                </div>                         
                        </Expand>
                </div>
                 
            </div>
        )
    }

    render() {
        let scope = this;
        const postsRender = this.props.posts.map((post) => 
                    (scope.renderSinglePost(post, scope)));
        return (
          <div>
              {postsRender}
          </div>
        );
      }
}
export default UserWall;