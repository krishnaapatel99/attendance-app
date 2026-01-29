import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

function TeacherTimetable() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timetable, setTimetable] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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
      const res = await api.get('/timetable/teacher/weekly-timetable');
      if (res.data.success) {
        setTimetable(res.data.timetable || {});
      }
    } catch (err) {
      console.error('Error fetching timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-xl">Loading timetable...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="flex-1 p-6 space-y-4">

          {/* Header */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h1 className="text-3xl font-bold">My Weekly Timetable</h1>
            <p className="text-gray-600">{user?.name}</p>
          </div>

          {/* Timetable */}
          <div className="bg-white rounded-lg p-6 shadow-sm overflow-x-auto">
            <table className="w-full min-w-[900px] border border-gray-300 border-collapse">
              <thead>
                <tr className="bg-blue-50">
                  <th className="border p-3">Day / Time</th>
                  {timeSlots.map(slot => (
                    <th key={slot.lecture} className="border p-3">
                      <div className="text-sm font-semibold">Lecture {slot.lecture}</div>
                      <div className="text-xs text-gray-600">{slot.time}</div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {days.map(day => {
                  let skipUntil = 0;

                  return (
                    <tr key={day}>
                      <td className="border p-3 font-semibold bg-blue-50 text-center">
                        {day}
                      </td>

                      {timeSlots.map(slot => {
                        if (slot.lecture < skipUntil) return null;

                        const cell = timetable?.[day]?.[slot.lecture];

                        // BREAK
                        if (slot.lecture === 4 && !cell) {
                          return (
                            <td
                              key={slot.lecture}
                              className="border p-3 bg-yellow-50 text-center"
                            >
                              Break
                            </td>
                          );
                        }

                        // FREE SLOT
                        if (!cell) {
                          return (
                            <td
                              key={slot.lecture}
                              className="border p-3 text-center text-gray-400"
                            >
                              Free
                            </td>
                          );
                        }

                        const duration = cell.duration || 1;
                        skipUntil = slot.lecture + duration;

                        const isPractical =
                          cell.type === 'PRACTICAL' || cell.type === 'PRACT';

                        return (
                          <td
                            key={slot.lecture}
                            colSpan={duration}
                            className={`border p-3 text-center ${
                              isPractical
                                ? 'bg-blue-50 border-blue-300'
                                : 'bg-green-50 border-green-300'
                            }`}
                          >
                            <div
                              className={`font-semibold ${
                                isPractical
                                  ? 'text-blue-800'
                                  : 'text-green-800'
                              }`}
                            >
                              {cell.subject}
                            </div>

                            <div
                              className={`text-sm ${
                                isPractical
                                  ? 'text-blue-600'
                                  : 'text-green-600'
                              }`}
                            >
                              {cell.class}
                              {cell.batch ? ` (${cell.batch})` : ''}
                            </div>

                            <span
                              className={`inline-block mt-1 px-2 py-1 rounded-full text-xs ${
                                isPractical
                                  ? 'bg-blue-200 text-blue-800'
                                  : 'bg-green-200 text-green-800'
                              }`}
                            >
                              {cell.type}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold mb-2">Legend</h3>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 bg-green-50 border border-green-300" />
                Lecture
              </span>
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 bg-blue-50 border border-blue-300" />
                Practical
              </span>
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 bg-yellow-50 border" />
                Break
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default TeacherTimetable;
