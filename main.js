var token = 'izfw53ajijl3ykshxwvsb5teg2jzjffokbprfsq3uzkjzdf6g43q'
var projectsG;
var usersG;
var workloadG;
var actualWorkload;

var msgProject="Todos";
var msgState="Todo";


$( document ).ready(function() {
    
/*---------------Inicio de la plataforma-------------- */
    $body = $("body");
    get_users();
    get_projects(appendProjects);
    get_workItems(plot);
    
    
    editMsg();
/*----------------Capturas de eventos---------------*/
//cuando cambias el estado
    $('.btnEstado').on('click',function(event) {
        var jthis = $(this);
        var estado = jthis.text();
        
        if(estado){
            msgState=estado;
            editMsg();
            
            stateWorkItems = change_state(estado);
            plot(stateWorkItems);

        }
    });
});


function plot(workload){
    plot_general(workload);
    plot_issues(actualWorkload);
}

//modifica el mensaje debajo del título
function editMsg(){
    var mensaje = "Mostrando ";
    
    if (msgState=="Todo") mensaje = mensaje + "todos los issues "; else mensaje = mensaje + " los issues "+msgState;
    if (msgProject=="Todos") mensaje = mensaje + " de todos los proyectos"; else mensaje = mensaje + " del proyecto "+msgProject;

    $('#msg').text(mensaje);
}

//appendea proyectos al dropdown
function appendProjects(projects){
    for (var i = 0; i<projects.length; i++){
        $("#proyectos").append('<button class="dropdown-item btnProyecto" type="button">'+ projects[i] +'</button>');
    }
    //cuando cambias el proyecto
    $('.btnProyecto').on('click',function(event) {
        var jthis = $(this);
        var project = jthis.text();
        
        if(project){
            msgProject=project;
            editMsg();          
            
            projectWorkItems = change_project(project);
            actualWorkload=projectWorkItems;
            plot(projectWorkItems);

        }
    });
}

//cambia el estado y actualiza
function change_state(estado){
    var stateWorkItems = [];
    
    if (estado=="Todo") stateWorkItems=actualWorkload;
    else
    for (var i = 0; i<actualWorkload.length; i++){
        if(actualWorkload[i]["System.State"]==estado){
            stateWorkItems.push(actualWorkload[i]);
        }
    }
    
    return stateWorkItems;
}

//cambia el proyecto y actualiza
function change_project(project){
    var projectWorkItems = [];
    
    if (project=="Todos") projectWorkItems=workloadG;
    else
    for (var i = 0; i<workloadG.length; i++){
        if(workloadG[i]["System.TeamProject"]==project){
            projectWorkItems.push(workloadG[i]);
        }
    }
    
    return projectWorkItems;
}

//agarra users
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


//agarra proyectos
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

//agarra IDs de issues
function get_workItems(callbackFunction2){
    var data = [];
    var workItems = [];
    
    var promises = [];
    
    $.ajax({
        url: 'https://perceptiongroup.visualstudio.com/DefaultCollection/_apis/wit/wiql?api-version=1.0',
        type: 'POST',
        contentType: "application/json",
        dataType: 'json',
        headers: {
                'Authorization': 'Basic ' + btoa("" + ":" + token)
            },
        data: JSON.stringify({"query":"Select * From WorkItems Where [System.WorkItemType] = 'Task' order by [Microsoft.VSTS.Common.Priority] asc, [System.CreatedDate] desc"
            }),
        async: true,
        success:function(data) {
            
                data = data.workItems;
                
                for (var i = 0; i<data.length; i++){
                    workItems.push(data[i].id);
                };
                
                get_workLoad(workItems, callbackFunction2);
            },
    });
            

    

    console.log(workItems);
    return workItems;
    
}

//agarra los datos de los issues por ID
function get_workLoad(workItems, callbackFunction){
    var data;
    var workLoad = [];
    length = workItems.length;
    
    var promises = [];
    for (var i = 0; i<length; i+=200){
    //recorrer de a tandas de a 200
        promises.push(
            $.ajax({
                url: 'https://perceptiongroup.visualstudio.com/DefaultCollection/_apis/wit/WorkItems?ids='+ workItems.slice(i,i+199).join(",") +'&fields=System.Title,System.AssignedTo,System.State,Microsoft.VSTS.Scheduling.OriginalEstimate,Microsoft.VSTS.Scheduling.CompletedWork,Microsoft.VSTS.Scheduling.RemainingWork,System.TeamProject,System.State,System.IterationPath',
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
        
        workloadG = workLoad;
        actualWorkload=workloadG;
        
        callbackFunction(workLoad);
        console.log(workLoad);
        
        
        return workLoad;
        
    }, function() {
        //error
    });
    
    
    console.log(workLoad);
    return workLoad;
    
}


//plot de horas general
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
    type: 'bar',
    marker: {"color": "rgb(146, 210, 255)"}
    };

    var trace2 = {
    x: users,
    y: cWork,
    //y: [0*2,1*2,2*2,3*2,4*2,5*2,6*2],
    name: 'Completed Work',
    type: 'bar',
    marker: {"color": "rgb(14, 181, 255)"}
    };

    if (msgState!="Closed") name = "Remaining Work"; else name = "Desviacion";
    var trace3 = {
    x: users,
    y: deviation,
    //y: [0*2,1*2,2*2,3*2,4*2,5*2,6*2],
    name: name,
    type: 'bar',
    marker: {"color": "rgb(31, 62, 249)"}
    };
    
    var data = [trace1, trace2, trace3];

    var layout = {
        barmode: 'group',
        yaxis: {
            title: 'Horas',
            titlefont: {
            family: 'Arial, Helvetica, sans-serif',
            size: 18,
            color: '#7f7f7f'
            }
        }
    };

    Plotly.newPlot('plot', data, layout);
    
}


//plot de issues
function plot_issues(workLoad){
    var countNew = 0, countActive = 0, countClosed = 0;
    
    for (var i = 0; i<workLoad.length; i++){
        state = workLoad[i]["System.State"];
        state=='New'? countNew++ : 0;
        state=='Active'? countActive++ : 0;
        state=='Closed'? countClosed++ : 0;
    }    
    
    var data = [{
    values: [countNew, countActive, countClosed],
    labels: ['New', 'Active', 'Closed'],
    type: 'pie',
    hoverinfo: "percent",
    marker: {"line": {"width": 0}, "colors": ["rgb(255,255,204)", "rgb(161,218,180)", "rgb(65,182,196)", "rgb(44,127,184)", "rgb(8,104,172)", "rgb(37,52,148)"]},
    textinfo: "label+value"
    }];

    var layout = {"width": 350, "height": 350, "breakpoints": [], "title": "Por estado"}

    Plotly.newPlot('plotIssues', data, layout);
    
}