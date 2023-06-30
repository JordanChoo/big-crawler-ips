# Big Crawler IPs 🕷️
Welcome to Big Crawler IPs! This is a serverless function that routinely checks both Google and Bing's list of official crawler IP addresses and saves them into a BigQuery table.

## Deployment Guide
[Watch the step by step deployment guide here](https://jordanchoo.com/blog/how-to-save-googlebot-bingbot-ip-addresses-to-bigquery/).

### Environment Variables
When deploying Big Crawler IPs your Cloud Function needs the following environment variables:
- `bqProjectId`: Your Google Cloud Project's ID
- `bqDataset`: The name of your BigQuery dataset 
- `bqTable`: The name of your table in BigQuery
- `gServiceAccount`: Your Google Cloud Service Account 
- `kgKey`: A unique identifier to "authenticate" incoming HTTP requests

## How It Works
Once the function is deployed as a Google Cloud Function that is triggered via cron job HTTP request, the function then:
1. Checks to make sure that your table exists and if it doesn't create one
2. Gathers all of the existing IPs from your BigQuery table
3. Scrapes the offical GoogleBot and BingBot IP address files
4. Cross references the pre-existing IPs in BigQuery and the official scrapped IPs
5. Saves the IPs that were found on the official list but, not in BigQuery