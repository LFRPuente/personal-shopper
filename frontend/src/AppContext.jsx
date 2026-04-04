import { V } from './utils.js';

const AppContext = V.createContext(null);

export const AppProvider = AppContext.Provider;

export const useApp = () => {
  const ctx = V.useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};

export default AppContext;
