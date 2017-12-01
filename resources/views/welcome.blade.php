<!doctype html>
<html lang="{{ app()->getLocale() }}">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>ShitFaceTime</title>

        <!-- Fonts -->
        <link href="https://fonts.googleapis.com/css?family=Raleway:100,600" rel="stylesheet" type="text/css">

        <!-- Client -side dependencies -->
        <link rel="stylesheet" href="{{ asset('css/picnic.min.css') }}">
        <link rel="stylesheet" href="{{ asset('css/plugins.min.css') }}">
        <link rel="stylesheet" href="{{ asset('css/app.css') }}">
        <script src="{{ asset('js/jquery.min.js') }}"></script>
        <script src="{{ asset('js/peer.min.js') }}"></script>
        <script src="{{ asset('js/app.js') }}"></script>
    </head>
    <body>
      <div id="wrapper">
        <!-- Display the video of the remote peer -->
        <div id="peer-camera" class="camera">
          <video width="300" height="300" autoplay></video>
        </div>

        <div id="messenger-wrapper">
          <div class="container">
            <h1>Peer Messenger</h1>

            <!--
              Display the login form and messaging form.
              This allows the user to send messages to their peer and make a video call.
            -->
            <div id="connect">
              <h4>ID: <span id="id"></span></h4>
              <input type="text" name="name" id="name" placeholder="Name">
              <input type="text" name="peer_id" id="peer_id" placeholder="Peer ID">
              <div id="connected_peer_container" class="hidden">
                Connected Peer:
                <span id="connected_peer"></span>
              </div>
              <button id="login">Login</button>
            </div>

            <div id="chat" class="hidden">
              <div id="messages-container">
                <ul id="messages"></ul>
              </div>
              <div id="message-container">
                <input type="text" name="message" id="message" placeholder="Type message..">
                <button id="send-message">Send Message</button>
                <button id="call">Call</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Display video of the current user -->
        <div id="my-camera" class="camera">
          <video width="200" height="200" autoplay></video>
        </div>
      </div>

      <!-- Handlebars template for constructing the list of messages -->
      {{-- <script id="messages-template" type="text/x-handlebars-template">
        {{#each messages}}
        <li>
          <span class="from">{{from}}:</span> {{text}}
        </li>
        {{/each}}
      </script> --}}
    </body>
</html>
