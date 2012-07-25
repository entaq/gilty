
var mongodb = require("mongodb"),
    mongoserver = new mongodb.Server("localhost",mongodb.Connection.DEFAULT_PORT),
    db_connector = new mongodb.Db("gilt", mongoserver);



var Db = require('mongodb').Db,
    
// Connect to the server
Db.connect(process.env.OPENSHIFT_NOSQL_DB_URL, function(err, db) {
  assert.equal(null, err);

  db.close();
});



var express = require('express');

var app = express.createServer();

app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
});

app.get('/mongos', function(req, res){
  //res.send('hello world');
  db_connector.open(function(err, db){
    db.collectionNames(function(err, collections){
        res.send(collections);
        console.log(collections); // ["blog.posts", "blog.system.indexes"]
        db_connector.close();
    });
  });
}); 

app.use("/views", express.static(__dirname + '/views'));

app.register('.html', require('ejs'));
//app.set('views', __dirname + '/../views');
app.set('view engine', 'html');


app.post('/', function(req, res) {
  console.log(req.body.user);
  //split string into array and re-assign. easier to query on a JS array than a CSV
  var array = req.body.user.interests.split(',');
  req.body.user.interests = array;
  //res.redirect('back'); 
  db_connector.open(function(err, db){

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
          db.collection("products").findOne({'product':doc.product},{}, function(newErr,prod){
            console.log(prod); 
            res.render('success.html', {message : prod});
            db_connector.close(); //be careful where we can close
          });  
        } else {
          res.render('success.html', {message : doc});
          db_connector.close(); //be careful where we can close
        }

          
      })
        
        

    /*
    db.collectionNames(function(err, collections){
        //res.send(collections);
          res.render('success.html', {
            message : collections
          });
        console.log(collections); 
        db_connector.close(); //be careful where we can close
    });
    */

  });
  
});

app.listen(3000);

/*
> db.users.insert({email:'arun.nagarajan@gmail.com',phone:'4435703003',interests:['candles','jeans','missoni']})

//categories not containing Home
> db.products.findOne({categories:{$ne: "Home"}})

> db.products.findOne({categories:"Women"})

*/

/*

curl -X POST 'https://api.twilio.com/2010-04-01/Accounts/ACd4e8e6872e581bf4cf560d37fb9059db/SMS/Messages.json' \
-d 'From=%2B12246773902' \
-d 'To=(516)+398-0727' \
-d 'Body=donkey' \
-u ACd4e8e6872e581bf4cf560d37fb9059db:6adbb278dd3dc96d6304d56b63fda75f
*/


