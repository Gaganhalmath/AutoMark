import jwt from "jsonwebtoken";

export const generateToken = (user, departmentId = null) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      departmentId: departmentId ?? null,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    },
  );
};
