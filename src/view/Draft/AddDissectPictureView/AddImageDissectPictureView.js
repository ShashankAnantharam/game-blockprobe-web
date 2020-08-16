import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import './AddDissectPictureView.css';
import Textarea from 'react-textarea-autosize';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Loader from 'react-loader-spinner';
import ImageUploader from 'react-images-upload';
import imageCompression from 'browser-image-compression';
import * as firebase from 'firebase';
import 'firebase/firestore';
import Img from 'react-image';
import { isNullOrUndefined } from 'util';

class AddImageDissectPictureView extends React.Component {

    constructor(props){
        super(props);
        //imageUrl

        this.state={
            isImageUploading: false,
            imageUrl: null
        }

        this.uploadFileToDb = this.uploadFileToDb.bind(this);
        this.removeImageFromDb = this.removeImageFromDb.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.closeImagePane = this.closeImagePane.bind(this);

    }

    removeImage(){
        //delete file here
    }

    async uploadFileToDb(latestPicture){
        let scope = this;
        let path = this.props.bId + '/general/dissect_picture';
        let pathRef = firebase.storage().ref(path);
        this.setState({
            isImageUploading: true
        });
        try{
            await pathRef.put(latestPicture);

            let url = await pathRef.getDownloadURL();
                         
            scope.setState({
                imageUrl: url,
                isImageUploading: false
            });
            scope.closeImagePane(true);
        }
        catch(error){
            scope.setState({isImageUploading: false});
        }        
    }

    async removeImageFromDb(){
        let scope = this;
        let path = this.props.bId + '/general/dissect_picture';
        let pathRef = firebase.storage().ref(path);
        this.setState({
            isImageUploading: true
        });

        try{    

            await pathRef.delete();                               
            scope.setState({
                imageUrl: null,
                isImageUploading: false
            });
        }
        catch(error){
            scope.setState({isImageUploading: false});
        }   
    }

    async onDrop(picture) {
        if(picture.length > 0)
        {
            let latestPicture = picture[picture.length-1];  
            var options = {
                maxSizeMB: 0.040,
                maxWidthOrHeight: 1920,
                useWebWorker: true
              }
              try {
                let compressedFile = await imageCompression(latestPicture, options);
                //upload file here
                this.uploadFileToDb(compressedFile);
              } catch (error) {

              }
        }
    }

    closeImagePane(shouldUpdatePic){
        if(this.props.closeImagePane){
            this.props.closeImagePane(shouldUpdatePic);
        }
    }

    componentDidMount(){
        if(this.props.imageUrl){
            this.setState({
                imageUrl: this.props.imageUrl
            });
        }
    }

    render(){
        return (
            <div>
                <ImageUploader
                    withIcon={true}
                    label={'Max-size: 5MB, Accepted formats: jpg|png|jpeg|gif|svg'}
                    buttonText='Choose image'
                    onChange={this.onDrop}
                    singleImage={true}
                    imgExtension={['.jpg', '.gif', '.png', '.svg','.jpeg']}
                    maxFileSize={5242880}
                />
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
                        <div>
                            {this.state.imageUrl?
                                <div style={{textAlign: 'center', marginBottom: '35px'}}>
                                    <span className="removeImageButton" onClick={this.removeImageFromDb}>
                                        Delete picture
                                    </span>
                                </div>
                                :
                                null
                            }
                            {this.state.imageUrl?
                                <div style={{textAlign: 'center', marginBottom: '35px'}}>
                                    <span className="removeImageButton" onClick={() => this.closeImagePane(false)}>
                                        Cancel
                                    </span>
                                </div>
                                :
                                null
                            }                                             
                            <div style={{textAlign: 'center'}}>
                                <Img src={[this.state.imageUrl]}
                                    style={{width:'200px', maxHeight:'200px', marginLeft: '1.1em'}}></Img>
                            </div>
                        </div>
                    }                                    
                </div>
            </div>
        )
    }
}
export default AddImageDissectPictureView;