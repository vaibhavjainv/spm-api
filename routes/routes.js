var resources = require("../model/resources.js");

var appRouter = function (app) {

    app.get("/api/resources/getall", function (req, res) {
        resources.getAllResources(res);
    });

    app.get("/api/resources/getdetails/:id", function (req, res) {
        resources.getResourceDetails(req, res);
    });

    app.post("/api/resources/add", function (req, res) {
        resources.addResource(req, res);
    });

    app.put("/api/resources/updateallocation", function (req, res) {
        resources.updateallocation(req, res);
    });
    
    app.put("/api/resources/removeallocation", function (req, res) {
        resources.removeallocation(req, res);
    });

    app.delete("/api/resources/delete/:id", function (req, res) {
        resources.deleteResource(req, res);
    });

    app.get("/api/assignments/getall", function (req, res) {
        resources.getAllAssignments(res);
    });

    app.options("*", function (req, res) {
        // Website you wish to allow to connect
        res.setHeader('Access-Control-Allow-Origin', '*');
        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        res.status(200).send("");
    });
}

module.exports = appRouter;