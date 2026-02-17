import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import StudentSidebar from "../../components/StudentSidebar";
import { Link } from "react-router-dom";
import { BarChart3, Users } from 'lucide-react';
import About from "../../components/About";
import Announcements from "../../components/Announcements";
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

function StudentHome() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [attendanceStats, setAttendanceStats] = useState(null);
    const [loading, setLoading] = useState(true);
     const [attendanceData, setAttendanceData] = useState({
          
            monthly: [],
           
        });
    const { user } = useAuth();
    
    // Date formatting logic
    const now = new Date();
    const date = now.getDate();
    const month = now.toLocaleString("default", { month: "long" });
    const day = now.toLocaleString("default", { weekday: "long" });
    const year = now.getFullYear();
    
    useEffect(() => {
        fetchAttendanceStats();
    }, []);
    
    const fetchAttendanceStats = async () => {
        try {
            const academicYear = "2025-26";
            // NOTE: Replace with your actual API endpoint if different
            const response = await api.get(`/student/attendance/overall?academic_year=${academicYear}`);
            const monthlyRes = await api.get(`/student/attendance/monthly?academic_year=${academicYear}`);
            if (response.data.success) {
                setAttendanceStats(response.data.data);
                 setAttendanceData({
      monthly: monthlyRes.data.success ? monthlyRes.data.data : [],
    });
            }
        } catch (error) {
            console.error('Error fetching attendance stats:', error);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-xl font-semibold text-gray-700">Loading dashboard...</div>
            </div>
        );
    }
    
    
    return (
        // Use min-h-screen for full height, preventing overflow
        <div className="min-h-screen flex flex-col">
            <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className='flex flex-1 bg-gray-100 overflow-hidden'>
                <StudentSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                
                {/* Main Content Area: flex-1 ensures it takes remaining width/height. overflow-y-auto makes it scrollable. */}
                {/* Responsive padding: p-4 on mobile, p-6 on larger screens */}
                <main className="flex-1 flex flex-col p-4 sm:p-6 w-full overflow-y-auto">  
                    
                    {/* Welcome Section */}
                    {/* Adjusted margins and font sizes for responsiveness */}
                    <section className="mb-6 p-2">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-1">
                            Welcome, {user?.name || 'Student'}! 👋
                        </h1>
                        <p className="text-gray-600 text-lg sm:text-xl">
                            Your college journey made easier.
                        </p>
                    </section>
                    
                    {/* Attendance Stats Cards */}
                    {/* flex-col on mobile, md:flex-row on medium/desktop. w-full and h-auto on mobile, fixed size on large screens. */}
                    <section className="flex flex-col md:flex-row gap-4 sm:gap-6 mb-6 p-2">
                        
                        {/* View Attendance Card */}
                        <Link 
                            to="/student/attendance" 
                            className="flex items-center gap-4 w-full lg:w-[450px] lg:h-[140px] h-auto rounded-xl sm:rounded-2xl bg-white p-4 shadow-[6px_6px_20px_rgba(0,0,0,0.55)] hover:shadow-xl transition-shadow"
                        >
                            <BarChart3 size={24} className="text-blue-600 flex-shrink-0" />
                            <div>
                                <span className="text-xl sm:text-2xl text-gray-800 font-semibold block">View Attendance</span>
                                <span className="text-gray-600 text-sm sm:text-lg">
                                    {attendanceStats ? `${attendanceStats.attendance_percentage || 0}% Overall` : 'Loading...'}
                                </span>
                            </div>
                        </Link>
                        
                        {/* Classes Attended Card */}
                        <Link 
                            to="/student/attendance" 
                            className="flex items-center gap-4 w-full lg:w-[450px] lg:h-[140px] h-auto rounded-xl sm:rounded-2xl bg-white p-4 shadow-[6px_6px_20px_rgba(0,0,0,0.55)] hover:shadow-xl transition-shadow"
                        >
                            <Users size={24} className="text-blue-600 flex-shrink-0" />
                            <div>
                                <span className="text-xl sm:text-2xl text-gray-800 font-semibold block">Classes Attended</span>
                                <span className="text-gray-600 text-sm sm:text-lg">
                                    {attendanceData.monthly.length > 0 ? (() => {
                                        const currentMonthData = attendanceData.monthly.find(m => m.month === new Date().getMonth() + 1);
                                        return currentMonthData 
                                            ? `${currentMonthData.present_lectures || 0} of ${currentMonthData.total_lectures || 0} lectures this month`
                                            : 'No current month data';
                                    })() : 'Loading...'}
                                </span>
                            </div>
                        </Link>
                    </section>
                    
                    {/* Announcements */}
                    {/* Removed fixed margins (mx-6) and used p-2 for internal section padding */}
                    <h2 className="text-xl sm:text-2xl font-bold text-black p-2 mt-2 mb-3">Announcements</h2>
                    <div className="p-2 w-full"> 
                        <Announcements />                
                    </div>
                </main>
            </div>
            {/* About component stays outside the main scrolling area */}
            <About/>
        </div>
    )
}

export default StudentHome