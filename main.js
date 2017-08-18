var token = 'izfw53ajijl3ykshxwvsb5teg2jzjffokbprfsq3uzkjzdf6g43q'
var projectsG;
var usersG;
var workloadG;

$( document ).ready(function() {
    $body = $("body");
    get_users();
    get_projects(appendProjects);
    get_projects(get_workItems, plot_general)
    
});



function appendProjects(projects){
    for (var i = 0; i<projects.length; i++){
        $("#proyectos").append('<button class="dropdown-item" type="button">'+ projects[i] +'</button>');
    }
}


function get_users(){
    var users=[];
    $.ajax({
        url: 'https://perceptiongroup.visualstudio.com/DefaultCollection/_apis/projects/PG%20General/teams/PG%20General%20Team/members?api-version=1.0',
        dataType: 'json',
        headers: {
                'Authorization': 'Basic ' + btoa("" + ":" + token)
            },
        async: false,
        beforeSend: function() {
            $body.addClass("loading"); 
        },
        success: function(data) {
            
                data = data.value;
                
                data.forEach(function(element) {
                    users.push(element.displayName);
                });
                console.log(users);
            },
    });
    
    usersG=users;
    return users;
    
}


function get_projects(callbackFunction, callbackFunction2){
    var projects = [];
    $.ajax({
        url: 'https://perceptiongroup.visualstudio.com/DefaultCollection/_apis/projects?api-version=1.0',
        dataType: 'json',
        headers: {
                'Authorization': 'Basic ' + btoa("" + ":" + token)
            },
        async: true,
        beforeSend: function() {
            $body.addClass("loading"); 
        },
        success:function(data) {
            
                data = data.value;
                
                for (var i = 0; i<data.length; i++){
                    projects.push(data[i].name);
                };
                
                console.log(projects);
                callbackFunction(projects, callbackFunction2);
            },
    });
    projectsG=projects;
    return projects;
}

function get_workItems(projects, callbackFunction2){
    var data = [];
    var workItems = [];
    
    var promises = [];
    for (var i = 0; i<projects.length; i++) {
        promises.push(
            $.ajax({
                url: 'https://perceptiongroup.visualstudio.com/DefaultCollection/'+projects[i]+'/_apis/wit/wiql?api-version=1.0',
                type: 'POST',
                contentType: "application/json",
                dataType: 'json',
                headers: {
                        'Authorization': 'Basic ' + btoa("" + ":" + token)
                    },
                data: JSON.stringify({"query":"Select * From WorkItems Where [System.WorkItemType] = 'Task' AND [State] = 'Closed' AND [State] <> 'Removed' order by [Microsoft.VSTS.Common.Priority] asc, [System.CreatedDate] desc"
                    }),
                async: true
            })
            
        );
    }
    $.when.apply($, promises).then(function() {
        for (var j = 0; j<projects.length; j++) {
            for (var k = 0; k<arguments[j][0].workItems.length; k++) {
                workItems.push(arguments[j][0].workItems[k].id);
            }
        }
        
        get_workLoad(workItems, callbackFunction2);
        
    }, function() {
        // error occurred
    });
    console.log(workItems);
    return workItems;
    
}


function get_workLoad(workItems, callbackFunction){
    var data;
    var workLoad = [];
    length = workItems.length;
    
    var promises = [];
    for (var i = 0; i<length; i+=200){
    //recorrer de a tandas de a 200
        promises.push(
            $.ajax({
                url: 'https://perceptiongroup.visualstudio.com/DefaultCollection/_apis/wit/WorkItems?ids='+ workItems.slice(i,i+200).join(",") +'&fields=System.Title,System.AssignedTo,System.State,Microsoft.VSTS.Scheduling.OriginalEstimate,Microsoft.VSTS.Scheduling.CompletedWork,Microsoft.VSTS.Scheduling.RemainingWork,System.TeamProject',
                type: 'GET',
                contentType: "application/json",
                dataType: 'json',
                headers: {
                    'Authorization': 'Basic ' + btoa("" + ":" + token)
                },
                async: true
            })
        );
    }   
    $.when.apply($, promises).then(function() {
        $body.removeClass("loading");
        
        for (var j = 0; j<arguments.length; j++){
            for (var k = 0; k<arguments[j][0].value.length; k++) {
                workLoad.push(arguments[j][0].value[k].fields);
            }
        };
        
        callbackFunction(workLoad);
        console.log(workLoad);
        
        workloadG = workLoad;
        return workLoad;
        
    }, function() {
        //error
    });
    
    
    console.log(workLoad);
    return workLoad;
    
}



function plot_general(workLoad){
    users = usersG;
    oEstimate = [];
    cWork=[];
    deviation = [];
    
    for (var i = 0; i < users.length; i++) {
        oEstimate[i] = 0; 
        cWork[i] = 0;
        deviation[i] = 0;
    }
    
    for (var i = 0; i<workLoad.length; i++){
        assignedTo = workLoad[i]["System.AssignedTo"];
        if (!assignedTo) continue;
        user = assignedTo.split(" <")[0];
        
        j = users.indexOf(user);
        
        oEstimate[j] += oe= workLoad[i]["Microsoft.VSTS.Scheduling.OriginalEstimate"] || 0;
        cWork[j] += cw = workLoad[i]["Microsoft.VSTS.Scheduling.CompletedWork"] || 0;
        deviation[j] += oe - cw;
    }
    
    var trace1 = {
    x: users,
    y: oEstimate,
    //y: [0,1,2,3,4,5,6],
    name: 'Original Estimate',
    type: 'bar'
    };

    var trace2 = {
    x: users,
    y: cWork,
    //y: [0*2,1*2,2*2,3*2,4*2,5*2,6*2],
    name: 'Completed Work',
    type: 'bar'
    };

    var trace3 = {
    x: users,
    y: deviation,
    //y: [0*2,1*2,2*2,3*2,4*2,5*2,6*2],
    name: 'Desviacion',
    type: 'bar'
    };
    
    var data = [trace1, trace2, trace3];

    var layout = {barmode: 'group'};

    Plotly.newPlot('plot', data, layout);
    
}