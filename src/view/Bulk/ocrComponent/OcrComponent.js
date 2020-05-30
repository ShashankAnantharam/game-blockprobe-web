import React, { Component } from 'react';
import * as firebase from 'firebase';
import ImageUploader from 'react-images-upload';
import Loader from 'react-loader-spinner';
import imageCompression from 'browser-image-compression';
import Checkbox from '../../Draft/Checkbox';
import * as Utils from '../../../common/utilSvc';
import  "./OcrComponent.css";
import { isNullOrUndefined } from 'util';

class OcrComponent extends React.Component {

    constructor(props){
        super(props);
        //addText

        this.state={
            text: 'none',
            loadingText: false,
            fileName: null,
            pictures: [],
            showPreview: true
        }

        this.functions = firebase.functions();
        this.onDrop = this.onDrop.bind(this);
        this.uploadOcrFileToDb = this.uploadOcrFileToDb.bind(this);
        this.getText = this.getText.bind(this);
        this.canSubmit = this.canSubmit.bind(this);
        this.clickSubmit = this.clickSubmit.bind(this);
        this.togglePreviewImages = this.togglePreviewImages.bind(this);
    }

    async uploadOcrFileToDb(latestPicture,  index){
         
        let scope = this;
        let path = this.props.bId + '/users/' + this.props.uId +'/ocr_' + String(index) ;
        let pathRef = firebase.storage().ref(path);
        try{
            await pathRef.put(latestPicture);
        }
        catch(error){

        }        
    }

    async getText(latestPicture, options, index){
        let compressedFile = await imageCompression(latestPicture, options);
        let url = URL.createObjectURL(compressedFile);

        
        let text = '';

        try{
            await this.uploadOcrFileToDb(compressedFile, index);

            var ocrFunc = this.functions.httpsCallable('ocrTextExtraction');

            let finResult = await ocrFunc({bpId: this.props.bId, userId: this.props.uId, index: index}); 
            text = finResult.data;
            text = Utils.filterText(text);
            text += '\n\n';                                       
        }
        catch(e){
            text = '';
        }
        return text;
    }

    onDrop(picture){
        this.setState({
            pictures: picture
        });        
    }

    async clickSubmit(){
        let pictures = this.state.pictures;
        var options = {
            maxSizeMB: 1,
            useWebWorker: true
          }
        this.setState({
            loadingText: true
        });

        let name = '';
        let textPromises = [];
        for(let i=0; i<pictures.length; i++){
            try{
                let picture  = pictures[i];
                if(i==pictures.length-1 && !isNullOrUndefined(picture.name)){
                    name  = picture.name;
                }
                let textPromise =  this.getText(picture, options, i); 
                textPromises.push(textPromise);             
            }
            catch (error) {
                console.log(error);
            }
        }
        let results = await Promise.all(textPromises);

        for(let i=0; i<results.length; i++){
            if(!isNullOrUndefined(results[i]) && results[i].length>0)
                this.props.addText(results[i]);
        }

        this.setState({
            loadingText: false,
            fileName: name
        });
    }

    canSubmit(){
        if(this.state.pictures.length > 0)
            return true;
        return false;
    }

    togglePreviewImages(){
        this.setState({
            showPreview: !this.state.showPreview            
        });
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
                                    <p className="processingOcrText">
                                        Your image is being processed. This may take 15 seconds or more to complete.
                                    </p>
                                </div> 
                            </div>                            
                            :
                            <div>
                                <div style={{textAlign:'center'}}>
                                    {this.canSubmit()?
                                        <button className="converOcrButton" onClick={this.clickSubmit}>Save</button>
                                        :
                                        null
                                    }
                                </div>
                                <div style={{marginLeft:'1em'}}>
                                    <Checkbox 
                                        value={'showPreview'}
                                        isChecked={this.state.showPreview}
                                        label={'Preview images'}  
                                        toggleChange = {this.togglePreviewImages}                              
                                        />
                                </div>
                                <ImageUploader
                                    withIcon={true}
                                    buttonText='Choose image'
                                    onChange={this.onDrop}
                                    singleImage={true}
                                    imgExtension={['.jpg', '.gif', '.png', '.gif']}
                                    maxFileSize={5242880}
                                    withPreview={this.state.showPreview}
                                    />
                                {!isNullOrUndefined(this.state.fileName)?
                                    <div style={{textAlign:'center'}}>
                                        <p className="processingOcrText">
                                            Your last image upload was <span style={{color:'blue'}}>{this.state.fileName}</span>.
                                        </p>
                                    </div>
                                    :
                                    null
                                }
                            </div>                              
                    }             
            </div>
        );
    }
}
export default OcrComponent;