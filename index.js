var retrieveArguments = require('retrieve-arguments'),
    me = {};
require('./includes-polyfill');
require('./starts-with-polyfill');

me = function(gulp, processArgv) {
  var taskFn = gulp.task;
  gulp.argv = processArgv;

  gulp.task = function(name, dep, fn) {
    var fnArgs, argv, injections, newFn, callbackIndex;

    if (!fn && typeof dep === 'function') {
      fn = dep;
      dep = undefined;
    }
    dep = dep || [];
    fn = fn || function() {};

    fnArgs = retrieveArguments(fn);
    argv = me.getParams(gulp.argv);
    injections = me.getInjections(fnArgs, argv);
    callbackIndex = me.getCallbackIndex(fnArgs);

    if(callbackIndex >= 0) {
      newFn = function(callback) {
        injections.splice(callbackIndex, 0, callback);
        return fn.apply(gulp, injections);
      }
    } else {
      newFn = function() {
        return fn.apply(gulp, injections);
      };
    }

    return taskFn.call(gulp, name, dep, newFn);
  };

  return gulp;
};

me.getParams = function(argv) {
  var sliceIndex = 3;
  if (argv[2] && argv[2].startsWith('-')) {
    sliceIndex = 2;
  }
  return argv.slice(sliceIndex);
};

me.getCallbackIndex = function(fnArgs) {
  for (var i = 0; i < fnArgs.length; i++) {
    if (fnArgs[i] === 'callback') {
      return i;
    }
  }
  return -1;
}

me.getInjections = function(fnArgs, keys) {
  var injections = [];

  for (var i = 0; i < fnArgs.length; i++) {
    var key = fnArgs[i],
      index, next;
    if (key === 'callback') {
      continue;
    }

    if (includes(keys, key) || includesShort(keys, key[0])) {
      if (includes(keys, key)) {
        index = keys.indexOf('--' + key);
      } else {
        index =  keys.indexOf('-' + key[0]);
      }
      next = keys[index + 1];
      if (next && !next.startsWith('-')) {
        injections.push(next);
      } else {
        injections.push(true);
      }
    } else {
      injections.push(null);
    }
  }
  return injections;
};

function includes(keys, key) {
  return keys.includes('--' + key);
}

function includesShort(keys, key) {
  return keys.includes('-' + key[0]);
}

module.exports = me;
