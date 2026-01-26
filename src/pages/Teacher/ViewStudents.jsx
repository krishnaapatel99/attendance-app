import React, { useState, useEffect , useMemo} from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';
import { toast, ToastContainer } from 'react-toastify';
import { X } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ViewStudents() {
  /* ---------------- Layout ---------------- */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ---------------- Filters ---------------- */
  const [lectureType, setLectureType] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');

  /* ---------------- Month ---------------- */
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  /* ---------------- Students ---------------- */
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  /* ---------------- Calendar ---------------- */
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [calendarData, setCalendarData] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  
  /* ---------------- Email ---------------- */
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailStudent, setEmailStudent] = useState(null);
  const [emailContent, setEmailContent] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  /* ============================================================
     1️⃣ AUTO LOAD CURRENT LECTURE
     ============================================================ */
  useEffect(() => {
    api.get('/teacher/current-lecture')
      .then(res => {
        if (!res.data?.data) return;
        const d = res.data.data;
        setLectureType(d.lecture_type);
        setSelectedSubject(d.subject_id);
        setSelectedClass(d.class_id);
        setSelectedBatch(d.batch_id || '');
      })
      .catch(() => {});
  }, []);

  /* ============================================================
     2️⃣ SUBJECTS
     ============================================================ */
  useEffect(() => {
    if (!lectureType) {
      setSubjects([]);
      setSelectedSubject('');
      return;
    }

    api.get('/teacher/lecture-type-subjects', {
      params: { lecture_type: lectureType }
    })
      .then(res => setSubjects(res.data.data || []))
      .catch(() => toast.error('Failed to load subjects'));
  }, [lectureType]);

  /* ============================================================
     3️⃣ CLASSES
     ============================================================ */
  useEffect(() => {
    if (!lectureType || !selectedSubject) {
      setClasses([]);
      setSelectedClass('');
      return;
    }

    api.get('/teacher/classes-for-subject-type', {
      params: { lecture_type: lectureType, subject_id: selectedSubject }
    })
      .then(res => setClasses(res.data.data || []))
      .catch(() => toast.error('Failed to load classes'));
  }, [lectureType, selectedSubject]);

  /* ============================================================
     4️⃣ BATCHES
     ============================================================ */
  useEffect(() => {
    if (!selectedSubject || !selectedClass) {
      setBatches([]);
      setSelectedBatch('');
      return;
    }

    api.get('/teacher/batches-for-subject-class', {
      params: { subject_id: selectedSubject, class_id: selectedClass }
    })
      .then(res => setBatches(res.data.data || []))
      .catch(() => toast.error('Failed to load batches'));
  }, [selectedSubject, selectedClass]);

  /* ============================================================
     5️⃣ ATTENDANCE SUMMARY
     ============================================================ */
useEffect(() => {
  if (!lectureType || !selectedSubject || !selectedClass) return;

  setLoadingStudents(true);

  // ✅ only reset when filters change
  setSelectedStudent(null);
  setCalendarData([]);

  api.get('/teacher/attendance-summary', {
    params: {
      lecture_type: lectureType,
      subject_id: selectedSubject,
      class_id: selectedClass,
      batch_id: selectedBatch || null
    }
  })
  .then(res => setStudents(res.data.data || []))
  .catch(() => toast.error('Failed to load students'))
  .finally(() => setLoadingStudents(false));
}, [lectureType, selectedSubject, selectedClass, selectedBatch]);


  /* ============================================================
     6️⃣ CALENDAR TOGGLE
     ============================================================ */
  const fetchCalendar = async student => {
  setLoadingCalendar(true);
  try {
    const res = await api.get('/teacher/attendance-calendar', {
      params: {
        student_rollno: student.student_rollno,
        lecture_type: lectureType,
        subject_id: selectedSubject,
        class_id: selectedClass,
        batch_id: selectedBatch || null,
        month
      }
    });
    setCalendarData(res.data.data || []);
  } catch {
    toast.error('Failed to load calendar');
  } finally {
    setLoadingCalendar(false);
  }
};
const toggleCalendar = student => {
  if (loadingCalendar) return;

  if (selectedStudent?.student_rollno === student.student_rollno) {
    setSelectedStudent(null);
    setCalendarData([]);
    return;
  }

  setSelectedStudent(student);
  fetchCalendar(student);
};

const handleOpenEmailModal = async (student) => {
  try {
    // First, get the student's email
    const response = await api.post('/email/get-student-email', {
      studentId: student.student_rollno
    });
    
    if (response.data?.data?.email) {
      setEmailStudent({
        ...student,
        email: response.data.data.email
      });
      setEmailContent(`Poor attendance.\n\n`);
      setEmailModalOpen(true);
    } else {
      toast.error('Could not find student email');
    }
  } catch (error) {
    console.error('Error fetching student email:', error);
    toast.error('Failed to load student email');
  }
};

const handleSendEmail = async () => {
  if (!emailContent.trim()) {
    toast.error('Please enter a message');
    return;
  }

  if (!emailStudent?.email) {
    toast.error('No recipient email found');
    return;
  }

  setSendingEmail(true);
  try {
    await api.post('/email/send-email', {
      to: emailStudent.email,
      subject: `Attendance Update - ${selectedSubject}`,
      message: emailContent
    });
    console.log(selectedSubject)
    toast.success('Email sent successfully');
    setEmailModalOpen(false);
    setEmailContent('');
  } catch (error) {
    console.error('Error sending email:', error);
    toast.error(error.response?.data?.message || 'Failed to send email');
  } finally {
    setSendingEmail(false);
  }
};

useEffect(() => {
  if (selectedStudent) fetchCalendar(selectedStudent);
  // eslint-disable-next-line
}, [month]);




  /* ============================================================
     CALENDAR LOGIC
     ============================================================ */
const attendanceMap = useMemo(() => {
  const map = {};
  calendarData.forEach(d => {
    map[new Date(d.attendance_date).getDate()] = d.status;
  });
  return map;
}, [calendarData]);


 const { totalLectures, presentCount, absentCount } = useMemo(() => {
  const total = calendarData.length;
  let present = 0;
  let absent = 0;

  calendarData.forEach(d => {
    if (d.status === 'Present') present++;
    if (d.status === 'Absent') absent++;
  });

  return { totalLectures: total, presentCount: present, absentCount: absent };
}, [calendarData]);


  const renderCalendar = () => {
    const base = new Date(month + '-01');
    const days = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    const start = new Date(base.getFullYear(), base.getMonth(), 1).getDay();

    const cells = [];
    for (let i = 0; i < start; i++) cells.push(<div key={`e${i}`} />);

    for (let d = 1; d <= days; d++) {
      const status = attendanceMap[d];
      const cls =
        status === 'Present' ? 'bg-green-500 text-white' :
        status === 'Absent' ? 'bg-red-500 text-white' :
        status === 'Late' ? 'bg-yellow-400 text-black' :
        'bg-gray-100';

      cells.push(
        <div
          key={d}
          className={`h-9 w-9 rounded-full flex items-center justify-center text-sm ${cls}`}
        >
          {d}
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-7 gap-1 text-xs text-center text-gray-500 mb-1">
          {DAY_NAMES.map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">{cells}</div>
      </>
    );
  };

  /* ============================================================
     JSX
     ============================================================ */
  return (
    <div className="min-h-screen bg-gray-100">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="flex-1 p-6 space-y-4">

          {/* FILTERS */}
          <div className="bg-white p-4 rounded shadow flex flex-wrap gap-4 items-center">
            <select value={lectureType} onChange={e => setLectureType(e.target.value)}>
              <option value="">Type</option>
              <option value="LECTURE">Lecture</option>
              <option value="PRACTICAL">Practical</option>
            </select>

            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} disabled={!subjects.length}>
              <option value="">Subject</option>
              {subjects.map(s => (
                <option key={s.subject_id} value={s.subject_id}>
                  {s.subject_name}
                </option>
              ))}
            </select>

            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} disabled={!classes.length}>
              <option value="">Class</option>
              {classes.map(c => (
                <option key={c.class_id} value={c.class_id}>
                  {c.year} {c.branch}
                </option>
              ))}
            </select>

            <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} disabled={!batches.length}>
              <option value="">Batch</option>
              {batches.map(b => (
                <option key={b.batch_id} value={b.batch_id}>
                  {b.batch_name}
                </option>
              ))}
            </select>

            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
            />
          </div>

          {/* MAIN CONTENT */}
          <div
            className={`grid gap-4 transition-all ${
              selectedStudent ? 'lg:grid-cols-3' : 'grid-cols-1'
            }`}
          >
            {/* TABLE */}
            <div className={`${selectedStudent ? 'lg:col-span-2' : ''} bg-white p-4 rounded shadow`}>
              {loadingStudents ? <p>Loading…</p> : (
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="py-2 text-left">Roll</th>
                      <th className="py-2 text-left">Name</th>
                      <th className="py-2 text-left">%</th>
                      <th className="py-2 text-left">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <React.Fragment key={s.student_rollno}>
                        <tr
                          onClick={() => toggleCalendar(s)}
                          className={`cursor-pointer hover:bg-gray-50 ${
                            selectedStudent?.student_rollno === s.student_rollno ? 'bg-blue-50' : ''
                          }`}
                        >
                          <td className="py-2">{s.student_rollno}</td>
                          <td className="py-2">{s.name}</td>
                          <td className="py-2 font-semibold">
                            {s.attendance_percentage}%
                          </td>
                          <td className="py-2 font-semibold">
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleOpenEmailModal(s);
                             }} 
                             className="bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-600 transition-colors"
                           >
                             Send
                           </button>
                          </td>
                        </tr>

                        {/* MOBILE CALENDAR */}
                       {selectedStudent?.student_rollno === s.student_rollno && (
  <tr className="lg:hidden">
    <td colSpan="3" className="p-3 bg-gray-50 space-y-4">

      {/* Calendar */}
      {loadingCalendar ? (
        <p>Loading…</p>
      ) : (
        renderCalendar()
      )}

      {/* Stats (MOBILE) */}
      <div className="grid gap-2">
        <div className="bg-yellow-100 p-3 rounded flex justify-between">
          <span>Total Lectures</span>
          <strong>{totalLectures}</strong>
        </div>

        <div className="bg-green-100 p-3 rounded flex justify-between">
          <span>Present</span>
          <strong>{presentCount}</strong>
        </div>

        <div className="bg-red-100 p-3 rounded flex justify-between">
          <span>Absent</span>
          <strong>{absentCount}</strong>
        </div>
      </div>

    </td>
  </tr>
)}

                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* DESKTOP CALENDAR */}
            {selectedStudent && (
              <div className="hidden lg:block bg-white p-4 rounded shadow space-y-4">
                <h3 className="font-semibold">{selectedStudent.name}</h3>
                {loadingCalendar ? 'Loading…' : renderCalendar()}

                <div className="grid gap-3">
                  <div className="bg-yellow-100 p-3 rounded flex justify-between">
                    <span>Total Lectures</span>
                    <strong>{totalLectures}</strong>
                  </div>
                  <div className="bg-green-100 p-3 rounded flex justify-between">
                    <span>Present</span>
                    <strong>{presentCount}</strong>
                  </div>
                  <div className="bg-red-100 p-3 rounded flex justify-between">
                    <span>Absent</span>
                    <strong>{absentCount}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-md"
            onClick={() => setEmailModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10">
            <button
              onClick={() => setEmailModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-semibold mb-4">Send Email</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Email will be sent to: {emailStudent?.email ? emailStudent.email : 'Loading...'}
              </p>
              <textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type your message here..."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEmailModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={sendingEmail}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center"
              >
                {sendingEmail ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewStudents;
