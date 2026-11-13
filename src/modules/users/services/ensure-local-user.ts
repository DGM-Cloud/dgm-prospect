import { userRepository } from "../repositories/user-repository";
import {
  LOCAL_SHELL_USER_EMAIL,
  LOCAL_SHELL_USER_ID,
  LOCAL_SHELL_USER_NAME,
} from "../constants";

export async function ensureLocalShellUser() {
  return userRepository.upsertFromAuth({
    id: LOCAL_SHELL_USER_ID,
    email: LOCAL_SHELL_USER_EMAIL,
    fullName: LOCAL_SHELL_USER_NAME,
    role: "ADMIN",
  });
}
