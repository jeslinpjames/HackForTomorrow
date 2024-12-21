import Image from "next/image";
import React from "react";

const Logo = () => {
  return (
    <div className="font-semibold font-serif flex items-center py-4 justify-center text-white">
      <Image src="/logo.png" alt="logo" width={80} height={80} />
      <span className="text-3xl">Inclusify</span>
    </div>
  );
};

export default Logo;
