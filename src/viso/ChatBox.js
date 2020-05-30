import React, { Component } from 'react';
import * as firebase from 'firebase';
import { ChatFeed, ChatBubble, BubbleGroup, Message } from 'react-chat-ui';
import './ChatBox.css';
import { isNullOrUndefined } from 'util';

const styles = {
    button: {
      backgroundColor: '#fff',
      borderColor: '#1D2129',
      borderStyle: 'solid',
      borderRadius: 20,
      borderWidth: 2,
      color: '#1D2129',
      fontSize: 18,
      fontWeight: '300',
      paddingTop: 8,
      paddingBottom: 8,
      paddingLeft: 16,
      paddingRight: 16,
    },
    selected: {
      color: '#fff',
      backgroundColor: '#0084FF',
      borderColor: '#0084FF',
    },
  };
  
  const users = {
    0: 'You',
    1: 'Submitter',
    2: 'Reviewer',
  };

  const customBubble = props => (
    <div>
      <p>{`${props.message.senderName} ${props.message.id ? 'says' : 'said'}: ${
        props.message.message
      }`}</p>
    </div>
  );
  
class ChatBox extends React.Component {

    constructor(props){
        super(props);

        this.state={
              messages: [],
              useCustomBubble: false,
              curr_user: 0,
              shajs: '',
              uIdHash: '',
             
        }

        this.prevBlockId = '';
        this.prevBlockState = '';
        this.currRef = null;

        var shajs = require('sha.js');
        this.state.uIdHash = shajs('sha256').update(this.props.uId).digest('hex');
        this.state.shajs = shajs;
        this.getChatFeedFromDb = this.getChatFeedFromDb.bind(this);
    }


    onPress(user) {
        this.setState({ curr_user: user });
      }
    
      onMessageSubmit(e) {
        const input = this.message;
        e.preventDefault();
        if (!input.value) {
          return false;
        }
        this.pushMessage(this.state.curr_user, input.value);
        input.value = '';
        return true;
      }
    
      pushMessage(recipient, message) {
        
        var blockSubmitter = null;
        if(this.props.selectedBlock.blockState == 'UNDER REVIEW'){
          blockSubmitter = true;
        }
        else if(this.props.selectedBlock.blockState == 'TO REVIEW')
        {
          blockSubmitter = false;
        }
        if(this.currRef!=null){
          this.currRef.push({
            author:this.state.uIdHash,
            blockSubmitter: blockSubmitter,
            message: message
          });
        }
      }

      //people, undo, thumb_up
      /*const prevState = this.state;
        const newMessage = new Message({
          id: recipient,
          message,
          senderName: users[recipient]
        });
        prevState.messages.push(newMessage);
        this.setState(this.state);
      */
 
        /* new Message({
                  id: 1,
                  message: "I'm the recipient! (The person you're talking to)",
                }), // Gray bubble
                new Message({ id: 0, message: "I'm you -- the blue bubble!" }), // Blue bubble
                */
          //author
          //blockSubmitter true/false
          //message
          
      async componentDidUpdate(){
        if(this.prevBlockId != this.props.selectedBlock.key ||
           (this.prevBlockId == this.props.selectedBlock.key &&
            this.prevBlockState != this.props.selectedBlock.blockState)){
          //console.log('Here');
          this.prevBlockId= this.props.selectedBlock.key;
          this.prevBlockState= this.props.selectedBlock.blockState;
          await this.setState({
            messages:[],
          },
          function() { this.getChatFeedFromDb()}
          );

        }
      }

      componentDidMount(){
        this.getChatFeedFromDb();
      }

      getChatFeedFromDb(){

        if(!isNullOrUndefined(this.props.selectedBlock)){

          this.prevBlockId= this.props.selectedBlock.key;
          this.prevBlockState= this.props.selectedBlock.blockState;

          if(this.currRef!=null){
            this.currRef.off();
          }
          this.currRef = firebase.database().ref("Blockprobes/"+this.props.bpId
          +"/chts/"+this.props.selectedBlock.key);
          this.currRef.
          on('child_added', dataSnapshot => {

            var items = this.state.messages;
            var chatData = dataSnapshot.val();
            
            var currId = 0;
            if(this.state.uIdHash == chatData.author){
              if(this.props.selectedBlock.blockState =="TO REVIEW"
               && chatData.blockSubmitter){

                //Chat is in submitter profile but user is reveiwing
                currId = 1;
              }
              else if(this.props.selectedBlock.blockState =="UNDER REVIEW"
              && !chatData.blockSubmitter){

                //Chat is in reviewer profile but user is submitter
                currId = 2;
              }
              else{

                //Chat and user in same profile
                currId = 0;
              }
          }
          else{
            if(chatData.blockSubmitter){
              currId = 1;
            }
            else{
              currId = 2;
            }
          }


          items.push(new Message({
                  id: currId,
                  message: chatData.message,
                  senderName: users[currId]
                }));

          this.setState({
              messages: items
            }); 

        });

        return null;
      }
    }

    render(){
        return(
            <div className="chat-box-container">
                
                <ChatFeed
                  chatBubble={this.state.useCustomBubble && customBubble}
                  maxHeight={250}
                  messages={this.state.messages} // Boolean: list of message objects
                  showSenderName
                />

                <form onSubmit={e => this.onMessageSubmit(e)}>
                    <input
                    ref={m => {
                        this.message = m;
                    }}
                    placeholder="Type a message..."
                    className="message-input"
                    style={{width:'99%', height:'30px'}}
                    />
                </form>
                </div>
        );
    }
}
export default ChatBox;