//Ported from https://github.com/askmike/gekko/blob/develop/strategies/TMA.js
var z = require('zero-fill'),
    n = require('numbro'),
    sma = require('../../../lib/sma')
var previous_action = null

module.exports = {
    name: 'tma',
    description: 'Triple Moving Average',

    getOptions: function() {
        this.option('period', 'period length, same as --periodLength', String, '15m')
        this.option('period_length', 'period length, same as --period', String, '15m')
        this.option('min_periods', 'min. number of history periods', Number, 60)
        this.option('tma_short', 'Short moving average', Number, 7)
        this.option('tma_medium', 'Medium moving average', Number, 25)
        this.option('tma_long', 'Long moving average', Number, 99)
    },

    calculate: function(s) {
        sma(s, 'short', s.options.tma_short)
        sma(s, 'medium', s.options.tma_medium)
        sma(s, 'long', s.options.tma_long)

    },

    onPeriod: function(s, cb) {
        if (!s.in_preroll) {

            let short = s.period.short;
            let medium = s.period.medium;
            let long = s.period.long;

            if ((short > medium) && (medium > long)) {
                s.signal = 'buy'
                previous_action = 'buy'
            } else if ((short < medium) && (medium > long)) {
                s.signal = 'sell'
                previous_action = 'sell'
            } else if (((short > medium) && (medium < long))) {
                s.signal = 'sell'
                previous_action = 'sell'
            } else {
                s.signal = null // hold
                previous_action = 'hold'
            }

        }
        cb()
    },

    onReport: function(s) {
        var cols = []
        var color = 'grey'
        if (previous_action === 'hold') {
            color = 'grey'
        } else if (previous_action === 'buy') {
            color = 'green'
        } else {
            color = 'red'
        }
        cols.push(z(4, n(s.options.tma_short).format('0'), ' ')[color])
        cols.push(z(4, n(s.options.tma_medium).format('0'), ' ')[color])
        cols.push(z(4, n(s.options.tma_long).format('0'), ' ')[color])

        return cols
    }
}