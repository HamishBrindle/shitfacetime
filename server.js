const express = require('express');
const mustacheExpress = require('mustache-express');
const bodyParser = require('body-parser');
const ExpressPeerServer = require('peer').ExpressPeerServer;
const path = require('path')
const fs = require('fs');

// Create express app instance.
const app = express();

// Http server from app
var server = require('http').Server(app);

// Create new socket instance using the https server.
var io = require('socket.io')(server);

// Set the app's port to whoever is running it (or 5000)
app.set('port', (process.env.PORT || 5001));

// Prepare Variables For Video Chat.
var queue = [];    // list of sockets waiting for peers
var rooms = {};    // map socket.id => room
var peerids = {};    // map socket.id => name
var allUsers = {}; // map socket.id => socket

// Find a peer to connect with for video chat.
var findPeerForLoneSocket = function(you) {
    // this is place for possibly some extensive logic
    // which can involve preventing two people pairing multiple times
    if (queue.length > 0)
    {
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
        them.emit('call start', {'peer': peerids[you.id], 'room' : room, 'caller':'this'});
        you.emit('call start', {'peer': peerids[them.id], 'room' : room});
    }
    else
    {
        queue.push(you); // Queue is empty, add our lone socket.
    }
}

// On connection for socket.
io.on('connection', function(socket) {
    console.log('User Connected');

    // Wait for initial peer connection for video.
    socket.on('peerid', function(id) {
        console.log("Peerid: " + id);
        peerids[socket.id] = id;
        allUsers[socket.id] = socket;
        findPeerForLoneSocket(socket); // Check if is in queue.
    });

    // When a socket disconnects.
    socket.on('disconnect', function() {
        console.log('User Disconnected.');

        /*
        var room = rooms[socket.id];
        var peerID = room.split('#');
        peerID = peerID[0] === socket.id ? peerID[1] : peerID[0];
        // Current socket left, add the other one to the queue
        findPeerForLoneSocket(allUsers[peerID]);
        */
    });
});

// Register '.mustache' extension with The Mustache Express
app.engine('mustache', mustacheExpress());

// View engine setup
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/node_modules'));

// Takes the raw requests and turns them into usable properties on req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For avoidong Heroku $PORT error
app.get('/', function(request, response) {
    response.render('home');
}).listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
});
