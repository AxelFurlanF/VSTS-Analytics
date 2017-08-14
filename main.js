$( document ).ready(function() {
    projects = get_projects();
    appendProjects(projects);
    //workItems = get_workItems(projects);
    //workLoad = get_workLoad(workItems);
    
    users = get_users();
    plot_general(0, users);
    
    console.log(users);
});

var token = 'izfw53ajijl3ykshxwvsb5teg2jzjffokbprfsq3uzkjzdf6g43q'


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
        async: true,
        success: function(data) {
            
                data = data.value;
                
                data.forEach(function(element) {
                    users.push(element.displayName);
                });
                console.log(users);
            },
    });
    
    
    return users;
    
}


function get_projects(){
    var projects = [];
    $.ajax({
        url: 'https://perceptiongroup.visualstudio.com/DefaultCollection/_apis/projects?api-version=1.0',
        dataType: 'json',
        headers: {
                'Authorization': 'Basic ' + btoa("" + ":" + token)
            },
        async: true,
        success:function(data) {
            
                data = data.value;
                
                for (var i = 0; i<data.length; i++){
                    projects.push(data[i].name);
                };
                
                console.log(projects);
                get_workItems(projects);
            },
    });
    
    return projects;
}

function get_workItems(projects){
    var data;
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
            data: JSON.stringify({"query":"Select * From WorkItems Where [System.WorkItemType] = 'Task' AND [State] <> 'Closed' AND [State] <> 'Removed' order by [Microsoft.VSTS.Common.Priority] asc, [System.CreatedDate] desc"
                }),
            async: false
            })
            
        );
    }
    $.when.apply($, promises).then(function() {
        // returned data is in arguments[0][0], arguments[1][0], ... arguments[9][0]
        // you can process it here
    }, function() {
        // error occurred
    });
    
    
    
    for (var i = 0; i<projects.length; i++){
        //por cada projecto
        data = $.parseJSON($.ajax({
            url: 'https://perceptiongroup.visualstudio.com/DefaultCollection/'+projects[i]+'/_apis/wit/wiql?api-version=1.0',
            type: 'POST',
            contentType: "application/json",
            dataType: 'json',
            headers: {
                    'Authorization': 'Basic ' + btoa("" + ":" + token)
                },
            data: JSON.stringify({"query":"Select * From WorkItems Where [System.WorkItemType] = 'Task' AND [State] <> 'Closed' AND [State] <> 'Removed' order by [Microsoft.VSTS.Common.Priority] asc, [System.CreatedDate] desc"
                }),
            async: false
        }).responseText);
        
        data = data.workItems;
        
        for (var j = 0; j<data.length; j++){
            workItems.push(data[j].id);
        };
    };
    console.log(workItems);
    return workItems;
    
}


function get_workLoad(workItems){
    var data;
    var workLoad = [];
    length = workItems.length;
    for (var i = 0; i<length; i+=200){
    //recorrer de a tandas de a 200
        data = $.parseJSON($.ajax({
            url: 'https://perceptiongroup.visualstudio.com/DefaultCollection/_apis/wit/WorkItems?ids='+ workItems.slice(i,i+200).join(",") +'&fields=System.Title,System.AssignedTo,System.State,Microsoft.VSTS.Scheduling.OriginalEstimate,Microsoft.VSTS.Scheduling.CompletedWork,Microsoft.VSTS.Scheduling.RemainingWork,System.TeamProject',
            type: 'GET',
            contentType: "application/json",
            dataType: 'json',
            headers: {
                    'Authorization': 'Basic ' + btoa("" + ":" + token)
                },
            async: false
        }).responseText);
        
        data = data.value;
        
        for (var j = 0; j<data.length; j++){
            workLoad.push(data[j].fields);
        };
    }
    
    console.log(workLoad);
    return workLoad;
    
}



function plot_general(workLoad, users){
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
        deviation[j]= oe - cw;
    }
    
    var trace1 = {
    x: users,
    //y: oEstimate,
    y: [0,1,2,3,4,5,6],
    name: 'Original Estimate',
    type: 'bar'
    };

    var trace2 = {
    x: users,
    //y: cWork,
    y: [0*2,1*2,2*2,3*2,4*2,5*2,6*2],
    name: 'Completed Work',
    type: 'bar'
    };

    var trace3 = {
    x: users,
    //y: deviation,
    y: [0*2,1*2,2*2,3*2,4*2,5*2,6*2],
    name: 'Desviacion',
    type: 'bar'
    };
    
    var data = [trace1, trace2, trace3];

    var layout = {barmode: 'group'};

    Plotly.newPlot('plot', data, layout);
    
}