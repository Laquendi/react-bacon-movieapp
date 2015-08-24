var MovieList = React.createClass({
  render: function() {
    var movieNodes = this.props.data.map(movie => 
      <Movie data={movie} />
    );
    return (
      <div className="movieList">
        {movieNodes}
      </div>
    );
  }
});

var Movie = React.createClass({
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
      </div>
    );
  }
});

var data = Bacon.fromPromise(
  $.ajax('http://netflixroulette.net/api/api.php?actor=Saori%20Hayami')
);

var App = React.createClass({
  getInitialState: function() {
    return {data: []};
  },
  loadCommentsFromServer: function() {
  },
  componentDidMount: function() {
    var state = Bacon.combineTemplate({
      data
    }).toEventStream().onValue(this.setState.bind(this));
  },
  render: function() {
    return (
      <div className="app">
        <h1>Hayami Saori movies</h1>
        <MovieList data={this.state.data} />
      </div>
    );
  }
});

React.render(
  <App />,
  document.getElementById('content')
);
