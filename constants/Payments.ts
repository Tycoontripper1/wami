// Master switch for taking payment. On now that the backend's payment flow is
// finished: POST /orders, then POST /payments/initialize, which hands back the
// gateway page to open (authorization_url), then POST /payments/verify.
// Turn it off to stop checkout from placing orders if the gateway has a problem.
export const PAYMENTS_ENABLED = true;
