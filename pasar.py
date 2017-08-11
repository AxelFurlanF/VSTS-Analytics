
token = 'izfw53ajijl3ykshxwvsb5teg2jzjffokbprfsq3uzkjzdf6g43q'


def get_projects():
    rp = requests.get('https://perceptiongroup.visualstudio.com/DefaultCollection/'
                      '_apis/projects?api-version=1.0',
                      auth=HTTPBasicAuth(token, ''))
    dp = rp.json()
    dictP = dp['value']
    projects = []
    for project in dictP:
        projects.append(project['name'])

    return projects


def get_workItems(projects):
    param = {
        "query": "Select [System.Id], [System.AssignedTo], [System.OriginalEstimate],"
                 "[System.CompletedWork], [System.RemainingWork],"
                 "[System.Title], [System.State] From WorkItems "
                 "Where [System.WorkItemType] = 'Task' AND [State] <> 'Closed' AND [State] <> 'Removed' "
                 "order by [Microsoft.VSTS.Common.Priority] asc, [System.CreatedDate] desc"
    }
    workItems = []
    for project in projects:
        rwp = requests.post(
            'https://perceptiongroup.visualstudio.com/DefaultCollection/' + project + '/_apis/wit/wiql?api'
                                                                                      '-version=1.0',
            auth=HTTPBasicAuth(token, ''), json=param)
        dwi = rwp.json()
        dictWi = dwi['workItems']
        for workItem in dictWi:
            workItems.append(workItem['id'])

    return workItems