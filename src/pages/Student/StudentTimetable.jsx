import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import StudentSidebar from '../../components/StudentSidebar';
import api from '../../utils/api';

function StudentTimetable() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const timeSlots = [
    { lecture: 1, time: '9:30-10:30' },
    { lecture: 2, time: '10:30-11:30' },
    { lecture: 3, time: '11:30-12:30' },
    { lecture: 4, time: '12:30-1:00' }, // Break
    { lecture: 5, time: '1:00-2:00' },
    { lecture: 6, time: '2:00-3:00' },
    { lecture: 7, time: '3:00-4:00' }
  ];

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const res = await api.get('/timetable/student/weekly-timetable');
      if (res.data.success) {
        setTimetableData(res.data);
      } else {
        // Handle API success but no data case
        setTimetableData({ timetable: {} });
      }
    } catch (err) {
      console.error('Failed to fetch timetable:', err);
      // Set empty data to prevent infinite loading
      setTimetableData({ timetable: {} });
      // Optional: Show error message to user
      if (err.response?.status !== 401) {
        
        alert('Unable to load timetable. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getCell = (day, lecture) =>
    timetableData?.timetable?.[day]?.[lecture] || null;

  const getCurrentLecture = () => {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' });

    const slots = [
      [1, 570, 630],
      [2, 630, 690],
      [3, 690, 750],
      [4, 750, 780],
      [5, 780, 840],
      [6, 840, 900],
      [7, 900, 960]
    ];

    for (const [lec, start, end] of slots) {
      if (mins >= start && mins <= end) {
        return { day, lecture: lec };
      }
    }
    return null;
  };

  const current = getCurrentLecture();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-xl">
        Loading timetable...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex">
        <StudentSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="flex-1 p-2 sm:p-4 space-y-4 max-w-full overflow-hidden">

          {/* HEADER */}
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
            <h1 className="text-xl sm:text-2xl font-bold">My Weekly Timetable</h1>
            <p className="text-gray-600 text-sm sm:text-base">Student Dashboard</p>
          </div>

          {/* TIMETABLE TABLE (Mobile + Desktop) */}
          <div className="bg-white p-2 sm:p-4 rounded-lg shadow">
            {/* Mobile scroll indicator */}
            <div className="sm:hidden text-xs text-gray-500 mb-2 text-center">
              ← Swipe horizontally to see more →
            </div>
            <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
              <div className="min-w-max">
                <table className="w-full border border-gray-300" style={{ minWidth: '900px' }}>
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="border p-2 sm:p-3 text-center text-xs sm:text-sm">Day / Time</th>
                      {timeSlots.map(slot => (
                        <th key={slot.lecture} className="border p-2 sm:p-3 text-center">
                          <div className="text-xs sm:text-sm font-semibold">
                            Lec {slot.lecture}
                          </div>
                          <div className="text-xs text-gray-600">
                            {slot.time}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {days.map(day => (
                      <tr key={day}>
                        <td className="border p-2 sm:p-3 font-semibold bg-blue-50 text-center text-xs sm:text-sm">
                          {day}
                        </td>

                        {timeSlots.map(slot => {
                          const cell = getCell(day, slot.lecture);
                          const isBreak = slot.lecture === 4;
                          const isCurrent =
                            current?.day === day &&
                            current?.lecture === slot.lecture;

                          if (isBreak && !cell) {
                            return (
                              <td
                                key={slot.lecture}
                                className="border bg-yellow-50 text-center text-xs sm:text-sm font-medium"
                              >
                                Break
                              </td>
                            );
                          }

                          if (!cell) {
                            return (
                              <td
                                key={slot.lecture}
                                className="border text-gray-400 text-center text-xs sm:text-sm"
                              >
                                Free
                              </td>
                            );
                          }

                          const isPractical = cell.type === 'PRACTICAL';

                          return (
                            <td
                              key={slot.lecture}
                              className={`border p-1 sm:p-2 text-center ${
                                isCurrent
                                  ? 'bg-green-200 border-green-400'
                                  : isPractical
                                  ? 'bg-green-50 border-green-300'
                                  : 'bg-blue-50 border-blue-300'
                              }`}
                            >
                              <div
                                className={`font-semibold text-xs sm:text-sm ${
                                  isPractical
                                    ? 'text-green-800'
                                    : 'text-blue-800'
                                }`}
                              >
                                {cell.subject}
                              </div>

                              <div
                                className={`text-xs ${
                                  isPractical
                                    ? 'text-green-600'
                                    : 'text-blue-600'
                                }`}
                              >
                                {cell.teacher}
                              </div>

                              <div
                                className={`mt-1 inline-block px-1 sm:px-2 py-0.5 rounded-full text-xs ${
                                  isPractical
                                    ? 'bg-green-200 text-green-800'
                                    : 'bg-blue-200 text-blue-800'
                                }`}
                              >
                                {cell.type}
                              </div>

                              {isCurrent && (
                                <div className="mt-1 text-xs bg-green-600 text-white rounded px-1 sm:px-2 inline-block">
                                  Live
                                </div>
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
          </div>

          {/* LEGEND */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-3">Legend</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-blue-50 border rounded"></span> Lecture
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-green-200 border rounded"></span> Practical
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-yellow-50 border rounded"></span> Break
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-gray-50 border rounded"></span> Free
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-green-50 border rounded"></span> Current
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default StudentTimetable;
