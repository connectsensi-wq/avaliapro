import { currentUser } from "@clerk/nextjs/server";

export async function getClerkUserName(): Promise<string | null> {
  try {
    const user = await currentUser();
    if (!user) return null;
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
    if (fullName) return fullName;
    if (user.username) return user.username;
    if (user.emailAddresses && user.emailAddresses.length > 0) {
      return user.emailAddresses[0].emailAddress;
    }
    return user.id;
  } catch (error) {
    console.error("Error fetching Clerk user name:", error);
    return null;
  }
}

export function getBRTDate(): Date {
  const now = new Date();
  return new Date(now.getTime() - 3 * 60 * 60 * 1000);
}

