$("body").append(
  `<nav class="navbar navbar-inverse navbar-fixed-top">
      <div class="container">
        <div class="navbar-header">
          <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
            <span class="sr-only">Toggle navigation</span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </button>
          <a class="navbar-brand hidden-sm" href="index.html">Renaud Vilmart</a>
          <a class="navbar-brand visible-sm-inline" href="index.html">R. Vilmart</a>
        </div>
        <div id="navbar" class="collapse navbar-collapse">
          <ul class="nav navbar-nav">
            <li id="index"><a href="index.html"><span class="glyphicon glyphicon-tent" aria-hidden="true"></span> Home</a></li>
            <li id="publis"><a href="publis.html"><span class="glyphicon glyphicon-hdd" aria-hidden="true"></span> Publications</a></li>
            <li><a href="https://lmf.cnrs.fr/Research/Quant" target="_blank"><span class="glyphicon glyphicon-flag" aria-hidden="true"></span> Team <span style="font-size: 60%;" class="glyphicon glyphicon-new-window" aria-hidden="true"></span></a></li>
            <li class="dropdown">
              <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"><span class="glyphicon glyphicon-blackboard" aria-hidden="true"></span> Teaching <span class="caret"></span></a>
              <ul class="dropdown-menu">
                <li><a href="ArteQ.html"> ARTeQ - EITQ </a></li>
                <li><a href="QDCS.html"> QDCS / QMI </a></li>
              </ul>
            </li>
            <li class="dropdown">
              <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"><span class="glyphicon glyphicon-bullhorn" aria-hidden="true"></span> Offers  <span class="caret"></span></a>
              <ul class="dropdown-menu">
                <li> Nothing at the moment </li>
              </ul>
            </li>
            <li id="contact"><a href="contact.html"><span class="glyphicon glyphicon-globe" aria-hidden="true"></span> Contact</a></li>
          </ul>
        </div><!--/.nav-collapse -->
      </div>
    </nav>`)



var path = window.location.pathname;
var page = path.split("/").pop().split(".")[0];
$("#"+page).addClass("active")

