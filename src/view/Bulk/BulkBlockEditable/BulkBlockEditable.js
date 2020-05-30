import React, { Component } from 'react';
import ContentEditable from 'react-contenteditable';
import  * as Utils from '../../../common/utilSvc';
import  "./BulkBlockEditable.css";
import { isNullOrUndefined } from 'util';

class BulkBlockEditable extends React.Component {

    constructor(props){
        super(props);
        //value, onChange, delims, type

        this.state = {
            html: '',
            delims: ['(',')']
        }

        this.htmlToText = require('html-to-text');

        this.handleChange = this.handleChange.bind(this);    
        this.unmakeHtml = this.unmakeHtml.bind(this);
        this.formatHtml = this.formatHtml.bind(this);
        this.removeExtraEffects = this.removeExtraEffects.bind(this);
        this.getDelimiters = this.getDelimiters.bind(this);
    }

    handleChange(e){
        let htmlStr = String(e.target.value);
        console.log(e.target);
        console.log(htmlStr);
        console.log(this.unmakeHtml(htmlStr));
        let newHtml = htmlStr;
        if(this.unmakeHtml(this.state.html)!=this.unmakeHtml(htmlStr))
            newHtml = this.formatHtml(htmlStr);

        this.setState({
            html: newHtml
        });
/*        let text = e.currentTarget.textContent;
        let event = {
            target: {
                value: text
            }
        };
        this.props.onChange(event);
        */
    }

    unmakeHtml(html){
        // replace br with \n

        let ans = html;
        ans = ans.replace(/<div/g,'<br><div');
        ans = this.htmlToText.fromString(ans);
        return ans;
    }

    removeExtraEffects(htmlStr){
        let ans = htmlStr;

        //replace title
        ans = ans.replace(new RegExp('<span style="color: green">','g'),'');

        //replace delim bold
        ans = ans.replace(new RegExp('<span style="font-weight:bold">','g'),'');

        //replace delim bold
        ans = ans.replace(new RegExp('<b style="color: green">','g'),'');
        ans = ans.replace(new RegExp('</b>','g'),'');
        
        //Replace endings
        ans = ans.replace(new RegExp('</span>','g'),'');

        return ans;
    }

    getDelimiters(html){
        //Check for consequtive title
        let delim = this.props.delims;
        let ans = html;
        if(!isNullOrUndefined(delim) && delim.length==2){
            ans = Utils.HtmlBasedOnDelimter(html,delim[0],delim[1],true); 
        }
        return ans;
    }

    formatHtml(html){
        let ans = html;

        //Delimiters
        if(this.props.type['delims'])
            ans = this.getDelimiters(html);
        /*for(let i=0; i<html.length; i++){
            if(html[i]=='#'){
                ans += `<span style="color: green">`;
                while(i<html.length && (html[i]!='\n') && (html[i]!='<'))
                {
                    ans += html[i];
                    i++;
                }
                ans += `</span>`;
                i--;

            }
            else{
                ans+=html[i];
            }
        }*/
        return ans;
    }

    render(){
        let html = this.props.value;
        html ='<div class="nonEditablePreviewText">' + html + '</div>';
        html = this.formatHtml(html);
        return (
            <div style={{width:'100%'}}>
                <ContentEditable
                    className="editableBulkDivMain"
                    html={html} // innerHTML of the editable div
                    disabled={true}       // use true to disable editing
                    />
            </div>
        );
    }
}
export default BulkBlockEditable;

/*
<div
                    className="editableBulkDiv"
                    contentEditable='true'
                    onInput={e => this.handleChange(e)}>
                    {this.props.value}
                    </div>
                    */