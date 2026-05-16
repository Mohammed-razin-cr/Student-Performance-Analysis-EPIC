import React from "react";

export default function GlassNavbar() {
  return (
    <nav className="glass-navbar mx-auto mt-6 flex w-[900px] max-w-full items-center justify-between rounded-2xl px-8 py-3 shadow-lg backdrop-blur-md">
      <div className="font-bold text-xl text-green-800">Epic</div>
      <ul className="flex gap-6 items-center text-green-900 font-medium">
        <li>
          <a href="#home" className="nav-link active">Home</a>
        </li>
        <li>
          <a href="#about" className="nav-link">About</a>
        </li>
        <li>
          <a href="#features" className="nav-link">Features</a>
        </li>
        <li>
          <a href="#contact" className="nav-link">Contact</a>
        </li>
      </ul>
    </nav>
  );
}
