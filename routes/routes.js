var resources = require("../model/resources.js");

var appRouter = function (app) {

    app.get("/api/resources/getall", function (req, res) {
        resources.getAllResources(res);
    });

    app.post("/api/resources/add", function (req, res) {
        resources.addResource(req, res);
    });

    app.put("/api/resources/updateallocation", function (req, res) {
        resources.updateallocation(req, res);
    });

    app.delete("/api/resources/delete/:id", function (req, res) {
        resources.deleteResource(req, res);
    });
}

module.exports = appRouter;