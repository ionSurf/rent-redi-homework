import React, { useState } from "react";
import { useUsers } from "./hooks/useUsers";
import { UserRepository } from "./repositories/UserRepository";
import { useAuth } from "./hooks/useAuth"; // Assume similar hook for Auth
import { UserSchema } from "../../shared/schemas";

function App() {
  const { addUser } = useUsers();
  const [form, setForm] = useState({ name: "", zip: "" });
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate locally
    const result = UserSchema.safeParse(form);

    if (!result.success) {
      // Map Zod errors to our state
      const formattedErrors = result.error.format();
      setErrors(formattedErrors);
      return;
    }

    try {
      await addUser(form.name, form.zip);
      setForm({ name: "", zip: "" });
      setErrors({});
    } catch (err) {
      console.error("Submission failed", err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      {errors.name && (
        <span style={{ color: "red" }}>{errors.name._errors[0]}</span>
      )}

      <input
        placeholder="ZIP Code"
        value={form.zip}
        onChange={(e) => setForm({ ...form, zip: e.target.value })}
      />
      {errors.zip && (
        <span style={{ color: "red" }}>{errors.zip._errors[0]}</span>
      )}

      <button type="submit">Add User</button>
    </form>
  );
}

export default App;
