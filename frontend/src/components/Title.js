import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import Typewriter from "typewriter-effect";

const Title = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/home");
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen min-w-full bg-gray-900 text-white p-4">
      {/* Lottie Animation */}
      <div className="w-48 h-48 mb-2">
        <DotLottieReact
          src="https://lottie.host/9bb57524-3527-47c1-991d-eb374dcc2dd4/oqM8nKIjzk.lottie"
          loop
          autoplay
        />
      </div>
xz
      {/* Title */}
      <h1 className="text-5xl font-extrabold text-orange-600 mb-4 text-center">
        Smart Interview Assistant
      </h1>

      {/* Tagline with Typewriter */}
      <div className="text-xl text-gray-400 text-center">
        <Typewriter
          options={{
            strings: ["Resume Parsing, Timed Q&A, and AI Scoring"],
            autoStart: true,
            loop: true,
            delay: 30,
          }}
        />
      </div>
    </div>
  );
};

export default Title;
