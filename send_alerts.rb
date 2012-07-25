require 'rubygems'  # not necessary for Ruby 1.9
require 'mongo'
require 'open-uri'
require 'json'

connection = Mongo::Connection.from_uri(ENV['OPENSHIFT_NOSQL_DB_URL'] + "gilt")
sms_script = ENV['OPENSHIFT_HOMEDIR'] + "/gilt/runtime/repo/sendmessage.sh"

db = connection.db("gilt")

products_coll = db.collection("products")
users_coll = db.collection("users")
matches_coll = db.collection("matches")


matches_coll.find.each do |match|
  puts "Working on : " + match["email"] 
  if match["alerted"] == true
    puts "User already alerted for : " + match["product"]
  else
    products = products_coll.find_one({"product" => match["product"]})
    users = users_coll.find_one({"email" => match["email"]} )
    message = "New Gilt product match: " + products["brand"] + " " + products["name"] + " " + products["url"]
    cmd = sms_script + " " + users["phone"] + " \"" + message + "\""
    puts "Runnning command: " + cmd
    result = %x[ #{cmd} ]
    match["alerted"] = true
    matches_coll.update({"_id" => match["_id"] }, match)
  end
end




