import React, { Component } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import DeleteIcon from '@material-ui/icons/Delete';
import DoneIcon from '@material-ui/icons/Done'
import Textarea from 'react-textarea-autosize';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Loader from 'react-loader-spinner';
import ImageUploader from 'react-images-upload';
import imageCompression from 'browser-image-compression';
import * as firebase from 'firebase';
import 'firebase/firestore';
import Img from 'react-image';
import './DraftBlockEvidenceView.css';
import { isNullOrUndefined } from 'util';

class DraftBlockEvidenceView extends React.Component {

    constructor(props){
        super(props);
        //props: isClicked; updateEvidence, index; evidence: supportingDetails, evidenceLink;

        //console.log('Here');
        //console.log(this.props.evidence);
        this.state={
            isClicked: JSON.parse(JSON.stringify(this.props.isClicked)),
            newEvidence: JSON.parse(JSON.stringify(this.props.evidence)),
            isImage: false,
            isImageUploading: false,
            image: null
        }
        
        this.getEvidenceViewOnly = this.getEvidenceViewOnly.bind(this);
        this.clickEvidenceNotInDraft = this.clickEvidenceNotInDraft.bind(this);
        this.getEvidenceDraft = this.getEvidenceDraft.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.removeEvidence = this.removeEvidence.bind(this);
        this.updateEvidence = this.updateEvidence.bind(this);
        this.cancelEvidenceAction = this.cancelEvidenceAction.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.uploadEvidenceImageToDb = this.uploadEvidenceImageToDb.bind(this);
        this.deleteEvidenceImageFromDb = this.deleteEvidenceImageFromDb.bind(this);
    }

    clickEvidenceNotInDraft(){
        this.setState({
            isClicked: true,
            newEvidence: JSON.parse(JSON.stringify(this.props.evidence))
        });
    }

    cancelEvidenceAction(){
        this.setState({
            isClicked: false
        });
    }

    async removeEvidence(){
        // console.log(this.state.newEvidence);
        // console.log(this.props.evidence);
        this.props.updateEvidence(this.props.evidence, null, false, true, this.props.index);
        this.setState({
            isClicked: false
        });
    }

    async updateEvidence(){
        this.props.updateEvidence(this.props.evidence, this.state.newEvidence, true, false, this.props.index);
        this.setState({
            isClicked: false,
            image: null
        });
    }

    handleChange(event, type) {
        var shouldUpdate = true;
        var lastChar = event.target.value[event.target.value.length-1];
        if(lastChar=='\n' || lastChar=='\t'){
            shouldUpdate=false;
        }
        //TODO Handle change here too!

        if(shouldUpdate){
            var evidence = this.state.newEvidence;
            if(type=="details"){
                evidence.supportingDetails = event.target.value;
                this.setState({newEvidence: evidence});
            }
            else if(type=="link"){
                evidence.evidenceLink = event.target.value;
                this.setState({newEvidence: evidence});
            }

        }
      }

      async onDrop(picture) {
        if(picture.length > 0)
        {
            let latestPicture = picture[picture.length-1];
            

            var options = {
                maxSizeMB: 0.06,
                maxWidthOrHeight: 900,
                useWebWorker: true
              }
              try {
                let compressedFile = await imageCompression(latestPicture, options);
                this.setState({
                    image: compressedFile
                })
              } catch (error) {

              }
        }
    }

    async deleteEvidenceImageFromDb(path){       
        /*
          if(this.props.evidence.isImage && this.props.evidence.imgPath){
            await this.deleteEvidenceImageFromDb(this.props.evidence.imgPath);
        }
        */
        try{
            this.setState({
                isImageUploading: true
            });
            console.log(path);
            let pathRef = firebase.storage().ref(path);
            await pathRef.delete();
            this.setState({
                isImageUploading: false
            });
        }
        catch{
            this.setState({
                isImageUploading: false
            });
        }
    }

    async uploadEvidenceImageToDb(){
         /*
          if(this.props.evidence.isImage && this.props.evidence.imgPath){
            await this.deleteEvidenceImageFromDb(this.props.evidence.imgPath);
        }
        await this.uploadEvidenceImageToDb();

                            <Tab>Image</Tab>

                    <TabPanel>
                        <div>
                        <ImageUploader
                                    buttonText='Choose image'
                                    onChange={this.onDrop}
                                    singleImage={true}
                                    imgExtension={['.jpg', '.gif', '.png', '.gif']}
                                    maxFileSize={5242880}
                                />
                        </div>
                    </TabPanel>
        */
        let scope = this;
        let latestPicture = this.state.image;

        let newEvidence = this.state.newEvidence;
        if(!isNullOrUndefined(latestPicture)){            
            let path = this.props.bId + '/' + 'evidences/' + this.props.uIdHash + "_" + String(Date.now());
            let pathRef = firebase.storage().ref(path);
            this.setState({
                isImageUploading: true
            });
            try{
                await pathRef.put(latestPicture);
    
                let url = await pathRef.getDownloadURL();
        
                newEvidence.evidenceLink = url; 
                newEvidence['isImage'] = true;   
                newEvidence['imgPath'] = path;   
                               
                scope.setState({
                            isImageUploading: false,
                            newEvidence: newEvidence
                });
            }
            catch(error){
                scope.setState({isImageUploading: false});
            }        
        }
        else{
            if(newEvidence){
                delete newEvidence['isImage'];
                delete newEvidence['imgPath'];
            }
        }
    }


    getEvidenceDraft(){
        return(
            <div>
            
                <Tabs style={{marginTop:'10px', fontSize:'15px'}}>
                    <TabList>
                            <Tab>Url</Tab>
                    </TabList>

                    <TabPanel>
                    <form>
                        <label>
                        <Textarea 
                        type="text"
                        placeholder="Paste link to evidence here."
                        value={this.state.newEvidence.evidenceLink}
                        onChange={(e) => { this.handleChange(e,"link")}}
                        maxRows="3"
                        minRows="2"
                        style={{
                            background: 'white',
                            borderWidth:'2px', 
                            borderStyle:'solid', 
                            borderColor:'darkgrey',
                            paddingTop:'6px',
                            paddingBottom:'6px',
                            width:'60%'
                            }}/>
                        </label>
                    </form>
                    </TabPanel>                    
                </Tabs>
                <form>
                <label>
                        <Textarea 
                        type="text"
                        placeholder="Enter relevant details about evidence here."
                        value={this.state.newEvidence.supportingDetails}
                        onChange={(e) => { this.handleChange(e,"details")}}
                        maxRows="5"
                        minRows="3"
                        style={{
                            background: 'white',
                            borderWidth:'2px', 
                            borderStyle:'solid', 
                            borderColor:'darkgrey',
                            paddingTop:'6px',
                            paddingBottom:'6px',
                            width:'60%'
                            }}/>    
                </label>
                </form>

                <div className='draft-evidence-button-container'>
                    <button
                    className="updateEvidenceButton"
                    onClick={this.updateEvidence}>
                        <div>Confirm evidence</div>
                    </button>
                    <button
                    className="removeEvidenceButton"
                    onClick={this.removeEvidence}>
                        <div>Remove evidence</div>
                    </button>
                    <button
                    className="removeEvidenceButton"
                    onClick={this.cancelEvidenceAction}>
                        <div>Cancel</div>
                    </button>
                </div>

            </div>
        );
    }

    getEvidenceViewOnly(){

        return(
            <ListItem button 
                    onClick={() => { this.clickEvidenceNotInDraft()}}
                    style={{width:'100%', minHeight:'70px', borderTop:'1px solid darkgrey'}}
                    >
                    <ListItemText
                    style={{overflow:'hidden'}} 
                    primary={this.props.evidence.evidenceLink} 
                    secondary={this.props.evidence.supportingDetails}/>
            </ListItem>        
        );
    }

    render(){
        return(
            <div>
                {this.state.isClicked?
                    <div>
                        {this.state.isImageUploading?
                             <div style={{margin:'auto',width:'50px'}}>
                                <Loader 
                                type="TailSpin"
                                color="#00BFFF"
                                height="50"	
                                width="50"
                                /> 
                            </div>
                            :
                            this.getEvidenceDraft()
                        }
                    </div>
                    :
                    this.getEvidenceViewOnly()    
            }
            </div>
        )
    }

}
export default DraftBlockEvidenceView;