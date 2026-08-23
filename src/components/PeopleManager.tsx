import { useState } from "react";
import { Button } from "./catalyst/Button/Button";
import { Card } from "./catalyst/Card/Card";
import { Input } from "./ui/Input";
import { useReceiptStore } from "../store/useReceiptStore";

export function PeopleManager() {
  const people = useReceiptStore((s) => s.people);
  const addPerson = useReceiptStore((s) => s.addPerson);
  const removePerson = useReceiptStore((s) => s.removePerson);
  const renamePerson = useReceiptStore((s) => s.renamePerson);
  const [newName, setNewName] = useState("");

  const submitNewPerson = () => {
    const name = newName.trim();
    if (!name) return;
    addPerson(name);
    setNewName("");
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>Who's splitting the bill?</Card.Title>
        <Card.Description>Add everyone who's chipping in.</Card.Description>
      </Card.Header>
      <Card.Body>
        <div className="space-y-3">
          {people.length > 0 && <p className="text-sm text-text-muted">Name</p>}
          {people.map((person) => (
            <div key={person.id} className="flex items-center gap-2">
              <Input
                label={`Person name`}
                hideLabel
                value={person.name}
                onChange={(e) => renamePerson(person.id, e.target.value)}
              />
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

          <div className="flex items-center gap-2">
            <Input
              label="New person name"
              hideLabel
              placeholder="Add a person"
              value={newName}
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
