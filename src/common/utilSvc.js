import { isNullOrUndefined } from "util";

let months = ['Jan','Feb','March','April','May','June','July','Aug','Sep','Oct','Nov','Dec'];

export const getShortenedListOfBlockprobes = (blockprobes) => {
    let allBlockprobes = [], currentBlockprobePage = [];
    let count=0;
    if(blockprobes!=null){
        Object.keys(blockprobes).map((key, index) => {
            if(count && count%100==0){
                let page = {
                    blockprobe: currentBlockprobePage
                };
                allBlockprobes.push(page);
                currentBlockprobePage = [];
            }
            let blockprobe = blockprobes[key];
            if(blockprobe!=null){  
                Object.keys(blockprobe).map((bpKey) => {
                    if(blockprobe[bpKey]==undefined){
                        delete blockprobe[bpKey];
                    }
                });
                currentBlockprobePage.push(blockprobe);
                count++;
            }
        } 
        );
    }
    if(currentBlockprobePage.length > 0){
        let page = {
            blockprobe: currentBlockprobePage
        };
        allBlockprobes.push(page);
        currentBlockprobePage = [];
    }    
    return allBlockprobes;
}

export const getShortenedListOfGameLists = (gameLists) => {
    let all = [], currentGameLists = [];
    let count=0;
    if(gameLists!=null){
        Object.keys(gameLists).map((key, index) => {
            if(count && count%100==0){
                let page = {
                    gameLists: currentGameLists
                };
                all.push(page);
                currentGameLists = [];
            }
            let gameList = gameLists[key];
            if(gameList!=null){  
                currentGameLists.push(gameList);
                count++;
            }
        } 
        );
    }
    if(currentGameLists.length > 0){
        let page = {
            gameLists: currentGameLists
        };
        all.push(page);
        currentGameLists = [];
    }    
    return all;
}

export const getShortenedListOfBlockTree = (blockTree) => {
        let bTree = blockTree;
        let count=0;
        let allBlocks = [], currBlockPage = [];
        if(bTree!=null){
            Object.keys(bTree).map((key, index) => {
                if(count && count%100 == 0){
                    let page = {
                        blocks: currBlockPage
                    };
                    allBlocks.push(page);
                    currBlockPage = [];
                }
                let block = bTree[key];
                if(block!=null){
                    if(block.previousKey)
                        block['parent']=block.previousKey;
                    if(!block.children)
                        block['children']=[];    
                    if(block.actionType){  
                        Object.keys(block).map((bKey) => {
                            if(block[bKey]==undefined){
                                delete block[bKey];
                            }
                        });   
                        currBlockPage.push(block);
                        count++;
                    }
                }
            } 
            );
        }
        if(currBlockPage.length > 0){
            let page = {
                blocks: currBlockPage
            };
            allBlocks.push(page);
            currBlockPage = [];
        }

        
        return allBlocks;
        
}

export const getShortenedListOfImages = (imageMapping) => {
    
    //Add images
    let imageMap = imageMapping;
    let countI=0;
    let allImages = [], currImagePage = [];
    if(imageMap!=null){
        Object.keys(imageMap).map((key, index) => {
            if(countI && countI%200==0){
                let page = {
                    images: currImagePage
                };
                allImages.push(page);
                currImagePage = [];
            }
            var image = {
                url: imageMap[key],
                entity: key
            };
            if(image!=null){   
                Object.keys(image).map((imKey) => {
                    if(image[imKey]==undefined){
                        delete image[imKey];
                    }
                });                
                currImagePage.push(image);
                countI++;
            }
        } 
        );
    }
    if(currImagePage.length > 0){
        let page = {
            images: currImagePage
        };
        allImages.push(page);
        currImagePage = [];
    }
    return allImages;
}

export const getShortenedListOfPosts = (posts) => {    
    let count=0;
    let allPosts = [], currPostPage = [];
    if(posts!=null){
        for(let i=0; i<posts.length; i++){
                if(count && count%100 == 0){
                    let page = {
                        posts: currPostPage
                    };
                    allPosts.push(page);
                    currPostPage = [];
                }
                let post = posts[i];
                if(!isNullOrUndefined(post)){
                    currPostPage.push(post);
                    count++;        
                }
            }
    } 
    
    if(currPostPage.length > 0){
        let page = {
            posts: currPostPage
        };
        allPosts.push(page);
        currPostPage = [];
    }
       
    return allPosts;    
}

export const getTextListForBulk = (text) => {
    let textList = [];
    let  curr = '';
    for(let i=0;!isNullOrUndefined(text) && i<text.length; i++){
        curr += text[i];
        if(i && i%10000 == 0){
            textList.push(curr);
            curr  = '';
        }
    }
    if(curr.length>0)
        textList.push(curr);
        
    return textList;
}

export const  extractBlockIndex = (block)=>{
    if(isNullOrUndefined(block))
        return null;    
    
    let title = block.title;
    if(isNullOrUndefined(title))
        return null;

    let a =  title.trim(), aIndex = 0;
    let isAExist = false;
    if(a.length>0 && a.charAt(0)==='#'){
        var num = '';
        for(var i=1; i<a.length && a[i]!=' '; i++){
            
            if((!isNaN(parseInt(a.charAt(i), 10))) || a[i]==='.'){
                num += a.charAt(i);
            }
            else{
                if(num.length > 0){
                    aIndex = parseFloat(num);
                    isAExist = true;
                }
            }
        }
        if(num.length > 0){
            aIndex = parseFloat(num);
            isAExist = true;
        }    
    }
    if(isAExist)
        return aIndex;
    return null;
}

export const validateNumber = (text) => {
    for(let i=0; text && i<text.length; i++){
        let lastChar = text[i];
        if(!((lastChar>='1' && lastChar<='9') || lastChar=='0'))
            return false;
    }
    return true;
}

export const appendCharToString = (str, char, totalLength) => {
    let newStr = '';
    let len = Math.max(0,totalLength - str.length);
    for(let i=0; i<len; i++){
        newStr += String(char);
    }
    newStr += str;
    return newStr;
}

export const getDateTimeString = (timelineBlock) => {
    var ans = "";
    if(timelineBlock.blockDate!=null){      
        if(!isNullOrUndefined(timelineBlock.blockDate.month))  
            ans = ans + months[timelineBlock.blockDate.month] + " ";
        if(!isNullOrUndefined(timelineBlock.blockDate.date))
            ans = ans + timelineBlock.blockDate.date + ", ";
        ans = ans + appendCharToString(String(timelineBlock.blockDate.year),'0',4) + "  ";

        if(timelineBlock.blockTime!=null){
            var temp = "";
            if(timelineBlock.blockTime.hours < 10){
                temp = "0"; 
            }
            temp = temp + timelineBlock.blockTime.hours;
            ans = ans + temp + ":";

            temp = "";
            if(timelineBlock.blockTime.minutes < 10){
                temp = "0"; 
            }
            temp = temp + timelineBlock.blockTime.minutes;
            ans = ans + temp;
        }
    }
    return ans;    
}

export const isTitleHashtag = (str)=>{
    //str is string
    if(!isNullOrUndefined(str)){
        str = str.trim();
        if(str.length>0 && str[0]=='#')
            return true;
    }
    return false;
}

export const isEntitiesDollar = (str)=>{
    //str is string;
    // return true for $ [.....  ]
    if(!isNullOrUndefined(str)){
        str = str.trim();
        if(str.length>2 && str[0]=='$'){
            let i=1;
            while(i<str.length && str[i]==' ')
                i++;
            if(str[i]=='['){
                while(i<str.length && str[i]!=']')
                    i++;
                if(i<str.length && str[i]==']')
                    return true;
            }            
        }
    }
    return false;
}

export const getEntities =  (str) =>{
    //Assuming string is of  form $[...]
    let i=0;
    let ans = [];
    if(isNullOrUndefined(str))
        return ans;
    let start=0, end=0;
    while(i<str.length && str[i]!='['){
        i++;
    }
    start =  i+1;
    while(i<str.length && str[i]!=']'){
        i++;
    }
    end = i;
    if(end >= str.length){
        return ans;
    }

    let newStr = str.substring(start,end);
    ans = newStr.split(',');
    for(let j=0; j<ans.length; j++){
        ans[j] = ans[j].trim();
    }
    return ans;
}

export const isTitleSummary = (str)=>{
    //str is string
    if(isTitleHashtag(str)){
        str = str.trim();
        let startIndex = 0;
        while(startIndex<str.length && str[startIndex] != ' '){
            if(str[startIndex] == 's' || str[startIndex] == 'S')
                return true;
            startIndex++;
        }
    }
    return false;
}

export const removeTitleHashtag = (str)=>{
    //str is string
    if(isTitleHashtag(str)){
        str = str.trim();
        let startIndex = 0;
        while(startIndex<str.length && str[startIndex] != ' '){
            startIndex++;
        }
        if(startIndex < str.length){
            str = str.substring(startIndex+1);
        }
        else{
            str = '';
        }
    }
    return str;
}

export const getBlocksText = (blocks)=>{
    //str is string
    let ans = '';
    if(!isNullOrUndefined(blocks)){
        for(let i=0; i<blocks.length; i++){
            if(!isNullOrUndefined(blocks[i].title) && blocks[i].title.trim().length>0){
                let strLeftover = removeTitleHashtag(blocks[i].title);
                if(strLeftover.length>0)
                    ans += '# '+ removeTitleHashtag(blocks[i].title) + '\n';
            }
            if(!isNullOrUndefined(blocks[i].summary) && blocks[i].summary.trim().length>0){
                ans += blocks[i].summary + '\n';
            }
            if(!isNullOrUndefined(blocks[i].entities) && blocks[i].entities.length>0){
                let entityStr = "$[";
                for(let j=0; j<blocks[i].entities.length;j++){
                    if(j!=0)
                        entityStr += ',';
                    entityStr += blocks[i].entities[j].title.toLowerCase();
                }
                entityStr += "]\n";
                ans += entityStr;
            }
            ans += "\n";            
        }
    }
    return ans;
}

export const sortBlocksCommon = (a, b, a_ts = 0, b_ts = 0)=>{
    a = a.trim();        
    b = b.trim();

    var aIndex = 0, bIndex = 0, isAExist = false, isBExist = false;
    if(a.length>0 && a.charAt(0)==='#'){
        var num = '';
        for(var i=1; i<a.length; i++){
            
            if((!isNaN(parseInt(a.charAt(i), 10))) || a[i]==='.'){
                num += a.charAt(i);
            }
            else{
                if(num.length > 0){
                    aIndex = parseFloat(num);
                    isAExist = true;
                }
            }
        }
        if(num.length > 0){
            aIndex = parseFloat(num);
            isAExist = true;
        }    
    }

    if(b.length>0 && b.charAt(0)==='#'){
        var num = '';
        for(var i=1; i<b.length; i++){
            
            if((!isNaN(parseInt(b.charAt(i), 10))) || b[i]==='.'){
                num += b.charAt(i);
            }
            else{
                if(num.length > 0){
                    bIndex = parseFloat(num);
                    isBExist = true;
                }
            }
        }    
        if(num.length > 0){
            bIndex = parseFloat(num);
            isBExist = true;
        }
    
    }

    // A comes after b
    if(!isAExist && isBExist)
        return 1;

    // A comes before b
    if(isAExist && !isBExist)
        return -1;

    // A comes before b
    if(isAExist && isBExist){
        if(aIndex > bIndex)
            return 1;
        return -1;
    }

    if(a_ts > b_ts)
        return 1;
    else if(b_ts > a_ts)
        return -1;

    if(a > b)
        return 1;

    return -1;
}

export const sortTimeline =(timelineList)=>{
    timelineList.sort(function(b,a){
    if(a.blockDate.year!==b.blockDate.year)
        return a.blockDate.year - b.blockDate.year; 
        
    if(a.blockDate.month == null)
        return 1;
    else if(b.blockDate.month == null)
        return -1;

    if(a.blockDate.month!==b.blockDate.month)
        return a.blockDate.month - b.blockDate.month;        

    if(a.blockDate.date == null)
        return 1;
    else if(b.blockDate.date == null)
        return -1;

    if(a.blockDate.date!==b.blockDate.date)
        return a.blockDate.date - b.blockDate.date;

     if(b.blockTime == null &&  a.blockTime!=null){
         return 1;
         //a is greater than or equal to if b has no time
     }
     else if(a.blockTime == null &&  b.blockTime!=null){
        return -1;
        //a is greater than or equal to if b has no time
    }
     
     if(a.blockTime!=null && b.blockTime!=null){
         if(a.blockTime.hours!==b.blockTime.hours){
             return a.blockTime.hours - b.blockTime.hours;
         }
         if(a.blockTime.minutes!==b.blockTime.minutes){
            return a.blockTime.minutes - b.blockTime.minutes;
        }
     }

     //a is not null and b is not null OR both are fully equal
     return sortBlocksCommon(a.title,b.title,a.timestamp,b.timestamp);
    });

    timelineList.reverse();
}

export const filterText = (text) => {
    let ans = '';
    for(let i=0; !isNullOrUndefined(text) && i<text.length; i++){
        if((text[i]>='1' && text[i]<='9') || (text[i]>='a' && text[i]<='z')
            || (text[i]>='A' && text[i]<='Z') || (text[i]=='0') || 
            (text[i]=='.') || (text[i]=='?') || (text[i]==',') || (text[i]=='"') || (text[i]=='\'')
            || (text[i]==' ') || (text[i]=='/') || (text[i]=='\n'))
            {
                ans += text[i];
            }
        else{
            ans += ' ';
        }
    }
    ans += '\n\n';
    return ans;
}

export const isCharacterNumeric = (text) => {
    if(!((text >='1' && text<='9') || text=='0' || text=='.'))
        return false;
    return  true;
}

export const isCharacterAlphabet = (text) => {
    if(!((text >='a' && text<='z') || (text >='A' && text<='Z')))
        return false;
    return  true;
}

export const isCharacterAcceptableText = (text) => {
    if(text =='.' || text==',' || text ==' ' || text =='%' || isCharacterAlphabet(text) || isCharacterNumeric(text))
        return true;
    return false;
}

export const isValidDelimiter = (text) => {
    if(!isNullOrUndefined(text)){
        if(text.length > 2)
            return false;
        for(let i=0; i<2; i++){
            if(text[i]=='\n' || text[i]=='\t' || text[i]==' ')
                return false;
        }
        if(text.length==2){
            if(text[0]==text[1])
                return false;
        }
    }
    return true;
}

export const correctTextForSpeech = (text) => {
    let ans = '';
    if(!isNullOrUndefined(text)){
        if(text.length)
            ans += text[0];
        for(let i=1; i<text.length;i++){
            if(text[i-1]=='.' || text[i-1]==','){
                if(!isCharacterNumeric(text[i]) && text[i]!='.' && text[i]!=' '){
                    ans += ' ';
                }
            }
            ans += text[i];
        }
    }
    ans = ans.trim();
    return ans;
}

export const filterTextBasedOnDelimter = (text, lDelim, rDelim, shouldInclude) => {
    let prev2 = ' ';
    let prev1 = ' ';
    if(!isNullOrUndefined(text)){
        let flag=0;
        let delimText = '';
        let nonDelimText =  '';
        for(let i=0; i<text.length; i++){
            let isNewlineBtwParas = false;
            if(prev2!='\n' && prev1=='\n' && text[i]=='\n')
                isNewlineBtwParas = true;

            let shouldAdd = true;
            if(text[i]==lDelim){
                if(flag==0)
                {
                    shouldAdd = false;
                    nonDelimText += '\n';
                }
                flag++;
            }
            else if(text[i]==rDelim){
                if(flag==1){
                    shouldAdd = false;
                    delimText += '\n';
                }
                if(flag>0){
                    flag--;
                }                
            }

            if(flag==0 && shouldAdd){
                nonDelimText += text[i];
                if(isNewlineBtwParas){
                    delimText += '\n\n';
                }
            }
            else if(shouldAdd){
                delimText += text[i];
                if(isNewlineBtwParas){
                    nonDelimText += '\n\n';
                }
            }
            prev2 = prev1;
            prev1 = text[i];            
        }
        if(shouldInclude)
            return delimText;
        return nonDelimText;
    }
    return text;
}


export const HtmlBasedOnDelimter = (text, lDelim, rDelim, shouldInclude) => {
    if(!isNullOrUndefined(text)){
        let flag=0;
        let ans = '';
        for(let i=0; i<text.length; i++){
            if(text[i]==lDelim){
                if(flag==0)
                {
                    ans += text[i];
                    ans += '<b class="filterTextStyle">';  
                    flag++;
                    continue;                  
                }
                flag++;               
            }
            else if(text[i]==rDelim){
                if(flag==1){
                    ans += '</b>';
                }
                if(flag>0){
                    flag--;
                }                
            }
            ans += text[i];         
        }
        return ans;
    }
    return text;
}

export const shouldUpdateText = (str, restrictedChars)=>{
    for(let i=0;!isNullOrUndefined(str) && i<str.length; i++){
        for(let j=0; !isNullOrUndefined(restrictedChars) && j<restrictedChars.length; j++){
            if(str[i]==restrictedChars[j])
                return false;
        }
    }
    return true;
}

export const isNumber = (str)=>{

    //exception for single dash
    if(str.length==1 && str[0]=='-')
        return true;

    if(isNaN(str))
        return false;
    return true;
}

export const coalesceNumbers = (numbers)=>{
    let nMap = {};
    for(let i=0;!isNullOrUndefined(numbers) && i<numbers.length; i++){
        let key = numbers[i].key;
        let value = numbers[i].value;
        if(!(key in nMap)){
            nMap[key] = 0;
        }
        if(!isNaN(Number(nMap[key])))
            nMap[key] += Number(value);
    }
    let finalAns = [];
    Object.keys(nMap).forEach((key) => {
        finalAns.push({
            key: key,
            value: nMap[key]
        });
    })
    return finalAns;
}

export const coalesceBlockNumbers = (blocks)=>{
    let nos = [];
    for(let i=0; i<blocks.length;i++){
        if(!isNullOrUndefined(blocks[i].numbers)){
            for(let j=0; j<blocks[i].numbers.length;j++){
                nos.push(blocks[i].numbers[j]);
            }
        }
    }
    nos = coalesceNumbers(nos);
    return nos;
}

export const makeFirstLetterUppercase = (str)=>{
    if(isNullOrUndefined(str))
        return '';
    str = str.trim();
    if(str.length==0)
        return str;
    let out = str.toUpperCase().charAt(0) + str.substring(1).toLowerCase(); 
    return out;
}

export const getEntityChange = (entity, ts, entityChanges)=>{
    let defaultEntity = {change: entity, ts: ts};
    if(!(entity in entityChanges))
        return defaultEntity;
    
    let changes = entityChanges[entity];
    if(isNullOrUndefined(changes))
        return defaultEntity;

    //Binary search to find lowest
    let l = 0, r = changes.length-1; 
    while(l<r){
        let m = Math.floor(l + (r-l)/2);
        if(changes[m].ts < ts){
            l = m+1;
        }
        else{
            r = m;
        }
    }

    //handle border cases
    while(l<changes.length && changes[l].ts < ts)
        l++;
    
    if(l>=changes.length){
        return defaultEntity;
    }
    return changes[l];
}

export const deduplicateBlocks = (blockList)=>{
    let ans = [];
    for(let i=0; !isNullOrUndefined(blockList) && i<blockList.length; i++){
        if(i==0 || (blockList[i].title != blockList[i-1].title) || (blockList[i].summary != blockList[i-1].summary))
                ans.push(blockList[i]);
    }
    return ans;
}

export const modifyBlockEntities = (blockList, blockTree, entityChanges)=>{
    if(isNullOrUndefined(blockList) || isNullOrUndefined(blockTree)  || isNullOrUndefined(entityChanges))
        return blockTree;

    for(let i=0; i<blockList.length; i++){
        let currEntityMap = {};
        let currBlock = blockTree[blockList[i]];
        if(!isNullOrUndefined(currBlock)){
            let entities = currBlock.entities;
            for(let j=0;!isNullOrUndefined(entities) && j<entities.length; j++){
                let currEntity = entities[j];
                if(!(currEntity.title in entityChanges)){
                    //No change for this entity, add as is
                    currEntityMap[currEntity.title] = '';
                }
                else{
                    //some change for the entity
                    let currEntityStr = currEntity.title;
                    let ts = currBlock.timestamp;
                    let newEntityStr = null; //dummy since they are not equal
                    while(!isNullOrUndefined(currEntityStr)){
                        // console.log(currEntityStr);
                        // console.log(ts);
                        let newEntity = getEntityChange(currEntityStr, ts, entityChanges);
                        newEntityStr = newEntity.change;                        
                        if(currEntityStr==newEntityStr)
                            break;
                        currEntityStr = newEntityStr;
                        ts = newEntity.ts;
                    }
                    if(!isNullOrUndefined(newEntityStr)){
                        currEntityMap[newEntityStr] = '';
                    }
                }
            }
        }
        // console.log(currEntityMap);
        let newEntities = [];
        for(let entity in currEntityMap){
            newEntities.push({
                title: entity,
                type: "None"
            })
        }
        blockTree[blockList[i]].entities = newEntities;
    }
    return blockTree;
}

export const traverseGraphNode = (graph, nodeId, visited, islandCount)=>{
    let node = graph[nodeId];
    let label = nodeId;
    let edges ={};
    if(label in visited)
        return;
    if(!isNullOrUndefined(node.edges)){
        edges = node.edges;
    }
    visited[label] = {
        island: islandCount,
        count: Object.keys(edges).length
    }

    for(let edgeKey in edges){
        traverseGraphNode(graph,edgeKey,visited,islandCount);   
    }    
}

export const getGraphIslandsAndValues = (graph)=>{
    // console.log(graph);
    if(isNullOrUndefined(graph))
        return {};

    let visited = {};
    let islandCount = 0;
    for(let key in graph){
        if(!(key in visited)){
            traverseGraphNode(graph,key,visited,islandCount);
            islandCount++;        
        }
    }

    // console.log(visited);
    let islands =  {};
    for(let key in visited){
        let island = visited[key].island;
        let count = visited[key].count;
        if(!(island in islands)){
            islands[island] = {
                count: -1,
                node: null
            }
        };
        if(count > islands[island].count){
            islands[island] = {
                count: count,
                node: key
            }
        }
    }

    return islands;
}

export const languageCheck = (lang, voice)=>{

    if(isNullOrUndefined(lang))
        lang = 'en';
    
    if(isNullOrUndefined(voice))
        return false;

    let name = voice.name;
    let vLang = voice.lang;

    if(lang == 'en'){
        if(name.toLowerCase().includes('eng') || name.toLowerCase().includes('catherine'))
            return true;
    }
    else if(lang == 'hi'){
        if(vLang.toLowerCase().includes('hi') || vLang.includes('हिंदी') 
            || name.includes('हिंदी') || name.toLowerCase().includes('hindi'))
            return true;
    }
    return false;
}

export const getTotalEdges = (investigationGraph)=>{
    let totalEdges = 0;
    if(isNullOrUndefined(investigationGraph))
        return totalEdges;

    for(let key in investigationGraph){
        if(!isNullOrUndefined(investigationGraph[key].edges)){
            totalEdges += Object.keys(investigationGraph[key].edges).length;
        }
    }
    return totalEdges/2;
}

export const isAcceptableChar = (charA, acceptableStr)=>{
    for(let i=0; !isNullOrUndefined(acceptableStr) && !isNullOrUndefined(charA) && i<acceptableStr.length; i++){
        if(charA == acceptableStr[i])
            return true;
    }
    return false;
} 

export const isEntityPartOfString = (str,  entity)=>{
    if(isNullOrUndefined(entity) || isNullOrUndefined(str) || entity.length == 0 || str.length == 0)
        return false;

    let  pos=0, i=-1;
    while(pos!=-1){
        pos = str.indexOf(entity, i + 1);
        i = pos;      
        if((i==0 || (isAcceptableChar(str[i-1],' ,.'))) && 
        (i+entity.length==str.length || (isAcceptableChar(str[i+entity.length],' ,.'))))
            return true;
    }
    return false;
}