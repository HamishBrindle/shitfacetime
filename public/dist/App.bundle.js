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
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

// General Variables
var APP_NAME = 'SFT';
var room = '';
var partyVideoStreamURL = null;
var clientVideoStreamURL = null;
var socketConnected = false;
var peerConnected = false;
var peerid = '';
var peerSettings = {
    host: 'sft-peer.herokuapp.com',
    secure: true,
    port: 443,
    debug: 3,
    config: {
        'iceServers': [{
            url: "stun:global.stun.twilio.com:3478?transport=udp"
        }, {
            url: "turn:global.turn.twilio.com:3478?transport=udp",
            username: "6126da033a7be666f10a3f1c0a4bf26f0111c0ac7e7ebd9e3503a181f9e51d8c",
            credential: "bM0+RW4MfPkSJRkGMtdo26vI36/USjTt6zG4Eaitt8s="
        }, {
            url: "turn:global.turn.twilio.com:3478?transport=tcp",
            username: "6126da033a7be666f10a3f1c0a4bf26f0111c0ac7e7ebd9e3503a181f9e51d8c",
            credential: "bM0+RW4MfPkSJRkGMtdo26vI36/USjTt6zG4Eaitt8s="
        }, {
            url: "turn:global.turn.twilio.com:443?transport=tcp",
            username: "6126da033a7be666f10a3f1c0a4bf26f0111c0ac7e7ebd9e3503a181f9e51d8c",
            credential: "bM0+RW4MfPkSJRkGMtdo26vI36/USjTt6zG4Eaitt8s="
        }]
    }
};

// Setup our Howler.js Object
// for playing sounds
var sound = new Howl({
    src: ['sound/traphorn.mp3'],
    sprite: {
        blast: [0, 3000]
    },
    volume: 0.5,
    onend: function onend() {
        console.log('Finished playing sound.');
    }
});

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
    navigator.getUserMedia({
        video: true,
        audio: true
    }, function (stream) {

        // Call loading callback.
        onCallLoading();

        // Hangup previous call.
        hangupCall();

        // Start a new call.
        var call = peerjs.call(peerid, stream);

        // Wait for stream on the call.
        call.on('stream', function (remoteStream) {
            // Call connected callback.
            onCallConnected();

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
        onClientLoadVideoFailed();
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
    navigator.getUserMedia({
        video: true,
        audio: true
    }, function (stream) {

        // Call loading callback.
        onCallLoading();

        // Display Call In Progress
        callConnectedUI(true, "Loading Video..");

        // Hangup previous call.
        hangupCall();

        // Answer the call with an A/V stream.
        call.answer(stream);

        // Wait for stream on the call.
        call.on('stream', function (remoteStream) {
            // Call connected callback.
            onCallConnected();

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

            // Call failed, retry callback.
            onCallFailedRetry();

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
        // Client video failed to load callback.
        onClientLoadVideoFailed();
        console.log('Failed to get local stream', err);
    });
});

/**
 * Emitted when the peer is disconnected from the signalling server.
 *
 * @return void
 */
peerjs.on('disconnected', function () {
    // Reconnect user.
    peerjs.reconnect();

    // Call failed, retry callback.
    onCallFailedRetry();

    // Dislay disconnected
    console.log("Disconnected");
});

/**
 * PeerJS: Display any errors within the call.
 *
 * @param err - Errors with call.
 * @return void
 */
peerjs.on('error', function (err) {
    // Reconnect user.
    peerjs.reconnect();

    // Call failed, retry callback.
    onCallFailedRetry();

    // Display Call In Progress
    callConnectedUI(false, 'Calling Failed.');

    // Check if the error was peer not connected.
    if (err = 'peer-unavailable' && peerjs.disconnected) {

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
        // Find party callback.
        onFindingParty();

        // Start a new call.
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
    // Client has disconnected callback.
    onClientDisconnected();

    // Display console message.
    console.log('Connection fell or your browser is closing.');
});

/**
 * Adds a chat message to the chat area.
 *
 * @param msg
 * @return void
 */
socket.on('chat message', function (data) {

    // Ensure sender does not display their own message.
    if (data.sender != socket.id) {
        // Append your value instead.
        var html = '<div class="bubble left"><div class="content">' + data.message + '</div></div>';

        // Add chat message to chat area.
        $('#chat-area').append(html);

        // Scroll to new message.
        $('.chat').scrollTop($('.chat')[0].scrollHeight);
    }
});

/**
 * Executes toolbar function selected by user.
 *
 * @param tool
 * @return void
 */
socket.on('tool selection', function (data) {

    // Decide which tool was selected (data is id)
    if (data.tool === 'tool-traphorn') {
        console.log('Tool recieved: traphorn.');
        sound.play('blast');
    } else if (data.tool === 'tool-music') {
        console.log('Tool recieved: music.');
    } else if (data.tool === 'tool-thumbsup') {
        console.log('Tool recieved: thumbs-up.');
    } else if (data.tool === 'tool-thumbsdown') {
        console.log('Tool recieved: thumbs-down.');
    } else if (data.tool === 'tool-heart') {
        console.log('Tool recieved: heart.');
    }
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
        // When client is ready to call.
        onClientReady();

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
    navigator.getUserMedia({
        audio: true,
        video: true
    }, function (stream) {
        // Set your local stream video to display.
        $('#my-video').prop('src', URL.createObjectURL(stream));

        // Save stream video.
        window.localStream = stream;

        // Hide the enable camera alert.
        $('#enable-camera-alert').hide();

        // Client video added successfuly.
        onClientLoadVideoSuccess();
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

    // Call ended callback.
    onCallEnded();
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
            peer.socket.send({
                type: 'HEARTBEAT'
            });
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

/******************************
 * User Interface Callbacks.
 ******************************/

/**
 * The client has connected to both services
 * and is ready to make a call.
 *
 * {Hide any connecting to services/initial loading icons.}
 * @return void
 */
function onClientReady() {}
//


/**
 * Client is looking for a call/another party to
 * start calling with.
 *
 * {Display looking for calls icon/searching for others.}
 * @return void
 */
function onFindingParty() {}
//


/**
 * Call is now connecting, and each client is
 * waiting for each others video streams to play.
 *
 * {Display partners video loading icon/call connecting icon.}
 * @return void
 */
function onCallLoading() {}
//


/**
 * When a call has successfully connected and loading on one clients end.
 * TODO: Check if video stream was connected properly.
 *
 * {Display video for the user.}
 * @param remoteStream - Stream from the other party, display this.
 * @return void
 */
function onCallConnected() {
    $('.video-loader').hide();
}

/**
 * Call connection failed when loading. Each client
 * is now reconnecting and attempting to find another call.
 *
 * {Display call failed/finding a new call icons.}
 * @return void
 */
function onCallFailedRetry() {}
//


/**
 * The party you are trying to connect with has disconnected,
 * and your client is now reconnecting and finding a new partner.
 *
 * {Display leaving/ending call icon or call disconnected finding new call.}
 * @return void
 */
function onPartyDisconnected() {}
//


/**
 * When the call has been hung up, on the clients.
 *
 * {Display call ended icon.}
 * @return void
 */
function onCallEnded() {
    $('.video-loader').show();
    $('.chat ul').html('');
}

/**
 * A user has successfully loaded/allowed access to
 * use their local video stream.
 *
 * {Hide any request to access video/display video in box.}
 * @param stream - Clients local stream.
 * @return void
 */
function onClientLoadVideoSuccess() {}
//


/**
 * When the current clients video failed to load.
 *
 * {Display alert/modal showing client video load failed.}
 * @param err - Error and Reason for disconnect.
 * @return void
 */
function onClientLoadVideoFailed(err) {}
//


/**
 * When a user has disconnected from either Socket.IO or Peer.JS
 *
 * {Stop local video stream/ask to reload page.}
 * @return void
 */
function onClientDisconnected() {}
//


// Click handlers setup
$(function () {

    // Sending messages
    $('#message-send').click(function () {
        sendChatMessage();
        return false;
    });

    // When user enters keypress.
    $(document).keypress(function (e) {
        if (e.which == 13) {
            sendChatMessage();
            return false;
        }
    });

    // When user hits traphorn button
    $('.tools button').click(function () {

        // Get the ID of the tool selected
        var id = $(this).attr('id');

        // Send off tool selection to be emitted
        sendToolSelection(id);
    });

    // Retry if getUserMedia fails
    $('#step1-retry').click(function () {
        setupCall();
    });

    // Get things started
    setupCall();
});

function sendToolSelection(id) {

    // Emits the selected button's ID to the server.
    socket.emit('tool selection', id);
}

// Sends a chat message.
function sendChatMessage() {

    // Check if message is empty.
    if ($('#m').val() == '') {
        return;
    }

    // Append your value instead.
    var html = '<div class="bubble right"><div class="content">' + $('#m').val() + '</div></div>';

    // Add chat message to chat area.
    $('#chat-area').append(html);

    // Emits the chat message to the server.
    socket.emit('chat message', $('#m').val());

    // Scroll to new message.
    $('.chat').scrollTop($('.chat')[0].scrollHeight);

    // Resets the value.
    $('#m').val('');
}

/***/ })
/******/ ]);
//# sourceMappingURL=App.bundle.js.map