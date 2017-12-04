const mongoose = require('mongoose');
const socketIO = require('socket.io');
const http = require('http');
const https = require('https');
const fs = require('fs');

// import environmental variables from our variables.env file
require('dotenv').config({
    path: 'variables.env'
});

// Connect to our Database and handle any bad connections
mongoose.connect(process.env.DATABASE);
mongoose.Promise = global.Promise; // Tell Mongoose to use ES6 promises
mongoose.connection.on('error', (err) => {
    console.error(`🙅 🚫 🙅 🚫 🙅 🚫 🙅 🚫 → ${err.message}`);
});

// Start our app!
const app = require('./app');

// Check what environment is being used (development || production)
const environment = process.env.NODE_ENV;

// TODO: Anyway we can make this const and still do a check for environment?
var server;

// Set our port to that of the servers or 3000
app.set('port', process.env.PORT || 3000);

// Because we need https to run socket and peerjs, but server and local
// development require different setup, we decide here.
if (environment === 'production') {
    // Using the LIVE server
    server = app.listen(app.get('port'), () => {
        console.log(`Express running → PORT ${server.address().port}`);
    });
} else {
    // Using LOCAL server (Port will be 4444)
    // Certificate keys
    var privateKey = fs.readFileSync('server.key', 'utf8');
    var certificate = fs.readFileSync('server.crt', 'utf8');
    var credentials = {
        key: privateKey,
        cert: certificate
    };

    // Setup certificate options.
    var options = {
        key: fs.readFileSync('server.key'),
        cert: fs.readFileSync('server.crt'),
        requestCert: false,
        rejectUnauthorized: false
    };
    server = https.createServer(options, app).listen(4444, function() {
        console.log(`Express running → PORT ${server.address().port}`);
    });
}

// Get our Socket.io connection
const io = socketIO(server);

// Prepare Variables For Video Chat.
var queue = []; // list of sockets waiting for peers
var rooms = {}; // map socket.id => room
var peerids = {}; // map socket.id => name
var allUsers = {}; // map socket.id => socket

// Find a peer to connect with for video chat.
var findPeerForLoneSocket = function(you) {
    // this is place for possibly some extensive logic
    // which can involve preventing two people pairing multiple times
    if (queue.length > 0) {
        // Somebody is in queue, pair them!
        var them = queue.pop();
        var room = you.id + '#' + them.id;

        // Join them both
        them.join(room);
        you.join(room);

        // Register rooms to their names
        rooms[them.id] = room;
        rooms[you.id] = room;

        // Exchange names between the two of them and start the chat
        them.emit('call start', {
            'peer': peerids[you.id],
            'room': room,
            'caller': 'this'
        });
        you.emit('call start', {
            'peer': peerids[them.id],
            'room': room
        });
    } else {
        queue.push(you); // Queue is empty, add our lone socket.
    }
}

// On connection for socket.
io.on('connection', function(socket) {

    // User is connected
    console.log('User Connected');

    // Wait for initial peer connection for video (other user to join).
    socket.on('peerid', function(id) {
        console.log("Peerid: " + id);
        peerids[socket.id] = id;
        allUsers[socket.id] = socket;
        findPeerForLoneSocket(socket); // Check if is in queue.
    });

    // When a socket disconnects.
    socket.on('disconnect', function() {
        console.log('User Disconnected.');
    });
});
