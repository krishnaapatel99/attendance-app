import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import StudentSidebar from '../../components/StudentSidebar';
import api from '../../utils/api';

function StudentAttendance() {
    const [activeBtn, setActiveBtn] = useState('Overall');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [attendanceData, setAttendanceData] = useState({
        overall: null,
        monthly: [],
        subjectWise: [],
        monthlySubjectWise: []
    });
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetchAllAttendanceData();
    }, []);
   const fetchAllAttendanceData = async () => {
  setLoading(true);

  try {
    const academicYear = "2025-26"; // Static for now
    
    const overallRes = await api.get(`/student/attendance/overall?academic_year=${academicYear}`);
    const monthlyRes = await api.get(`/student/attendance/monthly?academic_year=${academicYear}`);
    const subjectWiseRes = await api.get(`/student/attendance/subject-wise?academic_year=${academicYear}`);

    setAttendanceData({
      overall: overallRes.data.success ? overallRes.data.data : null,
      monthly: monthlyRes.data.success ? monthlyRes.data.data : [],
      subjectWise: subjectWiseRes.data.success ? subjectWiseRes.data.data : [],
      monthlySubjectWise: []
    });
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    if (error.response?.status === 401) {
      // Auth error will be handled by interceptor
      console.warn("Unauthorized while fetching attendance");
    } else {
      // Set default data to prevent infinite loading
      setAttendanceData({
        overall: null,
        monthly: [],
        subjectWise: [],
        monthlySubjectWise: []
      });
      // Show user-friendly error
      alert('Unable to load attendance data. Please check your connection and try again.');
    }
  } finally {
    setLoading(false);
  }
};

    
    const getAttendanceStatus = (percentage) => {
        if (percentage >= 85) return { label: 'Excellent', color: 'bg-green-600', text_color: 'text-green-600' };
        if (percentage >= 75) return { label: 'Good', color: 'bg-blue-600', text_color: 'text-blue-600' };
        if (percentage >= 65) return { label: 'Average', color: 'bg-yellow-600', text_color: 'text-yellow-600' };
        return { label: 'Poor', color: 'bg-red-600', text_color: 'text-red-600' };
    };
    
    // Custom CSS for Active/Inactive Buttons
    const changecolor = (btn) => 
        activeBtn === btn 
        ? "border-2 border-black text-black bg-white shadow-xl" // Active button style
        : "bg-white text-gray-700 hover:bg-gray-100 shadow-lg"; // Inactive button style
    
    
    const renderOverallView = () => {
        const overall = attendanceData.overall;
        if (!overall) return <div className="p-4">No attendance data available</div>;
        
        const percentage = overall.overall_percentage || 0;
        const status = getAttendanceStatus(percentage);
        
        return (
            // Adjusted padding and shadow
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl mt-4 w-full">
                <div className='mb-4 sm:mb-5'>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <h2 className="text-xl sm:text-2xl font-bold text-black mb-2 sm:mb-0">Overall Attendance</h2>
                        <div className="text-left sm:text-right">
                            <p className="text-sm text-gray-500">Overall Percentage</p>
                            <p className="text-lg sm:text-xl font-semibold text-black">{percentage}%</p>
                        </div>
                    </div>
                    <p className='text-sm sm:text-lg text-gray-600'>Your complete attendance summary</p>
                </div>

                <div className="mb-5 flex justify-between items-center">
                    {/* KEY CHANGE 1: Percentage color changes based on status */}
                    <span className={`text-3xl sm:text-4xl font-bold ${status.text_color}`}>{percentage}%</span>
                    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 sm:px-4 sm:py-2 ${status.color}`}>
                        <span className="text-xs font-bold text-white">{status.label}</span>
                    </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4">
                    {/* KEY CHANGE 2: Progress bar color is consistently blue */}
                    <div 
                        className={`h-3 sm:h-4 rounded-full bg-blue-500`} 
                        style={{width: `${percentage}%`}}
                    ></div>
                </div>
                <p className='pt-3 sm:pt-4 text-gray-600 text-xs sm:text-sm'>
                    Overall attendance across all subjects
                </p>
            </div>
        );
    };
    
    const renderMonthlyView = () => {
        return (
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl mt-4 w-full">
                <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">Monthly Attendance</h2>
                {attendanceData.monthly.length === 0 ? (
                    <p className="text-gray-600">No monthly data available</p>
                ) : (
                    <div className="space-y-3 sm:space-y-4">
                        {attendanceData.monthly.map((month, index) => {
                            const percentage = month.monthly_percentage || 0;
                            const status = getAttendanceStatus(percentage);
                            const monthName = new Date(0, month.month - 1).toLocaleString("default", { month: "long" });
                            return (
                                <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div>
                                        <h3 className="font-semibold text-base sm:text-lg">{monthName}</h3>
                                        <p className="text-xs sm:text-sm text-gray-600">
                                            {month.present_lectures || 0} of {month.total_lectures || 0} classes attended
                                        </p>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        {/* Percentage badge uses status color */}
                                        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${status.color}`}>
                                            <span className="text-xs font-bold text-white">{percentage}%</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };
    
    const renderSubjectWiseView = () => {
        return (
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl mt-4 w-full">
                <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">Subject-wise Attendance</h2>
                {attendanceData.subjectWise.length === 0 ? (
                    <p className="text-gray-600">No subject-wise data available</p>
                ) : (
                    <div className="space-y-3 sm:space-y-4">
                        {attendanceData.subjectWise.map((subject, index) => {
                            const percentage = subject.attendance_percentage || 0;
                            const status = getAttendanceStatus(percentage);
                            return (
                                <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="mb-2 sm:mb-0">
                                        <h3 className="font-semibold text-base sm:text-lg">{subject.subject_name}</h3>
                                        <p className="text-xs sm:text-sm text-gray-600">
                                            {subject.present_lectures || 0} of {subject.total_lectures || 0} classes attended
                                        </p>
                                    </div>
                                    <div className="text-left sm:text-right w-full sm:w-auto">
                                        <div className="flex justify-between items-center sm:justify-end">
                                            {/* Percentage badge uses status color */}
                                            <div className={`inline-flex items-center rounded-full px-3 py-1 ${status.color}`}>
                                                <span className="text-xs font-bold text-white">{percentage}%</span>
                                            </div>
                                        </div>
                                        {/* Progress Bar uses consistently blue color */}
                                        <div className="w-full sm:w-32 bg-gray-200 rounded-full h-2 mt-2">
                                            <div 
                                                className={`h-2 rounded-full bg-blue-500`} 
                                                style={{width: `${percentage}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };
    
    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-xl font-semibold text-gray-700">Loading attendance data...</div>
            </div>
        );
    }
    
    return (
        <div className='min-h-screen flex flex-col'>
            <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>
            <div className='flex flex-1 bg-gray-100 overflow-hidden'>
                <StudentSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>
                
                <main className='flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto'>
                    
                    {/* Header Section */}
                    <section className='mb-4 sm:mb-6'>
                        <h1 className='text-3xl sm:text-4xl font-bold text-black'>Attendance Analytics</h1>
                        <p className='text-base sm:text-xl text-gray-600'>View your attendance in different formats</p>
                    </section>
                    
                    {/* Button Toggles */}
                    <div className='flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between items-center mt-4 w-full bg-gray-200 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg gap-3'>
                        {[
                            { label: "Overall", key: "Overall" },
                            { label: "Monthly", key: "Monthly" },
                            { label: "Subject-wise", key: "Subject-wise" }
                        ].map(({ label, key }) => (
                            <button 
                                key={key}
                                onClick={() => {setActiveBtn(key)}}
                                className={`flex-1 w-full flex justify-center items-center h-10 p-3 rounded-xl text-sm sm:text-lg cursor-pointer transition-all duration-200 active:scale-[0.98] ${changecolor(key)}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    
                    {/* Dynamic Content Based on Active Button */}
                    <div className='flex-1'>
                        {activeBtn === 'Overall' && renderOverallView()}
                        {activeBtn === 'Monthly' && renderMonthlyView()}
                        {activeBtn === 'Subject-wise' && renderSubjectWiseView()}
                    </div>
                    
                </main>
            </div>
        </div>
    )
}

export default StudentAttendance