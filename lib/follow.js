module.export = function Follow (server) {
  return function (feedId, cb = console.log) {
    // TODO isFeed or a Schema
    const follow = {
      type: 'contact',
      contact: feedId,
      following: true
    }

    server.publish(follow, (err, msg) => {
      if (err) return cb(err)

      cb(null, msg)
    })
  }
}
