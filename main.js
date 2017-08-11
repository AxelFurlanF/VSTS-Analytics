$( document ).ready(function() {
    projects = get_projects();
    //workItems = get_workItems(projects);
    //workLoad = get_workLoad(workItems);
    users = get_users();
    workLoad=0;
    
    
    draw_plots(workLoad, users);
    
    console.log(users);
});

var token = 'izfw53ajijl3ykshxwvsb5teg2jzjffokbprfsq3uzkjzdf6g43q'

function get_users(){
    var data = $.parseJSON($.ajax({
        url: 'https://perceptiongroup.visualstudio.com/DefaultCollection/_apis/projects/PG%20General/teams/PG%20General%20Team/members?api-version=1.0',
        dataType: 'json',
        headers: {
                'Authorization': 'Basic ' + btoa("" + ":" + token)
            },
        async: false
    }).responseText);
    
    data = data.value;
    var users = [];
    data.forEach(function(element) {
        users.push(element.displayName);
    });
    
    return users;
    
}


function get_projects(){
    var data = $.parseJSON($.ajax({
        url: 'https://perceptiongroup.visualstudio.com/DefaultCollection/_apis/projects?api-version=1.0',
        dataType: 'json',
        headers: {
                'Authorization': 'Basic ' + btoa("" + ":" + token)
            },
        async: false
    }).responseText);
    
    data = data.value;
    var projects = [];
    data.forEach(function(element) {
        projects.push(element.name);
    });
    
    return projects;
}

function get_workItems(projects){
    var data;
    var workItems = [];
    projects.forEach(function(project) {
        //por cada projecto
        data = $.parseJSON($.ajax({
            url: 'https://perceptiongroup.visualstudio.com/DefaultCollection/'+project+'/_apis/wit/wiql?api-version=1.0',
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
        
        data.forEach(function(workitem) {
           workItems.push(workitem.id);
        });
    });

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
        
        data.forEach(function(workitem) {
            workLoad.push(workitem.fields);
        });
    }
    return workLoad;
    
}



function draw_plots(workLoad, users){
    var trace1 = {
    x: users,
    y: [20, 14, 23,20,20,20,20],
    name: 'Original Estimate',
    type: 'bar'
    };

    var trace2 = {
    x: users,
    y: [12, 18, 29,20,20,20,20],
    name: 'Completed Work',
    type: 'bar'
    };

    var data = [trace1, trace2];

    var layout = {barmode: 'group'};

    Plotly.newPlot('plot', data, layout);
    
}