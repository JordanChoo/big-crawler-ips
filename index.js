// Pull in NPM Modules
const {BigQuery} = require('@google-cloud/bigquery');

// Pull in ENV variables
require('dotenv').config();
const bqProjectId = process.env.bqProjectId || null;
const bqDataset = process.env.bqDataset || null;
const bqTable = process.env.bqTable || null;
const gServiceAccount = JSON.parse(process.env.gServiceAccount || null);
const https = require('https');
const kgKey = process.env.kgKey || null;

// Create BQ obj
const bigQuery = new BigQuery({
    credentials: gServiceAccount,
    projectId: bqProjectId
});

module.exports = {

    main: async(req,res) => {
      // Check to see if it is a POST Req
      if(req.method != 'POST') return res.status(401).send('Not authorized');
      // Check for KgKey
      if(req.query.kgKey != kgKey) return res.status(401).send('Not authorized');
        
      const seBots = [
          {
              se: 'googleBot',
              url: 'https://developers.google.com/static/search/apis/ipranges/googlebot.json'
          },
          {
              se: 'bingBot',
              url: 'https://www.bing.com/toolbox/bingbot.json'
          }
      ]

      // Check to see if the table exists
      if(! await module.exports.checkBqTableExists()){
        // Create the table if it doesn't exist
        await module.exports.createBqTable();
      }

      // Get all of the existing IPs
      const existingIps = await module.exports.getExistingIps();
      // Create an empty missing IPs obj
      const missingIps = [];
      // Go through each of the seBots
      for (const seBot of seBots) {
          // Download the JSON from the URL
          let ips = await module.exports.gatherIps(seBot.url);
          // Go through each of the IP addresses
          for (let ip = 0; ip < ips.prefixes.length; ip++) {
            // Check whether it is an IP4 or IP6
            if(!!ips.prefixes[ip].ipv4Prefix){
              // Check to see if the IPv4 address is already in BQ
              if(!existingIps.some(el => el.ip === ips.prefixes[ip].ipv4Prefix.substring(0, ips.prefixes[ip].ipv4Prefix.indexOf('/')))){
                // Push the clean missing IPv4
                missingIps.push({
                  se: seBot.se,
                  ip: ips.prefixes[ip].ipv4Prefix.substring(0, ips.prefixes[ip].ipv4Prefix.indexOf('/'))
                });
              }
            } else {
              // Check to see if the IPv6 address is already in BQ
              if(!existingIps.some(el => el.ip === ips.prefixes[ip].ipv6Prefix.substring(0, ips.prefixes[ip].ipv6Prefix.indexOf('::/')))){
                // Push the clean missing IPv6
                missingIps.push({
                  se: seBot.se,
                  ip: ips.prefixes[ip].ipv6Prefix.substring(0, ips.prefixes[ip].ipv6Prefix.indexOf('::/'))
                });
              }
            }
          }
      }

      let message;
      // Check to see the missingIps legnth
      if(missingIps.length > 0){
        // If more than 0 push the rows to BQ
        let bqIpInsertResults = await bigQuery.dataset(bqDataset).table(bqTable).insert(missingIps);
        message = `${missingIps.length} additional IP addresses were found and added`
      } else {
        message = 'No new IP addresses found'
      }

      // Return 200 success
      console.log(message);
      return res.status(200).send(message);

    },

    checkBqTableExists: async() => {

      // Get the BQ table reference
      const dataset = bigQuery.dataset(bqDataset);

      // Attempt the check
      try {
        // Run the get request to see if there is a table
        await dataset.table(bqTable).get();
        // return true if table
        return true;
      } catch (e) {
        // return false if no table
        return false;
      }
    },

    createBqTable: async() => {

      // Set the schema for the table
      let schema = [
        {name: 'se', type: 'STRING'},
        {name: 'ip', type: 'STRING'},
      ];

      // Set the options
      let tableOptions = {
        schema: schema,
        location: 'us-central1',
      };

      // Return/run the BQ table creation
      return await bigQuery
      .dataset(bqDataset)
      .createTable(bqTable, tableOptions);

    },

    getExistingIps: async() => {
      // Construct the query
        let query = `
          SELECT
            se,
            ip
          FROM
          ${bqDataset}.${bqTable}
        `
      // Run the query as a job
      let [bqIpJob] = await bigQuery.createQueryJob({query:query});
      // Wait for the query to finish
      let [existingIps] = await bqIpJob.getQueryResults();
      // Return the rows
      return existingIps;
    },

    gatherIps: async(url) => {

      try {
        const response = await new Promise((resolve, reject) => {
          https.get(url, (res) => {
            resolve(res);
          }).on('error', (error) => {
            reject(error);
          });
        });
    
        let data = '';
    
        response.on('data', (chunk) => {
          data += chunk;
        });
    
        await new Promise((resolve) => {
          response.on('end', () => {
            resolve();
          });
        });
    
        const jsonObject = JSON.parse(data);
        return jsonObject;
      } catch (error) {
        console.error('Error:', error.message);
      }
    }
}