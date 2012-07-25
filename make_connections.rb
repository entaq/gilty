require 'rubygems'  # not necessary for Ruby 1.9
require 'mongo'
require 'open-uri'
require 'json'

connection = Mongo::Connection.from_uri(ENV['OPENSHIFT_NOSQL_DB_URL'] + "gilt")

db = connection.db("gilt")
apikey = "37e6fc5959f018dbdd23d20d65d4197d"

url = 'https://api.gilt.com/v1/sales/active.json?apikey=' + apikey
buffer = open(url, "UserAgent" => "Ruby-Wget").read


sales_coll = db.collection("sales")
products_coll = db.collection("products")
users_coll = db.collection("users")
matches_colls = db.collection("matches")

users_coll.find.each do |user|
  puts "Working on : " + user['email']
  user['interests'].each do | interest |
    puts "Searching for interest: " + interest
    products = products_coll.find_one({"categories" => interest })
    if products != nil
      puts "Matched user's interest " + interest + " to " + products["name"]
      #products.each do | product |
      #  puts "Matched user's interest " + interest + " to " + product['name']
      #end
      matches = matches_colls.find_one({"email"=>user['email'], "product" => products['product']})
      if matches == nil
        doc = {"email" => user['email'], "product" => products['product'], "alerted" => false, "ts" => Time.new}
        puts "Creating match : " + doc.map{|k,v| "#{k}=#{v}"}.join('   ') 
        matches_colls.insert(doc)
      else
        if matches["product"] != products["product"]
          matches["product"] = products['product']
          matches["alerted"] =  false
          matches["ts"] = Time.new
          matches_colls.update({"_id" => matches["_id"] }, matches)
          puts "Match exists already, updating: " + matches.map{|k,v| "#{k}=#{v}"}.join('   ')
        else
          puts "Match exists and product is the same.  Doing nothing."
        end
      end
    end
  end
end




