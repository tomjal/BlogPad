var Couchbase = require("couchbase");
var Express = require("express");
var UUID = require("uuid");
var BodyParser = require("body-parser");
var Bcrypt = require("bcryptjs");

var app = Express();
var N1qlQuery = Couchbase.N1qlQuery;

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

var cluster = new Couchbase.Cluster("couchbase://localhost");
var bucket = cluster.openBucket("default", "");
var server = app.listen(3000, () => {
    console.log("Listening on port " + server.address().port + "...");
});

var validate = function (request, response, next) {
    var authHeader = request.headers["authorization"];
    if (authHeader) {
        bearerToken = authHeader.split(" ");
        if (bearerToken.length == 2) {
            bucket.get(bearerToken[1], (error, result) => {
                if (error) {
                    return response.status(401).send({ "message": "Invalid session token" });
                }
                request.pid = result.value.pid;
                bucket.touch(bearerToken[1], 3600, (error, result) => { });
                next();
            });
        } else {
            response.status(401).send({ "message": "An authorization header is required" });
        }
    } else {
        response.status(401).send({ "message": "An authorization header is required" });
    }
};

app.get("/account", validate, (request, response) => {
    bucket.get(request.pid, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        response.send(result.value);
    });
});

app.post("/account", (request, response) => {
    if (!request.body.email) {
        return response.status(401).send({ "message": "An `email` is required" });
    } else if (!request.body.password) {
        return response.status(401).send({ "message": "A `password` is required" });
    }
    var id = UUID.v4();
    var account = {
        "type": "account",
        "pid": id,
        "email": request.body.email,
        "password": Bcrypt.hashSync(request.body.password, 10)
    };
    var profile = request.body;
    profile.type = "profile";
    delete profile.password;
    bucket.insert(id, profile, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        bucket.insert(request.body.email, account, (error, result) => {
            if (error) {
                bucket.remove(id);
                return response.status(500).send(error);
            }
            response.send(result);
        });
    });
});

app.post("/login", (request, response) => {
    if (!request.body.email) {
        return response.status(401).send({ "message": "An `email` is required" });
    } else if (!request.body.password) {
        return response.status(401).send({ "message": "A `password` is required" });
    }
    bucket.get(request.body.email, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (!Bcrypt.compareSync(request.body.password, result.value.password)) {
            return response.status(500).send({ "message": "The password is invalid" });
        }
        var session = {
            "type": "session",
            "id": UUID.v4(),
            "pid": result.value.pid
        };
        bucket.insert(session.id, session, { "expiry": 3600 }, (error, result) => {
            if (error) {
                return response.status(500).send(error);
            }
            response.send({ "sid": session.id });
        });
    });
});

app.post("/blog", validate, (request, response) => {
    if (!request.body.title) {
        return response.status(401).send({ "message": "A `title` is required" });
    } else if (!request.body.content) {
        return response.status(401).send({ "message": "A `content` is required" });
    }
    var blog = {
        "type": "blog",
        "pid": request.pid,
        "title": request.body.title,
        "content": request.body.content,
        "timestamp": (new Date()).getTime()
    };
    bucket.insert(UUID.v4(), blog, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        response.send(blog);
    });
});

app.get("/blogs", validate, (request, response) => {
    console.log(request.pid);
    var query = N1qlQuery.fromString("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "` WHERE type = 'blog' AND pid = $pid");
    bucket.query(query, { "pid": request.pid }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});