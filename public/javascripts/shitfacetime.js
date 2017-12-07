import '../sass/style.scss';

// Compatibility shim
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

// General Variables
const APP_NAME = 'SFT';
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
        'iceServers': [
            {
                url: "stun:global.stun.twilio.com:3478?transport=udp"
            },
            {
                url: "turn:global.turn.twilio.com:3478?transport=udp",
                username: "49e1aa5f04c9ef9e20fd3d152dc45fc9952407453a2b5f5b6d2a2c34fff2a6ee",
                credential: "vhGp1LbBos0Qliz464N1Ui1bqxI0r/7ID/0F3K0ry3g="
            },
            {
                url: "turn:global.turn.twilio.com:3478?transport=tcp",
                username: "49e1aa5f04c9ef9e20fd3d152dc45fc9952407453a2b5f5b6d2a2c34fff2a6ee",
                credential: "vhGp1LbBos0Qliz464N1Ui1bqxI0r/7ID/0F3K0ry3g="
            },
            {
                url: "turn:global.turn.twilio.com:443?transport=tcp",
                username: "49e1aa5f04c9ef9e20fd3d152dc45fc9952407453a2b5f5b6d2a2c34fff2a6ee",
                credential: "vhGp1LbBos0Qliz464N1Ui1bqxI0r/7ID/0F3K0ry3g="
            }
        ]
    }
};

// Is our confetti showing?
var isConfetti = false;

// Is our confetti showing?
var isMusic = false;

// Setup our Howler.js Object
// for playing sounds
var sound = new Howl({
    src: ['sound/traphorn.mp3'],
    sprite: {
        blast: [0, 3000]
    },
    volume: 0.5,
    onend: function() {
        console.log('Finished playing sound.');
    }
});

// for playing kids celebrating with confetti
var kids = new Howl({
    src: ['sound/yayy.mp3'],
    sprite: {
        yayy: [0, 5000]
    },
    volume: 0.25,
    onend: function() {
        console.log('Finished playing sound.');
    }
});

// for playing music
var music = new Howl({
    src: ['sound/gucci-gang.mp3'],
    sprite: {
        gucci: [16000, 4075]
    },
    volume: 0.5,
    onend: function() {
        console.log('Finished playing music.');
        isMusic = false;
    }
});

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
    }, function(stream) {

        // Call loading callback.
        onCallLoading();

        // Hangup previous call.
        hangupCall();

        // Start a new call.
        var call = peerjs.call(peerid, stream);

        // Wait for stream on the call.
        call.on('stream', function(remoteStream) {
            // Call connected callback.
            onCallConnected();

            // Set Peer Video Display
            $('#their-video').prop('src', URL.createObjectURL(remoteStream));
        });

        // When call has stopped.
        call.on('close', function() {
            // Remove black box in empty call video.
            $('#their-video').attr('src', '');
        });

        // UI stuff
        window.existingCall = call;
        $('#their-id').text(call.peer);

        // Display Call In Progress
        callConnectedUI(true, "In Call");
    }, function(err) {
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
peerjs.on('call', function(call) {
    navigator.getUserMedia({
        video: true,
        audio: true
    }, function(stream) {

        // Call loading callback.
        onCallLoading();

        // Display Call In Progress
        callConnectedUI(true, "Loading Video..");

        // Hangup previous call.
        hangupCall();

        // Answer the call with an A/V stream.
        call.answer(stream);

        // Wait for stream on the call.
        call.on('stream', function(remoteStream) {
            // Call connected callback.
            onCallConnected();

            // Set Peer Video Display
            $('#their-video').prop('src', URL.createObjectURL(remoteStream));
        });

        // When call has stopped.
        call.on('close', function() {
            // Remove black box in empty call video.
            $('#their-video').attr('src', '');
        });

        // If there was an error with the call.
        call.on('error', function(err) {

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
    }, function(err) {
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
peerjs.on('disconnected', function() {
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
peerjs.on('error', function(err) {
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
socket.on('connect', function(socket) {
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
socket.on('chat message', function(data) {

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
socket.on('tool selection', function(data) {

    // Decide which tool was selected (data is id)
    if (data.tool === 'tool-traphorn') {
        console.log('Tool recieved: traphorn.');
        sound.play('blast');
    } else if (data.tool === 'tool-music') {
        console.log('Tool recieved: music.');
        if (!isMusic) {
            isMusic = true;
            music.play('gucci');
        }
    } else if (data.tool === 'tool-thumbsup') {
        console.log('Tool recieved: thumbs-up.');
    } else if (data.tool === 'tool-thumbsdown') {
        console.log('Tool recieved: thumbs-down.');
    } else if (data.tool === 'tool-confetti') {
        console.log('Tool recieved: confetti.');
        // Confetti is always playing. Here we decide whether or note
        // to show it. The timeout is for hiding it once it's done.
        // TODO: Clean this up
        if (!isConfetti) {
            isConfetti = true;
            $('#confeti').show();
            kids.play('yayy');
            setTimeout(function() {
                $('#confeti').hide();
                isConfetti = false;
            }, 5000);
        }
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
    }, function(stream) {
        // Set your local stream video to display.
        $('#my-video').prop('src', URL.createObjectURL(stream));

        // Save stream video.
        window.localStream = stream;

        // Hide the enable camera alert.
        $('#enable-camera-alert').hide();

        // Client video added successfuly.
        onClientLoadVideoSuccess();
    }, function(err) {
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
        start: function() {
            if (timeoutId === 0) {
                heartbeat();
            }
        },
        stop: function() {
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
function onClientReady() {
    //
}

/**
 * Client is looking for a call/another party to
 * start calling with.
 *
 * {Display looking for calls icon/searching for others.}
 * @return void
 */
function onFindingParty() {
    //
}

/**
 * Call is now connecting, and each client is
 * waiting for each others video streams to play.
 *
 * {Display partners video loading icon/call connecting icon.}
 * @return void
 */
function onCallLoading() {
    //
}

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
    confetti();
    $('#confeti').hide();
}

/**
 * Call connection failed when loading. Each client
 * is now reconnecting and attempting to find another call.
 *
 * {Display call failed/finding a new call icons.}
 * @return void
 */
function onCallFailedRetry() {
    //
}

/**
 * The party you are trying to connect with has disconnected,
 * and your client is now reconnecting and finding a new partner.
 *
 * {Display leaving/ending call icon or call disconnected finding new call.}
 * @return void
 */
function onPartyDisconnected() {
    //
}

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
function onClientLoadVideoSuccess() {
    //
}

/**
 * When the current clients video failed to load.
 *
 * {Display alert/modal showing client video load failed.}
 * @param err - Error and Reason for disconnect.
 * @return void
 */
function onClientLoadVideoFailed(err) {
    //
}

/**
 * When a user has disconnected from either Socket.IO or Peer.JS
 *
 * {Stop local video stream/ask to reload page.}
 * @return void
 */
function onClientDisconnected() {
    //
}

// Click handlers setup
$(function() {

    // Sending messages
    $('#message-send').click(function() {
        sendChatMessage();
        return false;
    });

    // When user enters keypress.
    $(document).keypress(function(e) {
        if (e.which == 13) {
            sendChatMessage();
            return false;
        }
    });

    // When user hits traphorn button
    $('.tools button').click(function() {

        // Get the ID of the tool selected
        var id = $(this).attr('id');

        // Send off tool selection to be emitted
        sendToolSelection(id);

    });

    // Retry if getUserMedia fails
    $('#step1-retry').click(function() {
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

function confetti() {
    var COLORS, Confetti, NUM_CONFETTI, PI_2, canvas, confetti, context, drawCircle, drawCircle2, drawCircle3, i, range, xpos;
    NUM_CONFETTI = 40;
    COLORS = [
        [235, 90, 70],
        [97, 189, 79],
        [242, 214, 0],
        [0, 121, 191],
        [195, 119, 224]
    ];
    PI_2 = 2 * Math.PI;
    canvas = document.getElementById("confeti");
    context = canvas.getContext("2d");
    window.w = 0;
    window.h = 0;
    window.resizeWindow = function() {
        window.w = canvas.width = window.innerWidth;
        return window.h = canvas.height = window.innerHeight
    };
    window.resizeWindow();
    window.addEventListener("resize", resizeWindow, !1);
    window.onload = function() {
        return setTimeout(resizeWindow, 0)
    };
    range = function(a, b) {
        return (b - a) * Math.random() + a
    };
    drawCircle = function(a, b, c, d) {
        context.beginPath();
        context.moveTo(a, b);
        context.bezierCurveTo(a - 17, b + 14, a + 13, b + 5, a - 5, b + 22);
        context.lineWidth = 2;
        context.strokeStyle = d;
        return context.stroke()
    };
    drawCircle2 = function(a, b, c, d) {
        context.beginPath();
        context.moveTo(a, b);
        context.lineTo(a + 6, b + 9);
        context.lineTo(a + 12, b);
        context.lineTo(a + 6, b - 9);
        context.closePath();
        context.fillStyle = d;
        return context.fill()
    };
    drawCircle3 = function(a, b, c, d) {
        context.beginPath();
        context.moveTo(a, b);
        context.lineTo(a + 5, b + 5);
        context.lineTo(a + 10, b);
        context.lineTo(a + 5, b - 5);
        context.closePath();
        context.fillStyle = d;
        return context.fill()
    };
    xpos = 0.9;
    document.onmousemove = function(a) {
        return xpos = a.pageX / w
    };
    window.requestAnimationFrame = function() {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(a) {
            return window.setTimeout(a, 5)
        }
    }();
    Confetti = function() {
        function a() {
            this.style = COLORS[~~range(0, 5)];
            this.rgb = "rgba(" + this.style[0] + "," + this.style[1] + "," + this.style[2];
            this.r = ~~range(2, 6);
            this.r2 = 2 * this.r;
            this.replace()
        }
        a.prototype.replace = function() {
            this.opacity = 0;
            this.dop = 0.03 * range(1, 4);
            this.x = range(-this.r2, w - this.r2);
            this.y = range(-20, h - this.r2);
            this.xmax = w - this.r;
            this.ymax = h - this.r;
            this.vx = range(0, 2) + 8 * xpos - 5;
            return this.vy = 0.7 * this.r + range(-1, 1)
        };
        a.prototype.draw = function() {
            var a;
            this.x += this.vx;
            this.y += this.vy;
            this.opacity +=
                this.dop;
            1 < this.opacity && (this.opacity = 1, this.dop *= -1);
            (0 > this.opacity || this.y > this.ymax) && this.replace();
            if (!(0 < (a = this.x) && a < this.xmax)) this.x = (this.x + this.xmax) % this.xmax;
            drawCircle(~~this.x, ~~this.y, this.r, this.rgb + "," + this.opacity + ")");
            drawCircle3(0.5 * ~~this.x, ~~this.y, this.r, this.rgb + "," + this.opacity + ")");
            return drawCircle2(1.5 * ~~this.x, 1.5 * ~~this.y, this.r, this.rgb + "," + this.opacity + ")")
        };
        return a
    }();
    confetti = function() {
        var a, b, c;
        c = [];
        i = a = 1;
        for (b = NUM_CONFETTI; 1 <= b ? a <= b : a >= b; i = 1 <= b ? ++a : --a) c.push(new Confetti);
        return c
    }();
    window.step = function() {
        var a, b, c, d;
        requestAnimationFrame(step);
        context.clearRect(0, 0, w, h);
        d = [];
        b = 0;
        for (c = confetti.length; b < c; b++) a = confetti[b], d.push(a.draw());
        return d
    };
    step();;
}
