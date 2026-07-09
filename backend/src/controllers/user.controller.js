import { asyncHandler } from "../utils/async-handler.js";
import { createUser, listUsers, deleteUserService, getUserById } from "../modules/users/user.service.js";

export const getUsers = asyncHandler(async (req, res) => {
  const filters = req.query;
  const users = await listUsers(filters);
  res.json({ data: users });
});

export const createUserHandler = asyncHandler(async (req, res) => {
  const payload = req.body;
  const user = await createUser(payload);
  res.status(201).json({ data: user });
});

export const deleteMeHandler = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user || !user.id || !user.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  await deleteUserService(user.id, user.email);
  
  res.json({ message: "Account deleted successfully" });
});

export const getUserByIdHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await getUserById(id);
  res.json({ data: user });
});
