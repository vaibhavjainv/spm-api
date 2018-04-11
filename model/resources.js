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

var addResource = function (req, res) {

    initResources(function () {
        var resource = new Resource(req.body);
        resource.save(function (err, resource) {
            if (err) return console.error(err);
            res.status(200).send(resource);
        });

    }
    );
}

var deleteResource = function (req, res) {

    initResources(function () {

        Resource.remove({ _id: req.params.id }, function (err) {
            if (err) return handleError(err);
            res.status(200).send('Deleted');
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
                rate: Number,
                projects: [
                    {
                        account: String,
                        assignment: String,
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
    updateallocation
}