var React = require('react');
var ReactDOM = require('react-dom');
var d3 = require('d3');

var euclideanRhythm = require('./.');

var EuclideanRhythmDemo = React.createClass({
  getInitialState: function () {
    var size = 120;
    var radius = Math.min(size, size) / 2;
    return {
      onNotes: 3,
      totalNotes: 8,
      state: 'stop',
      rhythmIndex: 0,

      midiOpts: {
        soundfontUrl: 'node_modules/midi/examples/soundfont/',
        instrument: 'acoustic_grand_piano',
        volume: 127,
        channel: 0,
        note: 50,
        velocity: 127,
        duration: .25,
      },

      pieOpts: {
        width: size,
        height: size,
        radius: radius,
        outerRadius: radius*.9,
        innerRadius: radius*.8,
        transitionDuration: 20,
        onColor: '#555',
        offColor: '#ddd',
        playColor: '#c00'
      }
    };
  },
  componentDidMount: function () {
    var self = this;
    var state = self.state;

    var pieOpts = state.pieOpts;
    self.setState({
      arc: d3.svg.arc()
        .outerRadius(pieOpts.radius*.9)
        .innerRadius(pieOpts.radius*.8),
      pie: d3.layout.pie()
        .sort(null)
        .value(function (d, i) { return 1; }),
      svg: d3.select(ReactDOM.findDOMNode(self)).append('svg').append('g')
        .attr('class', 'beats')
        .attr('transform', 'translate(' + (pieOpts.width/2) + ',' + (pieOpts.height/2) + ')')
    });

    var midiOpts = state.midiOpts;
    MIDI.loadPlugin({
      soundfontUrl: midiOpts.soundfontUrl,
      instrument: midiOpts.instrument,
      onprogress: console.log.bind(console),
      onsuccess: function () {
        MIDI.setVolume(midiOpts.channel, midiOpts.volume);
        self.setState({midi: MIDI});
      }
    });
  },
  componentDidUpdate: function () {
    this.updatePie();
  },
  getRhythm: function () { return euclideanRhythm(this.state.onNotes, this.state.totalNotes); },
  getNextState: function () {
    return {
      stop: 'play',
      play: 'stop'
    }[this.state.state];
  },
  play: function () {
    var self = this;
    var state = self.state;
    var midiOpts = state.midiOpts;
    if (self.getRhythm()[state.rhythmIndex]) {
      MIDI.noteOn(midiOpts.channel, midiOpts.note, midiOpts.velocity, 0);
      MIDI.noteOff(midiOpts.channel, midiOpts.note, midiOpts.duration);
    }
    self.render();
    self.setState({
      state: 'play',
      rhythmIndex: (state.rhythmIndex + 1) % state.totalNotes,
      playTimeout: setTimeout(self.play, midiOpts.duration * 1000)
    });
  },
  stop: function () {
    var self = this;
    var state = self.state;
    var midiOpts = state.midiOpts;
    MIDI.noteOff(midiOpts.channel, midiOpts.note, 0);
    clearTimeout(state.playTimeout);
    self.setState({
      state: 'stop',
      rhythmIndex: 0,
      playTimeout: null
    });
  },
  toggle: function (evt) { this[this.getNextState()](); },
  onChange: function (evt) {
    var newState = {};
    newState[evt.target.name] = Number(evt.target.value);
    this.setState(newState);
    this.stop();
  },
  updatePie: function () {
    var self = this;
    var state = self.state;
    var pieOpts = state.pieOpts;

    var slice = state.svg.selectAll('.beat')
      .data(state.pie(self.getRhythm()));

    slice.enter()
      .insert('path')
      .attr('class', 'beat');

    slice
      .transition().duration(pieOpts.transitionDuration)
      .attrTween('d', function (d) {
        var interpolate = d3.interpolate(this._current || d, d);
        this._current = interpolate(0);
        return function (t) { return state.arc(interpolate(t)); };
      })

    slice.exit()
      .remove();

    slice.style('fill', function (d, i) {
      return state.state === 'play' && state.rhythmIndex === i
        ? pieOpts.playColor
        : d.data
          ? pieOpts.onColor
          : pieOpts.offColor;
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
      </form>
    );
  }
});

var component = ReactDOM.render(<EuclideanRhythmDemo />,
  document.getElementById('euclidean-rhythm')
);
