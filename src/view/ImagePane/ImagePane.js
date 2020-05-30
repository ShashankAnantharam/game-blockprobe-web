import React, { Component } from 'react';
import  MultiSelectReact  from 'multi-select-react';
import Button from '@material-ui/core/Button';
import './ImagePane.css';
import Textarea from 'react-textarea-autosize';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Loader from 'react-loader-spinner';
import ImageUploader from 'react-images-upload';
import imageCompression from 'browser-image-compression';
import * as firebase from 'firebase';
import 'firebase/firestore';
import Img from 'react-image';
import { isNullOrUndefined } from 'util';

class ImagePaneView extends React.Component {

    constructor(props){
        super(props);

        this.state={
            firstEntitySelectList: [

            ],
            selectedEntityUrl: '',
            selectedEntity: '',
            changedEntities: {},
            uploadedImages: {},
            entityTabIndex: {},
            selectedTabIndex: 0,
            isImageUploading: false,
            hasUpdated: false
        }

        this.generateEntityLists = this.generateEntityLists.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.submitEntityImage = this.submitEntityImage.bind(this);
        this.canSubmit = this.canSubmit.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.getImageOptions = this.getImageOptions.bind(this);
        this.getImageUrlFromFile = this.getImageUrlFromFile.bind(this);
        this.onChangeImageTab = this.onChangeImageTab.bind(this);
        this.removeImageFromDb = this.removeImageFromDb.bind(this);
        this.closeImagePane = this.closeImagePane.bind(this);
        this.isImagePresent = this.isImagePresent.bind(this);
    }

    async submitEntityImage(){
        if(this.state.selectedEntity.length > 0){
            let tasks = [];
            for(let key in this.state.changedEntities){
                let url = this.state.changedEntities[key];
                let imageUploadtype = 0;
                if(key in this.state.entityTabIndex && this.state.entityTabIndex[key]==1){
                    //Uploaded image
                    url = this.state.uploadedImages[key];
                    imageUploadtype = 1;
                }
                var newImage = {
                    entity: key,
                    url: url,
                    timestamp: Date.now(),
                    imageUploadtype: imageUploadtype
                }

                let taskResult = firebase.firestore().collection("Blockprobes").
                    doc(this.props.bId).collection("images").
                    doc(newImage.entity).set(newImage);
                tasks.push(taskResult);                
            }
            await Promise.all(tasks);
            this.props.refreshBlockprobe();
        }
    }

    generateEntityLists(){
        var count = 1;
        var firstEntityList = this.state.firstEntitySelectList;
        Object.keys(this.props.investigationGraph).forEach(function(entityLabel) {
            firstEntityList.push({                
                    value: false, 
                    label: entityLabel, 
                    id: count             
            });           
            count++;
        });

        firstEntityList.sort(function(a,b){
            if(a.label.toLocaleLowerCase() == 'none')
                return -1;
            if(b.label.toLocaleLowerCase() == 'none')
                return 1;
            if(a.label.toLocaleLowerCase() < b.label.toLocaleLowerCase())
                return -1;
            return 1;
        });
       
        let selectedEntity = '', url = '';
        if(firstEntityList.length > 0){
            selectedEntity = firstEntityList[0].label;
            if(selectedEntity in this.props.imageMapping){
                url = this.props.imageMapping[selectedEntity];
            }
            firstEntityList[0].value = true;
        }
        this.setState({
            firstEntitySelectList: firstEntityList,
            selectedEntity: selectedEntity,
            selectedEntityUrl: url 
        });
    }

    firstEntityClicked(entityList) {
        var selectedEntity = '', url = '';
        for(var i=0; i<entityList.length; i++){
            if(entityList[i].value){
                selectedEntity = entityList[i].label;
                if(selectedEntity in this.state.changedEntities){
                    url = this.state.changedEntities[selectedEntity];
                }
                else if(selectedEntity in this.props.imageMapping){
                    url = this.props.imageMapping[selectedEntity];
                }
            }
        }
        this.setState({ 
            firstEntitySelectList: entityList, 
            selectedEntity: selectedEntity,
            selectedEntityUrl: url 
        });
    }
    
    firstSelectedBadgeClicked(entityList) {
        var selectedEntity = '', url = '';
        for(var i=0; i<entityList.length; i++){
            if(entityList[i].value){
                selectedEntity = entityList[i].label;
                if(selectedEntity in this.state.changedEntities){
                    url = this.state.changedEntities[selectedEntity];
                }
                else if(selectedEntity in this.props.imageMapping){
                    url = this.props.imageMapping[selectedEntity];
                }
            }
        }

        let selectedIndex = 0;
        if(selectedEntity in this.state.entityTabIndex){
            selectedIndex = this.state.entityTabIndex[selectedEntity];
        }

        this.setState({ 
            firstEntitySelectList: entityList, 
            selectedEntity: selectedEntity,
            selectedEntityUrl: url,
            selectedTabIndex: selectedIndex
        });
    }

    componentDidMount(){
        this.generateEntityLists();
    }

    handleChange(event, type) {

        var shouldUpdate = true;
        if(type!="date" && type!="time"){
            var lastChar = event.target.value[event.target.value.length-1];
            if(lastChar=='\n' || lastChar=='\t'){
                shouldUpdate=false;
            }
        }

        if(shouldUpdate){
            if(type=="entity"){
                let selectedEntityUrl = event.target.value;
                let changedEntities = this.state.changedEntities;
                let selectedEntity = this.state.selectedEntity;
                if(this.state.selectedEntity){
                    changedEntities[selectedEntity] = selectedEntityUrl;
                }
                
                this.setState({
                    selectedEntityUrl: selectedEntityUrl,
                    changedEntities: changedEntities
                });
            }
        }
           
      }

    canSubmit(){
      //  if(this.props.permit == 'CREATOR' && this.state.selectedEntity.length > 0)
      //      return true;
        return false;
    }  

    async uploadFileToDb(latestPicture){
        let uploadedImages = this.state.uploadedImages;
        let selectedEntity = this.state.selectedEntity;            
        let scope = this;
        let path = this.props.bId + '/' + selectedEntity;
        let pathRef = firebase.storage().ref(path);
        this.setState({
            isImageUploading: true
        });
        try{
            await pathRef.put(latestPicture);

            let url = await pathRef.getDownloadURL();
    
            uploadedImages[selectedEntity] = url;    
            var newImage = {
                    entity: selectedEntity,
                    url: url,
                    timestamp: Date.now(),
                    imageUploadtype: 1
                }
    
            await firebase.firestore().collection("Blockprobes").
                    doc(scope.props.bId).collection("images").
                    doc(newImage.entity).set(newImage);
                         
            scope.setState({
                        uploadedImages: uploadedImages,
                        isImageUploading: false,
                        hasUpdated: true
                    });
        }
        catch(error){
            scope.setState({isImageUploading: false});
        }        
    }

    async removeImageFromDb(){
        let uploadedImages = this.state.uploadedImages;
        let selectedEntity = this.state.selectedEntity;            
        let scope = this;
        let path = this.props.bId + '/' + selectedEntity;
        let pathRef = firebase.storage().ref(path);
        this.setState({
            isImageUploading: true
        });

        try{    
            uploadedImages[selectedEntity] = null;

            var newImage = {
                entity: selectedEntity,
                url: '',
                timestamp: Date.now(),
                imageUploadtype: 1
            }

            await pathRef.delete();

            await firebase.firestore().collection("Blockprobes").
                doc(scope.props.bId).collection("images").
                doc(newImage.entity).set(newImage);
                         
            scope.setState({
                        uploadedImages: uploadedImages,
                        isImageUploading: false,
                        hasUpdated: true
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
                maxSizeMB: 0.015,
                maxWidthOrHeight: 1920,
                useWebWorker: true
              }
              try {
                let compressedFile = await imageCompression(latestPicture, options);
                this.uploadFileToDb(compressedFile);
              } catch (error) {

              }
        }
    }

    getImageUrlFromFile(entity){
        let uploadedImages = this.state.uploadedImages;
        let url = null;
        if(entity in uploadedImages)
            url = uploadedImages[entity];
        else if(entity in this.props.imageMapping)
            url = this.props.imageMapping[entity];
        return url;
    }

    isImagePresent(entity){
        let uploadedImages = this.state.uploadedImages;
        let url = null;
        if(entity in this.props.imageMapping)
            url = this.props.imageMapping[entity];
        if(entity in uploadedImages)
            url = uploadedImages[entity];
        if(url == null || url == '')
            return false;
        return true;
    }

    onChangeImageTab(index, lastIndex, event){
        let entityTabIndex = this.state.entityTabIndex;
        entityTabIndex[this.state.selectedEntity] = index;
        
        let changedEntities = this.state.changedEntities;
        changedEntities[this.state.selectedEntity] = '';

        this.setState({
            selectedTabIndex: index,
            entityTabIndex: entityTabIndex
        });
    }

    /*
        Old url input
          <TabPanel>
                            <div>
                                <div className="imagepane-url-container">
                                        <form>
                                            <label>
                                                <Textarea 
                                                    type="text"
                                                    placeholder = "Image url"
                                                    value={this.state.selectedEntityUrl}
                                                    onChange={(e) => { this.handleChange(e,"entity")}}
                                                    maxRows="2"
                                                    minRows="1"
                                                    style={{
                                                        background: 'white',
                                                        borderWidth:'2px', 
                                                        borderStyle:'solid', 
                                                        borderColor:'black',
                                                        paddingTop:'6px',
                                                        paddingBottom:'6px',
                                                        width:'95%'
                                                        }}/>
                                            </label>
                                        </form>
                                </div>
                                <div>
                                    <Img src={[this.state.selectedEntityUrl]}
                                        style={{width:'200px', maxHeight:'200px', marginLeft: '1.1em'}}></Img>
                                </div>
                            </div>
                        </TabPanel>


    */

    getImageOptions(){
        return (
            <div style={{marginBottom: '40px'}}>
                <Tabs selectedIndex={this.state.selectedTabIndex}
                    onSelect={this.onChangeImageTab}>
                        <TabList>
                            <Tab>Upload Image</Tab>
                        </TabList>
                        
                        <TabPanel>
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
                                            {this.isImagePresent(this.state.selectedEntity)?
                                                <div style={{textAlign: 'center', marginBottom: '35px'}}>
                                                    <span className="removeImageButton" onClick={this.removeImageFromDb}>
                                                        Remove image
                                                    </span>
                                                </div>
                                                :
                                                null
                                            }                                            
                                            <div style={{textAlign: 'center'}}>
                                                <Img src={[this.getImageUrlFromFile(this.state.selectedEntity)]}
                                                    style={{width:'200px', maxHeight:'200px', marginLeft: '1.1em'}}></Img>
                                            </div>
                                        </div>
                                    }                                    
                                </div>
                            </div>
                        </TabPanel>                  
                </Tabs>
            </div>
        )
    }

    closeImagePane(){
        if(this.state.hasUpdated)
            this.props.refreshBlockprobe();
        this.props.closeImagePane();
    }

    render(){

        const selectedOptionsStyles = {
            color: "white",
            backgroundColor: "rgb(117, 106, 214)",
            borderRadius:"20px",
            fontSize:'0.6em',
            padding:'10px',
            maxWidth: '92%',
            wordWrap: 'break-word'
        };
        const optionsListStyles = {
            backgroundColor: "darkcyan",
            color: "white",

        };

        return (
            <div>
                <div className='imagepane-filter-container'>                
                
                    <div className="imagepane-dropdown-container">
                        <MultiSelectReact 
                        options={this.state.firstEntitySelectList}
                        optionClicked={this.firstEntityClicked.bind(this)}
                        selectedBadgeClicked={this.firstSelectedBadgeClicked.bind(this)}
                        selectedOptionsStyles={selectedOptionsStyles}
                        optionsListStyles={optionsListStyles} 
                        isSingleSelect={true}
                        isTextWrap={false} 
                        />
                        
                    </div>     

                    {this.canSubmit()?
                        <Button
                            color="primary" 
                            variant="contained" 
                            className="imagePaneButton" onClick={this.submitEntityImage}>Save</Button>
                        :
                        null
                    }
                    
                    <Button
                        color="primary" 
                        variant="contained" 
                        className="imagePaneButton" onClick={this.closeImagePane}>Close</Button>              
                </div>
                {this.state.selectedEntity == ''?
                    null
                    :
                    this.getImageOptions()   
                }                
            </div>
        );
    }
}
export default ImagePaneView;