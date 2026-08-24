import { useReceiptStore } from "../store/useReceiptStore";

const initialState = useReceiptStore.getState();

export function resetReceiptStore() {
  useReceiptStore.setState(initialState, true);
}
