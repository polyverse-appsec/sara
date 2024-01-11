#!/bin/bash

# The URL to send the request to
URL="http://localhost:3000"

# Perform the curl request and do not follow redirects, so we can capture the status code
HTTP_STATUS=$(curl -s -o /dev/null -w '%{http_code}' --max-redirs 0 $URL)

# The expected redirect status code is 307
EXPECTED_STATUS=307

# Check if the status code matches the expected redirect status
if [ "$HTTP_STATUS" -eq $EXPECTED_STATUS ]; then
  echo "Success: Response is a 307 Temporary Redirect."
else
  echo "Error: Response is not a 307 Temporary Redirect. Status code is $HTTP_STATUS."
fi
