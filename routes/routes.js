var resources = require("../model/resources.js");

var appRouter = function (app) {

    app.get("/api/getallresources", function (req, res) {
        resources.getAllResources(res);
    });
    
    app.post("/api/addresource", function (req, res) {
        resources.addResource(req, res);
    });

    app.put("/api/updateresource/:id", function (req, res) {
        console.log(req.params.id);
        res.status(200).send();
    });
}

module.exports = appRouter;