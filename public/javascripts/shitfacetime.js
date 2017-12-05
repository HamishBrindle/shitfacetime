import '../sass/style.scss';

// Compatibility shim
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

// General Variables
const APP_NAME = 'SFT';
var room = '';
var socketConnected = false;
var peerConnected = false;
var peerid = '';
var peerSettings = {　
    host: 'sft-peer.herokuapp.com',
    secure: true,
    port: 443,
    debug: 3,
    config: {'iceServers': [
        {
            url: "stun:global.stun.twilio.com:3478?transport=udp"
        },
        {
            url: "turn:global.turn.twilio.com:3478?transport=udp",
            username: "d44a3662a61e115cf3df7254d44d6b276d90300d065a1560a1618fa49bbdd5f3",
            credential: "0JZh27bgCb3oM0EmXKkctvuQT6S5qIJJthvUxho20r8="
        },
        {
            url: "turn:global.turn.twilio.com:3478?transport=tcp",
            username: "d44a3662a61e115cf3df7254d44d6b276d90300d065a1560a1618fa49bbdd5f3",
            credential: "0JZh27bgCb3oM0EmXKkctvuQT6S5qIJJthvUxho20r8="
        },
        {
            url: "turn:global.turn.twilio.com:443?transport=tcp",
            username: "d44a3662a61e115cf3df7254d44d6b276d90300d065a1560a1618fa49bbdd5f3",
            credential: "0JZh27bgCb3oM0EmXKkctvuQT6S5qIJJthvUxho20r8="
        }
    ]}
};

// Create PeerJS and Socket connections.
const socket = io();
const peerjs = new Peer(peerSettings);

/**
* PeerJS: On Connection.
*
* @param  socket - Clients Socket Object.
* @return void
*/
peerjs.on('open', function() {
    consoleMessage('Peerjs Connected'); // Connected message.
    peerjsConnectedUI(); // Display peerjs connected.
    peerConnected = true; // Connection has been made.
    findPeer(); // Find peer to call.
});

/**
* PeerJS: When a user is recieving a call.
*
* @param call - Recieving call.
* @return void
*/
peerjs.on('call', function(call) {

    // End any current calls.
    hangupCall();

    // Answer the call.
    call.answer(window.localStream);

    //
    makeCall(call);
});

/**
* Emitted when the peer is disconnected from the signalling server.
*
* @return void
*/
peerjs.on('disconnected', function() {
    // Attempt to reconnect if peerjs isn't destroyed.
    if (peerjs.destroyed == false) {
        peerjs.reconnect();
        console.log(peerjs.id);
    }
});

/**
 * PeerJS: Display any errors within the call.
 *
 * @param err - Errors with call.
 * @return void
 */
peerjs.on('error', function(err) {
    // Display Call In Progress
    callConnectedUI(false, 'Calling Failed.');

    // Display errors.
    console.log(err.message);

    // Destroy peer now that it is useless.
    peerjs.destroy();
});

/**
 * Socket.IO: On Connection.
 *
 * @param  socket - Clients Socket Object.
 * @return void
 */
socket.on('connect', function (socket) {
    consoleMessage('Socket Connected'); // Connected message.
    socketConnectedUI(); // UI display for connected.
    socketConnected = true; // Connection has been made.
    findPeer(); // Find peer to call.
});

/**
* Socket.IO: Matched with a peer, and call has started.
*
* @return void
*/
socket.on('call start', function(data) {
    // Save the room name.
    room = data.room;

    // For testing, print all collected data.
    console.log("Starting New Video Call.");
    console.log("Room: " + data.room);
    console.log("Peer ID: " + data.peer);

    // End any calls.
    hangupCall();

    // Ensure only one person starts the call.
    if (data.caller == 'this')
    {
        // Call given the matched up peer id.
        var call = peerjs.call(data.peer, window.localStream);
        makeCall(call);
    }
});

/**
* Socket.IO: Emitted when a
*
* @return void
*/
socket.on('partner disconnected', function(data) {
    // Reset the room name.
    room = '';

    // End any calls.
    hangupCall();

    // Setup the UI.
    callConnectedUI(false, 'Not in call.');
    $('#their-id').text('Not in call.');

    // Emitted to remove server side info, and find new peer.
    socket.emit('partner disconnected');
});

/**
* Socket.IO: When disconnect of the call has occurred.
*
* @return void
*/
socket.on('disconnect', function() {
    console.log('Connection fell or your browser is closing.');
});

/**
* Socket.IO: Helper function to toggle the UI when socket.io is connected.
*
* @return void
*/
function socketConnectedUI() {
    $('#socket-connected').addClass('badge-success').removeClass('badge-danger');
    $('#socket-connected').text('Connected');
    $('#socket-id').text(socket.id);
}

/**
* PeerJS: Helper function to toggle the UI when peerjs is connected.
*
* @uses PeerJS
* @return void
*/
function peerjsConnectedUI() {
    // UI: Peerjs connection status.
    $('#peerjs-connected').addClass('badge-success').removeClass('badge-danger');
    $('#peerjs-connected').text('Connected');
    $('#my-peerjs-id').text(peerjs.id);
}

/**
* Helper function to display call connected/not connected.
*
* @return void
*/
function callConnectedUI(status, message) {
    // Class names.
    var to = 'success';
    var from = 'dark';

    // Check status
    if (status != true) {
        to = 'dark';
        from = 'success';
    }

    // UI: Peerjs connection status.
    $('#call-connected').addClass('badge-' + to).removeClass('badge-' + from);
    $('#call-connected').text(message);
}

/**
* Helper function to display console messages.
*
* @return void
*/
function consoleMessage(message = '') {
    console.log(APP_NAME + ':\t' + message);
}

/**
* Find a peer to call with.
*
* @return void
*/
function findPeer() {

    // Display message.
    callConnectedUI(false, 'Finding Call.');

    // Hang up on an existing call if present
    hangupCall();

    // Ensure services are connected.
    if (socketConnected && peerConnected) {
        // Send peerid and find call partner.
        socket.emit('peerid', peerjs.id);
    }
}

/**
* Setup call information.
*
* @return void
*/
function setupCall() {
    // Get audio/video stream
    navigator.getUserMedia({ audio: true, video: true }, function(stream) {
        $('#my-video').prop('src', URL.createObjectURL(stream)); // Set your video displays
        window.localStream = stream; // Make stream
        $('#enable-camera-alert').hide();
    }, function(err) {
        console.log('Failed to get local stream', err);
    });
}

/**
* Make Call Function.
*
* @param call - Call Object
* @return void
*/
function makeCall(call) {
    // Display loading call.
    callConnectedUI(true, "Loading call..");

    // Wait for stream on the call.
    call.on('stream', function(stream) {
        // Set Peer Video Display
        $('#their-video').prop('src', URL.createObjectURL(stream));
    });

    // UI stuff
    window.existingCall = call;
    $('#their-id').text(call.peer);

    // Display Call In Progress
    callConnectedUI(true, "In Call");

    // 1. 'call.peer' gets the other users PeerJS ID.
    // 2. 'call.open' gets whether the call was successful.
}

/**
 * Hangup the call if it exists.
 *
 * @return void
 */
function hangupCall() {
    // Hang up on an existing call if present
    if (window.existingCall) {
        window.existingCall.close();
    }
}

// Click handlers setup
$(function() {

    // Retry if getUserMedia fails
    $('#step1-retry').click(function(){
        setupCall();
    });

    // Get things started
    setupCall();
});
