import { Button } from "@/components/ui/button";
import { getRole } from "@/utils/roles";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const {userId} = await auth();
  const role = await getRole();

  //f(userId && role) {
    //redirect(`/${role}`);
  //}

  return ( 
  <div className="flex flex-col items-center justify-center h-screen p-6">
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-center">
            Welcome to <br/>
          <span className="text-blue-700 text-5xl md:text-6xl">Kinda VisionMed</span>
          </h1>
      </div>
      <div className="text-center max-w-xl flex flex-col items-center justify-center">
        <p className="mb-8">
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Et, hic recusandae cumque 
          atque, similique error excepturi ratione dolorum dolorem dolore ad perspiciatis autem 
          id doloremque quos ipsum animi fugiat ipsa?
        </p>
        <div className="flex gap-4">
          {userId ? (
            <>
              <Link href={`/${role}`}>
                <Button>View Dashboard</Button>
              </Link>
              <UserButton/> </>) : (
            <>
            <Link href="/sign-up">
              <Button className="md-text-base font-light">New User</Button>
            </Link>
            <Link href="/sign-in">
              <Button
              variant="outline"
              className="md:text-base underline hover:text-blue-600">Login to account</Button>
            </Link>
            </>
          )}
        </div>
      </div>
    </div>
    <footer className="mt-8">
      <p className="text-center text-sm">
          &copy; 2025 Kinda SensiConnect Management System. All rights reserved.
      </p>
    </footer>
  </div>
  )
}