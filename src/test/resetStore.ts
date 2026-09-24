import { useEntriesStore } from "../store/useEntriesStore";
import { useReceiptStore } from "../store/useReceiptStore";

const initialReceiptState = useReceiptStore.getState();
const initialEntriesState = useEntriesStore.getState();

export function resetReceiptStore() {
  useReceiptStore.setState(initialReceiptState, true);
}

export function resetEntriesStore() {
  useEntriesStore.setState(initialEntriesState, true);
}
