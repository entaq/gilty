require 'rubygems'  # not necessary for Ruby 1.9
require 'mongo'
require 'open-uri'
require 'json'



connection = Mongo::Connection.from_uri(ENV['OPENSHIFT_NOSQL_DB_URL'] + "gilt")

db = connection.db("gilt")
apikey = "37e6fc5959f018dbdd23d20d65d4197d"

url = 'https://api.gilt.com/v1/sales/active.json?apikey=' + apikey
buffer = open(url, "UserAgent" => "Ruby-Wget").read


coll = db.collection("sales")
coll.drop
coll = db.collection("products");
coll.drop

sales_coll = db.collection("sales")
products_coll = db.collection("products")

# convert JSON data into a hash
result = JSON.parse(buffer)

sales = result['sales']
sales.each do |sale|
  puts "Parsing sale: " + sale['name']
  id = sales_coll.insert(sale)
  products = sale['products']
  products.each do |product|
  	url = product + "?apikey=" + apikey
  	product_buffer = open(url, "UserAgent" => "Ruby-Wget").read
  	product_result = JSON.parse(product_buffer)
  	puts "\tParsed product: " + product_result['name']
  	id = products_coll.insert(product_result)
  	sleep(0.5)
  end
end


