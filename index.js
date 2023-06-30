// Pull in NPM Modules
const {BigQuery} = require('@google-cloud/bigquery');

// Pull in ENV variables
require('dotenv').config();
const bqProjectId = process.env.bqProjectId || null;
const bqDataset = process.env.bqDataset || null;
const bqTable = process.env.bqTable || null;
const gServiceAccount = JSON.parse(process.env.gServiceAccount || null);
const https = require('https');

// Create bigQuery Obj
if(!!gServiceAccount && !!bqProjectId) {
  const bigQuery = new BigQuery({
      credentials: gServiceAccount,
      projectId: bqProjectId
  });
} else {
  console.log('Missing BQ Credentials and Project ID')
}

module.exports = {

    main: async(req,res) => {
        
        const seBots = [
            {
                name: 'googleBot',
                url: 'https://developers.google.com/static/search/apis/ipranges/googlebot.json'
            },
            {
                name: 'bingBot',
                url: 'https://www.bing.com/toolbox/bingbot.json'
            }
        ]

        // Get all of the existing IPs
        const existingIps = await ExistingIps();

        // Go through each of the seBots
        for (const seBot of seBots) {
            // Download the JSON from the URL
            let ips = await module.exports.gatherIps(seBot.url);
            // Loop through each item in the JSON
                // Check to see if the IP address exists in the existingIps
                // If not add it to missingIps
        }

        // Check to see the missingIps legnth
            // If more than 0 push the rows to BQ

    },

    getExistingIps: async(req,res) => {

    },

    gatherIps: async(url) => {

        // Run an HTTP req to the IP JSON file
        https.get(url, (response) => {
            let data = '';
          
            response.on('data', (chunk) => {
              data += chunk;
            });
          
            response.on('end', () => {
              try {
                
                let ipsJson = JSON.parse(data);
                console.log(ipsJson);
                return ipsJson

              } catch (error) {
                // Console log and return error
                console.error('Error parsing JSON:', error.message);
                return error;

              }
            });
          }).on('error', (error) => {
            // Console log and return error
            console.error('Error retrieving JSON:', error.message);
            return error;
          });
    },

    saveIps: async(req, res) => {

    }
}