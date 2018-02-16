//Ported from https://github.com/pushkarnagle/gekko-buy_atsell_at
var z = require('zero-fill'),
    n = require('numbro')
var previous_action = 'sell'
var previous_action_price = Infinity

module.exports = {
    name: 'buy_at_sell_at',
    description: 'Simple strategy that buys and sells at predefined percentages with built in stop-loss and market-up rebuying functionality.',

    getOptions: function() {
        this.option('period', 'period length, same as --periodLength', String, '2m')
        this.option('period_length', 'period length, same as --period', String, '2m')
        this.option('min_periods', 'min. number of history periods', Number, 60)
        this.option('buy_at', 'Buy when the price surges to x% of the bought price or current balance on initial start (e.g. 1.15 for 15%).', Number, '1.05')
        this.option('sell_at', 'Buy again if the price goes down to u% (0.97 for 3%) of the sold price.', Number, '0.97')
        this.option('stop_loss_pct', 'Sell when the price drops below y% (0.95 for 5%) of the bought price.', Number, '0.95')
        this.option('sell_at_up', 'Buy again if the price surges to z% (1.01 for 1%) of last sold price.', Number, '1.01')
    },

    calculate: function(s) {
        //console.log(s);
    },

    onPeriod: function(s, cb) {
        if (!s.in_preroll) {
            if (previous_action === 'buy') {
                // calculate the minimum price in order to sell
                s.period.threshold = previous_action_price * s.options.buy_at

                // calculate the stop loss price in order to sell
                s.stop_loss = previous_action_price * s.options.stop_loss_pct

                // we sell if the price is more than the required threshold or equals stop loss threshold
                if ((s.period.close > s.period.threshold) || (s.period.close < s.stop_loss)) {
                    s.signal = 'sell'
                    previous_action = 'sell'
                    previous_action_price = s.period.close
                }
            } else if (previous_action === 'sell') {
                // calculate the minimum price in order to buy
                s.period.threshold = previous_action_price * s.options.sell_at

                // calculate the price at which we should buy again if market goes up
                s.sell_at_up_price = previous_action_price * s.options.sell_at_up

                // we buy if the price is less than the required threshold or greater than Market Up threshold
                if ((s.period.close < s.period.threshold) || (s.period.close > s.sell_at_up_price)) {
                    s.signal = 'buy'
                    previous_action = 'buy'
                    previous_action_price = s.period.close
                }
            }
        }
        cb()
    },

    onReport: function(s) {
        let paColor = 'grey'
        let pcColor = 'grey'
        s.period.next_action = 'buy'

        if (previous_action === 'sell') {
            paColor = 'green'
            s.period.next_action = 'buy'
            s.period.sls = s.sell_at_up_price
        } else if (previous_action === 'buy') {
            paColor = 'red'
            s.period.next_action = 'sell'
            s.period.sls = s.stop_loss
        }

        if ((s.period.next_action === 'sell') && ((s.period.close >= s.period.threshold) || (s.period.close <= s.stop_loss))) {
            pcColor = 'red'
        } else if ((s.period.next_action === 'buy') && ((s.period.close <= s.period.threshold) || (s.period.close >= s.sell_at_up_price))) {
            pcColor = 'green'
        } else {
            pcColor = 'grey'
        }

        var cols = []
        cols.push(('  ' + s.period.next_action + '  ')[paColor])
        cols.push(z(8, n(s.period.threshold).format('0.00'), ' ')[paColor])
        cols.push(z(8, n(s.period.close).format('0.00'), ' ')[pcColor])
        cols.push(z(8, n(s.period.sls).format('0.00'), ' ')[paColor])
        return cols
    }
}