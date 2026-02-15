import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import { toast ,ToastContainer} from "react-toastify";

function TeacherAdvisor() {
  const now = new Date();
  const date = now.getDate();
  const month = now.toLocaleString("default", { month: "long" });
  const day = now.toLocaleString("default", { weekday: "long" });
  const year = now.getFullYear();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [expandedRollNo, setExpandedRollNo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showUpdateInputs, setShowUpdateInputs] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [updateText, setUpdateText] = useState("");
  const [showModal, setShowModal] = useState(false);
const [lectureData, setLectureData] = useState([]);
const [selectedStudent, setSelectedStudent] = useState(null);
const [updating, setUpdating] = useState(false);
const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
const [reportFormat, setReportFormat] = useState("pdf");
const [downloading, setDownloading] = useState(false);
const [showReportModal, setShowReportModal] = useState(false);



  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchAdvisorStudents = async () => {
      try {
        setLoading(true);
        const res = await api.get("/teacher/advisor-students");

        if (res.data.success) {
          setStudents(res.data.students);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load advisor students");
      } finally {
        setLoading(false);
      }
    };

    fetchAdvisorStudents();
  }, []);
  const handleDownloadReport = async (type) => {
  try {
    setDownloading(true);

    const academicYear = "2025-26";

    let params = {
      type,
      academic_year: academicYear,
      format: reportFormat,
    };

    if (type === "monthly") {
      params.month = reportMonth;
    }

    const res = await api.get("/teacher/download-report", {
      params,
      responseType: "blob",
    });

    const fileExtension = reportFormat === "pdf" ? "pdf" : "xlsx";

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute(
      "download",
      `${type}-attendance-report.${fileExtension}`
    );

    document.body.appendChild(link);
    link.click();
    link.remove();

    toast.success("Report downloaded successfully");
  } catch (err) {
    console.error(err);
    toast.error("Failed to download report");
  } finally {
    setDownloading(false);
  }
};

  const handleFetchLectures = async () => {
  if (!selectedDate || !updateText) {
    toast.warning("Please enter date and roll number");
    return;
  }

  try {
    const res = await api.get("/teacher/advisor-student-lectures", {
      params: {
        student_rollno: updateText,
        date: selectedDate,
      },
    });

    if (res.data.success && res.data.lectures.length > 0) {
      setLectureData(res.data.lectures);
      setSelectedStudent(res.data.student);
      setShowModal(true);
    } else {
      toast.info("No lectures found for this date");
    }
  } catch (err) {
    console.error(err.message);
    toast.error("Failed to fetch lectures");
  }
};
const handleUpdateLecture = async (lecture) => {
  try {
    setUpdating(true);

    const newStatus =
      lecture.status === "Present" ? "Absent" : "Present";

    const res = await api.put("/teacher/advisor-mark-present", {
      updates: [
        {
          attendance_id: lecture.attendance_id,
          status: newStatus,
        },
      ],
    });

    res.data.results.forEach((r) => {
      if (r.updated) {
        toast.success(
          `Lecture ${r.lecture_no} (${r.subject}) → ${r.new_status}`
        );
      } else {
        toast.info(
          `Lecture ${r.lecture_no}: ${r.reason}`
        );
      }
    });

    // update UI instantly
    setLectureData((prev) =>
      prev.map((l) =>
        l.attendance_id === lecture.attendance_id
          ? { ...l, status: newStatus }
          : l
      )
    );
  } catch (err) {
    console.error(err);
    toast.error("Failed to update attendance");
  } finally {
    setUpdating(false);
  }
};


  /* ================= HELPERS ================= */
  const toggleRow = (rollNo) => {
    setExpandedRollNo((prev) => (prev === rollNo ? null : rollNo));
  };

  const handleUpdateClick = () => {
    setShowUpdateInputs(!showUpdateInputs);
    if (!showUpdateInputs) {
      // Reset inputs when opening
      setSelectedDate("");
      setUpdateText("");
    }
  };

  const handleDateChange = (e) => {
    const today = new Date().toISOString().split('T')[0];
    if (e.target.value <= today) {
      setSelectedDate(e.target.value);
    }
  };

  const getMaxDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading advisor dashboard...</div>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen w-full bg-gray-100">
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

      <div className="flex flex-col md:flex-row">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Main Content */}
        <div className="flex-1 mt-8 px-4 md:ml-8 md:mr-8 space-y-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-2xl lg:text-3xl font-bold text-black">
                  Advisor Dashboard
                </h1>
                <p className="text-gray-600 text-base sm:text-lg">
                  {day}, {month} {date}, {year}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
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
                    onClick={handleUpdateClick}
                    className="bg-blue-600 flex items-center justify-center text-white px-4 sm:px-6 lg:px-8 py-2 lg:py-2.5 rounded-lg lg:rounded-xl hover:bg-blue-700 transition-colors active:scale-95 duration-200 cursor-pointer text-base sm:text-lg w-full sm:w-auto lg:h-[40px] lg:font-medium"
                  >
                    Update
                  </button>
                    <button 
                    onClick={() => setShowReportModal(true)}
                    className="bg-blue-600 flex items-center justify-center text-white px-4 sm:px-6 lg:px-8 py-2 lg:py-2.5 rounded-lg lg:rounded-xl hover:bg-blue-700 transition-colors active:scale-95 duration-200 cursor-pointer text-base sm:text-lg w-full sm:w-auto lg:h-[40px] lg:font-medium"
                  >
                    Download Report
                  </button>
                </div>
              </div>
            </div>

            {/* Update Inputs Section */}
            {showUpdateInputs && (
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={handleDateChange}
                      max={getMaxDate()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Update Text
                    </label>
                    <input
                      type="text"
                      value={updateText}
                      onChange={(e) => setUpdateText(e.target.value)}
                      placeholder="Enter Roll no to update student attendance status..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button onClick={handleFetchLectures}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg">Fetch</button>
                </div>
              </div>
            )}
          </div>

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
                      Overall %
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => {
                    const isLow = student.percentage < 75;

                    return (
                      <React.Fragment key={student.rollNo}>
                        {/* MAIN ROW */}
                        <tr
                          onClick={() => toggleRow(student.rollNo)}
                          className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50
                            ${isLow ? "bg-red-50" : ""}`}
                        >
                          <td className="py-3 px-4 text-base sm:text-lg">{student.rollNo}</td>
                          <td className="py-3 px-4 text-base sm:text-lg">{student.name}</td>
                          <td className="py-3 px-4">
                            <div
                              className={`w-16 sm:w-20 h-6 sm:h-8 text-sm sm:text-lg rounded border flex items-center justify-center font-semibold ${
                                isLow 
                                  ? "bg-red-500 border-red-600 text-white" 
                                  : "bg-green-500 border-green-600 text-white"
                              }`}
                            >
                              {student.percentage}%
                            </div>
                          </td>
                        </tr>

                        {/* EXPANDED ROW */}
                        <tr>
                          <td colSpan="3" className="p-0">
                            <div
                              className={`overflow-hidden transition-all duration-300 ease-in-out
                                ${
                                  expandedRollNo === student.rollNo
                                    ? "max-h-[500px] opacity-100"
                                    : "max-h-0 opacity-0"
                                }`}
                            >
                              <div className="bg-gray-50 px-6 py-4 border-l-4 border-blue-500">
                                {/* Monthly Summary */}
                                <div className="mb-4">
                                  <h4 className="font-semibold text-gray-700 mb-2">
                                    Current Month Summary
                                  </h4>
                                  <div className="flex gap-6 text-sm">
                                    <span>Total: {student.totalLectures}</span>
                                    <span className="text-green-600">
                                      Present: {student.present}
                                    </span>
                                    <span className="text-red-600">
                                      Absent:{" "}
                                      {student.totalLectures - student.present}
                                    </span>
                                  </div>
                                </div>

                                {/* Subject-wise */}
                                <div>
                                  <h4 className="font-semibold text-gray-700 mb-2">
                                    Subject-wise Attendance
                                  </h4>

                                  {student.subjects.length === 0 ? (
                                    <p className="text-sm text-gray-500">
                                      No attendance data available
                                    </p>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {student.subjects.map((sub) => {
                                        const percent =
                                          sub.total > 0
                                            ? Math.round(
                                                (sub.present / sub.total) * 100
                                              )
                                            : 0;

                                        const lowSub = percent < 75;

                                        return (
                                          <div
                                            key={sub.subject_id}
                                            className={`rounded-lg p-3 border
                                              ${
                                                lowSub
                                                  ? "border-red-300 bg-red-50"
                                                  : "border-green-300 bg-green-50"
                                              }`}
                                          >
                                            <p className="font-medium">
                                              {sub.subject_name}
                                            </p>
                                            <p
                                              className={`text-sm font-semibold
                                                ${
                                                  lowSub
                                                    ? "text-red-600"
                                                    : "text-green-600"
                                                }`}
                                            >
                                              {sub.present}/{sub.total} (
                                              {percent}%)
                                            </p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}

                  {filteredStudents.length === 0 && (
                    <tr>
                      <td
                        colSpan="3"
                        className="text-center py-8 text-gray-500 text-base sm:text-lg"
                      >
                        No students found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {showModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">
            {selectedStudent.name}
          </h2>
          <p className="text-sm text-gray-600">
            Roll No: {selectedStudent.student_rollno}
          </p>
        </div>
        <button
          onClick={() => setShowModal(false)}
          className="text-gray-500 hover:text-black text-xl"
        >
          ✕
        </button>
      </div>

      {/* Lectures Table */}
      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Lecture</th>
              <th className="p-2 border">Subject</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>

          <tbody>
            {lectureData.map((lec) => (
              <tr key={lec.attendance_id} className="text-center">
                <td className="p-2 border">{lec.lecture_no}</td>
                <td className="p-2 border">{lec.subject_name}</td>
                <td className="p-2 border">{lec.lecture_type}</td>
                <td
                  className={`p-2 border font-semibold ${
                    lec.status === "Present"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {lec.status}
                </td>
                <td className="p-2 border">
                  <button
                    disabled={updating}
                    onClick={() => handleUpdateLecture(lec)}
                    className={`px-3 py-1 rounded text-white ${
                      lec.status === "Present"
                        ? "bg-red-500"
                        : "bg-green-500"
                    }`}
                  >
                    Mark {lec.status === "Present" ? "Absent" : "Present"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

  {/* REPORT MODAL */}
  {showReportModal && (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-6">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Download Report
          </h2>
          <button
            onClick={() => setShowReportModal(false)}
            className="text-gray-500 hover:text-black text-2xl"
          >
            ✕
          </button>
        </div>

        {/* REPORT SECTION */}
        <div className="bg-gray-50 border rounded-xl p-4 mt-4 flex flex-col lg:flex-row lg:items-end gap-4">

          {/* Month Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Month
            </label>
            <select
              value={reportMonth}
              onChange={(e) => setReportMonth(Number(e.target.value))}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
          </div>

          {/* Format Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Format
            </label>
            <select
              value={reportFormat}
              onChange={(e) => setReportFormat(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              disabled={downloading}
              onClick={() => handleDownloadReport("monthly")}
              className={`px-5 py-2 rounded-lg text-white font-medium transition
                ${downloading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {downloading ? "Downloading..." : "Download Monthly"}
            </button>

            <button
              disabled={downloading}
              onClick={() => handleDownloadReport("overall")}
              className={`px-5 py-2 rounded-lg text-white font-medium transition
                ${downloading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {downloading ? "Downloading..." : "Download Overall"}
            </button>
          </div>
        </div>

      </div>
    </div>
  )}

      </div>
    </div>
  );
}

export default TeacherAdvisor;