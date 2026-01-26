import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { Link } from "react-router-dom";
import { BarChart3, Users } from 'lucide-react';
import About from "../../components/About";
import Announcements from "../../components/Announcements";
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

function TeacherHome() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    
    // Date formatting logic
    const now = new Date();
    const date = now.getDate();
    const month = now.toLocaleString("default", { month: "long" });
    const day = now.toLocaleString("default", { weekday: "long" });
    const year = now.getFullYear();
    
    useEffect(() => {
        fetchDashboardData();
    }, []);
    
    const fetchDashboardData = async () => {
        try {
            // NOTE: Replace '/teacher/dashboard' with your actual API endpoint if different
            const response = await api.get('/teacher/dashboard');
            console.log("DASHBOARD RESPONSE 👉", response.data);
            if (response.data.success) {
                setDashboardData(response.data.data);
            }
            console.log(dashboardData)
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Optionally, set an error state to display to the user
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
        // min-h-screen ensures full height and handles overflow
        <div className="min-h-screen flex flex-col">
            <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className='flex flex-1 bg-gray-100 overflow-hidden'>
                <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                
                {/* Main Content Area: flex-col and overflow-y-auto makes it slideable/scrollable */}
                <main className="flex-1 flex flex-col p-4 sm:p-6 w-full overflow-y-auto">  
                    
                    {/* Welcome Section */}
                    <section className="mb-6 p-2">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-1 sm:mb-2">
                            Welcome, {dashboardData?.teacher?.name || user?.name || 'Teacher'}! 👋
                        </h1>
                        <p className="text-gray-600 text-lg sm:text-xl">
                            Your college journey made easier
                        </p>
                    </section>
                    
                    {/* Action Cards: Stack vertically on small screens (flex-col) and side-by-side on larger screens (md:flex-row) */}
                    <section className="flex flex-col md:flex-row gap-4 sm:gap-6 mb-6 p-2">
                        
                        {/* Mark Attendance Card - Fixed large screen size applied with 'lg:' prefix */}
                        <Link 
                            to="/teacher/attendance" 
                            className="flex items-center gap-4 w-full lg:w-[450px] lg:h-[140px] h-auto rounded-xl sm:rounded-2xl bg-white p-4 shadow-[6px_6px_20px_rgba(0,0,0,0.55)] hover:shadow-xl transition-shadow"
                        >
                            <BarChart3 size={24} className="text-blue-600 flex-shrink-0" />
                            <div>
                                <span className="text-xl sm:text-2xl text-gray-800 font-semibold block">Mark Attendance</span>
                                <span className="text-gray-600 text-sm sm:text-lg">{date} {month} {year}</span>
                            </div>
                        </Link>

                        {/* Explore Students Card - Fixed large screen size applied with 'lg:' prefix */}
                        <Link 
                            to="/teacher/view-students" 
                            className="flex items-center gap-4 w-full lg:w-[450px] lg:h-[140px] h-auto rounded-xl sm:rounded-2xl bg-white p-4 shadow-[6px_6px_20px_rgba(0,0,0,0.55)] hover:shadow-xl transition-shadow"
                        >
                            <Users size={24} className="text-blue-600 flex-shrink-0" />
                            <div>
                                <span className="text-xl sm:text-2xl text-gray-800 font-semibold block">Explore Students</span>
                                <span className="text-gray-600 text-sm sm:text-lg">
                                    {dashboardData?.totalStudents || 0} students under your subjects
                                </span>
                            </div>
                        </Link>
                    </section>
                    
                    {/* Today's Schedule */}
                    {dashboardData?.todaySchedule && dashboardData.todaySchedule.length > 0 && (
                        <section className="p-2 mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-black mb-3 sm:mb-4">Today's Schedule ({day})</h2>
                            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
                                <div className="grid gap-3">
                                    {dashboardData.todaySchedule.map((schedule, index) => (
                                        <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div>
                                                <span className="font-semibold text-base sm:text-lg">{schedule.subject_name}</span>
                                                <p className="text-gray-600 text-sm sm:text-base">Class: {schedule.class_name}</p>
                                            </div>
                                            <div className="text-left sm:text-right mt-1 sm:mt-0">
                                                <span className="text-blue-600 font-medium text-sm sm:text-base">Lecture {schedule.lecture_no}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}
                    
                    {/* Assigned Subjects */}
                    {dashboardData?.teacher?.assignedSubjects && dashboardData.teacher.assignedSubjects.length > 0 && (
                        <section className="p-2 mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-black mb-3 sm:mb-4">Your Subjects</h2>
                            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
                                {/* Responsive Grid: 1 column on mobile, 2 on medium, 3 on large */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {dashboardData.teacher.assignedSubjects.map((subject) => (
                                        <div key={subject.subject_id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <span className="font-semibold text-sm sm:text-base text-blue-800">{subject.subject_name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}
                    
                    {/* Announcements */}
                    <h2 className="text-xl sm:text-2xl font-bold text-black p-2 mt-2 mb-3 sm:mb-4">Announcements</h2>
                    <div className="p-2">
                        <Announcements />   
                    </div>
                                     
                </main>
            </div>
            {/* About is outside the main scrolling area */}
            <About/>
        </div>
    )
}

export default TeacherHome;