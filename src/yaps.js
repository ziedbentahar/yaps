(function(name, definition, context) {
  'use strict';
    if (typeof module !== 'undefined') {
      module.exports = definition();
    } else if (typeof define === 'function' && typeof define.amd === 'object') {
      define(definition);
    } else {
      context[name] = definition();
    }
}) ('yaps' , function() {
  'use strict';

  var handlerId = 0;
  var subscription = {};
  var lastvalue = {};
  var regexpSubscibers = [];

  Function.prototype.handleException = function() {
    var self = this;

    return function() {
      try {
        self.apply(self, arguments);
      } catch (err) {
        console.log('Exception occured  ' + err);
      }
    };
  };

  function notify(handler, data, async) {
    if (async === true) {
      setTimeout(function() {
        handler(data);
      }, 0);
    } else {
      handler(data);
    }
  }

  function handleSubscriber(channel, subscriber) {
    if (!subscription.hasOwnProperty(channel)) {
      subscription[channel] = [];
    }
    subscription[channel].push(subscriber);

    if (lastvalue[channel] !== 'undefined') {
      notify(subscriber.handler, lastvalue[channel],
        subscriber.async);
      }
    }

    function handleRegExpSubscriber(subscriber) {
      for (var prop in subscription) {
        if (subscription.hasOwnProperty(prop) &&
        prop.match(subscriber.match) &&
        subscription[prop].indexOf(subscriber) === -1) {
          handleSubscriber(prop, subscriber);
        }
      }
    }

    return {
      'pub': function(channel, data, lastValueCache) {

        if(lastValueCache === true)
          lastvalue[channel] = data;

        var subs = subscription[channel];

        if (subs !== 'undefined') {
          for (var i = 0; i < subs.length; i++) {
            notify(subs[i].handler, data, subs[i].async);
          }
        } else {
          subscription[channel] = [];
        }

        for (var s = 0; s < regexpSubscibers.length ; s++) {
          handleRegExpSubscriber(regexpSubscibers[s]);
        }
      },

      'sub': function(channel, evtHandler, async) {

        var subscriber = {
          id: 'subid_' + (++handlerId),
          handler: evtHandler.handleException(),
          async: async || false,
          match: channel
        };

        if (channel instanceof RegExp) {
          regexpSubscibers.push(subscriber);
          handleRegExpSubscriber(subscriber);
        } else {
          handleSubscriber(channel, subscriber);
        }

        return function() {
          for (var i = 0; i < subscription[channel].length; i++) {
            if (subscription[channel][i].evtHandler === evtHandler) {
              delete subscription[channel][i].evtHandler;
              delete subscription[channel][i];
              subscription[channel].splice(i, 1);
              break;
            }
          }
        };
      }
    };
  }, this);
