/**
 * Logging utility
 *
 * @author Mark Jivko
 */
module.exports = {

    error: function() {
        console.log('\x1b[31m', ...arguments, '\x1b[0m');
    },

    warn: function () {
        console.log('\x1b[33m', ...arguments, '\x1b[0m');
    },

    info: function () {
        console.log('\x1b[34m', ...arguments, '\x1b[0m');
    },

    debug: function () {
        console.log('\x1b[30m', ...arguments, '\x1b[0m');
    }
}

/* EOF */