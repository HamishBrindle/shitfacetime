<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
<meta name="description" content="">
<meta name="author" content="">
<link rel="icon" href="http://v4-alpha.getbootstrap.com/favicon.ico">

<title>shitfacetime | Pre-game Video Chat</title>

<!-- Bootstrap core CSS -->
<link href="http://v4-alpha.getbootstrap.com/dist/css/bootstrap.min.css" rel="stylesheet">

<!-- Custom styles for this template -->
<link href="http://v4-alpha.getbootstrap.com/examples/cover/cover.css" rel="stylesheet">
<link href="{{ asset('css/app.css') }}" rel="stylesheet">

<!-- IE10 viewport hack for Surface/desktop Windows 8 bug -->
<script src="http://v4-alpha.getbootstrap.com/assets/js/ie10-viewport-bug-workaround.js"></script>
</head>

<body>

<div class="container-fluid navigation">
<!-- Image and text -->
    <div class="row">
        <div class="col-lg-4 col-lg-offset-4">
            <nav class="navbar navbar-toggleable-md navbar-light">
                <a class="navbar-brand" href="#">
                <img src="{{ asset('img/shitface.png') }}" width="30" height="30" class="d-inline-block align-top" alt="">
                shitfacetime
                </a>
                <div class="collapse navbar-collapse" id="navbarNavDropdown">
                    <ul class="navbar-nav">
                      @if (Route::has('login'))
                          @auth
                              <li class="nav-item active">
                                <a class="nav-link" href="{{ url('/home') }}">Home <span class="sr-only">(current)</span></a>
                              </li>
                              <li class="nav-item">
                                <a class="nav-link" href="#">Account</a>
                              </li>
                          @else
                              <li class="nav-item">
                                <a class="nav-link" href="{{ route('login') }}">Login</a>
                              </li>
                              <li class="nav-item">
                                <a class="nav-link" href="{{ route('register') }}">Register</a>
                              </li>
                          @endauth
                      @endif
                    </ul>
                </div>
            </nav>
        </div>
    </div>
</div>

<div class="jumbotron jumbotron-fluid">
    <div class="container text-left">
        <h1 class="display-3">shitfacetime</h1>
        <p class="lead">Time for the pre-game. Start things off by meeting some <em>new</em> friends for drinks!</p>
    </div>
</div>
<div class="site-wrapper sfc-dark-purple">
  <div class="site-wrapper-inner">
    <div class="cover-container">
        <div class="inner cover">
            <h1 class="cover-heading">Cover your page.</h1>
            <p class="lead">Cover is a one-page template for building simple and beautiful home pages. Download, edit the text, and add your own fullscreen background photo to make it your own.</p>
            <p class="lead">
                <a href="#" class="btn btn-lg btn-secondary">Learn more</a>
            </p>
        </div>
    </div>
</div>
</div>

<!-- Bootstrap core JavaScript
================================================== -->
<!-- Placed at the end of the document so the pages load faster -->
<script src="https://code.jquery.com/jquery-3.1.1.slim.min.js" integrity="sha384-A7FZj7v+d/sdmMqp/nOQwliLvUsJfDHW+k9Omg/a/EheAdgtzNs3hpfag6Ed950n" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/tether/1.4.0/js/tether.min.js" integrity="sha384-DztdAPBWPRXSA/3eYEEUWrWCy7G5KFbe8fFjk5JAIxUYHKkDx6Qin1DkWx51bBrb" crossorigin="anonymous"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/js/bootstrap.min.js" integrity="sha384-vBWWzlZJ8ea9aCX4pEW3rVHjgjt7zpkNpZk+02D9phzyeVkE+jo0ieGizqPLForn" crossorigin="anonymous"></script>


</body>
</html>
