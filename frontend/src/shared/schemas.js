const { z } = require("zod"); // Use 'import' if using ES Modules

const UserSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  zip: z.string().regex(/^\d{5}$/, "Must be a 5-digit ZIP")
});

module.exports = { UserSchema };