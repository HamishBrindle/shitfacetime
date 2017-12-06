const mongoose = require('mongoose');
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

// Get our Socket.io connection, and start the heartbeat.
var io = require('socket.io')(server);
io.set('heartbeat timeout', 4000);
io.set('heartbeat interval', 2000);

// Prepare Variables For Video Chat.
var queue = []; // list of sockets waiting for peers
var rooms = {}; // map socket.id => room
var peerids = {}; // map socket.id => name
var allUsers = {}; // map socket.id => socket

// Add connected users.
var connectedUsers = new Set();

// Find a peer to connect with for video chat.
var findPeerForLoneSocket = function(you) {
    if (queue.length > 0) {

        // Somebody is in queue, pair them!
        var them = queue.pop();

        // User from the queue is not an active user.
        if (connectedUsers.has(them.id) == false) {
            findPeerForLoneSocket(you);
            return;
        }

        // Create room name for new call.
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
    console.log('User Connected');
    connectedUsers.add(socket.id);

    // Wait for initial peer connection for video.
    socket.on('peerid', function(id) {
        console.log("Peerid: " + id);
        peerids[socket.id] = id;
        allUsers[socket.id] = socket;
        findPeerForLoneSocket(socket); // Check if is in queue.
    });

    // Emitted when a user needs a new call.
    socket.on('new call', function() {

        // Grab room.
        var room = String(rooms[socket.id]);

        // Leave the room.
        socket.leave(room);

        // Reset the rooms array.
        rooms[socket.id] = null; // Deletes the room from the user.

        // Find a new call to match with.
        findPeerForLoneSocket(socket); // Check if is in queue.
    });

    // When a socket disconnects.
    socket.on('disconnect', function() {
        // Display user disconnected, and remove socket from active user.
        console.log('User Disconnected.');

        // Deletes user from the connected users.
        connectedUsers.delete(socket.id);

        // Grab room.
        var room = String(rooms[socket.id]);

        // If user was in a room (Call)
        if (room != null) {
            socket.leave(room); // Remove current disconnected user.
            rooms[socket.id] = null; // Deletes the room from the user.
            peerids[socket.id] = null; // Remove PeerJS ID From List.

            // End active users call, and find them a new partner.
            socket.broadcast.to(room).emit('partner disconnected');
        }
    });

    /**
     * When the call has dropped due to one user disconnecting.
     *
     * @return void
     */
    socket.on('partner disconnected', function() {
        // Make them leave the room.
        var room = String(rooms[socket.id]);
        socket.leave(room); // Remove current disconnected user.
        rooms[socket.id] = null; // Deletes the room from the user.

        // Find a peer for the other user.
        findPeerForLoneSocket(allUsers[socket.id]);
    });
});
