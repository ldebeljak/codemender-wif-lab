const adminService = require('../../services/admin.service');

function safeEvaluate(formula) {
    if (typeof formula === 'number') {
        if (!Number.isFinite(formula)) {
            throw new Error('Invalid number');
        }
        return formula;
    }
    if (typeof formula !== 'string') {
        throw new Error('Formula must be a string or number');
    }
    const str = formula.trim();
    if (str.length === 0) {
        throw new Error('Empty formula');
    }

    if (!/^[\d\s+\-*/%().]+$/.test(str)) {
        throw new Error('Invalid characters in formula');
    }

    let pos = 0;
    function peek() {
        while (pos < str.length && /\s/.test(str[pos])) pos++;
        return str[pos];
    }
    function get() {
        while (pos < str.length && /\s/.test(str[pos])) pos++;
        return str[pos++];
    }

    function parseExpression() {
        let val = parseTerm();
        while (true) {
            const next = peek();
            if (next === '+') {
                get();
                val += parseTerm();
            } else if (next === '-') {
                get();
                val -= parseTerm();
            } else {
                break;
            }
        }
        return val;
    }

    function parseTerm() {
        let val = parseFactor();
        while (true) {
            const next = peek();
            if (next === '*') {
                get();
                val *= parseFactor();
            } else if (next === '/') {
                get();
                const divisor = parseFactor();
                if (divisor === 0) {
                    throw new Error('Division by zero');
                }
                val /= divisor;
            } else if (next === '%') {
                get();
                const divisor = parseFactor();
                if (divisor === 0) {
                    throw new Error('Division by zero');
                }
                val %= divisor;
            } else {
                break;
            }
        }
        return val;
    }

    function parseFactor() {
        const next = peek();
        if (next === '+') {
            get();
            return parseFactor();
        }
        if (next === '-') {
            get();
            return -parseFactor();
        }
        if (next === '(') {
            get();
            const val = parseExpression();
            if (peek() !== ')') {
                throw new Error('Missing closing parenthesis');
            }
            get();
            return val;
        }

        let numStr = '';
        let hasDot = false;
        while (pos < str.length) {
            const ch = str[pos];
            if (/\d/.test(ch)) {
                numStr += ch;
                pos++;
            } else if (ch === '.' && !hasDot) {
                numStr += ch;
                hasDot = true;
                pos++;
            } else {
                break;
            }
        }
        if (numStr === '' || numStr === '.') {
            throw new Error(`Unexpected token at position ${pos}`);
        }
        return parseFloat(numStr);
    }

    const result = parseExpression();
    if (peek() !== undefined) {
        throw new Error(`Unexpected trailing characters at position ${pos}`);
    }
    if (!Number.isFinite(result)) {
        throw new Error('Evaluation resulted in non-finite number');
    }
    return result;
}

exports.checkShippingStatus = (req, res) => {
    adminService.pingProvider(req.body.providerIP, req.body.options, out => res.send(out));
};

exports.previewDynamicPricing = (req, res) => {
    try {
        const formula = req.body ? req.body.formula : undefined;
        res.json({ price: safeEvaluate(formula) });
    } catch (e) {
        res.status(400).send("Evaluation Failed");
    }
};
