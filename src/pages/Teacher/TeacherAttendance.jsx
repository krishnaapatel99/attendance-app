// pages/Attendance.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import { toast } from "react-toastify";

function Attendance() {
  const now = new Date();
  const date = now.getDate();
  const month = now.toLocaleString("default", { month: "long" });
  const day = now.toLocaleString("default", { weekday: "long" });
  const year = now.getFullYear();
  const today = new Date().toISOString().split('T')[0];

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [submittedTimetables, setSubmittedTimetables] = useState({});
  const [loading, setLoading] = useState(true);
  const [updateMode, setUpdateMode] = useState(false);
  const [absentStudents, setAbsentStudents] = useState([]);
  const [selectedForUpdate, setSelectedForUpdate] = useState([]);

  const navigate = useNavigate();

  // Fetch students and their attendance when timetable changes
const fetchStudents = async (timetableId) => {
  if (!timetableId) {
    setStudents([]);
    setAttendanceData({});
    return;
  }

  try {
    setLoading(true);
    
    const [studentsResponse, attendanceResponse] = await Promise.all([
      api.get(`/teacher/students?timetable_id=${timetableId}`),
      api.get(`/teacher/attendance-data?timetable_id=${timetableId}&attendance_date=${today}`)
    ]);
    
    if (studentsResponse.data.success) {
      const studentsData = studentsResponse.data.data;
      setStudents(studentsData);
      
      const initialAttendance = {};
      let isLectureSubmitted = false;
      
      if (attendanceResponse.data.success && attendanceResponse.data.data.length > 0) {
        const attendanceRecords = attendanceResponse.data.data;
        isLectureSubmitted = attendanceRecords.some(record => record.submitted);
        
        // Update submitted timetables state
        if (isLectureSubmitted) {
          setSubmittedTimetables(prev => ({
            ...prev,
            [timetableId]: true
          }));
        }
        
        attendanceRecords.forEach(record => {
          if (record.student_rollno) {
            initialAttendance[record.student_rollno] = {
              status: record.status || 'Present',
              submitted: record.submitted || isLectureSubmitted
            };
          }
        });
      }
      
      studentsData.forEach(student => {
        if (!initialAttendance[student.student_rollno]) {
          initialAttendance[student.student_rollno] = {
            status: 'Present',
            submitted: false
          };
        }
      });
      
      setAttendanceData(initialAttendance);
    }
  } catch (error) {
    console.error('Error fetching students and attendance:', error);
    if (error.response?.status === 401) {
      navigate('/login');
    } else {
      toast.error('Failed to load student data');
    }
  } finally {
    setLoading(false);
  }
};

  // Fetch teacher's schedule when component mounts
  useEffect(() => {
    const fetchTeacherSchedule = async () => {
      try {
        setLoading(true);
        const response = await api.get('/teacher/dashboard');
        
        if (response.data.success) {
          setTodaySchedule(response.data.data);
          
          // Auto-select the first lecture if available
          if (response.data.data.length > 0) {
            const firstLecture = response.data.data[0];
            setSelectedTimetable(firstLecture.timetable_id);
            setSelectedSubject({
              subject_id: firstLecture.subject_id,
              subject_name: firstLecture.subject_name
            });
            // Fetch students for the first lecture
            await fetchStudents(firstLecture.timetable_id);
          }
        }
      } catch (error) {
        console.error('Error fetching teacher schedule:', error);
        if (error.response?.status === 401) {
          navigate('/login');
        } else {
          toast.error('Failed to load schedule');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherSchedule();
  }, []);

  // Handle lecture selection change
  const handleLectureChange = async (e) => {
    const timetableId = parseInt(e.target.value);
    const lecture = todaySchedule.find(l => l.timetable_id === timetableId);
    
    if (lecture) {
      setSelectedTimetable(timetableId);
      setSelectedSubject({
        subject_id: lecture.subject_id,
        subject_name: lecture.subject_name
      });
      await fetchStudents(timetableId);
    }
  };
  

const markAttendance = async (studentRollno, status) => {
  if (submittedTimetables[selectedTimetable]) {
    toast.warning('Attendance for this lecture has already been submitted and cannot be changed.');
    return;
  }

  if (!selectedSubject || !selectedTimetable) {
    toast.warning('Please select a lecture first');
    return;
  }

  try {
    const response = await api.post('/teacher/attendance', {
      student_rollno: studentRollno,
      timetable_id: selectedTimetable,
      status: status,
      attendance_date: today
    });

    if (response.data.success) {
      setAttendanceData(prev => ({
        ...prev,
        [studentRollno]: { 
          ...prev[studentRollno], 
          status: status,
          submitted: false
        }
      }));
      
      toast.success('Attendance marked successfully');
    } else {
      throw new Error(response.data.message || 'Failed to mark attendance');
    }
  } catch (error) {
    console.error('Error marking attendance:', error);
    if (error.response?.status === 401) {
      navigate('/login');
    } else if (error.response?.status === 400) {
      toast.error(error.response.data.message || 'Cannot update attendance. It may have already been submitted.');
    } else {
      toast.error('Failed to mark attendance');
    }
  }
};
const openUpdateModal = async () => {
  try {
    const res = await api.get(
      `/teacher/absent-students?timetable_id=${selectedTimetable}&attendance_date=${today}`
    );

    if (res.data.success) {
      setAbsentStudents(res.data.data);
      setSelectedForUpdate([]);
      setUpdateMode(true);
    }
  } catch (err) {
    toast.error("Failed to load absent students");
  }
};
const submitUpdatedAttendance = async () => {
  if (selectedForUpdate.length === 0) {
    toast.warning("No students selected");
    return;
  }

  try {
    await api.put("/teacher/update-status", {
      timetable_id: selectedTimetable,
      attendance_date: today,
      present_students: selectedForUpdate
    });

    // Update main attendance table state
    setAttendanceData(prev => {
      const updated = { ...prev };
      selectedForUpdate.forEach(roll => {
        if (updated[roll]) {
          updated[roll].status = "Present";
        }
      });
      return updated;
    });

    setUpdateMode(false);
    toast.success("Attendance updated successfully");

  } catch (err) {
    toast.error("Failed to update attendance");
  }
};



  const saveAllAttendance = async () => {
  if (submittedTimetables[selectedTimetable]) {
    toast.warning('Attendance for this lecture has already been submitted.');
    return;
  }

  if (!selectedTimetable) {
    toast.warning('Please select a lecture first');
    return;
  }

  const studentsWithoutAttendance = students.filter(
    student => !attendanceData[student.student_rollno]?.status
  );

  if (studentsWithoutAttendance.length > 0) {
    toast.warning(`Please mark attendance for all students before submitting. ${studentsWithoutAttendance.length} students remaining.`);
    return;
  }

  try {
    setSaving(true);
    const response = await api.post('/teacher/submit', {
      timetable_id: selectedTimetable,
      attendance_date: today
    });

    if (response.data.success) {
      // Update submitted timetables state
      setSubmittedTimetables(prev => ({
        ...prev,
        [selectedTimetable]: true
      }));

      // Update all attendance records to show they're submitted
      const updatedAttendance = { ...attendanceData };
      Object.keys(updatedAttendance).forEach(rollno => {
        updatedAttendance[rollno] = {
          ...updatedAttendance[rollno],
          submitted: true
        };
      });
      setAttendanceData(updatedAttendance);
      
      toast.success('Attendance submitted and locked successfully!');
    } else {
      throw new Error(response.data.message || 'Failed to submit attendance');
    }
  } catch (error) {
    console.error('Error submitting attendance:', error);
    if (error.response?.status === 401) {
      navigate('/login');
    } else if (error.response?.status === 400) {
      toast.error(error.response.data.message || 'Cannot submit attendance. Please check the data and try again.');
    } else {
      toast.error('Failed to submit attendance. Please try again.');
    }
  } finally {
    setSaving(false);
  }
};

  const getStatusStyle = (status) => {
    switch (status) {
      case "Present":
        return "bg-green-500 border-green-600 text-white font-semibold";
      case "Late":
        return "bg-yellow-500 border-yellow-600 text-white font-semibold";
      case "Absent":
        return "bg-red-500 border-red-600 text-white font-semibold";
      default:
        return "bg-white border-gray-300 text-black";
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_rollno.toString().includes(searchTerm)
  );

  const presentCount = Object.values(attendanceData).filter(a => a.status === 'Present').length;
  const absentCount = Object.values(attendanceData).filter(a => a.status === 'Absent').length;
  const lateCount = Object.values(attendanceData).filter(a => a.status === 'Late').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading attendance...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-100">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-col md:flex-row">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Main Content */}
        <div className="flex-1 mt-8 px-4 md:ml-8 md:mr-8 space-y-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
               <h1 className="text-2xl sm:text-2xl lg:text-3xl font-bold text-black">
  Daily Attendance {submittedTimetables[selectedTimetable] && <span className="text-green-600">(Submitted)</span>}
</h1>
                <p className="text-gray-600 text-base sm:text-lg">
                  {day}, {month} {date}, {year}
                </p>
              </div>

              {/* Subject Selection */}
              {todaySchedule.length > 0 ? (
                <div className="flex flex-col gap-2 mb-4">
                  <label className="text-sm font-medium text-gray-700">Select Lecture:</label>
                  <select 
                    value={selectedTimetable || ''}
                    onChange={handleLectureChange}
                    disabled={loading}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-md"
                  >
                    <option value="">Select a lecture</option>
                    {todaySchedule.map((lecture) => (
                      <option key={lecture.timetable_id} value={lecture.timetable_id}>
                        {lecture.lecture_type === 'LECTURE' ? 'Lecture' : 'Practical'} {lecture.lecture_no} - {lecture.subject_name} 
                        ({lecture.year} {lecture.branch} {lecture.batch_name ? `- ${lecture.batch_name}` : ''})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        No lectures scheduled for today.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <div className="flex gap-2">
                  <span className="text-green-600 font-medium">Present: {presentCount}</span>
                  <span className="text-red-600 font-medium">Absent: {absentCount}</span>
                  <span className="text-yellow-600 font-medium">Late: {lateCount}</span>
                </div>
                <p className="text-gray-700 font-medium text-base sm:text-lg">
                  Total {filteredStudents.length} 
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 lg:gap-3 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search by name or roll number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 sm:px-4 py-2 border border-gray-300 w-full sm:w-[300px] lg:w-[350px] lg:h-[40px] rounded-lg lg:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-lg lg:border-2 lg:border-blue-300"
                  />
                <button 
  onClick={saveAllAttendance}
  disabled={saving || submittedTimetables[selectedTimetable]}
  className="bg-blue-600 flex items-center justify-center text-white px-4 sm:px-6 lg:px-8 py-2 lg:py-2.5 rounded-lg lg:rounded-xl hover:bg-blue-700 transition-colors active:scale-95 duration-200 cursor-pointer text-base sm:text-lg w-full sm:w-auto lg:h-[40px] lg:font-medium disabled:opacity-50 disabled:cursor-not-allowed"
>
  {saving ? 'Saving...' : submittedTimetables[selectedTimetable] ? 'Submitted' : 'Save '}
                 </button>
                 {submittedTimetables[selectedTimetable] && (
                  <button
                    onClick={openUpdateModal}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
                      >Update 
                    </button>
                     )}

                </div>
              </div>
            </div>
          </div>

          {/* No Lecture Selected Message */}
          {(!selectedSubject || !selectedTimetable) && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-yellow-800 mb-2">No Lecture Selected</h3>
              <p className="text-yellow-700">
                {todaySchedule.length === 0 
                  ? "You don't have any lectures scheduled for today." 
                  : "Please select a lecture from the dropdown above to mark attendance."
                }
              </p>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="overflow-x-auto lg:overflow-y-auto lg:max-h-96">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-base sm:text-lg">
                      Roll No.
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-base sm:text-lg">
                      Student Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-base sm:text-lg">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-base sm:text-lg">
                      Actions
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-base sm:text-lg hidden lg:table-cell">
                      Class
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const attendance = attendanceData[student.student_rollno] || { status: 'Present' };
                    return (
                      <tr key={student.student_rollno} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-base sm:text-lg">{student.student_rollno}</td>
                        <td className="py-3 px-4 text-base sm:text-lg">{student.name}</td>
                        <td className="py-3 px-4">
                          <div
                            className={`w-16 sm:w-20 h-6 sm:h-8 text-sm sm:text-lg rounded border flex items-center justify-center ${getStatusStyle(attendance.status)}`}
                          >
                            {attendance.status}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
                            {["Present", "Late", "Absent"].map((type) => (
                              <button
                                key={type}
                                onClick={() => markAttendance(student.student_rollno, type)}
                                disabled={submittedTimetables[selectedTimetable]}
                                className={`px-2 sm:px-3 py-1 text-white text-xs sm:text-base lg:text-lg rounded active:scale-95 duration-70 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                  type === "Present" ? "bg-green-300 hover:bg-green-700" : type === "Late" ? "bg-yellow-300 hover:bg-yellow-700" : "bg-red-300 hover:bg-red-700"
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell text-base sm:text-lg">
                          {student.class} {student.div}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-gray-500">
                        No students found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {updateMode && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-lg">

      <h2 className="text-2xl font-bold mb-4 text-center text-red-600">
        Absent Students
      </h2>

      <div className="max-h-64 overflow-y-auto space-y-2">
        {absentStudents.map(student => (
          <label
            key={student.student_rollno}
            className="flex items-center justify-between border p-2 rounded"
          >
            <div>
              <p className="font-medium">{student.student_rollno}</p>
              <p className="text-gray-600 text-sm">{student.name}</p>
            </div>

            <input
              type="checkbox"
              className="w-5 h-5"
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedForUpdate(prev => [...prev, student.student_rollno]);
                } else {
                  setSelectedForUpdate(prev =>
                    prev.filter(r => r !== student.student_rollno)
                  );
                }
              }}
            />
          </label>
        ))}
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => setUpdateMode(false)}
          className="px-4 py-2 border rounded-lg"
        >
          Cancel
        </button>

        <button
          onClick={submitUpdatedAttendance}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Submit
        </button>
      </div>

    </div>
  </div>
)}

    </div>
  );
}

export default Attendance;
