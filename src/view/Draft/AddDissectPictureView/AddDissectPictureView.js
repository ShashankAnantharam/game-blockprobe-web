import React, { Component } from 'react';
import ReactGA from 'react-ga';
import DissectPictureView from '../../../viso/dissectPicture/dissectPicture';
import { Button } from '@material-ui/core';
import Loader from 'react-loader-spinner';
import TextField from '@material-ui/core/TextField';
import * as firebase from 'firebase';
import * as Utils from '../../../common/utilSvc';
import './AddDissectPictureView.css';
import { isNullOrUndefined } from 'util';
import AddImageDissectPictureView from './AddImageDissectPictureView';

class AddDissectPictureView extends React.Component {

    constructor(props){
        super(props);

        this.state={
            addConnection: false,
            title: "",
            summary: "",
            coord: null,
            isEdit: false,
            oldTitle: "",
            oldSummary: "",
            oldCoord: null,
            editReference: null,
            imageUrl: null,
            editImage: false,
            loadingImage: false,
            selectedLine: null
        }

        ReactGA.initialize('UA-143383035-1');  

        this.handleChange = this.handleChange.bind(this);
        this.closeImagePane = this.closeImagePane.bind(this);
        this.openImagePane = this.openImagePane.bind(this);
        this.getImageFromDb = this.getImageFromDb.bind(this);
        this.coordinatesSelected = this.coordinatesSelected.bind(this);
        this.selectLine = this.selectLine.bind(this);
    }

    handleChange(event, type) {
        let str = event.target.value;
        var shouldUpdate = true;
        shouldUpdate = Utils.shouldUpdateText(str, ['\n','\t']);
        if(shouldUpdate){
            if(type=="description"){
                this.setState({summary: event.target.value});
            }
            else  if(type=="title"){
                this.setState({title: event.target.value});
            }
        }
    }

    async getImageFromDb(){
        let scope = this;
        scope.setState({
            loadingImage: true
        });
        let path = this.props.bId + '/general/dissect_picture';
        let pathRef = firebase.storage().ref(path);
        try{
        
            let url = await pathRef.getDownloadURL();
                         
            scope.setState({
                imageUrl: url,
                loadingImage: false
            });
        }
        catch(error){
            scope.setState({
                imageUrl: null,
                loadingImage: false
            });
        }  
    }

    componentDidMount(){
       // this.setState({
       //     imageUrl: "https://i.pinimg.com/564x/3d/22/ef/3d22ef2dc19d25469b0c4f75ce868118.jpg"
       // })

       this.getImageFromDb();
    }

    closeImagePane(shouldUpdate){
        this.setState({
            editImage: false
        });
        if(shouldUpdate)
            this.getImageFromDb();
    }

    openImagePane(){
        this.setState({
            editImage: true
        });
    }

    coordinatesSelected(coord){
        // console.log(coord);
        this.setState({
            coord: coord
        });
    }

    getLatestIndex(){
        let latestIndex = 0 ;
        if(this.props.lastIndexDraftBlocks.length > 0)
            latestIndex = Math.max(latestIndex, this.props.lastIndexDraftBlocks[this.props.lastIndexDraftBlocks.length - 1]);

        if(this.props.lastIndex){
            latestIndex = Math.max(latestIndex, this.props.lastIndex);
        }
        return latestIndex;
    }


    saveLine(){

        let index = this.getLatestIndex();
        index += 0.1;
        let fullBlock = {
            title: `${this.state.title.trim()}`,
            summary: this.state.summary.trim(),
            entities: [],
            evidences: [],
            lineCoord: this.state.coord,
            referenceBlock: null,
            timestamp: Date.now(),
            actionType: 'ADD'
        };

        //this.props.bId
        ReactGA.event({
            category: String('partsOfImg_savePart'),
            action: String(this.props.bId),
            label: String(this.props.bId)
            });

        if(!isNullOrUndefined(this.state.editReference)){
            fullBlock['actionType'] = "MODIFY";
            fullBlock.referenceBlock = this.state.editReference; 
        }

        // console.log(fullBlock);
        this.props.commitBlockToBlockprobe(fullBlock);

    }

    deleteLine(){
        let fullBlock = {
            title: `${this.state.oldTitle}`,
            summary: this.state.oldSummary,
            entities: [],
            evidences: [],
            lineCoord: this.state.oldCoord,
            referenceBlock: null,
            timestamp: Date.now()
        };
        fullBlock['actionType'] = "REMOVE";
        fullBlock.referenceBlock = this.state.editReference; 
        this.props.commitBlockToBlockprobe(fullBlock);
    }

    selectLine(lineDetails){
        // console.log(lineDetails);
        this.setState({
            isEdit: true,
            selectedLine: lineDetails,
            title: lineDetails.title,
            summary: lineDetails.summary,
            coord: lineDetails.lineCoord,
            oldTitle: lineDetails.title,
            oldSummary: lineDetails.summary,
            oldCoord: lineDetails.lineCoord,
            editReference: lineDetails.key
        });
    }

    renderView(){

        let lineToEdit = null;
        if(!isNullOrUndefined(this.state.selectedLine))
            lineToEdit = this.state.selectedLine.lineCoord;
        return (
            <div>
                {!isNullOrUndefined(this.state.imageUrl) && !this.state.editImage?
                    <div className="">
                        <div>
                            <DissectPictureView
                                partsOfImageLines={this.props.partsOfImageList}
                                addBlock={this.state.addConnection | this.state.isEdit}
                                imageUrl={this.state.imageUrl}
                                coordinatesSelected={this.coordinatesSelected}
                                selectLine={this.selectLine}
                                lineToEdit={lineToEdit}
                            />
                        </div>
                        <div className="leftMargin-1em" style={{display:'flex', flexWrap:'wrap'}}>
                            {(this.state.addConnection || 
                            (this.state.isEdit) && 
                            (
                                (this.state.title !=this.state.oldTitle 
                                    || this.state.summary != this.state.oldSummary
                                || JSON.stringify(this.state.coord)!=JSON.stringify(this.state.oldCoord))
                            )
                            ) && 
                            this.state.title.trim().length>0 
                                && !isNullOrUndefined(this.state.coord)?
                                <div>
                                    <Button
                                        variant="contained" 
                                        onClick={() => { this.saveLine() }}
                                        className="savePicturePartButton"
                                        >
                                        Save
                                    </Button>
                                </div>
                                :
                                null
                            }   

                            {this.state.isEdit?
                                <div>
                                <Button
                                    variant="contained" 
                                    onClick={() => { this.deleteLine() }}
                                    className="deletePicturePartButton"
                                    >
                                    Delete
                                </Button>
                            </div>
                            :
                            null
                            }  

                            <div>
                                <Button
                                    variant="contained" 
                                    onClick={() => { 
                                        this.setState({
                                            addConnection: (this.state.isEdit?false:!this.state.addConnection),
                                            title:"",
                                            oldTitle:"",
                                            summary:"",
                                            oldSummary:"",
                                            coord: null,
                                            oldCoord: null,
                                            selectedLine: null,
                                            isEdit: false,
                                            editReference: null
                                        })
                                    }}
                                    className="addPicturePartButton"
                                    >
                                    {this.state.addConnection || this.state.isEdit?
                                        "Cancel" 
                                        :
                                        "Add line"
                                    }
                                </Button>
                            </div> 

                            {!isNullOrUndefined(this.state.imageUrl)?
                                <div>
                                    <Button
                                        variant="contained" 
                                        onClick={() => {
                                            this.setState({
                                                editImage: true
                                            });
                                         }}
                                        className="editPicturePartImageButton"
                                        >
                                        Change picture
                                    </Button>
                                </div>
                                :
                                null
                            }              
                        </div>
                        <div className="leftMargin-1em">
                            {this.state.addConnection || this.state.isEdit?
                            <div>
                                <h4 className="addEdgeTitle"> Picture part</h4>
                                <div className="addEdgeBlockTextContainer">
                                    <TextField 
                                                type="text"
                                                variant="outlined"
                                                value={this.state.title}
                                                onChange={(e) => { this.handleChange(e,"title")}}
                                                label = "Name of part"
                                                multiline
                                                rowsMax="2"
                                                rows="1"
                                                style={{
                                                    background: 'white',
                                                    marginTop:'6px',
                                                    marginBottom:'6px',
                                                    width:'100%',
                                                    color: 'darkBlue',
                                                    fontWeight:'600'
                                                    }}/>
                                </div>
                                <div className="addEdgeEntityContainer">
                                    <TextField 
                                                type="text"
                                                variant="outlined"
                                                value={this.state.summary}
                                                onChange={(e) => { this.handleChange(e,"description")}}
                                                label = "Function of part"
                                                multiline
                                                rowsMax="3"
                                                rows="2"
                                                style={{
                                                    background: 'white',
                                                    marginTop:'6px',
                                                    marginBottom:'6px',
                                                    width:'100%',
                                                    color: 'darkBlue',
                                                    fontWeight:'600'
                                                    }}/>
                                </div>    
                            </div>
                            :
                            null
                            }
                        </div>
                    </div>
                    :
                    <AddImageDissectPictureView
                            closeImagePane={this.closeImagePane}
                            bId={this.props.bId}
                            imageUrl = {this.state.imageUrl}
                    />
                }
            </div>
        )
    }

    render(){
        return (
            <div>
                {this.state.loadingImage?
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
                        {this.renderView()}
                    </div>
                }
            </div>
        )
    }
}
export default AddDissectPictureView;