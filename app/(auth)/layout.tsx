import React from 'react'
import Image
 from 'next/image';
const AuthLayout = ({children} :{children: React.ReactNode}) => {
  return (
    <div className="w-full f-screen flex items-center justify-center">
        <div className="w-1/2 h-full flex items-center justify-center">{children}</div>
        <div className="hidden md:flex w-1/2 h-full relative">
            <Image src="https://images.pexels.com/photos/8653452/pexels-photo-8653452.jpeg?_gl=1*1c51vcc*_ga*MjE0MDAzOTM1Ni4xNzQ0OTM5Nzgz*_ga_8JE65Q40S6*czE3NTgwNjc0NTAkbzIkZzEkdDE3NTgwNjc2ODIkajIwJGwwJGgw"
            width={750}
            height={750}
            alt="Doctors"
            className="w-full h-full object-cover"/>
            <div className="absolute top-0 w-full h-full z-10 flex flex-col items-center justify-center">
                <h1 className="text-3xl 2xl:text-5xl font-bold text-white">Kinda VisionMed</h1>
                <p className="text-white">You're Welcome</p>
            </div>
        </div>
    </div>
  );
};

export default AuthLayout;