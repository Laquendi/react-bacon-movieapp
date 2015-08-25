var isEnter = e => e.keyCode === 13;
class Search extends React.Component {
  componentDidMount() {
    var input = this.refs.search.getDOMNode();
    var searchEventStream = Bacon.fromEvent(input, "keydown").filter(isEnter)
      .map(function() {var tmp = input.value; input.value = ''; return tmp});
    this.props.returnStream.push(searchEventStream);
    this.props.returnStream.end();
  }
  render() {
    return (
      <div className="searchContainer">
        <h1> Search </h1>
        <input ref="search" placeholder="Search..."/>
      </div>
    );
  }
}

class MovieList extends React.Component {
  render() {
    var movieNodes = this.props.data.map((movie, i) => 
      <Movie key={i} data={movie} returnStream={this.props.returnStream}/>
    );
    return (
      <div className="movieList">
        {movieNodes}
      </div>
    );
  }
}

class Movie extends React.Component {
  componentDidMount() {
    var buyButton = this.refs.buy.getDOMNode();
    var buyEventStream = Bacon.fromEvent(buyButton, "click").map(() => 
      this.props.data.show_title);
    this.props.returnStream.push(buyEventStream);
  }
  render() {
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
}

class Library extends React.Component {
  render() {
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
}

var apiUrl = 'http://netflixroulette.net/api/api.php?actor=';

//Some of the poster imgs are missing. Preload images and only show ones that loaded.
function removeFaultyMovies(ms) {
  return Bacon.fromArray(ms).flatMap(function(m) {
    var img = $(new Image());
    var loaded = Bacon.fromEvent(img, "load").map(() => m);
    img.attr('src', m.poster);
    return loaded;
  }).bufferWithTime(300).first();
}

class App extends React.Component {
  constructor() {
    super();
    this.searchStream = new Bacon.Bus();
    this.buyStream = new Bacon.Bus();

    this.state = {movies: [], library:[]};

    var search = this.searchStream.flatMap(_.identity);
    var movies = search.flatMapLatest(s => 
      Bacon.fromPromise($.ajax(apiUrl + s)))
      .flatMap(removeFaultyMovies).toProperty([]);
    var buyEvents = this.buyStream.flatMap(_.identity);
    var library = buyEvents.scan([], function(acc,e){
      if(_.all(acc, a => a !== e)) return acc.concat(e);
    else return acc;
    }).toProperty();

    Bacon.combineTemplate({
      movies,
      search,
      library
    }).onValue(this.setState.bind(this));
  }
  render() {
    return (
      <div className="app">
        <Library data={this.state.library} />
        <Search returnStream={this.searchStream} />
        <h1>Showing results for query: {this.state.search}</h1>
        <MovieList data={this.state.movies} returnStream={this.buyStream} />
      </div>
    );
  }
}

React.render(
  <App />,
  document.getElementById('content')
);
