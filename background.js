var isEnable = false;
var URL = "https://kuldippatel.dev";
var currW = null;

function getCurrentWindow() {
    return browser.windows.getCurrent();
}

function getCurrentTab(){
    return browser.tabs.query({active: true, index: 0});
}

function getAllTabs() {
    return browser.tabs.query({});
}

function isWhitelisted(url){
    return url.startsWith(URL) || url.startsWith("about:");
}

function changeStatus(enable, txt, color){
    isEnable = enable;
    browser.browserAction.setBadgeText({text: txt});
    browser.browserAction.setBadgeBackgroundColor({'color': color});
}

function toggleStatus(checked){
    isEnable = checked;
    changeStatus(isEnable, isEnable ? "ON" : "OFF", isEnable ? "green" : "red");
}

function isOnFirstWindow(windowId){
    // console.log("Actual window: " + currW.id);
    return currW.id == windowId;
}

function blockRightClick(){
    browser.tabs.executeScript({code: 'document.addEventListener("contextmenu", function(e){e.preventDefault();});'});
}

//Close Other Page and Redirect to Ours
function closeAndcreate(){
    blockRightClick();
    getAllTabs().then((tabs) => {
        if(tabs.length > 0){
            let count = tabs.length;
            tabs.forEach((tab, index) => {
                if(!isWhitelisted(tab.url)){
                    // console.log("UNK TAB DETECTED: " + tab.id);
                    // console.log(tab);
                    if(count <= 1){
                        if(tab.status != "loading"){
                            // console.log("TAB UPDATE");
                            // console.log(tab)
                            browser.tabs.update(tab.id, {loadReplace: true, url: URL});
                        }
                    } else {
                        // console.log("TAB REMOVE");
                        browser.tabs.remove(tab.id);
                    }
                    --count;          
                }
            });
        }
    });
}

//Default
getCurrentWindow().then((windowInfo) => {
    currW = windowInfo;
    // console.log(windowInfo);
});
changeStatus(false, "OFF", 'red');

//Message Listner
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.pass && request.pass.length > 0 && request.pass === "1234"){
        toggleStatus(request.status == "ON");
        // console.log(request);
        if(request.status == "ON"){
            blockRightClick();
        }
        sendResponse({response: "Blocker: " + request.status});
    } else {
        sendResponse({response: "Enter Valid Password!"});
    }
});

//Key Detection
browser.commands.onCommand.addListener((command) => {
    if(isEnable){
        if(command == "detect-click"){
            browser.tabs.create({url: URL});
        } else if (command == "detect-zoom") {
            console.log(command);            
        }
    }
});

//Detect Tab Changing
browser.tabs.onActivated.addListener((activeInfo) => {
    if(isEnable){
        closeAndcreate();
        //console.log(activeInfo);
        //console.log("Tab " + activeInfo.tabId + " was activated");
    }
});

//Fix ZoomLevel
browser.tabs.onZoomChange.addListener((zoomChangeInfo) => {
    if(isEnable){
        browser.tabs.setZoom(zoomChangeInfo.tabId, 1.0);
    }
});

//Detect Tab Updates
browser.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
    if(isEnable){
        closeAndcreate();
    }
});

//Detect New Tab
browser.tabs.onCreated.addListener((tab) => {
    if(isEnable){
        browser.tabs.remove(tab.id);
    }
});

// Detect New Window
// browser.windows.onCreated.addListener((window) => {
//     if(isEnable){
//         console.log("New window: " + window.id);
//     }
// });

//Detect Window Defocusing
browser.windows.onFocusChanged.addListener((windowId) => {
    if(isEnable){
        // console.log("Newly focused window: " + windowId);
        browser.windows.getAll().then((windowArr) => {
            windowArr.forEach((w, index) => {
                // console.log(w);
                // if(windowId == -1 && w.state == "minimized"){
                //     browser.windows.update(currW.id, {focused: true, state: "maximized"});
                // } else 
                if(!isOnFirstWindow(w.id)){
                    // console.log("Different window: " + w.id);
                    browser.windows.remove(w.id);
                    browser.windows.update(currW.id, {focused: true});
                }
            });
        });
    }
});
