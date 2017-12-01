/**
 * First we will load all of this project's JavaScript dependencies which
 * includes Vue and other libraries. It is a great starting point when
 * building robust, powerful web applications using Vue and Laravel.
 */

require('./bootstrap');

// window.Vue = require('vue');
//
// /**
//  * Next, we will create a fresh Vue application instance and attach it to
//  * the page. Then, you may begin adding components to this application
//  * or customize the JavaScript scaffolding to fit your unique needs.
//  */
//
// Vue.component('example-component', require('./components/ExampleComponent.vue'));
//
// const app = new Vue({
//     el: '#app'
// });

/**
 * Video Connection code
 */

$(function() {

    var messages = [];
    var peer_id, name, conn;
    // var messages_template = Handlebars.compile($('#messages-template').html());

    var peer = new Peer({
        key: '6telfwnyvqwd0a4i'
    });

    peer.on('open', function() {
        $('#id').text(peer.id);
    });

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    function getVideo(callback) {
        navigator.getUserMedia({
            audio: true,
            video: true
        }, callback, function(error) {
            console.log(error);
            alert('An error occured. Please try again');
        });
    }

    getVideo(function(stream) {
        window.localStream = stream;
        onReceiveStream(stream, 'my-camera');
    });

    function onReceiveStream(stream, element_id) {
        var video = $('#' + element_id + ' video')[0];
        video.src = window.URL.createObjectURL(stream);
        window.peer_stream = stream;
    }

    $('#login').click(function() {
        name = $('#name').val();
        peer_id = $('#peer_id').val();
        if (peer_id) {
            conn = peer.connect(peer_id, {
                metadata: {
                    'username': name
                }
            });
            conn.on('data', handleMessage);
        }

        $('#chat').removeClass('hidden');
        $('#connect').addClass('hidden');
    });

    peer.on('connection', function(connection) {
        conn = connection;
        peer_id = connection.peer;
        conn.on('data', handleMessage);

        $('#peer_id').addClass('hidden').val(peer_id);
        $('#connected_peer_container').removeClass('hidden');
        $('#connected_peer').text(connection.metadata.username);
    });

    function handleMessage(data) {
        var header_plus_footer_height = 285;
        var base_height = $(document).height() - header_plus_footer_height;
        var messages_container_height = $('#messages-container').height();
        messages.push(data);

        var html = messages_template({
            'messages': messages
        });
        $('#messages').html(html);

        if (messages_container_height >= base_height) {
            $('html, body').animate({
                scrollTop: $(document).height()
            }, 500);
        }
    }

    function sendMessage() {
        var text = $('#message').val();
        var data = {
            'from': name,
            'text': text
        };

        conn.send(data);
        handleMessage(data);
        $('#message').val('');
    }

    $('#message').keypress(function(e) {
        if (e.which == 13) {
            sendMessage();
        }
    });

    $('#send-message').click(sendMessage);

    $('#call').click(function() {
        console.log('now calling: ' + peer_id);
        console.log(peer);
        var call = peer.call(peer_id, window.localStream);
        call.on('stream', function(stream) {
            window.peer_stream = stream;
            onReceiveStream(stream, 'peer-camera');
        });
    });

    peer.on('call', function(call) {
        onReceiveCall(call);
    });

    function onReceiveCall(call) {
        call.answer(window.localStream);
        call.on('stream', function(stream) {
            window.peer_stream = stream;
            onReceiveStream(stream, 'peer-camera');
        });
    }

});
