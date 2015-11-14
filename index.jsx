var React = require('react');
var ReactDOM = require('react-dom');
var DoughnutChart = require('react-chartjs').Doughnut;

var euclideanRhythm = require('./.');

var EuclideanRhythmDemo = React.createClass({
  getInitialState: function () {
    var width = 120;
    var height = 120;
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
        onColor: '#555',
        offColor: '#ddd',
        playColor: '#c00',
        width: width,
        height: height,
        doughnutChartOptions: {
          animateRotate: false,
          showTooltips: false,
          percentageInnerCutout: 80
        }
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
  },
  addRhythm: function (evt) {
    var self = this;
    self.setState({rhythms: self.state.rhythms.concat([{
      onNotes: 4,
      totalNotes: 8
    }])});
  },
  removeRhythm: function (evt) {
    var self = this;
    var match = evt.currentTarget.name.match(/(\w+)-(\d+)/);
    if (!match && match[1] !== 'removeRhythm') throw new Error("unknown element '"+evt.currentTarget.name+"'");

    var i = Number(match[2]);
    var rhythms = self.state.rhythms;
    var removedRhythm = rhythms.splice(i, 1)[0];

    self.setState({rhythms: rhythms});
  },
  render: function () {
    var self = this;
    var state = self.state;
    var pieOpts = state.pieOpts;
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
        <table className="table">
          <thead>
            <tr>
              <th className="col-xs-1"></th>
              <th>On notes</th>
              <th>Total notes</th>
              <th>Rhythm</th>
            </tr>
          </thead>
          <tbody>{state.rhythms.map(function (rhythm, i) {
            var beats = self.getBeats(rhythm);
            return (
              <tr key={i}>
                <td className="col-xs-1">
                  <button name={'removeRhythm-'+i} type="button" className="btn btn-danger" onClick={self.removeRhythm}>
                    <span className="glyphicon glyphicon-remove" aria-hidden="true"></span>
                  </button>
                </td>
                <td><input type="number" step="1" onChange={self.onChange} className="form-control" name={'onNotes-'+i}    value={rhythm.onNotes}    min="0"              max={rhythm.totalNotes} /></td>
                <td><input type="number" step="1" onChange={self.onChange} className="form-control" name={'totalNotes-'+i} value={rhythm.totalNotes} min={rhythm.onNotes} max="64" /></td>
                <td className="text-center">
                  <DoughnutChart redraw
                    width={pieOpts.width}
                    height={pieOpts.height}
                    data={beats.map(function (beat, i) {
                      return {
                        value: 1,
                        color: state.state === 'play' && (state.rhythmIndex % beats.length) === i
                          ? pieOpts.playColor
                          : beat
                            ? pieOpts.onColor
                            : pieOpts.offColor
                      };
                    })}
                    options={pieOpts.doughnutChartOptions} />
                </td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    );
  }
});

var component = ReactDOM.render(<EuclideanRhythmDemo />,
  document.getElementById('euclidean-rhythm')
);
