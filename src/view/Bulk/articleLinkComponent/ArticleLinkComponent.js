import React, { Component } from 'react';
import Loader from 'react-loader-spinner';
import Textarea from 'react-textarea-autosize';
import * as firebase from 'firebase';
import  "./ArticleLinkComponent.css";

class ArticleLinkComponent extends React.Component {

    constructor(props){
        super(props);
        //addText, text

        this.state={
            url: '',
            loadingText: false
        }

        this.functions = firebase.functions();
        this.handleChange = this.handleChange.bind(this);
        this.isValidLink = this.isValidLink.bind(this);
        this.getArticleText = this.getArticleText.bind(this);
    }

    async getArticleText(){
        this.setState({
            loadingText: true
        });

        try{
            let url = this.state.url;

            var articleFunc = this.functions.httpsCallable('articleTextExtraction');
            let result = '';
            try{
                let finResult = await articleFunc({url: url}); 
                result = finResult.data.content + '\n\n'; 
            }
            catch(e){
                result = '';
            }
            finally{
            }

            this.props.addText(result);
            this.setState({
                loadingText: false
            });
        }
        catch{
            this.setState({
                loadingText: false
            });
        }
        finally{
        }

    }

    handleChange(event, type) {

        var shouldUpdate = true;
      
        var lastChar = event.target.value[event.target.value.length-1];
        if(lastChar=='\n' || lastChar=='\t')
            shouldUpdate=false;

        if(shouldUpdate){
            let url = this.state.url;
            if(type=="url"){
                    url = event.target.value;                    
                    this.setState({url: url});
                }
            }       
    }

    isValidLink(){
        if(this.state.url.trim() == '')
            return false;
        return true;
    }

    render(){
        return (
            
            <div>       
                {this.state.loadingText?
                    <div>
                        <div style={{margin:'auto',width:'50px'}}>
                            <Loader 
                                type="TailSpin"
                                color="#00BFFF"
                                height="50"	
                                width="50"
                                /> 
                        </div>
                        <div style={{padding:'3px', textAlign:'center'}}>
                            <p className="processingArticleLinkText">
                                Your link is being processed. Kindly wait for a few moments.
                            </p>
                        </div> 
                    </div>    
                    :
                    <div>
                        <form className="articleLinkForm">
                            <label>
                            <Textarea 
                                type="text"
                                placeholder="Paste link to article here."
                                value={this.state.url}
                                onChange={(e) => { this.handleChange(e,"url")}}
                                maxRows="1"
                                minRows="1"
                                style={{
                                    background: 'white',
                                    borderWidth:'2px', 
                                    borderStyle:'solid', 
                                    borderColor:'darkgrey',
                                    paddingTop:'6px',
                                    paddingBottom:'6px',
                                    width:'96%'
                                    }}/>                            
                            </label>
                        </form>
                        {this.isValidLink()?
                            <button
                            className="submitArticleLinkButton"
                            onClick={this.getArticleText}>
                                <div>Get Text</div>
                            </button>                    
                        :
                            null
                        }
                    </div>
                }                       
            </div>
        );
    }
}
export default ArticleLinkComponent;