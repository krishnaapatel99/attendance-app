import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import StudentSidebar from '../../components/StudentSidebar';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

function StudentTimetable() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
 const timeSlots = [
    { lecture: 1, time: '9:30-10:30' },
    { lecture: 2, time: '10:30-11:30' },
    { lecture: 3, time: '11:30-12:30' },
    { lecture: 4, time: '12:30-1:00' },
    { lecture: 5, time: '1:00-2:00' },
    { lecture: 6, time: '2:00-3:00' },
    { lecture: 7, time: '3:00-4:00' },
    
  ];

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const response = await api.get('/timetable/student/weekly-timetable');
      if (response.data.success) {
        // Transform the data to match the expected format
        const transformedData = {
          timetable: response.data.timetable,
          timeSlots: response.data.timeSlots
        };
        setTimetableData(transformedData);
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectForSlot = (day, lectureNo) => {
    if (!timetableData?.timetable[day]) return null;
    const slot = timetableData.timetable[day][lectureNo];
    if (!slot) return null;
    
    return {
      subject_name: slot.subject,
      teacher_name: slot.teacher,
      type: slot.type,
      batch: slot.batch,
      time: slot.time
    };
  };

  const getCurrentLecture = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    const lectureSchedule = [
      { lecture: 1, start: 9 * 60 + 30, end: 10 * 60 + 30 }, // 9:30-10:30
      { lecture: 2, start: 10 * 60 + 30, end: 11 * 60 + 30 }, // 10:30-11:30
      { lecture: 3, start: 11 * 60 + 30, end: 12 * 60 + 30 }, // 11:30-12:30
      { lecture: 4, start: 12 * 60 + 30, end: 13 * 60  }, // 12:30-1:00
      { lecture: 5, start: 13 * 60, end: 14 * 60 }, // 1:00-2:00
      { lecture: 6, start: 14 * 60, end: 15 * 60 }, // 2:00-3:00
      { lecture: 7, start: 15 * 60, end: 16 * 60 }, // 3:00-4:00
    
    ];
    
    for (const schedule of lectureSchedule) {
      if (currentTime >= schedule.start && currentTime <= schedule.end) {
        return { day: currentDay, lecture: schedule.lecture };
      }
    }
    
    return null;
  };

  const isCurrentLecture = (day, lectureNo) => {
    const current = getCurrentLecture();
    return current && current.day === day && current.lecture === lectureNo;
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-xl">Loading timetable...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-100">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-col md:flex-row">
        <StudentSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Main Content */}
        <div className="flex-1 mt-8 px-4 md:ml-8 md:mr-8 space-y-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-2xl lg:text-3xl font-bold text-black">
                  My Timetable - SE Class
                </h1>
                <p className="text-gray-600 text-base sm:text-lg">
                  Room No. C-611 | Class Advisor: Dr. Smita A. Attarde
                </p>
              </div>
            </div>
          </div>

          {/* Current Lecture */}
          {(() => {
            const current = getCurrentLecture();
            if (current && days.includes(current.day)) {
              const currentSubject = getSubjectForSlot(current.day, current.lecture);
              return (
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold text-blue-800 mb-2">Current Lecture</h3>
                  {currentSubject ? (
                    <div className="text-blue-700">
                      <div className="font-medium">{currentSubject.subject_name}</div>
                      <div className="text-sm">Teacher: {currentSubject.teacher_name}</div>
                      <div className="text-sm">Lecture {current.lecture} - {timeSlots.find(s => s.lecture === current.lecture)?.time}</div>
                    </div>
                  ) : (
                    <div className="text-blue-700">No lecture scheduled right now</div>
                  )}
                </div>
              );
            }
            return null;
          })()}

          {/* Timetable Grid */}
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-gray-300 p-3 text-center font-semibold">
                      Time/Day
                    </th>
                    {timeSlots.map((slot) => (
                      <th key={slot.lecture} className="border border-gray-300 p-3 text-center font-semibold">
                        <div className="text-sm">Lecture {slot.lecture}</div>
                        <div className="text-xs text-gray-600">{slot.time}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => (
                    <tr key={day} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-3 font-semibold bg-blue-50 text-center">
                        {day}
                      </td>
                      {timeSlots.map((slot) => {
                        const subject = getSubjectForSlot(day, slot.lecture);
                        const isBreak = slot.lecture === 4  // Break after 3rd lecture except Friday
                        const isCurrent = isCurrentLecture(day, slot.lecture);
                        
                        if (isBreak && !subject) {
                          return (
                            <td key={slot.lecture} className="border border-gray-300 p-3 text-center bg-yellow-50">
                              <div className="text-sm font-medium text-gray-600">Break</div>
                              <div className="text-xs text-gray-500">12:30-1:00</div>
                            </td>
                          );
                        }
                        
                        return (
                          <td key={slot.lecture} className={`border border-gray-300 p-2 text-center ${
                            isCurrent ? 'bg-green-100 border-green-400' : 
                            subject ? 'bg-blue-50' : 'bg-gray-50'
                          }`}>
                            {subject ? (
                              <div className="text-xs">
                                <div className={`font-semibold ${isCurrent ? 'text-green-800' : 'text-blue-800'}`}>
                                  {subject.subject_name}
                                </div>
                                <div className={`${isCurrent ? 'text-green-600' : 'text-blue-600'}`}>
                                  {subject.teacher_name}
                                </div>
                                {isCurrent && (
                                  <div className="mt-1 inline-block px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs animate-pulse">
                                    Live Now
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-gray-400 text-xs">Free</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-lg mb-3">Legend</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-400 rounded"></div>
                <span className="text-sm">Current Lecture</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-50 border border-gray-300 rounded"></div>
                <span className="text-sm">Scheduled Lectures</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-50 border border-gray-300 rounded"></div>
                <span className="text-sm">Break Time</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-50 border border-gray-300 rounded"></div>
                <span className="text-sm">Free Period</span>
              </div>
            </div>
          </div>

          {/* Subject Legend */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-lg mb-3">Subject Abbreviations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div><strong>MCS:</strong> Mathematics for Computer Science</div>
              <div><strong>COA:</strong> Computer Organization and Architecture</div>
              <div><strong>AOA:</strong> Analysis of Algorithm</div>
              <div><strong>OE-I:</strong> Open Elective-I: Indian Constitution</div>
              <div><strong>EFM:</strong> Entrepreneurship & Financial Management</div>
              <div><strong>E&S:</strong> Entrepreneurship & Sustainability</div>
              <div><strong>FSJP:</strong> Full Stack Java Programming</div>
              <div><strong>COAL:</strong> Computer Organization Lab</div>
              <div><strong>AOAL:</strong> Analysis of Algorithm Lab</div>
              <div><strong>FSJPL:</strong> Full Stack Java Programming Lab</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentTimetable;