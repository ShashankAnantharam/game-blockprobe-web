import React, { Component, Fragment } from 'react';
import Img from 'react-image';
import { Line } from 'react-lineto';
import './dissectPicture.css';
import { isNullOrUndefined } from 'util';
import { black } from 'color-name';
import SimpleCircleView from './circleSimple';
import SimpleRectangleView from './rectangleSimple';

/*
{
                    x0:1/7,
                    y0:321/652,
                    x1:0.2,
                    y1:0.1
                },
                {
                    x0:443/570,
                    y0:447/570,
                    x1:0.8,
                    y1:0.95
                }
                */

class DissectPictureView extends React.Component {

    constructor(props){
        super(props);
        //addBlock, selectLine, blackListKey

        this.state ={
            showLines: false,
            imageLoaded: false,
            lines: [],
            pos:{
                first:null,
                second: null
            },
            selectedLinePos:{
                first:null,
                second: null
            }
        }

        this.renderLine = this.renderLine.bind(this);
        this.renderLines = this.renderLines.bind(this);
        this.mouseClick = this.mouseClick.bind(this);
        this.displayPositions = this.displayPositions.bind(this);
    }

    mouseClick(event) {
        let addBlock = this.props.addBlock;
        if(addBlock){
            let coord = {x:event.clientX, y:event.clientY};

            coord.x = coord.x - document.getElementById("testing").getBoundingClientRect().x
            + document.getElementById("testing").offsetLeft;
            coord.y = coord.y - document.getElementById("testing").getBoundingClientRect().y
            + document.getElementById("testing").offsetTop;
            let pos = this.state.pos;
            if(isNullOrUndefined(pos.first)){
                pos.first = coord;
                if(!isNullOrUndefined(this.props.coordinatesSelected))
                    this.props.coordinatesSelected(null);
            }
            else if(!isNullOrUndefined(pos.first) && isNullOrUndefined(pos.second)){
                pos.second = coord;
                if(!isNullOrUndefined(this.props.coordinatesSelected))
                    this.props.coordinatesSelected(this.getRelativeLinePos(pos));
            }
            else{
                //Function to return value here
                pos.first = coord;
                pos.second = null;
                if(!isNullOrUndefined(this.props.coordinatesSelected))
                    this.props.coordinatesSelected(null);
            }
            this.setState({
                pos:pos
            });
        }
    }

    getRelativeLinePos(pos){
        let newPos = {};
        if(pos.first){
            newPos.first = this.getRelativeCoord(pos.first);
        }
        if(pos.second){
            newPos.second = this.getRelativeCoord(pos.second);
        }
        return newPos;
    }

    getRelativeCoord(coord){
        let x = 
        (coord.x - document.getElementById("testing").offsetLeft)/Math.max(1,document.getElementById("testing").getBoundingClientRect().width);                
        let y = 
                (coord.y - document.getElementById("testing").offsetTop)/Math.max(1,document.getElementById("testing").getBoundingClientRect().height);
        return {
            x: x,
            y: y
        }
    }

    displayPositions(pos){
        return(
            <Fragment>
                {!isNullOrUndefined(pos.first)?
                    <Fragment>
                        {this.renderRectangle(pos.first.x,pos.first.y)}
                    </Fragment>
                    :
                    null
                }
                {!isNullOrUndefined(pos.second)?
                    <Fragment>
                        {this.renderRectangle(pos.first.x,pos.first.y)}
                        {this.renderCircle(pos.second.x,pos.second.y,null,null,false,true)}
                        {this.renderLine(pos.first.x,pos.first.y,pos.second.x,pos.second.y)}
                    </Fragment>
                    :
                    null
                }
            </Fragment>
        )
    }

    componentDidMount(){ 
        document.getElementById("testing").addEventListener("click", this.mouseClick);
        
        this.setState({
            showLines: true
        });
    }

    componentWillReceiveProps(newProps){
        if(isNullOrUndefined(this.props.lineToEdit) || 
        JSON.stringify(this.props.lineToEdit)!=JSON.stringify(newProps.lineToEdit)){
            if(isNullOrUndefined(newProps.lineToEdit)){
                if(!this.props.addBlock){
                    let pos =  {
                        first:null,
                        second: null
                    }
                    this.setState({
                        pos: pos
                    });
                }
            }
            else{
                if(!this.props.addBlock){
                    let lineCoord = newProps.lineToEdit;
                    
                    let pos = this.state.pos;
                    pos.first=  
                    {
                        x: document.getElementById("testing").offsetLeft + 
                    document.getElementById("testing").getBoundingClientRect().width*lineCoord.first.x,
                        y: document.getElementById("testing").offsetTop + 
                    document.getElementById("testing").getBoundingClientRect().height*lineCoord.first.y            
                    }
                    pos.second=  
                    {
                        x: document.getElementById("testing").offsetLeft + 
                    document.getElementById("testing").getBoundingClientRect().width*lineCoord.second.x,
                        y: document.getElementById("testing").offsetTop + 
                    document.getElementById("testing").getBoundingClientRect().height*lineCoord.second.y            
                    }

                    this.setState({
                        pos: pos
                    })
                }
            }
        }

        if(JSON.stringify(this.props.singleLineCoord)!=
            JSON.stringify(newProps.singleLineCoord)){
                if(isNullOrUndefined(newProps.singleLineCoord)){
                    if(!this.props.viewSingleLine){
                        let pos =  {
                            first:null,
                            second: null
                        }
                        this.setState({
                            selectedLinePos: pos
                        });
                    }
                }
                else{
                        let lineCoord = newProps.singleLineCoord;
                        let pos = this.state.selectedLinePos;
                        pos.first=  
                                {
                                    x: document.getElementById("testing").offsetLeft + 
                                document.getElementById("testing").getBoundingClientRect().width*lineCoord.first.x,
                                    y: document.getElementById("testing").offsetTop + 
                                document.getElementById("testing").getBoundingClientRect().height*lineCoord.first.y            
                                }
                        pos.second=  
                                {
                                    x: document.getElementById("testing").offsetLeft + 
                                document.getElementById("testing").getBoundingClientRect().width*lineCoord.second.x,
                                    y: document.getElementById("testing").offsetTop + 
                                document.getElementById("testing").getBoundingClientRect().height*lineCoord.second.y            
                                };
                        this.setState({
                            selectedLinePos: pos
                        });
                    
                }
            
        }
    }

    getLines(){
        let blockList = this.props.partsOfImageLines;
        let lines = [];
        if(blockList){
            blockList.map((block)=>{
                let line = {
                    title: block.title,
                    summary: block.summary,
                    x0: block.lineCoord.first.x,
                    y0: block.lineCoord.first.y,
                    x1: block.lineCoord.second.x,
                    y1: block.lineCoord.second.y,
                    lineCoord: block.lineCoord,
                    key: block.key
                }
                if('answeredTitle' in block){
                    line['answeredTitle'] = block.answeredTitle;
                }
                if('answeredSummary' in block){
                    line['answeredSummary'] = block.answeredSummary;
                }
                lines.push(line);
            });    
        }
        return lines;
    }

    renderLinesExcluded(key){
        let lines = this.getLines();

        let scope = this;
        function onClick(lineDetails){
            if(scope.props.selectLine){
                scope.props.selectLine(lineDetails);
            }
        }

        let lineRender = lines.map((line) => {
            if(scope.props.restrictedLines && scope.props.restrictedLines[line.key] || line.key==key)
                return null;
            let f0 = [
                document.getElementById("testing").offsetLeft + 
                document.getElementById("testing").getBoundingClientRect().width*line.x0,
                document.getElementById("testing").offsetTop + 
                document.getElementById("testing").getBoundingClientRect().height*line.y0
            ];
            let f1 = [
                document.getElementById("testing").offsetLeft + 
                document.getElementById("testing").getBoundingClientRect().width*line.x1,
                document.getElementById("testing").offsetTop + 
                document.getElementById("testing").getBoundingClientRect().height*line.y1
            ]
            return (
                <Fragment>
                    {this.renderLine(f0[0],f0[1],f1[0],f1[1],true)}
                    {this.renderCircle(f1[0],f1[1],line,onClick)}
                    {this.renderRectangle(f0[0],f0[1],line,onClick)}
                </Fragment>
            )
        });
        return lineRender;
    }

    renderLines(){
        let lines = this.getLines();

        let scope = this;
        function onClick(lineDetails){
            if(scope.props.selectLine){
                scope.props.selectLine(lineDetails);
            }
        }

        let lineRender = lines.map((line) => {
            if(scope.props.restrictedLines && scope.props.restrictedLines[line.key])
                return null;
            let f0 = [
                document.getElementById("testing").offsetLeft + 
                document.getElementById("testing").getBoundingClientRect().width*line.x0,
                document.getElementById("testing").offsetTop + 
                document.getElementById("testing").getBoundingClientRect().height*line.y0
            ];
            let f1 = [
                document.getElementById("testing").offsetLeft + 
                document.getElementById("testing").getBoundingClientRect().width*line.x1,
                document.getElementById("testing").offsetTop + 
                document.getElementById("testing").getBoundingClientRect().height*line.y1
            ]
            return (
                <Fragment>
                    {this.renderLine(f0[0],f0[1],f1[0],f1[1])}
                    {this.renderCircle(f1[0],f1[1],line,onClick)}
                    {this.renderRectangle(f0[0],f0[1],line,onClick)}
                </Fragment>
            )
        });
        return lineRender;
    }

    renderLine(x0,y0,x1,y1,transparent){
        return (
            <Line x0={x0} y0={y0} x1={x1} y1={y1} borderWidth="4px" 
            within="imageDissectContainer"
            borderColor="black"
            className={"lineS " + (transparent?" shape_transparent":null)}
            zIndex={1}
            />
        );
    }

    renderCircle(x,y,lineDetails, onClick, transparent, isColored){
        return (
            <SimpleCircleView
                id="circle1"
                lineDetails={lineDetails}
                x={x}
                y={y}
                onClick={onClick}
                transparent={transparent}
                isColored={isColored}
                />
        );
    }

    renderRectangle(x,y,lineDetails, onClick,transparent){
        return (
            <SimpleRectangleView
                id="rectangle1"
                lineDetails={lineDetails}
                x={x}
                y={y}
                onClick={onClick}
                transparent={transparent}
                />
        );
    }

    imageLoaded(){
        this.setState({
            imageLoaded: true
        });
    }

    render(){

        return (
            <div style={{marginBottom: '1.4em'}}>
                <div  className="imageDissectContainer">
                   <img id="testing" onLoad={() => this.imageLoaded()}                    
                   className={"imageToDissect " + 
                   (this.props.addBlock|| this.props.viewSingleLine?"imageToDissect_addBlock ":null)} src={this.props.imageUrl} />        
                    {this.state.showLines && !this.props.addBlock && this.state.imageLoaded 
                    && !this.props.viewSingleLine?
                        <Fragment>
                            {this.renderLines()}
                        </Fragment>
                        :
                        null
                    }
                    {this.state.showLines && this.props.addBlock && this.state.imageLoaded
                    && !this.props.viewSingleLine?
                        <Fragment>
                            {this.displayPositions(this.state.pos)}
                        </Fragment>
                        :
                        null
                    }
                    {this.props.viewSingleLine?
                        <Fragment>
                            {this.displayPositions(this.state.selectedLinePos)}
                            {this.renderLinesExcluded(this.props.selectedLineKey)}
                        </Fragment>
                    :
                    null
                    }                
                </div>
            </div>
        )
    }
}
export default DissectPictureView;