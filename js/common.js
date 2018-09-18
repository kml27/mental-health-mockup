//namespace datastore by page path, internally localStorage uses only host (dns:port)
var dataStoreNS = window.location.pathname;

function initializeDefaultSrc(control) {

    const defaultSrc = {
        //emulate a HTMLInputElement, type "checkbox", "radio"
        "checked": control.defaultChecked,
        //emulate a HTMLInputElement type "date", "number", "tel", "text", "textarea"
        "value": control.defaultValue == undefined ? "" : control.defaultValue,
        //emulate a HTMLSelectElement
        0: { "value": ""},
        selectedIndex: 0,
    };

    return defaultSrc;
}

function fnForFieldsetRadios(control, fn=function(radio){}){
    var childRadios = $(`fieldset[id=${control.id}] input[type=radio]`);

    for(radio of childRadios){
        fn(radio);
    }
}

function clearDisabledInputByType(control, alwaysClear=false){

    if(control.disabled || alwaysClear){
        setMemberByType(initializeDefaultSrc(control), control, control);
    }

    var inputEvent = new Event("input");

    control.dispatchEvent(inputEvent);

}

function setDependentDisabledState(clickedElement, specificRadio, specificTarget, stateOverride=false, disabledOverrideValue){

    var multiSource = false;
    var multiSourceState = false;

    if(specificRadio) {

        if(Array.isArray(specificRadio)){

            multiSource = true;

            for(radio of specificRadio){
                clickedElement = document.querySelector(radio);
                multiSourceState |= clickedElement.checked;
            }

            //if one of the specified elements is checked, then remove disabled attribute
            multiSourceState=!multiSourceState;

        } else {
            //console.log("setting clickedElement to ", specificRadio);
            clickedElement = document.querySelector(specificRadio);
        }
    }

    var el = clickedElement.parentElement;

    var targetState = !clickedElement.checked || clickedElement.selected;

    if(stateOverride){
        targetState = disabledOverrideValue;
    } else if (multiSource) {
        targetState = multiSourceState;
    }

    
    if(!specificTarget){
        //console.log('toggling state', clickedElement);
        while(el.nextElementSibling) {

            el = el.nextElementSibling;
            var targetEl = el.children[0];
            //console.log(el, el.children[0]);
            targetEl.disabled = targetState;

            clearDisabledInputByType(targetEl);
            //console.log('toggled disavbled on element with id', el.children[0].id);

        }
    } else {
        
        if(Array.isArray(specificTarget)) {
            
            for(target of specificTarget) {
                var targetEl = document.querySelector(target);

                if(targetEl==null){
                    continue;
                }

                targetEl.disabled = targetState;
                
                if($(`fieldset[id=${targetEl.id}] input[type=radio]`).length){
                    fnForFieldsetRadios(targetEl, function(radio){clearDisabledInputByType(radio, true)});
                }
                else{
                    clearDisabledInputByType(targetEl);
                }
            }

        } else {
            var targetEl = document.querySelector(specificTarget)
            targetEl.disabled = targetState;
            
            clearDisabledInputByType(targetEl);
        }
    }
};

function getIndexFromOptionValue(control, optionValue){

    var optionIndex = -1;
    
    var iteratedOption = 0;

    for(var iteratedOption=0; optionIndex==-1 && control[iteratedOption]; iteratedOption++){
        
        var curOption = control[iteratedOption];
        //console.log(iteratedOption, curOption);

        if(curOption.value == optionValue){
            //console.log(curOption);
            optionIndex = iteratedOption;
            
            //When the form is reset, the select will return to its default selection for this select input
            //console.log("setting as default selection");
            curOption.defaultSelected=true;
        }
            
    }

    return optionIndex;
}

function loadLocalSiteInfo(attach=false){

    //console.log("loading header selections from browser local storage");

    var storedSelectOptions = ["province", "district", "health-facility"];

    for(selectID of storedSelectOptions) {

        //console.log("looking for", selectID);

        var jQuerySelect = $("select[id="+selectID+"-select]");
        var DOMSelect = undefined;

        if(jQuerySelect) {
            DOMSelect = jQuerySelect[0];
        }

        var storageName = dataStoreNS+"mhf-"+selectID;

        if(DOMSelect && localStorage[storageName]){
            
            var optionIndex = getIndexFromOptionValue(DOMSelect, localStorage[storageName]);
            
            if(optionIndex) {
                DOMSelect.selectedIndex = optionIndex;
            }

        }

        if(attach && jQuerySelect) {
            //attach onChange handler to store province selection in local browser storage
            jQuerySelect.on("change", function(event){
                //console.log(this[this.selectedIndex].value);

                //this is built during handling of change event
                var storageName=dataStoreNS+"mhf-"+this.id.slice(0, this.id.lastIndexOf("-select"));
                //console.log("storage name", storageName);

                var prevOptionValue = localStorage[storageName];
                if(prevOptionValue != undefined) {

                    var prevOptionIndex = getIndexFromOptionValue(this, prevOptionValue);

                    var prevOptionSelected = this.options[prevOptionIndex];

                    //console.log(prevOptionID, prevOptionSelected);

                    //Remove default on previously stored option
                    prevOptionSelected.defaultSelected = false;
                }
                
                var newOptionSelected = this[this.selectedIndex];
                                        
                localStorage[storageName] = newOptionSelected.value;
                //Set this as the new default to return to when resetting the form
                newOptionSelected.defaultSelected = true;
            });
        }
    }
}

function setAllDisabledStates(){
    //onclick*='setDependentDisabledState'
    /*for(inputSetsDisabled of )){
        //console.log(inputSetsDisabled, inputSetsDisabled.checked, inputSetsDisabled.onclick);
        
        var onclick=String(inputSetsDisabled.onclick);
        
        var param = [];
        var argsStr = onclick.slice(onclick.indexOf("setDependentDisabledState(")+"setDependentDisabledState(".length, onclick.lastIndexOf(");"));

        param = argsStr.split(",");
        
        setDependentDisabledState(param[0]=="this"?clickedElement=inputSetsDisabled:param[0],specificRadio=param[1], specificTarget=param[2], stateOverride=true, disabledOverrideValue=true);
    }*/

    var disableDependencies = [
            {
                set: $("input[onclick*='setDependentDisabledState']"),
                handler: "onclick"
            },
            {
                set: $("[onchange*='setDependentDisabledState']"),
                handler: "onchange"
            }
    ];

    for(ontype of disableDependencies) {
        //onchange*='setDependentDisabledState'
        for(inputSetsDisabled of ontype.set){
            //console.log(inputSetsDisabled, inputSetsDisabled.checked, inputSetsDisabled.onchange);
            
            var onchange=String(inputSetsDisabled[ontype.handler]);
            
            var allParams = [];
            var argsStr = onchange.slice(onchange.indexOf("setDependentDisabledState(")+"setDependentDisabledState(".length, onchange.lastIndexOf(");"));

            //also splits arrays of targets which need to be rebuilt too
            allParams = argsStr.split(",");

            var paramArrayRanges=[];
            
            //console.log("allParams", allParams)

            //doesnt support nested arrays, neither does the function that is being called
            if(allParams.length>1){
                var foundArray=false;

                for(i=0; i<allParams.length; i++){
                    var param = allParams[i];
                    //selector like '[id=example]' also begins with '[', make sure there is more than one '[' in this param
                    //var segmentsAfterOpenBracket = param.split("[").length;

                    if(param.search(/\[ *('|"|`)/) != -1 ){
                        
                        paramArrayRanges[paramArrayRanges.length] = {
                            "beginArrayIndex": i,
                            "paramIndex": paramArrayRanges.length?paramArrayRanges[paramArrayRanges.length-1].paramIndex+1:i,
                        }

                        foundArray = true;
                        allParams[i] = param.replace(/\[ */, "");
                    }
                    //don't count a closing square bracket as an array if we havent found an open bracket
                    //a selector like '[id=example]' also ends with ']', there should be more than ']', (n+1 if n)
                    //in case someone decides to write (this, input[independent], [ input[id=dependent] ])
                    //var segmentsAfterCloseBracket = param.split("]").length;
                    if(foundArray && param.search(/('|"|`) *\]/) != -1 ){

                        paramArrayRanges[paramArrayRanges.length-1].endArrayIndex = i;
                        foundArray = false;
                        allParams[i] = param.replace(/\] *('|"|`) *\]/, "]'");
                    }
                }

                allParams = allParams.map(param => param.replace(/'/g, " ").trim());

                for(range of paramArrayRanges){
                    allParams[range.paramIndex] = allParams.slice(range.beginArrayIndex, range.endArrayIndex+1);
                }

                //if there were any arrays, move any remaining parameters forward, i.e. this, [], target
                if(paramArrayRanges.length){
                    var lastRange = paramArrayRanges[paramArrayRanges.length-1];
                    allParams.splice(lastRange.paramIndex+1, lastRange.endArrayIndex-lastRange.paramIndex);
                }

                allParams = allParams.slice(0, 3);
            }

            //console.log(argsStr, allParams, allParams[0]=="this");

            setDependentDisabledState(allParams[0]=="this"?clickedElement=inputSetsDisabled:allParams[0],allParams[1]=="undefined"?undefined:specificRadio=allParams[1], specificTarget=allParams[2], stateOverride=true, disabledOverrideValue=true);
        }
    }
}

function confirmReset(evt, reinitialize=true){
    var result = confirm('Are you sure you want to reset *ALL* patient inputs to defaults?');
    
    if(result==false)
    {
        //the user cancelled the reset, prevent the default form reset behavior
        evt.preventDefault();

    }else{
        //go through clearing and re-initilization of localdatastore without re-attaching inputs' event listeners
        if(reinitialize){
            initializeInputValuePersistence(reset=true);
        } else {
            initializeLocalStore(clear=true, initializeEmptyStore=false);
        }

        //the default behavior of form input type="reset" will be applied after this handler returns
    }

}

function warnMaxDateToday(dateInput, alertSelector){
    var todayDate = new Date();
    var todayStr = todayDate.toISOString().split('T')[0];
    console.log(todayStr, dateInput.value);
    
    var specifiedDay = new Date(dateInput.value);
    
    var alertjQuery = $(alertSelector);
    var alert = alertjQuery[0];

    var alertText = "";

    if(specifiedDay > todayDate){
        //dateInput.value = todayStr;
        alertText = "Specified date is after today."
        alertjQuery.addClass("bg-warning");
    } else{
        alertjQuery.removeClass("bg-warning");
    }
    
    console.log(alertText);

    alert.textContent = alertText;

}

function watchRange(control, alertSelector){
    var alert = $(alertSelector);
    
    if(control.value && (Number(control.value) < Number(control.min) || Number(control.value) > Number(control.max))){
        alert.removeAttr("hidden");
        alert[0].textContent = `Value is outside of range of ${control.min} to ${control.max}`;
    } else {
        alert.attr("hidden", "true");
        //alert[0].textContent = "";
    }
}

function calculateAge(dobDateInput, targetSelector){
    
    var specifiedDay = new Date(dobDateInput.value);
    
    if(isNaN(specifiedDay)) {
        return;
    }
    
    var todayDate = new Date();
    

    var ageDate = new Date(todayDate - specifiedDay);
    var age = ageDate.getFullYear() - new Date("1/1/1970").getFullYear()
    
    $(targetSelector)[0].value=age;
}

function calculateDOB(ageInput, targetSelector){

    var today = new Date();
    var specifiedDay = new Date(Number(today.getFullYear())-Number(ageInput.value), today.getMonth(), today.getDate());

    if(isNaN(specifiedDay)) {
        return;
    }

    $(targetSelector)[0].value=specifiedDay.toISOString().split("T")[0];
}


function setHiddenCheckbox(checkboxSelector, value){
    $(checkboxSelector)[0].checked = value;
}

//
function setMaxDateToToday(){
    var today =new Date().toISOString().split('T')[0];
    console.log(today);
    
    for(dateInput of $("input[type=date]")){
        dateInput.max=today;
    }
}

const dataStoreProto = JSON.stringify({"storageVersion": "0.1"})

function initializeLocalStore(clear, initializeEmptyStore=true){

    if(clear){
        delete localStorage[dataStoreNS];
    }

    if(initializeEmptyStore && !localStorage[dataStoreNS]){
        localStorage[dataStoreNS] = dataStoreProto;
    }
}

function setMemberByType(src, dest, control)
{
    //don't set disabled controls
    if(control.disabled || dest == undefined){
        return;
    }

    if(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) {
        switch(control.type){
            case "checkbox":
            case "radio":
                dest.checked= src.checked;
                break;

            case "date":
            case "text":
            case "number":
            case "tel":
            case "textarea":
                dest.value= src.value;
                break;
        }
    } else if (control instanceof HTMLSelectElement) {
        
        if(dest instanceof HTMLSelectElement) {
            var optionIndex = getIndexFromOptionValue(control, src.value);

            dest.selectedIndex= optionIndex;
        }
        else {
            dest.value= src[src.selectedIndex].value;
        }
    }

//trigger setDependentDisabledState handlers

    if(String(control.onchange).search("setDependentDisabledState")!=-1 ){
        control.onchange();
    }

    if(String(control.onclick).search("setDependentDisabledState")!=-1){
        control.onclick();
    }

    //for radios, the onchange event is on the parent fieldset
    if(control.type!=undefined && control.type=="radio"){
        var parentFieldset = getFieldsetsWithRadios(control)[0];
        
        if(parentFieldset.onchange){
            parentFieldset.onchange();
        }
    }

}

function versionedDataStore(datastore, control){

    var result = {};

    //if(datastore.storageVersion > "0.2") { }
    //if(datastore.storageVersion > "0.1") { }
    if(datastore.storageVersion < 0.2 && datastore.storageVersion >= "0.1") {
        result = datastore[control.id];
    }

    return result;
}

function localDataStore(control, load){
    
    var src = control;
    var dest = {};
    var dataStore = {};

    try{
        
        dataStore = JSON.parse(localStorage[dataStoreNS]);
        
        dest = versionedDataStore(dataStore, control);

    } catch (e){

        initializeLocalStore(clear=true);

        dataStore = JSON.parse(localStorage[dataStoreNS]);
        dest = versionedDataStore(dataStore, control);
    }

    if(load){
        src = dest;
        dest = control;
    }

    if(!src){

        //if the local data store is uninitialized for this input during load, initialize it
        if(load){

            dest = dataStore[control.id] = {"class": control.constructor.name};

            //reasonable deep copy, avoid changing the prototype, if the default is something other
            src = initializeDefaultSrc(control);

        } else {
            return;
        }
    }

    setMemberByType(src, dest, control);
    
    //store entire JSON object back into localStorage
    localStorage[dataStoreNS]=JSON.stringify(dataStore);
}

function applyScrollPositionPersistence(){

    document.body.scrollTop = document.documentElement.scrollTop = localStorage[dataStoreNS+"currentScroll"];

    window.addEventListener('scroll', function(event){
        //"pick up where you left off"
        //store current page scroll (though it is set to 0 when selecting a new tab)
        //when reloading the page to view changes, this value will be used to scroll back to scroll position before page refresh
        
        //console.log(document.documentElement.scrollTop);
        //document.body.scrollTop remains 0 with sticky position on common header
        localStorage[dataStoreNS+"currentScroll"]=document.documentElement.scrollTop;
    });
}

function getFieldsetsWithRadios(specificChildRadio=undefined){
    
    var fieldsets = jQuery.makeArray($('form#htmlform fieldset'));

    var fieldsetsWithRadios = fieldsets.filter( (fieldset) => {
            if(fieldset.id=="") {
                //console.log("Skipping", fieldset);
                return false;
            }

            var fieldsetHasRadios = false;
            //if only looking for a specific parent, check for that specific child first
            if(specificChildRadio!=undefined){
                var specificRadio = $(`fieldset[id=${fieldset.id}] input[type=radio][id=${specificChildRadio.id}]`);

                //if the specific radio was not selected, then reject this parent now
                if(specificRadio[0]==undefined){
                    return false;
                }

                fieldsetHasRadios = true;
                //else check that it is not a parent fieldset of the specific fieldset we want
            } else {
                //see if there are any child radios for the given fieldset
                fieldsetHasRadios = $(`fieldset[id=${fieldset.id}] input[type=radio]`).length>0;
            }

            //check if this fieldset has any children fieldsets (which may account for the radios we see)
            var isImmediateParent = $(`fieldset[id=${fieldset.id}] fieldset`).length==0;

            //if this is not a parent of fieldset and it has radio children, keep it
            return fieldsetHasRadios && isImmediateParent; 

        });

    return fieldsetsWithRadios;
}

function initializeInputValuePersistence(reset=false){
    
    var inputs = [];
    inputs = jQuery.makeArray($('form#htmlform input'));
    inputs = inputs.concat(jQuery.makeArray($('form#htmlform select')));
    
    var textAreas = jQuery.makeArray($('form#htmlform textarea'));
    inputs = inputs.concat(textAreas);

    var fieldsetsWithRadios = getFieldsetsWithRadios();

    //if just re-initializing, clear the local datastore
    initializeLocalStore(clear=(false||reset));

    //attach listener to locally store all data to all inputs
    for(input of inputs){

        //radios only generate their own input when checked is set to true (not when set to false implicitly), but when clearing disabled radios, the input event is still used to trigger storage to the localDataStore, so it is attached here, the fieldsets input listeners are attached to store all the child radios states whenever one in the fieldset is selected

            //if not resetting, attach event listeners (this only need to be done on document.ready())
            //if resetting local data store, don't re-attach input event listeners
            if(!reset){
                input.addEventListener("input", function oninputInputStore(event){localDataStore(this, load=false)});
            }
    
            //load locally stored data, if it exists, otherwise initialize data storage object
            localDataStore(input, load=true);
    }

    for(fieldset of fieldsetsWithRadios){

        //console.log(fieldset)
        
        //if not resetting, attach event listeners (this only need to be done on document.ready())
        //if resetting local data store, don't re-attach input event listeners
        if(!reset){
            
            //attach event listener to the radios parent fieldset
            fieldset.addEventListener("input", function oninputFieldsetStore(event){
                
                fnForFieldsetRadios(this, function storeRadioState(radio){ localDataStore(radio, load=false); });
            });
        }
        
        fnForFieldsetRadios(fieldset, function loadRadioState(radio){ localDataStore(radio, load=true); });

    }

}

var dxsList = {
		"F00":"deb48fc2-9083-11e6-a98e-000c29db4475",
		"F01":"dff79134-9083-11e6-a98e-000c29db4475",
		"F01.1":"caf7ac69-a874-445d-b738-2556b45faf64",
		"F02":"d74d0019-7e11-4d7e-a758-baa7994066b7",
		"F02.0":"c5119b6f-006c-49d6-a18b-8a587631b9ec",
		"F02.1":"8ec63b8f-3ccc-4514-8778-56530e8b5650",
		"F02.2":"53a4c799-6477-4215-bf33-af6b414e50bc",
		"F02.3":"a4977038-c888-4762-a37f-1e53914b6414",
		"F02.4":"ff14107b-f9f1-46f7-a8b8-186ab8bd8eec",
		"F03":"fce0fdc5-cc6d-4cf9-8048-ba160ff3e655",
		"F04":"01a232dc-33b5-4eec-9816-262dc668703d",
		"F05":"807bf558-5ff2-4803-978e-71dccab2ada4",
		"F06":"c28d5ed9-7c6e-4132-8dd0-3f8d8eda4235",
		"F07":"a5c86b4b-9544-40ec-9934-47973239ef0c",
		"F09":"abaaf0f7-5609-47cc-9cbc-28ef030d058f",
		"F10":"742dbe8f-11bf-4904-b835-b93052f02128",
		"F11":"2d5802f5-61d9-4f98-bceb-e2fb705b36d1",
		"F12":"21dc6d3a-0dbf-4fbe-85dd-31ce3aa739f5",
		"F13":"f14a7da0-d5f2-4949-ac4e-be2ee26ca551",
		"F14":"371c8725-1516-4089-8fec-efe4c62b3fb5",
		"F15":"1a663408-b618-46fb-a4da-8ee08bca1504",
		"F16":"44b418d9-499d-4403-a529-3ecc01d9a06e",
		"F17":"ec3fa93a-bf6d-4e12-bd01-706d2eb69b87",
		"F18":"e080d80f-6b2f-42fc-921f-f60915e2ff1e",
		"F19":"b07e0ef1-98dc-4063-aedb-561f62fe207c",
		"F20":"e1d25e8e-1d5f-11e0-b929-000c29ad1d07",
		"F20.0":"190da69e-5d27-40a8-93d0-ce5940543e14",
		"F20.1":"f359f505-9083-11e6-a98e-000c29db4475",
		"F20.2":"f38cfaf7-9083-11e6-a98e-000c29db4475",
		"F20.3":"f3b349f9-9083-11e6-a98e-000c29db4475",
		"F20.4":"f3d99c33-9083-11e6-a98e-000c29db4475",
		"F20.5":"f4012b7b-9083-11e6-a98e-000c29db4475",
		"F20.6":"f42dd971-9083-11e6-a98e-000c29db4475",
		"F20.8":"3fe78607-da08-4abd-9333-7d5a7be73017",
		"F20.9":"f4849b99-9083-11e6-a98e-000c29db4475",
		"F21":"c72f1a2c-3fc1-40a1-a3fb-80515cd321e3",
		"F22":"9379f91a-e334-4592-9df8-b0630941e0c5",
		"F22.0":"9b9c6817-9279-40cf-af3b-a9ed25d192f7",
		"F23":"f5ede243-9083-11e6-a98e-000c29db4475",
		"F23.0":"28ebf256-db47-45b7-a0af-10339412b4bc",
		"F23.1":"42a20746-88c4-44f4-b542-046d95af622d",
		"F23.2":"8d2d0257-a112-4786-88de-f65717bdd586",
		"F23.3":"caa3146a-d1d4-44b7-859c-83ff52b98e77",
		"F23.8":"795c2484-b211-4acf-91c8-e787e65cf3ac",
		"F23.9":"fc3bab16-2fc5-4301-bd4a-704caee143f1",
		"F24":"8af23c71-687a-4ba0-9c9f-08a93bc0cb13",
		"F25":"f6fdc519-9083-11e6-a98e-000c29db4475",
		"F25.0":"f65a619d-9083-11e6-a98e-000c29db4475",
		"F25.1":"f680afa4-9083-11e6-a98e-000c29db4475",
		"F25.2":"f6a6fc7e-9083-11e6-a98e-000c29db4475",
		"F25.8":"f6dc9ab1-9083-11e6-a98e-000c29db4475",
		"F25.9":"f3e5e0e1-a1ce-4e4a-a3d9-0a75837c128f",
		"F28":"dc249f14-11c8-4014-a23e-382ef0e9806e",
		"F29":"9bf315d6-717f-41c2-a92a-a222ccf4f301",
		"F30":"4506d879-fe51-455e-9096-ec436eb61ccb",
		"F30.0":"f82a59c8-9083-11e6-a98e-000c29db4475",
		"F31":"4873ee8e-3e3d-46ff-8fb3-a3ad5443053e",
		"F32":"678ec8ba-0cc6-4e95-9c0c-4db3fb04842e",
		"F33":"f0cd9355-56c4-43ac-9b9c-c52f89265cb4",
		"F34":"3a858407-ca60-4f18-8a85-a9ad5c939caf",
		"F34.0":"b519345d-b891-422b-97ce-813e93ccfa2b",
		"F34.1":"fc10ad5c-9083-11e6-a98e-000c29db4475",
		"F38":"5989c618-694c-4702-96f1-8f5132f6f649",
		"F39":"ece2c2e5-1944-4bbc-b5bd-64ff1fa0c54d",
		"F40":"ccab62bb-8c64-4af7-a1ce-fac31a809876",
		"F40.0":"fd0ec17f-9083-11e6-a98e-000c29db4475",
		"F40.1":"fd3799a5-9083-11e6-a98e-000c29db4475",
		"F40.2":"582bb5ca-a226-4b15-870d-a9c858f69f0c",
		"F41":"ca170368-911c-4848-ba05-c27285621063",
		"F41.0":"4a1aaf0e-0254-4995-a6b9-c5439df5c4e8",
		"F41.1":"fea17a55-9083-11e6-a98e-000c29db4475",
		"F42":"0006bac0-9084-11e6-a98e-000c29db4475",
		"F43":"b4a8cbc7-2cd5-4758-a791-e372c4e007e9",
		"F43.0":"4da36491-61f0-4c8a-97bb-5ce31734c175",
		"F43.1":"f6093d2e-a874-47ae-9b9f-6c3661e45870",
		"F43.2":"8af81225-19b0-447a-a75e-772cbf23aa35",
		"F44":"2c3a7910-c297-4e28-8163-caba428c93ff",
		"F44.0":"7b0009c1-b294-4a40-aa03-6622babe13dd",
		"F44.1":"2727cd62-83bc-4967-b6a4-39770b753d7a",
		"F44.2":"015ce2e7-9084-11e6-a98e-000c29db4475",
		"F44.3":"636d06d5-e2dc-464b-ba95-954c134cab9b",
		"F44.4":"792554df-fbae-4980-adcd-f87bd441635f",
		"F44.5":"54ea5096-bc34-4cd1-aeb9-860d89d450c6",
		"F44.6":"77aba2df-b17c-45c6-8be0-91d4b0c98531",
		"F44.6":"4aa74026-88d5-44a5-96ca-b8775e1d9457",
		"F45":"02b58ce4-9084-11e6-a98e-000c29db4475",
		"F45.0":"0288e2c0-9084-11e6-a98e-000c29db4475",
		"F48":"ae531291-9455-4196-a3c2-25e697dd1961",
		"F48.0":"14bbc32d-f151-4c17-a16e-e31f5a73bce9",
		"F50":"05f2937a-9084-11e6-a98e-000c29db4475",
		"F50.0":"0419c420-9084-11e6-a98e-000c29db4475",
		"F50.2":"b0bdafca-c6d9-44a6-b560-b48a4307deb5",
		"F51":"c9f23096-6a4d-4e00-9cd0-86d3f645f9a9",
		"F51.0":"06312622-9084-11e6-a98e-000c29db4475",
		"F51.1":"065777cc-9084-11e6-a98e-000c29db4475",
		"F51.2":"ddf31715-4ed1-4736-b3e6-707dbe38d0a8",
		"F51.3":"069e3831-9084-11e6-a98e-000c29db4475",
		"F51.4":"d43550ee-4656-4918-8eec-8483bf74511d",
		"F51.5":"883ed776-1369-49db-ad24-724c427df0ee",
		"F52":"dc88ea86-d1f4-49de-a366-cd88f8368f1d",
		"F52.0":"7916b64c-bff1-43d7-ad4f-4efc95f46d1e",
		"F52.1":"293107a6-29a9-40e8-8a81-7242bd149d4e",
		"F52.2":"923b447c-cb3f-4a44-b3f4-4ecc46651f72",
		"F52.3":"03a87a0f-af1b-4df5-9232-5ea628c80bc6",
		"F52.4":"08746e4a-9084-11e6-a98e-000c29db4475",
		"F52.5":"38572fe0-76af-4c85-8d3e-68f3dfc94bae",
		"F52.6":"dd904203-bc67-4189-b4d6-1d82279f7cbd",
		"F52.7":"60d26dfb-0696-49fc-927e-780bc893fe45",
		"F53":"569eb8e0-e722-4524-9fc2-673aa697a07a",
		"F53.0":"96e936b0-afc4-4d11-a8dc-38d150da8d86",
		"F53.1":"d79ef3cc-a7e5-4bdf-ad31-db81a3377631",
		"F54":"5389ba08-a112-4b63-b261-d96eb4272661",
		"F55":"12b5fd94-970f-4d1f-90f5-f7eb3c27c171",
		"F59":"aee0e0bb-1736-4d61-bd4e-34749aa572a2",
		"F60":"b2851b09-10fa-4692-aff1-0361e74eb824",
		"F60.0":"0a5843aa-9084-11e6-a98e-000c29db4475",
		"F60.1":"0a7e9642-9084-11e6-a98e-000c29db4475",
		"F60.2":"765dbaef-8d09-4f71-9848-bc95614967d7",
		"F60.3":"0aec4da0-9084-11e6-a98e-000c29db4475",
		"F60.4":"0b13e590-9084-11e6-a98e-000c29db4475",
		"F60.5":"c6092600-b417-400c-8936-f46cd5aafaf2",
		"F60.6":"2a9ecd7d-50bf-4df3-9606-fa02577a462f",
		"F60.7":"0b9c7101-9084-11e6-a98e-000c29db4475",
		"F60.8":"d455e234-1acf-4438-9bf3-5dc9476fd43c",
		"F60.9":"303bb2d3-7d38-4ca7-a2d0-dce700fd6b12",
		"F61":"b9ff0ba2-f6e9-40cc-b324-0dd6409a1736",
		"F62":"92519008-fc87-4ebd-a6cd-462dca0209db",
		"F63":"e371fca4-9d91-46fe-8a2c-2eaaf1e35567",
		"F63.0":"028532bd-42b3-415d-8df7-b6730da82b5b",
		"F63.1":"49c7ea32-f725-435f-a0d3-787aeda46ac9",
		"F63.2":"6321f641-3f9e-423b-842a-200aee1fd527",
		"F63.3":"0e058f56-9084-11e6-a98e-000c29db4475",
		"F64":"0f077f40-9084-11e6-a98e-000c29db4475",
		"F64.0":"0e8e2a70-9084-11e6-a98e-000c29db4475",
		"F64.1":"ffd08a5f-d75d-4cd6-9018-1cb66ccb9b61",
		"F64.2":"0ece03d0-9084-11e6-a98e-000c29db4475",
		"F65":"5166260b-b2d3-4f4a-be40-e042ab68cadc",
		"F65.0":"0f40fadb-9084-11e6-a98e-000c29db4475",
		"F65.1":"0f7451b7-9084-11e6-a98e-000c29db4475",
		"F65.2":"0f9e7363-9084-11e6-a98e-000c29db4475",
		"F65.3":"0fcda55b-9084-11e6-a98e-000c29db4475",
		"F65.4":"0ff3f067-9084-11e6-a98e-000c29db4475",
		"F65.5":"1021e05c-9084-11e6-a98e-000c29db4475",
		"F65.6":"1744b1d1-2f71-4aa6-bbed-c3ed4fbb82f1",
		"F65.8":"56fbe6db-a29a-4606-9148-24b572f88ced",
		"F66":"9fdb182e-8241-40d1-a95d-b0b712c010ab",
		"F66.0":"db10d29b-79a8-43b2-b6c3-88c872e94423",
		"F66.1":"0fae32bb-846b-40d9-95c0-1d1bf2b0d267",
		"F66.2":"11063029-9084-11e6-a98e-000c29db4475",
		"F66.8":"3e2737f7-37ea-489c-bc28-0e2eaefde6f3",
		"F66.9":"9af42294-a7e8-49ed-9f8f-b782b99d2128",
		"F68":"48f09c2a-84a7-434c-9665-3831259e6ee5",
		"F68.0":"23371259-7287-4958-b17d-5571d4c1710f",
		"F68.1":"fe4c20cc-ebbc-479b-be1a-d994263a4f44",
		"F68.8":"4f23a8a0-e1d6-4899-a5d2-86fdb4cd0310",
		"F69":"606922ca-8fd2-4ba8-ab97-5f54e8101206",
		"F70":"9158d0f4-8476-404e-89e3-b2c7cb0fe69d",
		"F71":"13b5436e-9084-11e6-a98e-000c29db4475",
		"F72":"1450fadd-9084-11e6-a98e-000c29db4475",
		"F73":"d78f0907-9036-49d2-b70a-7003d21670a6",
		"F78":"f59bdd0f-8f03-47a7-a446-dfcf22116ba8",
		"F79":"9079aa01-e664-4b44-9034-6e54f8da337c",
		"F80":"3b175b72-e10a-4250-a1f9-66347203ec1a",
		"F80.0":"50d967e6-f387-4103-896c-a9568edd538b",
		"F80.1":"164bac57-9084-11e6-a98e-000c29db4475",
		"F80.2":"1671f8e7-9084-11e6-a98e-000c29db4475",
		"F80.3":"7bbfef6a-9353-4ddd-b0e8-0af94660e0dd",
		"F80.8":"d9990b06-6d40-4461-99fa-5354887e9e50",
		"F80.9":"8d94a49f-7e41-408f-b413-7949bfad6656",
		"F81":"33c40b9f-9039-48f9-b03d-bed030759cff",
		"F81.0":"00623cd8-4920-46ca-aa8b-c58f11c17b60",
		"F81.1":"ff2ad1c7-8319-4acc-bd67-62f73347f7b5",
		"F81.2":"352fc215-269b-4f1f-9c3b-b0b436a0df49",
		"F81.3":"a52d4b82-115a-4561-8068-cbd4a32adb63",
		"F81.8":"74181ea8-2248-4c42-a916-2abbc7e179e6",
		"F81.9":"b9f5c243-b787-4b7d-afb0-c624de733d53",
		"F82":"9b759508-645f-4657-b658-58f4f407910e",
		"F83":"9c571f36-87c1-498b-a017-19947edf88ac",
		"F84":"00edabd6-6c0b-4761-93de-44c98773baf9",
		"F84.0":"97ab2b35-4636-4b09-bce7-bfe209b7666f",
		"F84.2":"bc73ccce-be55-419d-9c6a-e91116da7b17",
		"F84.4":"f4d644a0-0d64-43eb-84d6-04660b19b3ea",
		"F84.5":"18e84797-9084-11e6-a98e-000c29db4475",
		"F88":"e65b4efb-4490-4387-bd76-4ef7d2158c2a",
		"F89":"19560d05-9084-11e6-a98e-000c29db4475",
		"F90":"06ef0414-644c-4620-bb27-1634f3316a26",
		"F90.0":"7a77a507-698c-4a77-b3c8-febbeffdcfdb",
		"F90.1":"1c1b6040-a796-43cc-a404-1c88800b6234",
		"F91":"0ec884b3-a612-44f5-8933-878c8ecbdcf2",
		"F91.0":"7a77a507-698c-4a77-b3c8-febbeffdcfdb",
		"F91.1":"1b17dc11-9084-11e6-a98e-000c29db4475",
		"F91.2":"89239464-c8c2-4d9b-a19f-bc2f7dd4af1e",
		"F91.3":"a56ae00c-5ec7-474d-920e-e024bb01de08",
		"F92":"1c3c2364-9084-11e6-a98e-000c29db4475",
		"F92.0":"1be1978a-9084-11e6-a98e-000c29db4475",
		"F93":"be33a005-311d-43a9-a17c-16941a5231a8",
		"F93.0":"c8fe9f1b-acf2-4fd5-af39-c11b3627143e",
		"F93.1":"ba12fbda-c95e-4e51-9470-fb1e6300a571",
		"F93.2":"86089783-13c1-4155-bc25-ac96268978bf",
		"F93.3":"9748f424-6248-4fa3-9806-f9cf6448b371",
		"F94":"b9f604fe-9af2-4be1-b40c-e408dbd6dcc5",
		"F94.0":"0d88c45b-6b69-4cbc-b803-583a9f229b95",
		"F94.1":"1d819065-9084-11e6-a98e-000c29db4475",
		"F94.2":"6655e821-6791-4db9-b813-7991258385df",
		"F95":"3ba40d43-dc8d-411d-8fdf-e212c932221e",
		"F95.0":"8b280540-451b-418a-9aa7-4ce61e1251b1",
		"F95.1":"5c83ae7e-74bf-4564-9f2e-cbc0937c1e8d",
		"F95.2":"6b037d99-64d4-4c39-a14d-6bfaa84257e5",
		"F98":"9a8c44fd-8672-418c-91d5-b52719dc81f7",
		"F98.0":"b0432213-3cf5-49d3-b32d-33cfd36f417d",
		"F98.1":"1cf8f9ce-1d0a-48f5-8ce3-1995e9b066d4",
		"F98.2":"a9ac5611-5809-45a5-a15e-b817683fb6db",
		"F98.3":"5892138e-02a0-4b02-9629-2f26d5ef4ec2",
		"F98.4":"4e7c0c5e-f044-4d06-8bec-28f89fc52bcd",
		"F98.5":"1fdb9a5b-9084-11e6-a98e-000c29db4475",
		"F98.6":"8f60efe8-5339-4648-a7af-065b594eb3dc",
		"F98.8":"efafc9e8-0acb-4a63-9de7-3601d909842b",
		"F98.9":"52274020-bb94-4729-8dbd-063ddff01696",
		"F99":"0aae621c-f0c0-4c1f-9c4e-408ff1167d66"
	}

var fnmList = {
		"7-D-1": { "drug": "CARBAMAZEPINA", "drugUuid": "e1d6bb14-1d5f-11e0-b929-000c29ad1d07", "form": "200mg", "formUuid": "4c8b32db-acc4-4a59-802a-05d921315260" },
		"7-D-2": { "drug": "CLONAZEPAM", "drugUuid": "47031dcc-3f84-4711-9b72-359630f53bca", "form": "2mg", "formUuid": "98fb063d-159d-4236-bc58-4b2b692b2687" },
		"7-D-4": { "drug": "FENITOINA", "drugUuid": "e1d0616a-1d5f-11e0-b929-000c29ad1d07", "form": "100mg", "formUuid": "12a7ea29-6824-4098-8350-2113a764b7a0" },
		"7-D-6": { "drug": "FENOBARBITAL", "drugUuid": "e1d0301e-1d5f-11e0-b929-000c29ad1d07", "form": "100mg", "formUuid": "12a7ea29-6824-4098-8350-2113a764b7a0" },
		"7-D-7": { "drug": "FENOBARBITAL", "drugUuid": "e1d0301e-1d5f-11e0-b929-000c29ad1d07", "form": "15mg", "formUuid": "b99eed61-8e68-4161-b041-c776d0b1652e" },
		"7-D-11": { "drug": "LAMOTRIGINA", "drugUuid": "60aa53f5-5c00-4655-bba9-595e9e94e307", "form": "50mg", "formUuid": "431d2f8e-6d78-4bdb-a46d-f790a5d54501" },
		"7-D-12": { "drug": "TOPIRAMATO", "drugUuid": "12b4e538-3a81-4104-88a3-2d3c9d788f53", "form": "100mg", "formUuid": "12a7ea29-6824-4098-8350-2113a764b7a0" },
		"7-D-13": { "drug": "VALPROATO DE SODIO", "drugUuid": "004e305a-7401-4bdb-8460-300e781313f8", "form": "200mg", "formUuid": "4c8b32db-acc4-4a59-802a-05d921315260" },
		"7-D-14": { "drug": "VALPROATO DE SODIO", "drugUuid": "004e305a-7401-4bdb-8460-300e781313f8", "form": "200mg/5ml", "formUuid": "7bc69e34-9cea-434c-a220-1cfb6eb91803" },
		"7-F-1": { "drug": "BIPERIDENO [NEEDS CLARIFICATION]", "drugUuid": "UNKNOWN", "form": "2mg", "formUuid": "98fb063d-159d-4236-bc58-4b2b692b2687" },
		"7-F-2": { "drug": "BIPERIDENO (AKINETON) [NEEDS CLARIFICATION]", "drugUuid": "UNKNOWN", "form": "5mg/ml", "formUuid": "7c1bcb18-a292-44a6-90a2-532f907c4100" },
		"13-A-2": { "drug": "CLORFENIRAMINA", "drugUuid": "e1d6b3b2-1d5f-11e0-b929-000c29ad1d07", "form": "4mg", "formUuid": "d7ccee2b-2b93-4063-a31f-0145608a131d" },
		"13-A-3": { "drug": "CLORFENIRAMINA", "drugUuid": "e1d6b3b2-1d5f-11e0-b929-000c29ad1d07", "form": "2mg/5ml", "formUuid": "aa685a66-4978-46e1-910e-c7b78e964231" },
		"13-A-4": { "drug": "DIFENIDRAMINA", "drugUuid": "e1d6bc22-1d5f-11e0-b929-000c29ad1d07", "form": "50mg/ml", "formUuid": "71bc504b-63d4-480c-9d2c-660d9b4f6ffc" },
		"13-A-5": { "drug": "PROMETAZINA", "drugUuid": "e1d4b4a4-1d5f-11e0-b929-000c29ad1d07", "form": "10mg", "formUuid": "0a79cea9-3fc1-42b3-a247-ebcc746ad003" },
		"13-A-7": { "drug": "PROMETAZINA", "drugUuid": "e1d4b4a4-1d5f-11e0-b929-000c29ad1d07", "form": "50mg/2ml", "formUuid": "6edca76e-5657-4e0f-9ad4-b9c4b905bc96" },
		"7-G-1": { "drug": "AMITRIPTILINA", "drugUuid": "e1d6c6ae-1d5f-11e0-b929-000c29ad1d07", "form": "10mg", "formUuid": "0a79cea9-3fc1-42b3-a247-ebcc746ad003" },
		"7-G-2": { "drug": "AMITRIPTILINA", "drugUuid": "e1d6c6ae-1d5f-11e0-b929-000c29ad1d07", "form": "25mg", "formUuid": "bca695b6-4172-4cf1-8829-72306ac9a1d8" },
		"7-G-3": { "drug": "FLUOXETINA HCL", "drugUuid": "0841741e-bd0f-4370-8440-66a6bc95c941", "form": "20mg", "formUuid": "435761ad-a501-4a69-bb64-23f57a8c8fb7" },
		"7-G-4": { "drug": "IMIPRAMINA", "drugUuid": "696221a6-3405-4b48-ab17-be36c0a2acd2", "form": "25mg", "formUuid": "bca695b6-4172-4cf1-8829-72306ac9a1d8" },
		"7-G-6": { "drug": "MAPROTILINA", "drugUuid": "8a3c2ae9-a83a-4dd1-97ba-d66c758f813f", "form": "25mg", "formUuid": "bca695b6-4172-4cf1-8829-72306ac9a1d8" },
		"7-G-7": { "drug": "PAROXETINA", "drugUuid": "c24b5049-5a79-4a77-939d-e04e93cb9168", "form": "20mg", "formUuid": "435761ad-a501-4a69-bb64-23f57a8c8fb7" },
		"7-I-4": { "drug": "CLORDIAZEPOXIDO", "drugUuid": "5858d9fb-f9f9-45b8-a2c4-26cb8cf478dc", "form": "10mg", "formUuid": "0a79cea9-3fc1-42b3-a247-ebcc746ad003" },
		"7-I-5": { "drug": "DIAZEPAM", "drugUuid": "e1d039ba-1d5f-11e0-b929-000c29ad1d07", "form": "2mg", "formUuid": "98fb063d-159d-4236-bc58-4b2b692b2687" },
		"7-I-6": { "drug": "DIAZEPAM", "drugUuid": "e1d039ba-1d5f-11e0-b929-000c29ad1d07", "form": "10mg", "formUuid": "0a79cea9-3fc1-42b3-a247-ebcc746ad003" },
		"7-I-7": { "drug": "DIAZEPAM", "drugUuid": "e1d039ba-1d5f-11e0-b929-000c29ad1d07", "form": "10mg/2ml", "formUuid": "07e5dc44-9307-439a-8f4f-ef8c2fccd021" },
		"7-J-1": { "drug": "CLORPROMAZINA", "drugUuid": "77bf686f-4920-47d9-b448-8b1ef0c8e4c8", "form": "25mg", "formUuid": "bca695b6-4172-4cf1-8829-72306ac9a1d8" },
		"7-J-2": { "drug": "CLORPROMAZINA", "drugUuid": "77bf686f-4920-47d9-b448-8b1ef0c8e4c8", "form": "100mg", "formUuid": "12a7ea29-6824-4098-8350-2113a764b7a0" },
		"7-J-3": { "drug": "CLORPROMAZINA", "drugUuid": "77bf686f-4920-47d9-b448-8b1ef0c8e4c8", "form": "25mg/2ml", "formUuid": "0b812064-fca3-4d74-b4fb-aed971b7d971" },
		"7-J-4": { "drug": "FLUFENAZINA", "drugUuid": "a9529dce-4feb-4463-a1e6-446bccc0651d", "form": "2,5mg", "formUuid": "ae11b066-9fb8-45bd-8151-9771c53a42de" },
		"7-J-5": { "drug": "DECANOATO DE FLUFENAZINA (MODECATE) [NEEDS CLARIFICATION]", "drugUuid": "UNKNOWN", "form": "25mg/2ml", "formUuid": "0b812064-fca3-4d74-b4fb-aed971b7d971" },
		"7-J-6": { "drug": "HALOPERIDOL", "drugUuid": "d5958d7f-d54a-4046-b448-45db947e4b40", "form": "5mg", "formUuid": "d3e814d5-df91-4b9e-b7a3-ca46f8c2696e" },
		"7-J-7": { "drug": "HALOPERIDOL", "drugUuid": "d5958d7f-d54a-4046-b448-45db947e4b40", "form": "5mg/1ml", "formUuid": "UNKNOWN" },
		"7-J-9": { "drug": "TIORIDAZINA", "drugUuid": "824bf028-69f5-4663-a489-1817fe6134dd", "form": "10mg", "formUuid": "0a79cea9-3fc1-42b3-a247-ebcc746ad003" },
		"7-J-10": { "drug": "TIORIDAZINA", "drugUuid": "824bf028-69f5-4663-a489-1817fe6134dd", "form": "100mg", "formUuid": "12a7ea29-6824-4098-8350-2113a764b7a0" },
		"7-J-11": { "drug": "TRIFLUORPERAZINA", "drugUuid": "0bfdf410-2d6d-40a0-b697-13667d0a0c4a", "form": "5mg", "formUuid": "d3e814d5-df91-4b9e-b7a3-ca46f8c2696e" },
		"7-J-15": { "drug": "RISPERIDONA", "drugUuid": "2272fd69-d5f3-45e2-bd58-41cd4fc786d9", "form": "2mg", "formUuid": "98fb063d-159d-4236-bc58-4b2b692b2687" },
		"7-J-16": { "drug": "RISPERIDONA", "drugUuid": "2272fd69-d5f3-45e2-bd58-41cd4fc786d9", "form": "3mg", "formUuid": "3be55be3-9f64-4401-8689-b57da6ba6155" }
	}

function setHiddenMedicationValues (key, medName, medForm) {
    var drugUuid = fnmList[key]["drugUuid"];
    var formUuid = fnmList[key]["formUuid"];
    $("#" + medName).val(drugUuid);
    $("#" + medForm).val(formUuid);
}

function addOptionsToSelect(select, optionArr, blankVals=false) {
    var $select = $("#" + select);
    $select.append($("<option />"));
    $.each(optionArr, function(k, v) {
        if (blankVals) {
            $select.append($("<option />").val("").text(k));
        } else {
            $select.append($("<option />").val(v).text(k));
        }
    });
}

function closeTypeAhead(parent){
    var list = $(`[id=${$(parent).attr("id")}-typeahead]`)[0];

    if(list) {
        list.parentNode.removeChild(list);
    }
}

function addTypeAheadToDrugInput(){
    var inputRequiresTypeAhead = $("input.drug-list");

    inputRequiresTypeAhead.attr("autocomplete", "off");
    
    for(input of inputRequiresTypeAhead){
       
        var updatingValue = false;

        inputRequiresTypeAhead.on("input", function() {
            
            closeTypeAhead(this);

            //this will only occur on subsequent calls from the click event of one of the items
            if(updatingValue){
                updatingValue = false;
                return;
            }

            var input = this;
            typeAheadListDiv = document.createElement("DIV");
            var typeAheadId = inputRequiresTypeAhead.attr("id")+"-typeahead"
            typeAheadListDiv.setAttribute("id", typeAheadId);
            typeAheadListDiv.setAttribute("class", "typeahead-list");
            var jqTALD = $(typeAheadListDiv);

            var divList = [];
            for(drugKey of Object.keys(drugList)){
                var drugValue = drugList[drugKey]
                if( this.value == drugValue.substr(0, this.value.length) ){
                    divList.push(`<div class="typeahead-list-item" id="${typeAheadId}-${drugKey} data-uuid="${drugKey}">${drugValue}</div>`);
                }
            }
            var divHtml = divList.join('');
            
            jqTALD.html(divHtml)
            jqTALD.insertAfter(this);

            var items = $(".typeahead-list-item");
            items.on("click", function(e){
                //e.preventDefault();
                input.value = this.textContent;
                closeTypeAhead(input);
                var inputEvent = new Event("input");
                updatingValue = true;
                input.dispatchEvent(inputEvent);
            });
        });
         
        inputRequiresTypeAhead.on("keydown", function(){

        });

        inputRequiresTypeAhead.on("blur", function(){
            //closeTypeAhead(this);
        })
    }


}

var originalSubmitFn = null;

$(document).ready( 
    function () {

            //setMaxDateToToday();

            var settings = {};

            window.location.search.substr(1).split("&").map( (param) => {
                var settingValue = param.split("=");
                settings[settingValue[0]] = settingValue[1];

            } );

            //if in an HFE form, pathname will be the same, but GET param formId will differ when creating a form for a patient, id will differ when accessing the form from the HFE module pages
            if(settings.formId){
                dataStoreNS+="-id-"+settings.formId;
            } else if(settings.id) {
                dataStoreNS+="-id-"+settings.id;
            }

            //console.log(settings);

            if(settings.tabbed=="false"){
                
                //console.log("monolithic");
                
                //todo: make this default in html and apply these in tabbed, rather than remove, so browser w/o js will still see a usable form

                var tabContent = $("#tab-content-sections");

                //console.log(tabContent);
                tabContent.removeClass("tab-content");

                var panes = $(".tab-pane");

                //console.log(panes);

                for(pane of panes) { 
                    //console.log(pane);
                    $(pane).addClass("show");
                }

            }else{
                //console.log("tabbed version");
                
                var tabs = $("#section-tabs");

                //remove hidden attribute from tabs
                tabs.removeAttr("hidden");

                $("#"+sessionStorage[dataStoreNS+"visibleTab"]).tab('show');

                $('#section-tabs a').on('click', 
                    
                    function (event) {

                        event.preventDefault();

                        $(this).tab('show');

                        sessionStorage[dataStoreNS+"visibleTab"]=this.id;

                        document.body.scrollTop = document.documentElement.scrollTop = 0;

                    });

                //this is supposed to be handled for us already... but doesnt seem to be (previously selected tabs continue to show selected state without manually removing active)
                $('a[data-toggle="tab"]').on('shown.bs.tab', 
                    function (e) {
                        //e.target // newly activated tab
                        $(e.relatedTarget).removeClass("active");
                    });
            }


            applyScrollPositionPersistence();

            initializeInputValuePersistence(reset=false);
/*
            for(textarea of textAreas){
                textarea.addEventListener("input", function(event){localDataStore(this, load=false)});
            }
*/
            var templateProvidedValues = $("[id^=template-rendered]");

            for(value of templateProvidedValues){

                var targetControl = $(`[id=${value.dataset.targetId}`)[0];

                var value = value.textContent;

                if(targetControl.type == "date"){
                    try {
                        value = new Date(value).toISOString().split("T")[0];
                    } catch (e) {
                        value = "";
                    }
                } else if( targetControl instanceof HTMLFieldSetElement) {
                    var radios = $(`fieldset[id=${targetControl.id}] input[type=radio]`);
                    for(radio of radios){
                        if( radio.value == value)
                        {
                            radio.checked = true;
                        }
                    }
                }



                targetControl.value = value;

                var inputEvent = new Event("input");

                targetControl.dispatchEvent(inputEvent);
            }
            
            $("[id=encounterDate] input[type=text]").on("focus",
                function bringDatePickerToFrontAndFixPosition(){
                    var datepicker = $("div[id=ui-datepicker-div]");
                    datepicker.css("z-index", 1000000);
                    datepicker.css("position", "fixed");
                    var parentInput = $(this);
                    var position = parentInput.position().top+/*parentInput.offset().top-$(window).scrollTop+*/parentInput.outerHeight(true);
                    datepicker.css("top", position);
            });

            ///$("a[onclick^='handleDeleteButton']").on("click",
            //function bringDeleteToFront(){
                var deletePopup = $("[id=confirmDeleteFormPopup]");
                if(deletePopup) {
                    deletePopup.css("z-index", 1000000);
                }
            //});
            

            if( settings.dev=="true" ) {

                $("input").toArray().forEach(function(elem){ $(elem).css("background-color", $(elem).attr("data-concept-id")?"green":"red")});

                $("textarea").toArray().forEach(function(elem){ $(elem).css("background-color", $(elem).attr("data-concept-id")?"green":"red")});

                $("select").toArray().forEach(function(elem){ $(elem).css("background-color", $(elem).attr("data-concept-id")?"green":"red")});

                $("option").toArray().forEach(function(elem){ $(elem).css("background-color", $(elem).attr("data-concept-id")?"green":"red")});

                var fieldsetsWithRadios = getFieldsetsWithRadios();

                fieldsetsWithRadios.forEach(function(elem){ $(elem).css("background-color", $(elem).attr("data-concept-id")?"green":"red")});
            }

            var form = $("form#htmlform");

            //by setting onreset using attr(), the html will show onreset="setAllDisabledStates();" (in recent chrome at least)
            form.attr("onreset", "setAllDisabledStates();");

            //store original submit function
            form[0].originalSubmitFn = form[0].submit;

            //"monkey-patch" submit function
            form[0].submit = function(){
                
                var progress = $(document.createElement("DIV"));
                progress.attr("class", "progress-bar progress-bar-striped progress-bar-animated");
                progress.attr("role", "progressbar");
                
                progress.attr("aria-valuenow", "0");
                progress.attr("aria-valuemin", "0");
                progress.attr("aria-valuemax", "100");

                progress.css("z-index", "1000000");
                /*progress.css("top", "50%");
                progress.css("left", "50%");
                progress.css("transform", "translate(-50%, -50%)");*/
                progress.css("width", "75%");
                progress.css("height", "50px");
                
                progress.insertAfter("#section-tabs");

                //use xhr to detect redirect
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function(e) {
                    
                    var progressValue = String(100*Number(xhr.readyState/4))
                    progress.attr("width", `${progressValue}%`);

                    //wait for DONE state
                    //console.log(xhr.status, xhr.responseURL);
                    if (xhr.readyState == 4) {
                        
                        //if the final location differs from the current location,
                        //the submit succeeded and we got a redirect
                        if (window.location.href != xhr.responseURL) {
                            
                            //initializeInputValuePersistence(reset=true);
                            initializeLocalStore(clear=true, initializeEmptyStore=false);

                            //update the window location url
                            window.location.href = xhr.responseURL;
                        } else {
                            //may not be the most effecient impl. (might be... can't set document.documentElement)
                            //if not, call the old submit to get the error response in a way the user will see
                            form[0].originalSubmitFn();

                            //$("#htmlform").removeChild(progress);
                        }
                        
                        
                    }

                }

                xhr.withCredentials = true;
                xhr.open("POST", window.location.href, true);
                
                xhr.send(new FormData(form[0]));
                
            };
            
            var discardLink = $("[id=discardLinkSpan] a[class=html-form-entry-discard-changes]");
            discardLink.on("click", function(event) {confirmReset(event, reinitialize=false);} )

            var editLink = $("a[href*='mode=EDIT']");
            editLink.on("click", function(event) {initializeLocalStore(clear=true, initializeEmptyStore=false);} )

            //addTypeAheadToDrugInput();
            addOptionsToSelect("primary-dx-list", dxsList);
            addOptionsToSelect("secondary-dx-list", dxsList);
            addOptionsToSelect("medication-1-fnm", fnmList, true);
            addOptionsToSelect("medication-2-fnm", fnmList, true);
            addOptionsToSelect("medication-3-fnm", fnmList, true);
            addOptionsToSelect("medication-4-fnm", fnmList, true);
            addOptionsToSelect("medication-5-fnm", fnmList, true);
            
            loadLocalSiteInfo(true);
        }

);
