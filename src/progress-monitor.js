/**
 * Dispatch Progress.
 *
 * @description Posts progress to client.
 * @param {Object} client
 * @param {number} loaded
 * @param {number} total
 */
const dispatchProgress = (client, loaded, total) => {
  client.postMessage({ loaded, total })
}

/**
 * Respond With Progress Monitor.
 *
 * @description Reads progress from fetch stream.
 * @param {string} clientId - UUID.
 * @param {Response} response
 * @returns {Response} Response.
 */
module.exports = (clientId, response, debug = false) => {
  if (!response.body) {
    console.warn(
      'ReadableStream is not yet supported in this browser.  See https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream'
    )
    return response
  } else if (!response.ok) {
    // HTTP error code response
    return response
  }
  const contentLength = response.headers.get('content-length')
  if (contentLength == null) {
    // don't track download progress if we can't compare against a total size
    console.warn(
      'No Content-Length no header in response.  See https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#Access-Control-Expose-Headers'
    )
    return response
  }
  let loaded = 0
  let debugReadIterations = 0 // direct correlation to server's response buffer size
  const total = parseInt(contentLength, 10)
  const reader = response.body.getReader()

  return new Response(
    new ReadableStream({
      start(controller) {
        // get client to post message. Awaiting resolution first read() progress
        // is sent for progress indicator accuracy
        let client

        function read() {
          debugReadIterations++
          reader
            .read()
            .then(({ done, value }) => {
              if (done) {
                controller.close()
                return
              } else if (debug) {
                console.info(`read() ${debugReadIterations}`)
              }
              controller.enqueue(value)
              loaded += value.byteLength
              dispatchProgress(client, loaded, total)
              read()
            })
            .catch(error => {
              // error only typically occurs if network fails mid-download
              console.error('error in read()', error)
              controller.error(error)
            })
        }
        clients.get(clientId).then(c => {
          client = c
          read()
        })
      },
      // Firefox excutes this on page stop, Chrome does not
      cancel(reason) {
        console.log('cancel()', reason)
      }
    })
  )
}
