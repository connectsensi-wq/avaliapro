import { Roles } from "@/types/global";
import { auth } from "@clerk/nextjs/server";

export const checkRole = async (role: Roles) => {
  const { sessionClaims } = await auth();

  return sessionClaims?.metadata?.role === role.toLowerCase();
};

export const getRole = async () => {
  const { sessionClaims } = await auth();

  const role = sessionClaims?.metadata.role!?.toLowerCase() || "professional";

  return role;
};
