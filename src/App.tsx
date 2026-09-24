import { useEffect } from "react";
import { HomePage } from "./components/HomePage";
import { SplitBillWizard } from "./components/SplitBillWizard";
import { detectRegionByIp } from "./lib/geoip";
import { useEntriesStore } from "./store/useEntriesStore";
import { useReceiptStore } from "./store/useReceiptStore";

export default function App() {
  const view = useEntriesStore((s) => s.view);
  const applyDetectedRegion = useReceiptStore((s) => s.applyDetectedRegion);

  useEffect(() => {
    let cancelled = false;
    detectRegionByIp().then((region) => {
      if (region && !cancelled) applyDetectedRegion(region);
    });
    return () => {
      cancelled = true;
    };
  }, [applyDetectedRegion]);

  return view === "home" ? <HomePage /> : <SplitBillWizard />;
}
