var Kitten, Resource;

var getAllResources = function (res) {

    initResources(function () {
        var resource = new Resource({ name: "Vaibhav", location: "Onshore" })
        Resource.find(function (err, resources) {
            if (err)
                return console.error(err);
            var data = resources;
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

            Resource = mongoose.model('Resource', resourceSchema);
            callback();
        });
    } else {
        callback();
    }
}

var getAllKittens = function (res) {

    initKitten(function () {
        var silence = new Kitten({ name: 'Silence' });
        Kitten.find(function (err, kittens) {
            if (err)
                return console.error(err);
            var data = kittens;
            res.status(200).send(data);
        });
    }
    );
}

var initKitten = function (callback) {
    if (Kitten == undefined) {
        var mongoose = require('mongoose');
        mongoose.connect('mongodb://staffingplan:staffingplan@ds237409.mlab.com:37409/staffing-plan-db');
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function () {
            var kittySchema = mongoose.Schema({
                name: String
            });
            kittySchema.methods.speak = function () {
                var greeting = this.name
                    ? "Meow name is " + this.name
                    : "I don't have a name";
                console.log(greeting);
            };
            Kitten = mongoose.model('Kitten', kittySchema);
            callback();
        });
    } else {
        callback();
    }
}


module.exports = {
    getAllResources,
    addResource
}