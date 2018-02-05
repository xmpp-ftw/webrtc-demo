var Jingle = require('jingle')
  , attachMediaStream = require('attachmediastream')

var socket = new Primus('https://xmpp-ftw.herokuapp.com')
var jingle = new Jingle()

var loginInfo = document.getElementById('loginInfo')
var localStarted = false

loginInfo.onsubmit = function (e) {
  if (e.preventDefault) e.preventDefault()

  var jid = document.getElementById('jid').value
  var username = jid.slice(0, jid.indexOf('@'))

  console.log('Connected')
  socket.send(
    'xmpp.login', {
        jid: jid,
        password: document.getElementById('password').value,
        host: document.getElementById('host').value,
        resource: document.getElementById('resource').value || 'jingle-rocks'
    }
  )
  socket.on('xmpp.connection', function(data) {
    console.log('connected', data)
    socket.send('xmpp.presence', {})
    document.getElementById('myJID').textContent = data.jid.user +
        '@' + data.jid.domain + '/' + data.jid.resource
  })

  jingle.on('incoming', function (session) {
    console.log('incoming session', session)
    session.accept()
  })
  jingle.on('peerStreamAdded', function(session) {
    console.log('peerStreamAdded', session)
   attachMediaStream(session.stream, document.getElementById('remoteVideo'))
  })
  jingle.on('localStream', function (stream) {
    if (false === localStarted) {
      attachMediaStream(stream, document.getElementById('localVideo'), { muted: true, mirror: true })
      localStarted = true
    }
  })
  jingle.on('send', function(data) {
    if (data.jingle && (data.jingle.action == 'session-accept')) {
      console.debug('sending', data)
      window.jingleAccept = data
    }
    socket.send('xmpp.jingle.request', data, function(error, success) {
      if (error) return console.error('Failed', error)
      console.log(data.jingle.action + ' ack', success)
    })
  })

  var callInfo = document.getElementById('callInfo')
  callInfo.onsubmit = function (e) {
    e.preventDefault()
    var jid = document.getElementById('peer').value
    jingle.startLocalMedia(null, function (error, stream) {
      localStarted = true
      var sess = jingle.createMediaSession(jid)
      sess.start()
      console.log('Calling ' + jid)
    })
    return false
  }
  return false
}

socket.on('xmpp.error.client', function(error) {
  console.error(error)
})

jingle.startLocalMedia(null, function (error, stream) {
  if (error) return console.error(error)
  attachMediaStream(stream, document.getElementById('localVideo'), { muted: true, mirror: true })
  localStarted = true
})

socket.on('xmpp.jingle.request', function(data) {
  if (false === localStarted) {
    jingle.startLocalMedia(null, function (error, stream) {
      if (error) return console.error(error)
      attachMediaStream(stream, document.getElementById('localVideo'), { muted: true, mirror: true })
    })
    localStarted = true
  }
  jingle.process(data)
})
