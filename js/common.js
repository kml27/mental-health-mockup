function setDependentDisabledState(clickedElement, specificRadio, specificTarget, stateOverride=false, disabledOverrideValue){

    if(specificRadio) {
        //console.log("setting clickedElement to ", specificRadio);
        clickedElement = document.querySelector(specificRadio);
    }

    let el = clickedElement.parentElement;

    let targetState = !clickedElement.checked || clickedElement.selected;

    if(stateOverride){
        targetState = disabledOverrideValue;
    }

    if(!specificTarget){
        //console.log('toggling state', clickedElement);
        while(el.nextElementSibling) {

            el = el.nextElementSibling;
            //console.log(el, el.children[0]);
            el.children[0].disabled = targetState;
            //console.log('toggled disavbled on element with id', el.children[0].id);

        }
    } else {
        
        if(Array.isArray(specificTarget)) {
            
            for(target of specificTarget) {
                document.querySelector(target).disabled = targetState;
            }

        } else {
            document.querySelector(specificTarget).disabled = targetState;
        }
    }
};

function loadLocalStorage(attach=false){

    //console.log("loading header selections from browser local storage");

    var storedSelectOptions = ["province", "district", "health-facility"];

    for(selectID of storedSelectOptions) {

        //console.log("looking for", selectID);

        var jQuerySelect = $("select[id="+selectID+"-select]");
        var DOMSelect = undefined;

        if(jQuerySelect) {
            DOMSelect = jQuerySelect[0];
        }

        if(DOMSelect && localStorage["mhf-"+selectID]){
            
            //DOMSelect.selectedIndex=0;

            var option = DOMSelect.namedItem(localStorage["mhf-"+selectID]);

            var optionIndex = -1;
            
            var iteratedOption = 0;
        
            for(var iteratedOption=0; optionIndex==-1 && DOMSelect[iteratedOption]; iteratedOption++){
                
                var curOption = DOMSelect[iteratedOption];
                //console.log(iteratedOption, curOption);

                if(curOption == option){
                    //console.log(curOption);
                    optionIndex = iteratedOption;
                    
                    //When the form is reset, the select will return to its default selection for this select input
                    //console.log("setting as default selection");
                    curOption.defaultSelected=true;
                }
                    
            }

            //console.log(optionIndex);

            if(optionIndex) {
                DOMSelect.selectedIndex = optionIndex;

            }

        }

        if(attach && jQuerySelect) {
            //attach onChange handler to store province selection in local browser storage
            jQuerySelect.on("change", function(event){
                //console.log(this[this.selectedIndex].value);

                let storageName="mhf-"+this.id.slice(0, this.id.lastIndexOf("-select"));
                //console.log("storage name", storageName);

                var prevOptionID = localStorage[storageName];
                if(prevOptionID != undefined) {
                    var prevOptionSelected = this.options[prevOptionID];

                    //console.log(prevOptionID, prevOptionSelected);

                    //Remove default on previously stored option
                    prevOptionSelected.defaultSelected = false;
                }
                
                var newOptionSelected = this[this.selectedIndex];
                                        
                localStorage[storageName] = newOptionSelected.id;
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
                set: $("fieldset[onchange*='setDependentDisabledState']"),
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

            allParams = allParams.map(param => param.replace(/'/g, " ").trim());
            
            //console.log("allParams", allParams)

            if(allParams.length>2){
                var beginArrayIndex=-1;
                var foundArray=false;
                var endArrayIndex=-1;

                for(i=0; i<allParams.length; i++){
                    //selector like '[id=example]' also begins
                    if(allParams[i][0]=="[" && allParams[i].split("[").length>1){
                        beginArrayIndex = i;
                        foundArray = true;
                        allParams[i] = allParams[i].replace("[", " ").trim();
                    }
                    //don't count an closing square bracket as an array if we havent found an open bracket
                    //selector like '[id=example]' also ends
                    //in case someone decides to write (this, input[independent], [ input[id=dependent] ])
                    if(foundArray && allParams[i][0]=="]" && allParams[i].split("]").length > 1){
                        endArrayIndex = i;

                        allParams[i] = allParams[i].replace("]", " ").trim();
                    }
                }

                if( foundArray ) {
                    //console.log("target array found");
                    allParams[2] = allParams.slice(beginArrayIndex, endArrayIndex);

                    allParams = allParams.slice(0, 3);
                }
            }

            //console.log(argsStr, allParams, allParams[0]=="this");


            setDependentDisabledState(allParams[0]=="this"?clickedElement=inputSetsDisabled:allParams[0],allParams[1]=="undefined"?undefined:specificRadio=allParams[1], specificTarget=allParams[2], stateOverride=true, disabledOverrideValue=true);
        }
    }
}

function confirmReset(evt){
    var result = confirm('Are you sure you want to reset *ALL* inputs to defaults?');
    if(result==false)
    {
        evt.preventDefault();
    }

}

function warnMaxDateToday(dateInput, alertSelector){
    var todayDate = new Date();
    var todayStr = todayDate.toISOString().split('T')[0];
    console.log(todayStr, dateInput.value);
    
    var specifiedDay = new Date(dateInput.value);
    
    var alertjQuery = $(alertSelector);
    var alert = alertjQuery[0];

    //alert.clientWidth = dateInput.clientWidth;
    

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

$(document).ready( 
    function () {
            loadLocalStorage(true);
            //setMaxDateToToday();

            var settings = {};

            window.location.search.substr(1).split("&").map( (param) => {
                var settingValue = param.split("=");
                settings[settingValue[0]] = settingValue[1];

            }, settings );

            //console.log(settings);

            if(settings.tabbed=="true"){
                //console.log("tabbed version");
                
                var tabs = $("#section-tabs");

                //remove hidden attribute from tabs
                tabs.removeAttr("hidden");4

                console.log(sessionStorage["visibleTab"]);
                $("#"+sessionStorage["visibleTab"]).tab('show');
                
            }else{
                //console.log("monolithic");
                
                var tabContent = $("#tab-content-sections");
                
                //console.log(tabContent);
                tabContent.removeClass("tab-content");

                var panes = $(".tab-pane");

                //console.log(panes);

                for(pane of panes) { 
                    //console.log(pane);
                    $(pane).addClass("show");
                }
            }

            $('#section-tabs a').on('click', 
            function (e) {

                e.preventDefault();
                $(this).tab('show');

                sessionStorage["visibleTab"]=this.id;

            });

            //this is supposed to be handled for us already... but doesnt seem to work
            $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
                //e.target // newly activated tab
                $(e.relatedTarget).removeClass("active");
            });

            
        }
);