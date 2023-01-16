module.exports = function (onNotes, totalNotes) {
  if (onNotes > totalNotes) {
    throw new Error('on notes cannot be greater than number of notes');
  }

  // Run the Euclid algorithm and store all the intermediate results.
  var counts = [];
  var remainders = [onNotes];
  var divisor = totalNotes - onNotes;
  var level = 0;
  while (true) {
    counts.push(Math.floor(divisor / remainders[level]));
    remainders.push(divisor % remainders[level]);
    divisor = remainders[level];
    level++;
    if (remainders[level] <= 1) {
      break;
    }
  }
  counts.push(divisor);

  // Build out the pattern.
  var pattern = [];
  function build(curLevel) {
    if (curLevel === -1) {
      pattern.push(0);
      return;
    }
    if (curLevel === -2) {
      pattern.push(1);
      return;
    }
    for (var i = 0; i < counts[curLevel]; i++) {
      build(curLevel - 1);
    }
    if (remainders[curLevel] !== 0) {
      build(curLevel - 2);
    }
  }
  build(level);

  // Pattern starts with a 1. Ensure that's the case.
  var firstOnPulse = pattern.indexOf(1);
  return pattern.slice(firstOnPulse).concat(pattern.slice(0, firstOnPulse));
}
