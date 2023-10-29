import * as Sentry from "@sentry/browser";
//import { Integrations } from "@sentry/tracing";

//const isLocal = process.env.NODE_ENV === "development";
const isLocal = false;

export function initSentry() {
  if (isLocal) {
    return;
  }
  Sentry.init({
    dsn:
      "https://131e9f931cdd401aa1b6f5f1f76807fb@o496852.ingest.sentry.io/5572136",
  });
}

export function logError(error, errorInfo = null) {
  if (isLocal) {
    return;
  }

  Sentry.withScope((scope) => {
    errorInfo && scope.setExtras(errorInfo);
    Sentry.captureException(error);
  });
}

export function onError(error) {
    let errorInfo = {};
    let message = error.toString();
  
    // Auth errors
    if (!(error instanceof Error) && error.message) {
      errorInfo = error;
      message = error.message;
      error = new Error(message);
      // API errors
    } else if (error.config && error.config.url) {
      errorInfo.url = error.config.url;
    }
  
    logError(error, errorInfo);
  
    alert(message);
  }
