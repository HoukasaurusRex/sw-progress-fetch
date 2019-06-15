# SW Progress Monitor

[![NPM Total Downloads](https://img.shields.io/npm/dt/sw-progress-fetch.svg)](https://www.npmjs.com/package/sw-progress-fetch)
[![David Dependencies Status](https://david-dm.org/pterobyte/sw-progress-fetch.svg)](https://david-dm.org/pterobyte/sw-progress-fetch)
[![devDependencies Status](https://david-dm.org/pterobyte/sw-progress-fetch/dev-status.svg)](https://david-dm.org/pterobyte/sw-progress-fetch?type=dev)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/Pterobyte/sw-progress-fetch.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/Pterobyte/sw-progress-fetch/context:javascript)
[![prs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/pterobyte/sw-progress-fetch/master)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Dispatches fetch event progress as a 'message' event to a Service Worker.

**NOTE:** Fetches response while pushing progress monitor to client opaque request responses won't give us access to Content-Length and Response.body.getReader(), which are required for calculating download progress.  

**NOTE:** Respond with a newly-constructed Request from the original Request that will give us access to those. See [What Limitations Apply to Opaque Responses](https://stackoverflow.com/questions/39109789/what-limitations-apply-to-opaque-responses)

**NOTE:** 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'.

## Examples

`service-worker.js`

```js
const swProgressMonitor = require('sw-progress-monitor')

const fetchWithProgressMonitor = (event) => {
  const request = new Request(event.request.clone(), {
    mode: 'cors', // Make sure all origins are whitelisted in resource's CORS policy
    credentials: 'omit'
  })
  return fetch(request).then(response =>
    swProgressMonitor(event.clientId, response.clone())
  )
}

self.addEventListener('fetch', (event) => {
  event.respondWith(fetchWithProgressMonitor(event));

  // ...
})
```

`main.js`

```js
navigator.serviceWorker.addEventListener('message', (event) => {
  const { data } = event
  const percentNum = Math.round(data.loaded / data.total * 100)
  const percent = `${percentNum}%`
  console.log(`${percent} loaded`)
})
```
