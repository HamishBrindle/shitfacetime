const express = require('express');
const mustacheExpress = require('mustache-express');
const bodyParser = require('body-parser');
const ExpressPeerServer = require('peer').ExpressPeerServer;
const path = require('path')
const http = require('http');
const https = require('https');
const fs = require('fs');

// Certificate keys
var privateKey  = fs.readFileSync('server.key', 'utf8');
var certificate = fs.readFileSync('server.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};

// Create express app instance.
const app = express();

// Setup certificate options.
var options = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.crt'),
    requestCert: false,
    rejectUnauthorized: false
};

// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 4444;

// Connect to server option.
var server = https.createServer(options, app).listen(port, function() {
    console.log('Node app is running on port ' + port);
});

// Create new socket instance using the https server.
var io = require('socket.io')(server);

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

// Handle All Routes
app.get('/', function(req, res) {
    res.render('home');
});
