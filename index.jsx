var React = require('react');
var ReactDOM = require('react-dom');

var euclideanRhythm = require('./.');

var EuclideanRhythmDemo = React.createClass({
  getInitialState: function () {
    return {
      onNotes: 3,
      totalNotes: 8,
      state: 'stop'
    };
  },
  componentDidMount: function () {
    // TODO: init MIDI.js
  },
  getRhythm: function () {
    return euclideanRhythm(this.state.onNotes, this.state.totalNotes)
  },
  getNextState: function () {
    return {
      stop: 'play',
      play: 'stop'
    }[this.state.state];
  },
  onChange: function (evt) {
    var newState = {};
    newState[evt.target.name] = Number(evt.target.value);
    this.setState(newState);
    if (this.state.state !== 'stop') this.toggle();
  },
  toggle: function (evt) {
    // TODO: MIDI.js
    this.setState({
      state: this.getNextState()
    });
  },
  renderRhythm: function () {
    return this.getRhythm()
      .map(function (beat) { return beat ? 'x' : '-'; })
      .join('');
  },
  render: function () {
    return (
      <form>
        <div className="form-group">
          <label htmlFor="onNotes">On notes</label>
          <input name="onNotes" value={this.state.onNotes} onChange={this.onChange} type="number" step="1" min="0" max={this.state.totalNotes} id="onNotes" className="form-control" />
          <p className="help-block">Total number of notes that will be played in the measure.</p>
        </div>
        <div className="form-group">
          <label htmlFor="totalNotes">Total notes</label>
          <input name="totalNotes" value={this.state.totalNotes} onChange={this.onChange} type="number" step="1" min={this.state.onNotes} max="64" id="totalNotes" className="form-control" />
          <p className="help-block">Total number of notes in a measure.</p>
        </div>
        <button type="button" className="btn btn-primary btn-small" onClick={this.toggle}>
          <span className={'glyphicon glyphicon-'+this.getNextState()} aria-hidden="true"></span>
        </button>
        Rhythm: <code>{this.renderRhythm()}</code>
      </form>
    );
  }
});

var component = ReactDOM.render(<EuclideanRhythmDemo />,
  document.getElementById('euclidean-rhythm')
);
