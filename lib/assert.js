(function () {
  const results = [];
  const stack = [];
  const record = (status, message, detail) => {
    const entry = { status, message, detail: detail ?? null, groups: stack.slice() };
    results.push(entry);
    const prefix = stack.length ? `[${stack.join(' › ')}]` : '';
    if (status === 'fail') {
      console.error('❌', prefix, message, detail || '');
    } else {
      console.debug('✅', prefix, message);
    }
  };

  const assert = (condition, message) => {
    if (!condition) {
      record('fail', message, new Error(message));
    } else {
      record('pass', message);
    }
  };

  const group = (name, fn) => {
    stack.push(name);
    try {
      fn();
    } catch (error) {
      record('fail', `${name} threw`, error);
    }
    stack.pop();
  };

  const report = () => {
    const summary = results.reduce((acc, entry) => {
      if (entry.status === 'pass') acc.passed += 1;
      else acc.failed += 1;
      return acc;
    }, { passed: 0, failed: 0 });
    return Object.assign({ total: results.length, results: results.slice() }, summary);
  };

  const reset = () => {
    results.length = 0;
    stack.length = 0;
  };

  const api = { assert, group, report, reset };
  if (typeof window !== 'undefined') {
    window.__GALLERY_ASSERT__ = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
