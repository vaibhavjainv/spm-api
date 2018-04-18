var Resource;

var getAllResources = function (res) {

    initResources(function () {
        Resource.find(function (err, resources) {
            if (err)
                return console.error(err);
            var data = resources;

            // Website you wish to allow to connect
            res.setHeader('Access-Control-Allow-Origin', '*');

            // Request methods you wish to allow
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

            // Request headers you wish to allow
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');


            res.status(200).send(data);
        });
    }
    );
}

var getAssignmentMap = function (resources) {
    var assignmentMap = {};
    var globalStartWeek, globalEndWeek;

    resources.forEach(resource => {
        resource.projects.forEach(project => {
            var key = project.account + "-" + project.assignment;
            var assignment = {};

            if (assignmentMap[key] != undefined) {
                assignment = assignmentMap[key];
            }

            assignment["name"] = project.assignment;
            assignment["account"] = project.account;
            if (assignment["resources"] == undefined) {
                assignment["resources"] = [];
            }

            var res = {};

            res["name"] = resource.name;
            res["location"] = resource.location;
            res["rate"] = project.rate;
            res["role"] = project.role;
            res["allocation"] = {};
            res["totalhours"] = 0;
            res["id"] = resource._id;

            project.allocation.forEach(allocation => {
                if (assignment.startWeek == undefined || assignment.startWeek > allocation.week) {
                    assignment["startWeek"] = allocation.week;
                    if (globalStartWeek == undefined || allocation.week < globalStartWeek) {
                        globalStartWeek = new Date(allocation.week);
                    }
                }
                if (assignment.endWeek == undefined || assignment.endWeek < allocation.week) {
                    assignment["endWeek"] = allocation.week;
                    if (globalEndWeek == undefined || allocation.week > globalEndWeek) {
                        globalEndWeek = new Date(allocation.week);
                    }
                }
                res.allocation[new Date(allocation.week).toDateString()] = allocation.hours;
                res.totalhours = res.totalhours + allocation.hours;

                if (assignment["assignmentHours"] == undefined) {
                    assignment["assignmentHours"] = 0;
                }
                assignment["assignmentHours"] = assignment.assignmentHours + allocation.hours;
            });

            res["totalcost"] = res.totalhours * res.rate;


            if (assignment["assignmentCost"] == undefined) {
                assignment["assignmentCost"] = 0;
            }
            assignment["assignmentCost"] = assignment.assignmentCost + res.totalcost;

            assignment.resources[assignment.resources.length] = res;

            assignmentMap[key] = assignment;

        });
    });

    var assignmentArr = [];

    for (var assignmentname in assignmentMap) {
        assignment = assignmentMap[assignmentname]
        assignment["weeks"] = [];

        var nextWeek = new Date(assignment.startWeek);
        var endWeek = new Date(assignment.endWeek);

        assignment.weeks[assignment.weeks.length] = nextWeek.toDateString();

        var contine = true;

        while (contine) {
            nextWeek.setDate(nextWeek.getDate() + 7);
            if (nextWeek < endWeek) {
                assignment.weeks[assignment.weeks.length] = nextWeek.toDateString();
            } else {
                assignment.weeks[assignment.weeks.length] = endWeek.toDateString();
                contine = false;
            }
        }

        assignmentArr.push(assignment);
    }

   
    var metadata = {}
    if(globalStartWeek == undefined){
        globalStartWeek = new Date();
    }

    if(globalEndWeek == undefined){
        globalEndWeek = new Date();
    }

    metadata["globalStartWeek"] = globalStartWeek.toDateString();
    metadata["globalEndWeek"] = globalEndWeek.toDateString();

    var allweeks = [];
    var contine = true;
    var iterDate;
    while(contine){
        if(iterDate == undefined){
            iterDate = globalStartWeek;
        }else{
            iterDate.setDate(iterDate.getDate() + 7);
            if(iterDate >= globalEndWeek){
                contine = false;
            }
        }
        allweeks.push(iterDate.toDateString())
    }

    metadata["allweeks"] = allweeks;

    assignmentMap = {};
    assignmentMap["assignments"] = assignmentArr;
    assignmentMap["metadata"] = metadata;
    

//    assignmentArr.push(metadata);

    return assignmentMap;
}

var getAllAssignments = function (res, errormap) {

    initResources(function () {
        Resource.find(function (err, resources) {
            if (err)
                return console.error(err);
            var data = resources;

            var assignmentMap = getAssignmentMap(resources);

            if (errormap != undefined) {
                assignmentMap.push(errormap);
            }

            // Website you wish to allow to connect
            res.setHeader('Access-Control-Allow-Origin', '*');

            // Request methods you wish to allow
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

            // Request headers you wish to allow
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

            res.status(200).send(assignmentMap);
        });
    }
    );
}

var addResource = function (req, res) {
    initResources(function () {
        Resource.find({ name: req.body.name, location: req.body.location }, function (err, docs) {
            if (docs.length == 0) {
                var resource = new Resource(req.body);
                resource.save(function (err, resource) {
                    if (err) return console.error(err);
                    getAllAssignments(res);
                });
            } else if (docs.length == 1) {
                req.body.projects.forEach(incomingProject => {
                    var processed = false;

                    docs[0].projects.forEach(existingProject => {
                        if (existingProject.assignment == incomingProject.assignment && existingProject.account == incomingProject.account && !processed) {
                            existingProject.rate = incomingProject.rate;
                            existingProject.role = incomingProject.role;
                            //console.log("updated rate and role  to " + existingProject.rate + " project name = " + existingProject.name);              
                            processed = true;
                            //console.log(JSON.stringify(docs[0]));
                        }
                    });

                    if (!processed) {
                        docs[0].projects.push(incomingProject);
                    }

                });

                docs[0].save(function (err, result) {
                    if (err) return console.error(err);
                    getAllAssignments(res);
                });
            } else if (docs.length > 1) {
                var errormap = {};
                errormap["errors"] = ["There are more than one " + req.body.name + " in the system."]
                getAllAssignments(res, errormap);
            }
        });



    }
    );
}

var deleteResource = function (req, res) {

    initResources(function () {

        Resource.remove({ _id: req.params.id }, function (err) {
            if (err) return handleError(err);
            //res.status(200).send('Deleted');
            getAllAssignments(res);
        });

    }
    );
}

var updateallocation = function (req, res) {

    initResources(function () {

        Resource.findById(req.body.id, function (err, resource) {
            if (err) return handleError(err);

            resource.updateallocation(req.body.projects, function () {
                getAllAssignments(res);
                //res.status(200).send(update);
            });

        });


    }
    );
}

var removeallocation = function (req, res) {

    initResources(function () {

        Resource.findById(req.body.id, function (err, resource) {
            if (err) return handleError(err);

            resource.removeallocation(req.body, function () {
                getAllAssignments(res);
            });

        });


    }
    );
}


var initResources = function (callback) {
    if (Resource == undefined) {
        var mongoose = require('mongoose');
        mongoose.connect('mongodb://staffingplan:staffingplan@ds237409.mlab.com:37409/staffing-plan-db');
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function () {
            var resourceSchema = mongoose.Schema({
                name: String,
                location: String,
                projects: [
                    {
                        account: String,
                        assignment: String,
                        rate: Number,
                        role: String,
                        allocation: [
                            {
                                week: Date,
                                hours: Number
                            }
                        ]
                    }
                ]
            });

            resourceSchema.methods.updateallocation = function (projects, callback) {
                var needtosave = false;
                if (this.projects.length == 0) {
                    this.projects = projects;
                    //this.save();
                    needtosave = true;
                } else {
                    projects.forEach(project => {
                        var updated = false;
                        this.projects.forEach(currentproject => {
                            if (currentproject.account == project.account && currentproject.assignment == project.assignment) {
                                currentproject.allocation = project.allocation;
                                updated = true;
                            }
                        });

                        if (!updated) {
                            this.projects.push(project);
                        }
                        needtosave = true;
                        //this.save();
                    });
                }

                this.save(function () {
                    //var sr = {};
                    //sr["validation"] = this.validatehours();
                    callback();
                });


            }

            resourceSchema.methods.removeallocation = function (reqbody, callback) {

                var newprojects = [];

                this.projects.forEach(project => {
                    if (project.assignment != reqbody.assignment || project.account != reqbody.account) {
                        newprojects.push(project);
                    }
                });

                this.projects = newprojects;

                this.save(function () {
                    callback();
                });


            }

            resourceSchema.methods.validatehours = function () {
                var accumulatedAlloc = [];
                var result = [];

                this.projects.forEach(project => {
                    project.allocation.forEach(allocation => {

                        var hours = [];
                        var currentWeeklyAlloc = {};
                        var needpush = true;

                        accumulatedAlloc.forEach(weeklyAlloc => {
                            if (weeklyAlloc[allocation.week.toString()] && needpush) {
                                currentWeeklyAlloc = weeklyAlloc;
                                hours = currentWeeklyAlloc[allocation.week.toString()];
                                needpush = false;
                            }
                        });

                        hours[hours.length] = allocation.hours;
                        currentWeeklyAlloc[allocation.week.toString()] = hours;
                        if (needpush) {
                            accumulatedAlloc.push(currentWeeklyAlloc);
                        }


                    });
                });

                accumulatedAlloc.forEach(weeklyAlloc => {

                    for (const week in weeklyAlloc) {
                        if (weeklyAlloc.hasOwnProperty(week)) {
                            const allhours = weeklyAlloc[week];
                            var totalhours = 0;
                            allhours.forEach(hours => {
                                totalhours = totalhours + hours;
                            });
                            if (totalhours > 40) {
                                result[result.length] = totalhours + " allocated for week of " + week;
                            }
                        }
                    }
                });

                return result;
            }

            Resource = mongoose.model('Resource', resourceSchema);
            callback();
        });
    } else {
        callback();
    }
}

module.exports = {
    getAllResources,
    addResource,
    deleteResource,
    updateallocation,
    getAllAssignments,
    removeallocation
}