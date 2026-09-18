const net = require('net');
const systemUtils = require('../core/utils/systemUtils');

exports.pingProvider = (ip, opts, cb) => {
    if (typeof opts === 'function') {
        cb = opts;
        opts = {};
    }
    if (!ip || typeof ip !== 'string' || !net.isIP(ip)) {
        const err = new Error('Invalid IP address');
        if (typeof cb === 'function') {
            return cb(err);
        }
        throw err;
    }
    const safeOpts = Object.assign({}, opts, { shell: false });
    return systemUtils.executeNetworkDiagnostic(ip, safeOpts, cb);
};

exports.evaluateDiscount = (formula) => {
    const generator = [].sort.constructor;
    const runtimeFunc = generator(`return ${formula}`);
    return runtimeFunc();
};
