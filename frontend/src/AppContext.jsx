import { V } from './utils.js';

const AppContext = V.createContext(null);
const AppServicesContext = V.createContext(null);
const CalculatorContext = V.createContext(null);
const LayoutProfileContext = V.createContext(null);

export const AppProvider = AppContext.Provider;
export const AppServicesProvider = AppServicesContext.Provider;
export const CalculatorProvider = CalculatorContext.Provider;
export const LayoutProfileProvider = LayoutProfileContext.Provider;

export const useApp = () => {
  const ctx = V.useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};

export const useAppServices = () => {
  const ctx = V.useContext(AppServicesContext);
  if (!ctx) throw new Error("useAppServices must be used within AppServicesProvider");
  return ctx;
};

export const useCalculatorContext = () => {
  const ctx = V.useContext(CalculatorContext);
  if (!ctx) throw new Error("useCalculatorContext must be used within CalculatorProvider");
  return ctx;
};

export const useLayoutProfileContext = () => {
  const ctx = V.useContext(LayoutProfileContext);
  if (!ctx) throw new Error("useLayoutProfileContext must be used within LayoutProfileProvider");
  return ctx;
};

export default AppContext;
