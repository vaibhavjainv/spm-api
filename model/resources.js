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
    var assignmentMap = {}
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
                }
                if (assignment.endWeek == undefined || assignment.endWeek < allocation.week) {
                    assignment["endWeek"] = allocation.week;
                }
                res.allocation[new Date(allocation.week).toDateString()]=allocation.hours;
                res.totalhours=res.totalhours+allocation.hours;

                if(assignment["assignmentHours"] == undefined){
                    assignment["assignmentHours"] = 0;
                }
                assignment["assignmentHours"] = assignment.assignmentHours + allocation.hours;
            });

            res["totalcost"] = res.totalhours * res.rate;


            if(assignment["assignmentCost"] == undefined){
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
            }else{
                assignment.weeks[assignment.weeks.length] = endWeek.toDateString();
                contine = false;
            }
        }

        assignmentArr.push(assignment);
    }


    return assignmentArr;
}

var getAllAssignments = function (res) {

    initResources(function () {
        Resource.find(function (err, resources) {
            if (err)
                return console.error(err);
            var data = resources;

            var assignmentMap = getAssignmentMap(resources);

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
        var resource = new Resource(req.body);
        resource.save(function (err, resource) {
            if (err) return console.error(err);
            //res.status(200).send(resource);
            getAllAssignments(res);
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

        Resource.findById(req.body._id, function (err, resource) {
            if (err) return handleError(err);

            var update = resource.updateallocation(req.body.projects);

            res.status(200).send(update);
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

            resourceSchema.methods.updateallocation = function (projects) {

                if (this.projects.length == 0) {
                    this.projects = projects;
                    this.save();
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
                        this.save();
                    });
                }

                var sr = {};
                sr["validation"] = this.validatehours();
                return (sr);
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
    getAllAssignments
}