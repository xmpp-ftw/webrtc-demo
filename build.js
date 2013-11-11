var browserify = require('browserify')
  , UglifyJS = require('uglify-js')
  , fs = require('fs')

var bundle = browserify()
bundle.add('./main')

var options = {}
var debug = (-1 !== process.argv.indexOf('-d'))
if (true === debug) options.debug = true

bundle.bundle(options, function (err, js) {
    if (err) console.log(err)

    var result
    if (true === debug) 
      result = js
    else
      result = UglifyJS.minify(js, { fromString: true }).code

    fs.writeFileSync('webrtc.bundle.js', result)
})
