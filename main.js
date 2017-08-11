$( document ).ready(function() {
    projects = get_projects();
    workItems = get_workItems(projects);
    
    console.log(workItems);
});

var token = 'izfw53ajijl3ykshxwvsb5teg2jzjffokbprfsq3uzkjzdf6g43q'

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
    console.log(projects);
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
            data: JSON.stringify({"query": "Select [System.Id], [System.AssignedTo], [System.OriginalEstimate],"+
                    "[System.CompletedWork], [System.RemainingWork],"+
                    "[System.Title], [System.State] From WorkItems "+
                    "Where [System.WorkItemType] = 'Task' AND [State] <> 'Closed' AND [State] <> 'Removed' "+
                    "order by [Microsoft.VSTS.Common.Priority] asc, [System.CreatedDate] desc"
                }),
            async: false
        }).responseText);
        
        data = data.workItems;
        
        //data.forEach(function(workitem) {
        //    workItems.push(workitem);
        //});
    });

    return workItems;
    
}