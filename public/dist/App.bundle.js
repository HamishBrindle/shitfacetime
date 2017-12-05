/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(0);

// Compatibility shim
// navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

// General Variables
var APP_NAME = 'SFT';
var room = '';
var socketConnected = false;
var peerConnected = false;
var peerid = '';
var peerSettings = {
    host: 'sft-peer.herokuapp.com',
    secure: true,
    port: 443,
    debug: 3,
    config: { 'iceServers': [{
            url: "stun:global.stun.twilio.com:3478?transport=udp"
        }, {
            url: "turn:global.turn.twilio.com:3478?transport=udp",
            username: "d44a3662a61e115cf3df7254d44d6b276d90300d065a1560a1618fa49bbdd5f3",
            credential: "0JZh27bgCb3oM0EmXKkctvuQT6S5qIJJthvUxho20r8="
        }, {
            url: "turn:global.turn.twilio.com:3478?transport=tcp",
            username: "d44a3662a61e115cf3df7254d44d6b276d90300d065a1560a1618fa49bbdd5f3",
            credential: "0JZh27bgCb3oM0EmXKkctvuQT6S5qIJJthvUxho20r8="
        }, {
            url: "turn:global.turn.twilio.com:443?transport=tcp",
            username: "d44a3662a61e115cf3df7254d44d6b276d90300d065a1560a1618fa49bbdd5f3",
            credential: "0JZh27bgCb3oM0EmXKkctvuQT6S5qIJJthvUxho20r8="
        }] }
};

// Create PeerJS and Socket connections.
var socket = io();
var peerjs = new Peer(peerSettings);

/**
* PeerJS: On Connection.
*
* @param  socket - Clients Socket Object.
* @return void
*/
peerjs.on('open', function () {
    makePeerHeartbeater(peerjs); // Start heartbeat connection.
    consoleMessage('Peerjs Connected'); // Connected message.
    peerjsConnectedUI(); // Display peerjs connected.
    peerConnected = true; // Connection has been made.
    findPeer(); // Find peer to call.
});

/**
 * PeerJS: Start a new call.
 *
 * @type void
 */
function startCall(peerid) {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    navigator.getUserMedia({ video: true, audio: true }, function (stream) {

        console.log("Starting new call.");

        // Hangup previous call.
        hangupCall();

        // Start a new call.
        var call = peerjs.call(peerid, stream);

        // Wait for stream on the call.
        call.on('stream', function (remoteStream) {
            // Set Peer Video Display
            $('#their-video').prop('src', URL.createObjectURL(remoteStream));
        });

        // When call has stopped.
        call.on('close', function () {
            // Remove black box in empty call video.
            $('#their-video').attr('src', '');
        });

        // UI stuff
        window.existingCall = call;
        $('#their-id').text(call.peer);

        // Display Call In Progress
        callConnectedUI(true, "In Call");
    }, function (err) {
        console.log('Failed to get local stream', err);
    });
}

/**
 * PeerJS: When a user is recieving a call.
 *
 * @param call - Recieving call.
 * @return void
 */
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
peerjs.on('call', function (call) {
    navigator.getUserMedia({ video: true, audio: true }, function (stream) {
        // Display Call In Progress
        callConnectedUI(true, "Loading Video..");

        // Hangup previous call.
        hangupCall();

        // Answer the call with an A/V stream.
        call.answer(stream);

        // Wait for stream on the call.
        call.on('stream', function (remoteStream) {
            // Set Peer Video Display
            $('#their-video').prop('src', URL.createObjectURL(remoteStream));
        });

        // When call has stopped.
        call.on('close', function () {
            // Remove black box in empty call video.
            $('#their-video').attr('src', '');
        });

        // If there was an error with the call.
        call.on('error', function (err) {

            // Display error message.
            console.log('Error connecting call, retry.');

            // If the call is working, but not displaying anything close.
            // TODO: Check if its displaying anything.
            if (call.open) {
                call.close();
            }

            // Leave the room again.
            room = '';

            // Setup the UI.
            callConnectedUI(false, 'Call Failed.');
            $('#their-id').text('Not in call.');

            // Emit to start a new call.
            socket.emit('new call');
        });

        // UI stuff
        window.existingCall = call;
        $('#their-id').text(call.peer);

        // Display Call In Progress
        callConnectedUI(true, "In Call");
    }, function (err) {
        console.log('Failed to get local stream', err);
    });
});

/**
 * Emitted when the peer is disconnected from the signalling server.
 *
 * @return void
 */
peerjs.on('disconnected', function () {
    // Attempt to reconnect if peerjs isn't destroyed.
    if (peerjs.destroyed == false) {
        peerjs.reconnect();
    }
});

/**
 * PeerJS: Display any errors within the call.
 *
 * @param err - Errors with call.
 * @return void
 */
peerjs.on('error', function (err) {
    // Display Call In Progress
    callConnectedUI(false, 'Calling Failed.');

    // Check if the error was peer not connected.
    if (err = 'peer-unavailable' && peerjs.disconnected) {

        // Reconnect to the server.
        peerjs.reconnect();

        // End any calls.
        hangupCall();

        // Leave the room again.
        room = '';

        // Setup the UI.
        callConnectedUI(false, 'Call Failed.');
        $('#their-id').text('Not in call.');

        // Emit to start a new call.
        socket.emit('new call');
    }
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
socket.on('call start', function (data) {
    // Save the room name.
    room = data.room;

    // For testing, print all collected data.
    console.log("Room: " + data.room);
    console.log("Peer ID: " + data.peer);

    // Ensure only one person starts the call.
    if (data.caller == 'this') {
        startCall(data.peer);
    }
});

/**
* Socket.IO: Emitted when a
*
* @return void
*/
socket.on('partner disconnected', function (data) {
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
socket.on('disconnect', function () {
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
function consoleMessage() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

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
    navigator.getUserMedia({ audio: true, video: true }, function (stream) {
        $('#my-video').prop('src', URL.createObjectURL(stream)); // Set your video displays
        window.localStream = stream; // Make stream
        $('#enable-camera-alert').hide();
    }, function (err) {
        console.log('Failed to get local stream', err);
    });
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

/**
 * Make a peer heart beat connection to keep
 * the server alive when connected to our
 * heroku applications.
 *
 * @param peer - Current peer object.
 * @return void
 */
function makePeerHeartbeater(peer) {
    console.log('Heartbeat Started.');
    var timeoutId = 0;
    function heartbeat() {
        timeoutId = setTimeout(heartbeat, 20000);
        if (peer.socket._wsOpen()) {
            peer.socket.send({ type: 'HEARTBEAT' });
        }
    }
    // Start
    heartbeat();
    // return
    return {
        start: function start() {
            if (timeoutId === 0) {
                heartbeat();
            }
        },
        stop: function stop() {
            clearTimeout(timeoutId);
            timeoutId = 0;
        }
    };
}

// Click handlers setup
$(function () {

    // Retry if getUserMedia fails
    $('#step1-retry').click(function () {
        setupCall();
    });

    // Get things started
    setupCall();
});

/***/ })
/******/ ]);
//# sourceMappingURL=App.bundle.js.map