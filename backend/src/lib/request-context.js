import { AsyncLocalStorage } from "async_hooks";

const requestContextStorage = new AsyncLocalStorage();

export const requestContextMiddleware = (req, _res, next) => {
  requestContextStorage.run({ req }, () => next());
};

export const getCurrentRequest = () => requestContextStorage.getStore()?.req || null;
