#!/bin/env node
//  OpenShift sample Node application

var express = require('express');
var fs      = require('fs');

//  Local cache for static content [fixed and loaded at startup]
var zcache = { 'index.html': '' };
zcache['index.html'] = fs.readFileSync('./index.html'); //  Cache index.html

// Create "express" server.
var app  = express.createServer();

app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
});


var mongodb = require("mongodb"),
    mongoserver = new mongodb.Server(process.env.OPENSHIFT_NOSQL_DB_HOST,process.env.OPENSHIFT_NOSQL_DB_PORT),
    db_connector = new mongodb.Db("gilt", mongoserver);

console.log('connected'); 
        

var Db = require('mongodb').Db;


app.get('/mongos', function(req, res){
  Db.connect(process.env.OPENSHIFT_NOSQL_DB_URL+ "gilt", function(err, db) {
    db.collectionNames(function(err, collections){
          res.send(collections);
          console.log(collections); 
          db.close();
      });
  });
}); 



app.use("/views", express.static(__dirname + '/views'));

app.register('.html', require('ejs'));
//app.set('views', __dirname + '/../views');
app.set('view engine', 'html');

/******/

app.post('/', function(req, res) {
  console.log(req.body.user);
  //split string into array and re-assign. easier to query on a JS array than a CSV
  var array = req.body.user.interests.split(',');
  req.body.user.interests = array;
  //res.redirect('back'); 
  Db.connect(process.env.OPENSHIFT_NOSQL_DB_URL+ "gilt", function(err, db) {

    var users = db.collection("users");
    
    //dont blindly insert
    //users.insert(req.body.user);

    users.findAndModify({email:req.body.user.email}, [['email', 1]], 
                      req.body.user, {upsert:true}, 
                      function(err, doc) {
       
                      }
    );

    var matches = db.collection("matches");

    matches.findOne({email:req.body.user.email}, {}, function(err, doc) {
        console.log(doc); 
        if(doc){
          console.log(doc.product); 
          db.collection("products").findOne({'product':doc.product},{"sort": [['ts','desc']]}, function(newErr,prod){
            console.log(prod); 
            res.render('success.html', {message : prod});
            db_connector.close(); //be careful where we can close
          });  
        } else {
          res.render('success.html', {message : doc});
          db_connector.close(); //be careful where we can close
        }

          
      })
  });
});

/******/

/*  =====================================================================  */
/*  Setup route handlers.  */
/*  =====================================================================  */



// Handler for GET /health
app.get('/health', function(req, res){
    res.send('1');
});

// Handler for GET /asciimo
app.get('/asciimo', function(req, res){
    var link="https://a248.e.akamai.net/assets.github.com/img/d84f00f173afcf3bc81b4fad855e39838b23d8ff/687474703a2f2f696d6775722e636f6d2f6b6d626a422e706e67";
    res.send("<html><body><img src='" + link + "'></body></html>");
});

// Handler for GET /
app.get('/', function(req, res){
    res.redirect('/views/login.html');
});


//  Get the environment variables we need.
var ipaddr  = process.env.OPENSHIFT_INTERNAL_IP;
var port    = process.env.OPENSHIFT_INTERNAL_PORT || 8080;

if (typeof ipaddr === "undefined") {
   console.warn('No OPENSHIFT_INTERNAL_IP environment variable');
}

//  terminator === the termination handler.
function terminator(sig) {
   if (typeof sig === "string") {
      console.log('%s: Received %s - terminating Node server ...',
                  Date(Date.now()), sig);
      process.exit(1);
   }
   console.log('%s: Node server stopped.', Date(Date.now()) );
}

//  Process on exit and signals.
process.on('exit', function() { terminator(); });

['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS',
 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGPIPE', 'SIGTERM'
].forEach(function(element, index, array) {
    process.on(element, function() { terminator(element); });
});

//  And start the app on that interface (and port).
app.listen(port, ipaddr, function() {
   console.log('%s: Node server started on %s:%d ...', Date(Date.now() ),
               ipaddr, port);
});

