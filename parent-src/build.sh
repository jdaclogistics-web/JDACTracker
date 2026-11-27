#!/bin/sh
# Builds the JDAC Parent page (main link) from these source files
cd "$(dirname "$0")"
cat head3.html core.js ui3.js hr.js contacts.js v4.js emp.js slip.js contacts2.js hike.js leave.js late.js pro.js camp.js metad.js meta.js gmeet.js split.js mwidget.js xlsxr.js audit.js live.js zen.js taskui.js setup.js comms.js wallet.js ui5.js jdw.js comms2.js comms3.js codash.js copanel.js bday.js misc2.js cobrand.js access.js mysal.js studio.js crmnav.js mepage.js workacc.js logseg.js hrui.js mobile.js mchat.js mcompact.js mmail2.js msocial.js mfix.js mcrm.js mtask2.js forms2.js mtask3.js mwa.js mfile.js mscore2.js mrole.js mtime.js madsd.js mads.js > ../web/public/parent/index.html
echo '</script></body></html>' >> ../web/public/parent/index.html

