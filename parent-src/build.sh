#!/bin/sh
# Builds the JDAC Parent page (main link) from these source files
cd "$(dirname "$0")"
cat head3.html core.js ui3.js hr.js contacts.js v4.js emp.js slip.js contacts2.js hike.js leave.js late.js pro.js camp.js metad.js meta.js live.js > ../web/public/parent/index.html
echo '</script></body></html>' >> ../web/public/parent/index.html
