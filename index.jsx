var React = require('react');
var ReactDOM = require('react-dom');
var d3 = require('d3');

var euclideanRhythm = require('./.');

var EuclideanRhythmDemo = React.createClass({
  getInitialState: function () {
    var width = 120;
    var height = 120;
    var radius = Math.min(width, height) / 2;
    return {
      onNotes: 3,
      totalNotes: 8,
      state: 'stop',
      rhythmIndex: -1,

      midiOpts: {
        soundfontUrl: 'node_modules/midi/examples/soundfont/',
        instrument: 'acoustic_grand_piano',
        volume: 127,
        channel: 0,
        note: 50,
        velocity: 127,
        duration: .2,
      },

      pieOpts: {
        width: width,
        height: height,
        radius: radius,
        outerRadius: radius*.9,
        innerRadius: radius*.8,
        transitionDuration: 20,
        onColor: '#555',
        offColor: '#ddd',
        playColor: '#c00'
      },
      pieData: {
        arc: d3.svg.arc()
          .outerRadius(radius*.9)
          .innerRadius(radius*.8),
        pie: d3.layout.pie()
          .sort(null)
          .value(function (d, i) { return 1; })
      }
    };
  },
  componentDidMount: function () {
    var self = this;
    var state = self.state;

    var pieOpts = state.pieOpts;
    state.pieData.d3 = d3.select(self.refs.pie).append('svg')
      .attr('width', pieOpts.width)
      .attr('height', pieOpts.height)
    .append('g')
      .attr('class', 'beats')
      .attr('transform', 'translate(' + (pieOpts.width/2) + ',' + (pieOpts.height/2) + ')');
    self.setState({pieData: state.pieData});

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
  playNote: function () {
    var self = this;
    var state = self.state;
    var midiOpts = state.midiOpts;

    state.rhythmIndex = (state.rhythmIndex + 1) % state.totalNotes;
    self.setState({rhythmIndex: state.rhythmIndex});
    if (self.getRhythm()[state.rhythmIndex]) {
      MIDI.noteOn(midiOpts.channel, midiOpts.note, midiOpts.velocity, 0);
      MIDI.noteOff(midiOpts.channel, midiOpts.note, midiOpts.duration);
    }
  },
  play: function () {
    this.playNote();
    this.setState({
      state: 'play',
      playInterval: setInterval(this.playNote, this.state.midiOpts.duration * 1000)
    });
  },
  stop: function () {
    var self = this;
    var state = self.state;
    var midiOpts = state.midiOpts;
    MIDI.noteOff(midiOpts.channel, midiOpts.note, 0);
    clearInterval(state.playInterval);
    self.setState({
      state: 'stop',
      rhythmIndex: -1,
      playInterval: null
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
    var pieData = state.pieData;

    var slice = pieData.d3.selectAll('.beat')
      .data(pieData.pie(self.getRhythm()));

    slice.enter()
      .insert('path')
      .attr('class', 'beat');

    slice
      .transition().duration(pieOpts.transitionDuration)
      .attrTween('d', function (d) {
        var interpolate = d3.interpolate(this._current || d, d);
        this._current = interpolate(0);
        return function (t) { return pieData.arc(interpolate(t)); };
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
      <div className="row">
        <div className="col-xs-4">
          <label htmlFor="onNotes">On notes</label>
          <input name="onNotes" value={this.state.onNotes} onChange={this.onChange} type="number" step="1" min="0" max={this.state.totalNotes} id="onNotes" className="form-control" />
          <p className="help-block">Total number of notes that will be played in the measure.</p>
        </div>
        <div className="col-xs-4">
          <label htmlFor="totalNotes">Total notes</label>
          <input name="totalNotes" value={this.state.totalNotes} onChange={this.onChange} type="number" step="1" min={this.state.onNotes} max="64" id="totalNotes" className="form-control" />
          <p className="help-block">Total number of notes in a measure.</p>
        </div>
        <div className="col-xs-4">
          <label htmlFor="play">Rhythm</label>
          <button type="button" className="btn btn-block btn-primary" onClick={this.toggle} id="play">
            <span className={'glyphicon glyphicon-'+this.getNextState()} aria-hidden="true"></span>
          </button>
          <div ref="pie" className="text-center"></div>
        </div>
      </div>
    );
  }
});

var component = ReactDOM.render(<EuclideanRhythmDemo />,
  document.getElementById('euclidean-rhythm')
);
