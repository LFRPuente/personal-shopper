import { V } from '../utils.js';
import { MODULE_AMOUNT_FORMAT } from '../utils.js';
import { useCalculatorContext } from '../AppContext.jsx';

const CalculatorSection = V.memo(function CalculatorSection() {
  const {
    calcMode, calcFactor, calcTaxes, calcDiscount, calcCommission, calcExchangeRate,
    applyCalcModeChange, applyCalcFactorChange, applyCalcDiscountChange,
    applyCalcTaxesChange, applyCalcCommissionChange, applyCalcExchangeRateChange,
  } = useCalculatorContext();

  const [calcPrice, setCalcPrice] = V.useState("");
  const [calcCopied, setCalcCopied] = V.useState(!1);

  const o = parseFloat(calcPrice),
    N = Number.isFinite(o),
    A = N ? o * calcFactor * Math.max(0, 1 - calcDiscount / 100) : Number.NaN,
    vl = N
      ? o *
        Math.max(0, 1 - calcDiscount / 100) *
        (1 + calcCommission / 100) *
        (1 + calcTaxes / 100) *
        calcExchangeRate
      : Number.NaN,
    El = calcMode === "FACTOR" ? A : vl,
    Se = MODULE_AMOUNT_FORMAT;

  const copyCalculatorValue = async (val) => {
    if (!Number.isFinite(val)) return;
    try {
      await navigator.clipboard.writeText(val.toFixed(2));
      setCalcCopied(!0);
      setTimeout(() => setCalcCopied(!1), 1200);
    } catch (err) {
      console.error("Failed to copy calculator result", err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4 border border-border-light dark:border-border-dark bg-gradient-to-br from-sky-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 shadow-sm">
        <h2 className="text-lg font-bold text-text-main dark:text-white">Calculadora</h2>
        <p className="text-xs text-text-sub dark:text-slate-300 mt-1">
          Cambia entre Factor y Porcentaje. Toca el resultado para copiar.
        </p>
        <div className="mt-4 grid grid-cols-2 rounded-xl p-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => applyCalcModeChange("FACTOR")}
            className={`py-2 text-xs font-bold rounded-lg transition ${calcMode === "FACTOR" ? "bg-primary text-white" : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"}`}
          >
            Factor
          </button>
          <button
            onClick={() => applyCalcModeChange("PERCENTAGE")}
            className={`py-2 text-xs font-bold rounded-lg transition ${calcMode === "PERCENTAGE" ? "bg-emerald-600 text-white" : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"}`}
          >
            Porcentaje
          </button>
        </div>
      </div>

      {calcMode === "FACTOR" ? (
        <div className="rounded-2xl p-4 border border-amber-100 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-amber-950/30 shadow-sm space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Precio</label>
            <input
              type="number"
              step="0.01"
              value={calcPrice}
              onChange={(e) => setCalcPrice(e.target.value)}
              className="calc-input mt-1 w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white caret-gray-900 dark:caret-white outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Factor</label>
            <input
              type="number"
              step="0.01"
              value={calcFactor}
              onChange={(e) => applyCalcFactorChange(e.target.value)}
              className="calc-input mt-1 w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white caret-gray-900 dark:caret-white outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Descuento (%)</label>
            <input
              type="number"
              step="0.01"
              value={calcDiscount}
              onChange={(e) => applyCalcDiscountChange(e.target.value)}
              className="calc-input mt-1 w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white caret-gray-900 dark:caret-white outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-emerald-950/30 shadow-sm space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Monto</label>
            <input
              type="number"
              step="0.01"
              value={calcPrice}
              onChange={(e) => setCalcPrice(e.target.value)}
              className="calc-input mt-1 w-full px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white caret-gray-900 dark:caret-white outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="0.00"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">Descuento (%)</label>
              <input
                type="number"
                step="0.01"
                value={calcDiscount}
                onChange={(e) => applyCalcDiscountChange(e.target.value)}
                className="calc-input mt-1 w-full px-2 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white caret-gray-900 dark:caret-white outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">Taxes (%)</label>
              <input
                type="number"
                step="0.01"
                value={calcTaxes}
                onChange={(e) => applyCalcTaxesChange(e.target.value)}
                className="calc-input mt-1 w-full px-2 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white caret-gray-900 dark:caret-white outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">Comision (%)</label>
              <input
                type="number"
                step="0.01"
                value={calcCommission}
                onChange={(e) => applyCalcCommissionChange(e.target.value)}
                className="calc-input mt-1 w-full px-2 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white caret-gray-900 dark:caret-white outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">Tipo de Cambio</label>
              <input
                type="number"
                step="0.01"
                value={calcExchangeRate}
                onChange={(e) => applyCalcExchangeRateChange(e.target.value)}
                className="calc-input mt-1 w-full px-2 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white caret-gray-900 dark:caret-white outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => copyCalculatorValue(El)}
        className="w-full rounded-2xl border border-border-light dark:border-border-dark bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition text-left"
      >
        <p className="text-[10px] uppercase font-bold tracking-wide text-gray-500 dark:text-gray-400">Resultado</p>
        <p className="text-3xl font-black mt-1 text-gray-900 dark:text-white">
          {Number.isFinite(El) ? `$${Se.format(El)}` : "--"}
        </p>
        <p className={`text-xs mt-2 font-semibold transition ${calcCopied ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"}`}>
          {calcCopied ? "Copiado \u2713" : "Toca para copiar"}
        </p>
      </button>
    </div>
  );
});

export default CalculatorSection;
