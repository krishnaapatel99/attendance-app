import React, { useEffect, useRef } from "react";
import gsap from "gsap";

function LandingPage() {
  const svgRef = useRef(null);
  const maskRectRef = useRef(null);
  const textRef = useRef(null);

  const tickGroupRef = useRef(null);
  const blueTickRef = useRef(null);
  const leftHandRef = useRef(null);
  const rightHandRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();

    /* 1️⃣ Fade + translate in */
    tl.fromTo(
      svgRef.current.children,
      { opacity: 0, y: 35 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.15,
      }
    );

    /* 2️⃣ Top → bottom white wipe */
    tl.to(
      maskRectRef.current,
      {
        y: 300,
        duration: 1.2,
        ease: "power2.out",
      },
      "-=0.2"
    );
     tl.to(
      [blueTickRef.current],
      {
        
        opacity: 0,
      
      },
      
    );
    /* 3️⃣ Fade out TEXT + BLUE TICK (SAME TIME) */
    tl.to(
      [textRef.current],
      {
        y:30,
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
      },
      "-=0.9"
    );

    /* 4️⃣ OVERLAP HANDS + SCALE (UNCHANGED) */
  /* 4️⃣ OVERLAP BOTH HANDS + SCALE (PERFECT ALIGN) */

// LEFT HAND moves toward center
tl.to(
  leftHandRef.current,
  {
    x: 6,
    y: -10,
    rotation: 55,
    transformOrigin: "100% 50%",
    duration: 0.8,
    ease: "power3.out",
  },
  "+=0.1"
);

// RIGHT HAND moves toward center
tl.to(
  rightHandRef.current,
  {
    x: -25,
    y: 10,
    rotation: -45,
    transformOrigin: "0% 50%",
    duration: 0.8,
    ease: "power3.out",
  },
  "<" // 👈 same time
);

// SCALE at the SAME TIME
tl.to(
  tickGroupRef.current,
  {
    scale: 2.4,
    duration: 0.8,
    ease: "power3.out",
  },
  "<"
);


    tl.to(
      tickGroupRef.current,
      {
        scale: 2.4,
        duration: 0.8,
        ease: "power3.out",
      },
      "<"
    );
    
  

  }, []);

  return (
    <div className="bg-[#DBEAFE] h-screen w-screen flex justify-center items-center">
      <svg
  ref={svgRef}
  width="400"
  height="500"
  viewBox="0 0 260 300"
  xmlns="http://www.w3.org/2000/svg"
  style={{ overflow: "visible" }}
>
  {/* MASK */}
  <defs>
    <mask
      id="topToBottomMask"
      maskUnits="userSpaceOnUse"
      maskContentUnits="userSpaceOnUse"
    >
      <rect width="260" height="300" fill="black" />
      <rect
        ref={maskRectRef}
        x="-200"
        y="-300"
        width="700"
        height="300"
        fill="white"
      />
    </mask>
  </defs>

  {/* TICK GROUP ONLY */}
  <g
    ref={tickGroupRef}
    transform="translate(130 140) scale(1.5) translate(-130 -140)"
  >
    {/* BLUE BASE */}
    <path
      ref={blueTickRef}
      d="M80 140 L115 165 L175 105"
      fill="none"
      stroke="#2563EB"
      strokeWidth="22"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* WHITE LEFT HAND */}
    <path
      ref={leftHandRef}
      d="M80 140 L115 165"
      fill="none"
      stroke="#ffffff"
      strokeWidth="22"
      strokeLinecap="round"
      mask="url(#topToBottomMask)"
    />

    {/* WHITE RIGHT HAND */}
    <path
      ref={rightHandRef}
      d="M115 165 L175 105"
      fill="none"
      stroke="#ffffff"
      strokeWidth="22"
      strokeLinecap="round"
      mask="url(#topToBottomMask)"
    />
  </g>

  {/* TEXT */}
  <text
    ref={textRef}
    x="115"
    y="240"
    textAnchor="middle"
    fontSize="22"
    fontWeight="600"
    fontFamily="Inter, sans-serif"
    fill="#0f172a"
  >
    upasthit
  </text>
</svg>

    </div>
  );
}

export default LandingPage;  