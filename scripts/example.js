var isEnter = e => e.keyCode === 13;
var Search = React.createClass({
  componentDidMount: function() {
    var input = this.refs.search.getDOMNode();
    var searchEventStream = Bacon.fromEvent(input, "keydown").filter(isEnter)
      .map(function() {var tmp = input.value; input.value = ''; return tmp});
    this.props.returnStream.push(searchEventStream);
    this.props.returnStream.end();
  },
  render: function() {
    return (
      <div className="searchContainer">
        <h1> Search </h1>
        <input ref="search" placeholder="Search..."/>
      </div>
    );
  }
});

var MovieList = React.createClass({
  render: function() {
    var movieNodes = this.props.data.map((movie, i) => 
      <Movie key={i} data={movie} returnStream={this.props.returnStream}/>
    );
    return (
      <div className="movieList">
        {movieNodes}
      </div>
    );
  }
});

var Movie = React.createClass({
  componentDidMount: function() {
    var buyButton = this.refs.buy.getDOMNode();
    var buyEventStream = Bacon.fromEvent(buyButton, "click").map(() => 
      this.props.data.show_title);
    this.props.returnStream.push(buyEventStream);
  },
  render: function() {
    var data = this.props.data;
    return (
      <div className="movie">
        <h2 className="movieTitle">
          {data.show_title}
        </h2>
        <img src={data.poster} className="movieThumbnail" />
        <span className="movieCast"> <b> Cast: </b>{data.show_cast} </span>
        <br/>
        <span className="movieRating"> <b> Rating: </b>{data.rating} </span>
        <br/>
        <br/>
        <div ref="buy" className="btn">Buy</div>
      </div>
    );
  }
});

var Library = React.createClass({
  render: function() {
    var nodes = this.props.data.map(e => <li> {e} </li>);
    return (
      <div className="library">
        <h1>My library</h1>
        <ul>
          {nodes}
        </ul>
      </div>
    );
  }
});

var apiUrl = 'http://netflixroulette.net/api/api.php?actor=';

//Some of the poster imgs are missing. Preload images and only show ones that loaded.
function removeFaultyMovies(ms) {
  return Bacon.fromArray(ms).flatMap(function(m) {
    var img = $(new Image());
    var loaded = Bacon.fromEvent(img, "load").map(() => m);
    img.attr('src', m.poster);
    return loaded;
  }).bufferWithTime(200).first();
}

var App = React.createClass({
  getInitialState: function() {
    return {movies: [], library: []};
  },
  searchStream: new Bacon.Bus(),
  buyStream: new Bacon.Bus(),
  componentWillMount: function() {
    var search = this.searchStream.flatMap(_.identity);
    var movies = search.flatMapLatest(s => 
      Bacon.fromPromise($.ajax(apiUrl + s)))
      .flatMap(removeFaultyMovies).toProperty([]);
    var buyEvents = this.buyStream.flatMap(_.identity);
    var library = buyEvents.scan([], function(acc,e){
      if(_.all(acc, a => a !== e)) return acc.concat(e);
    else return acc;
    }).toProperty();

    var state = Bacon.combineTemplate({
      movies,
      search,
      library
    }).toEventStream().onValue(this.setState.bind(this));

  },
  render: function() {
    return (
      <div className="app">
        <Library data={this.state.library} />
        <Search returnStream={this.searchStream} />
        <h1>Results for query: {this.state.search}</h1>
        <MovieList data={this.state.movies} returnStream={this.buyStream} />
      </div>
    );
  }
});

React.render(
  <App />,
  document.getElementById('content')
);
