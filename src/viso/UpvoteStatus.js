import React, { Component } from 'react';
import ThumbUpIcon from '@material-ui/icons/ThumbUp'; 
import './UpvoteStatus.css';

class UpvoteStatusComponent extends React.Component {

    constructor(props){
        super(props);
        //upVotes, bpDetails

    

    }



    render(){

        var total = this.props.bpDetails.criterion;

        return(
            <div className="upvote-span">
                <ThumbUpIcon className="upvoteIcon"/>
                {this.props.upVotes} ({
                    total - this.props.upVotes > 0 ? 
                    total - this.props.upVotes : 0
                    } needed)  
            </div>
        );
    }

}
export default UpvoteStatusComponent;