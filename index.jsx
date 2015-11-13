var React = require('react');
var ReactDOM = require('react-dom');

var euclideanRhythm = require('./.');

var EuclideanRhythmDemo = React.createClass({
  getInitialState: function () {
    return {
      onNotes: 3,
      totalNotes: 8,
      state: 'stop',
      rhythmIndex: 0,

      // MIDI options
      volume: 127,
      channel: 0,
      note: 50,
      velocity: 127,
      duration: .25
    };
  },
  componentDidMount: function () {
    var self = this;
  	MIDI.loadPlugin({
  		soundfontUrl: "node_modules/midi/examples/soundfont/",
  		instrument: "acoustic_grand_piano",
  		onprogress: console.log.bind(console),
  		onsuccess: function() {
        MIDI.setVolume(self.state.channel, self.state.volume);
        self.setState({midi: MIDI});
  		}
  	});
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
  play: function () {
    if (this.getRhythm()[this.state.rhythmIndex]) {
      MIDI.noteOn(this.state.channel, this.state.note, this.state.velocity, 0);
      MIDI.noteOff(this.state.channel, this.state.note, this.state.duration);
    }
    this.render();
    this.setState({
      state: 'play',
      rhythmIndex: (this.state.rhythmIndex + 1) % this.state.totalNotes,
      timeout: setTimeout(this.play, this.state.duration * 1000)
    });
  },
  stop: function () {
    MIDI.noteOff(this.state.channel, this.state.note, 0);
    clearTimeout(this.state.timeout);
    this.setState({
      state: 'stop',
      rhythmIndex: 0,
      timeout: null
    });
  },
  toggle: function (evt) {
    this[this.getNextState()]();
  },
  onChange: function (evt) {
    var newState = {};
    newState[evt.target.name] = Number(evt.target.value);
    this.setState(newState);
    this.stop();
  },
  renderRhythm: function () {
    var self = this;
    return self.getRhythm().map(function (beat, i) {
      var renderedBeat = beat ? 'x' : '-';
      if (self.state.state === 'play' && self.state.rhythmIndex === i) renderedBeat = <strong key={i}>{renderedBeat}</strong>;
      return renderedBeat;
    });
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
