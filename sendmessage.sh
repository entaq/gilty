#!/bin/sh
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/ACd4e8e6872e581bf4cf560d37fb9059db/SMS/Messages.json" \
-d "From=%2B12246773902" \
-d "To=$1" \
-d "Body=$2" \
-u ACd4e8e6872e581bf4cf560d37fb9059db:6adbb278dd3dc96d6304d56b63fda75f
