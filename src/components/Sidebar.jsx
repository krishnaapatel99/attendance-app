// components/Sidebar.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { user, loading } = useAuth();
   const isAdvisor = user?.advisor?.isAdvisor;
  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-64 bg-[#3F51B5] z-40 transform 
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          transition-transform duration-300 
          
          /* DESKTOP STYLES: Define width once, use md:static for normal flow, stretch vertically */
          md:static 
          md:translate-x-0 
          md:w-64 /* Applied w-64 */
          md:ml-8 /* Spacing from the left edge */
          md:self-stretch /* IMPORTANT: Forces the sidebar to take full height of the parent flex container */
          md:h-auto /* Allows flex-parent to control height */
          
          flex flex-col rounded-xl p-4 gap-3`}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="text-white block md:hidden mb-4 self-end"
        >
          ✕
        </button>

        <Link
          to="/teacher"
          className="bg-[#2C397f] w-full mt-6 font-medium hover:bg-[#192048] text-center rounded-lg text-white py-3 active:scale-95 duration-200"
        >
          Home
        </Link>
        <Link
          to="/teacher/attendance"
          className="bg-[#2C397f] w-full font-medium hover:bg-[#192048] text-center rounded-lg text-white py-3 active:scale-95 duration-200"
        >
          Attendance
        </Link>
        <Link
          to="/teacher/timetable"
          className="bg-[#2C397f] w-full font-medium hover:bg-[#192048] text-center rounded-lg text-white py-3 active:scale-95 duration-200"
        >
          Timetable
        </Link>
        <Link
          to="/teacher/announcement"
          className="bg-[#2C397f] w-full font-medium hover:bg-[#192048] text-center rounded-lg text-white py-3 active:scale-95 duration-200"
        >
          Announcement
        </Link>
        {isAdvisor && (
          <Link
            to="/teacher/advisor"
            className="bg-[#2C397f] w-full font-medium hover:bg-[#192048] text-center rounded-lg text-white py-3 active:scale-95 duration-200"
          >
            Advisor
          </Link>
        )}
      </div>
    </>
  );
}

export default Sidebar;
