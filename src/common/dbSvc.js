import { isNullOrUndefined } from "util";
import * as firebase from 'firebase';
import * as Utils from './utilSvc';
import { promises } from "fs";

export const writePostListToDb =(postList, userId, successFn, errorFn)=>{
    let allPosts = Utils.getShortenedListOfPosts(postList);
    if(allPosts){

        firebase.firestore().collection("publicWall").doc(userId).
        collection("userPosts").get().then((snapshot) => {
                
            snapshot.forEach((doc) => {
                firebase.firestore().collection("publicWall").doc(userId).
                collection("userPosts").doc(doc.id).delete();
            });
                
            for(var i=0; i<allPosts.length; i++){
                firebase.firestore().collection("publicWall").doc(userId).
                    collection("userPosts").doc(String(i)).set(allPosts[i]);        
            }
            if(successFn)
                successFn();
        },
        (error) => {
            if(errorFn)
                errorFn();
        });
    }
}

export const removeNotification =(notification,userId)=>{
    if(!isNullOrUndefined(notification) && !isNullOrUndefined(userId) && ('id' in notification)){
        let nId = notification.id;
        return firebase.firestore().collection("Users").doc(userId)
        .collection("notifications").doc(nId).delete();
    }
    return null;
}

export const removeInviteStoryNotification =(notification,userId,userIdHash)=>{
    if(!isNullOrUndefined(notification) && !isNullOrUndefined(userId) && ('permit' in notification)
                && ('id' in notification))
    {
        let bId = notification.id;
        firebase.database().ref('Blockprobes/'+ bId +'/users/'+userIdHash).remove();            
    }
}


export const addUserToBlockprobe =(notification,userId,userIdHash)=>{
    let allPromises = [];

    if(!isNullOrUndefined(notification) && !isNullOrUndefined(userId) && ('permit' in notification)
                && ('id' in notification)){
        let userObj = {
            id: userId,
            role: notification.permit
        }
        let bId = notification.id;
        firebase.database().ref('Blockprobes/'+ bId +'/users/'+userIdHash).set(userObj);

        let softBlockprobe = notification;
        softBlockprobe.timestamp = Date.now();
        let firestoreWrite = firebase.firestore().collection('Users').doc(userId)
        .collection('blockprobes').doc(bId).set(softBlockprobe);

        allPromises.push(firestoreWrite);
    }
    return allPromises;
}

export const setLanguage =(bId, lang)=>{
    // firebase.database().ref('Blockprobes/'+ bId +'/lang').set(lang);
    return firebase.firestore().collection("blprobeLang").
                doc(bId).set({
                    lang: lang
                });
}

export const getLanguageDb =(bId)=>{
    //return firebase.database().ref('Blockprobes/'+ bId +'/lang').once("value");
    return firebase.firestore().collection("blprobeLang").
                doc(bId).get();
}

export const getLanguageLogic =(snapshot)=>{
    if(snapshot.exists){
        return snapshot.data()['lang'];
    }
    return "en";
}