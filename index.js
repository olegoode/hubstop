import { get } from 'https';
import { writeFile } from 'fs';
import jsontoxml from 'jsontoxml';

//define API key, Blog GUID, and # of posts
const API_KEY = 'API_KEY';
const GUID = 'BLOG_GUID';
const HUBSPOT_URL = 'http://blog.example.com/';
const WP_URL = 'http://example.com/';
const LIMIT = 100;

// accepts a callback to make use of the received data
let performRequest = (success) => {

  let getURL = `https://api.hubapi.com/content/api/v2/blog-posts?hapikey=${API_KEY}&content_group_id=${GUID}&limit=${LIMIT}`;

  get(getURL, (res) => {
    const statusCode = res.statusCode;
    let error;

    if (statusCode !== 200) {
      error = new Error(`Request failed. Status code: ${statusCode}`);
      console.log(error.message);
      res.resume();
      return;
    }

    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      let parsedData = JSON.parse(data);
      success(parsedData);
    });
  })
}

let handleResponse = (response) => {
  let formattedResponse = {
    "channel": [] // The default container element for RSS items
  };
  let fixURL = (str) => {
    return str.replace(HUBSPOT_URL,
      WP_URL)
  };
  let getUTCDate = (time) => {
    return new Date(time).toUTCString();
  };
  response.objects.map(function (o) {
    formattedResponse.channel.push(
      {
        "item": {
          "title": o.name,
          "link": fixURL(o.url),
          "pubDate": getUTCDate(o.publish_date),
          "content:encoded": o.post_body,
          "category": "Hubspot Import"
        }
      }
    )
  });
  
  // Based.
  let xml = jsontoxml(formattedResponse, true);

  writeFile('./feed.xml', xml, (error) => {
    if (error) {
      return console.log(error);
    } else {
      console.log('XML file saved');
    }
  })
}

performRequest(handleResponse);