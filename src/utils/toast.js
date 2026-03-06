// Module-level ref for imperative toast calls from any screen
let _show = null;
export function registerToastRef(fn) { _show = fn; }

export const toast = {
    success: (message, title = 'Success') => _show?.('success', message, title),
    error: (message, title = 'Error') => _show?.('error', message, title),
    info: (message, title = 'Info') => _show?.('info', message, title),
};
