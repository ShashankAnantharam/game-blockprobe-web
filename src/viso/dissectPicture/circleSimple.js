import React, { Component, Fragment } from 'react';
import Img from 'react-image';
import { Line } from 'react-lineto';
import './dissectPicture.css';
import { isNullOrUndefined } from 'util';

class SimpleCircleView extends React.Component {

    constructor(props){
        super(props);
        //id, x, y, lineDetails

        this.onClick = this.onClick.bind(this);
    }

    componentDidMount(){
        
    }

    onClick(){
        if(this.props.onClick){
            this.props.onClick(this.props.lineDetails);
        }
    }

    render(){
        return (
            <div
                id={this.props.id}
                style={{
                    borderRadius:'50%',                   
                    border: '2px black solid',
                    position: 'absolute',
                    zIndex: '2',
                    transform: 'translate(-50%, -50%)',
                    top: String(this.props.y) + 'px', /*[wherever you want it]*/
                    left: String(this.props.x) + 'px' /*[wherever you want it]*/
                }}
                className=
                {
                    "circle_dissectPicture " +                 
                    (!isNullOrUndefined(this.props.onClick)?"circle_dissectPicture_clickable ":"") +
                    (!isNullOrUndefined(this.props.transparent) && this.props.transparent?"shape_transparent ":"") +
                    (!isNullOrUndefined(this.props.isColored) && this.props.isColored?"colored_circle_dissectPicture":"")
                }
                onClick={this.onClick}
            ></div>
        );
    }
}
export default SimpleCircleView;