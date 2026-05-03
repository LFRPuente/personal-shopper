import { V } from './utils.js';

const AppContext = V.createContext(null);
const AppServicesContext = V.createContext(null);
const CalculatorContext = V.createContext(null);
const LayoutProfileContext = V.createContext(null);
const ShipmentsContext = V.createContext(null);
const ShoppingsContext = V.createContext(null);
const ClientsContext = V.createContext(null);
const HomeContext = V.createContext(null);

export const AppProvider = AppContext.Provider;
export const AppServicesProvider = AppServicesContext.Provider;
export const CalculatorProvider = CalculatorContext.Provider;
export const LayoutProfileProvider = LayoutProfileContext.Provider;
export const ShipmentsProvider = ShipmentsContext.Provider;
export const ShoppingsProvider = ShoppingsContext.Provider;
export const ClientsProvider = ClientsContext.Provider;
export const HomeProvider = HomeContext.Provider;

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

export const useShipmentsContext = () => {
  const ctx = V.useContext(ShipmentsContext);
  if (!ctx) throw new Error("useShipmentsContext must be used within ShipmentsProvider");
  return ctx;
};

export const useShoppingsContext = () => {
  const ctx = V.useContext(ShoppingsContext);
  if (!ctx) throw new Error("useShoppingsContext must be used within ShoppingsProvider");
  return ctx;
};

export const useClientsContext = () => {
  const ctx = V.useContext(ClientsContext);
  if (!ctx) throw new Error("useClientsContext must be used within ClientsProvider");
  return ctx;
};

export const useHomeContext = () => {
  const ctx = V.useContext(HomeContext);
  if (!ctx) throw new Error("useHomeContext must be used within HomeProvider");
  return ctx;
};

export default AppContext;
