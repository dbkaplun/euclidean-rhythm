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

      // MIDI options
      volume: 127,
      channel: 0,
      note: 50,
      velocity: 127,
      duration: .25,

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

    MIDI.loadPlugin({
      soundfontUrl: "node_modules/midi/examples/soundfont/",
      instrument: "acoustic_grand_piano",
      onprogress: console.log.bind(console),
      onsuccess: function () {
        MIDI.setVolume(state.channel, state.volume);
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
