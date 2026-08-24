import { useState } from "react";
import { Button } from "./catalyst/Button/Button";
import { Card } from "./catalyst/Card/Card";
import { Input } from "./ui/Input";
import { countryCodes, flagEmoji } from "../lib/countryCodes";
import { currencies } from "../lib/currencies";
import { useReceiptStore } from "../store/useReceiptStore";
import {
  DUPLICATE_NAME_MESSAGE,
  getDateError,
  getDuplicateNameIndices,
  getNameError,
  getPhoneError,
  getWildcardError,
  isNameTaken,
} from "../lib/validation";

function defaultPhoneCountry(): string {
  try {
    return new Intl.Locale(navigator.language).maximize().region ?? "US";
  } catch {
    return "US";
  }
}
const DEFAULT_PHONE_COUNTRY = defaultPhoneCountry();

export function PeopleManager() {
  const receiptName = useReceiptStore((s) => s.receiptName);
  const receiptDate = useReceiptStore((s) => s.receiptDate);
  const currency = useReceiptStore((s) => s.currency);
  const setReceiptName = useReceiptStore((s) => s.setReceiptName);
  const setReceiptDate = useReceiptStore((s) => s.setReceiptDate);
  const setCurrency = useReceiptStore((s) => s.setCurrency);
  const people = useReceiptStore((s) => s.people);
  const addPerson = useReceiptStore((s) => s.addPerson);
  const removePerson = useReceiptStore((s) => s.removePerson);
  const renamePerson = useReceiptStore((s) => s.renamePerson);
  const setPersonPhone = useReceiptStore((s) => s.setPersonPhone);
  const setPersonCountry = useReceiptStore((s) => s.setPersonCountry);
  const [newName, setNewName] = useState("");

  const submitNewPerson = () => {
    const name = newName.trim();
    if (!name || getNameError(name) !== null) return;
    if (isNameTaken(name, people.map((p) => p.name))) return;
    addPerson(name);
    setNewName("");
  };

  const duplicateIndices = getDuplicateNameIndices(people.map((p) => p.name));

  return (
    <Card>
      <Card.Header>
        <Card.Title>Who's splitting the bill?</Card.Title>
        <Card.Description>Add everyone who's chipping in.</Card.Description>
      </Card.Header>
      <Card.Body>
        <div className="mb-4 grid grid-cols-2 gap-3 border-b border-border pb-4">
          <Input
            label="Receipt name"
            placeholder="Add receipt name"
            value={receiptName}
            error={getWildcardError(receiptName)}
            onChange={(e) => setReceiptName(e.target.value)}
          />
          <Input
            label="Date"
            type="date"
            value={receiptDate}
            error={getDateError(receiptDate)}
            onChange={(e) => setReceiptDate(e.target.value)}
          />
          <div>
            <label htmlFor="receipt-currency" className="mb-1 block text-sm text-text-muted">
              Currency
            </label>
            <select
              id="receipt-currency"
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-3">
          {people.length > 0 && <p className="text-sm text-text-muted">Name</p>}
          {people.map((person, index) => (
            <div key={person.id} className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <Input
                  label={`Person name`}
                  hideLabel
                  value={person.name}
                  error={
                    getNameError(person.name) ?? (duplicateIndices.has(index) ? DUPLICATE_NAME_MESSAGE : null)
                  }
                  onChange={(e) => renamePerson(person.id, e.target.value)}
                />
              </div>
              <div className="w-32 shrink-0">
                <label htmlFor={`phone-country-${person.id}`} className="sr-only">
                  {person.name || "Person"} phone country
                </label>
                <select
                  id={`phone-country-${person.id}`}
                  className="h-10 w-full rounded-md border border-border bg-surface px-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                  value={person.phoneCountry ?? DEFAULT_PHONE_COUNTRY}
                  onChange={(e) => setPersonCountry(person.id, e.target.value)}
                >
                  {countryCodes.map((c) => (
                    <option key={c.iso2} value={c.iso2}>
                      {flagEmoji(c.iso2)} {c.dialCode}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0 flex-1">
                <Input
                  label={`${person.name || "Person"} phone number`}
                  hideLabel
                  type="tel"
                  placeholder="Phone (optional)"
                  value={person.phone ?? ""}
                  error={getPhoneError(person.phone ?? "")}
                  onChange={(e) => setPersonPhone(person.id, e.target.value)}
                />
              </div>
              <Button
                variant="ghost"
                size="md"
                iconOnly
                aria-label={`Remove ${person.name || "person"}`}
                onClick={() => removePerson(person.id)}
              >
                ✕
              </Button>
            </div>
          ))}

          <div className="flex items-start gap-2">
            <Input
              label="New person name"
              hideLabel
              placeholder="Add a person"
              value={newName}
              error={
                newName.length > 0
                  ? (getNameError(newName) ??
                    (isNameTaken(newName, people.map((p) => p.name)) ? DUPLICATE_NAME_MESSAGE : null))
                  : null
              }
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitNewPerson();
              }}
            />
            <Button variant="secondary" onClick={submitNewPerson}>
              Add
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
