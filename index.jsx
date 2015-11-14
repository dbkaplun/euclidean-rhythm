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
      state: 'stop',
      rhythmIndex: -1,
      rhythms: [],

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
        playColor: '#c00',

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

    self.addRhythm();
  },
  componentDidUpdate: function () {
    var self = this;
    var state = self.state;
    var pieOpts = state.pieOpts;
    state.rhythms.forEach(function (rhythm, i) {
      var pieRef = self.refs['pie-'+i];
      if (pieRef && !rhythm.pie) rhythm.pie = d3.select(pieRef).append('svg')
        .attr('width', pieOpts.width)
        .attr('height', pieOpts.height)
      .append('g')
        .attr('class', 'beats')
        .attr('transform', 'translate(' + (pieOpts.width/2) + ',' + (pieOpts.height/2) + ')');
    });
    this.updatePies();
  },
  getBeats: function (rhythm) { return euclideanRhythm(rhythm.onNotes, rhythm.totalNotes); },
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

    self.setState({rhythmIndex: ++state.rhythmIndex});
    state.rhythms.forEach(function (rhythm) {
      var beats = self.getBeats(rhythm);
      if (beats[state.rhythmIndex % beats.length]) {
        MIDI.noteOn(midiOpts.channel, midiOpts.note, midiOpts.velocity, 0);
        MIDI.noteOff(midiOpts.channel, midiOpts.note, midiOpts.duration);
      }
    });
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
    var match = evt.target.name.match(/(\w+)-(\d+)/);
    if (!match) throw new Error("unknown element '"+evt.target.name+"'");
    this.state.rhythms[Number(match[2])][match[1]] = Number(evt.target.value);
    this.setState({rhythms: this.state.rhythms});
    this.stop();
  },
  addRhythm: function (evt) {
    var self = this;
    self.setState({rhythms: self.state.rhythms.concat([{
      onNotes: 3,
      totalNotes: 8
    }])});
  },
  updatePies: function () {
    var self = this;
    var state = self.state;
    var pieOpts = state.pieOpts;
    state.rhythms.forEach(function (rhythm, i) {
      var pieRef = self.refs['pie-'+i];
      if (pieRef && !rhythm.pie) rhythm.pie = d3.select(pieRef).append('svg')
        .attr('width', pieOpts.width)
        .attr('height', pieOpts.height)
      .append('g')
        .attr('class', 'beats')
        .attr('transform', 'translate(' + (pieOpts.width/2) + ',' + (pieOpts.height/2) + ')');
      self.updatePie(rhythm);
    });
    self.render();
  },
  updatePie: function (rhythm) {
    if (!rhythm.pie) return;

    var self = this;
    var state = self.state;
    var pieOpts = state.pieOpts;

    var beats = self.getBeats(rhythm);
    var slice = rhythm.pie.selectAll('.beat')
      .data(pieOpts.pie(beats));

    slice.enter()
      .insert('path')
      .attr('class', 'beat');

    slice
      .transition().duration(pieOpts.transitionDuration)
      .attrTween('d', function (d) {
        var interpolate = d3.interpolate(this._current || d, d);
        this._current = interpolate(0);
        return function (t) { return pieOpts.arc(interpolate(t)); };
      })

    slice.exit()
      .remove();

    slice.style('fill', function (d, i) {
      return state.state === 'play' && (state.rhythmIndex % beats.length) === i
        ? pieOpts.playColor
        : d.data
          ? pieOpts.onColor
          : pieOpts.offColor;
    });
  },
  render: function () {
    var self = this;
    return (
      <div>
        <div className="btn-group" role="group" aria-label="...">
          <button type="button" className="btn btn-primary" onClick={self.toggle}>
            <span className={'glyphicon glyphicon-'+self.getNextState()} aria-hidden="true"></span>
          </button>
          <button type="button" className="btn btn-success" onClick={self.addRhythm}>
            <span className="glyphicon glyphicon-plus" aria-hidden="true"></span>
          </button>
        </div>
        <div>{self.state.rhythms.map(function (rhythm, i) {
          return (
            <div className="row" key={i}>
              <div className="col-xs-4">
                <label htmlFor={'onNotes-'+i}>On notes</label>
                <input name={'onNotes-'+i} value={rhythm.onNotes} onChange={self.onChange} type="number" step="1" min="0" max={rhythm.totalNotes} id={'onNotes-'+i} className="form-control" />
                <p className="help-block">Total number of notes that will be played in the measure.</p>
              </div>
              <div className="col-xs-4">
                <label htmlFor={'totalNotes-'+i}>Total notes</label>
                <input name={'totalNotes-'+i} value={rhythm.totalNotes} onChange={self.onChange} type="number" step="1" min={rhythm.onNotes} max="64" id={'totalNotes-'+i} className="form-control" />
                <p className="help-block">Total number of notes in a measure.</p>
              </div>
              <div className="col-xs-4">
                <div ref={'pie-'+i} className="text-center"></div>
              </div>
            </div>
          );
        })}</div>
      </div>
    );
  }
});

var component = ReactDOM.render(<EuclideanRhythmDemo />,
  document.getElementById('euclidean-rhythm')
);
