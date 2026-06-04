import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, BookOpen, Clock, MapPin, User, X } from 'lucide-react';
import { courseData} from './data';
const CourseTimetable = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: 'all',
    program: 'all',
    semester: 'all'
  });

  const parseCsvLine = (line) => {
    const parts = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current);
    return parts;
  };

  // Parse the CSV data
  useEffect(() => {
    const lines = courseData.trim().split('\n');
    const header = parseCsvLine(lines[0]);
    const dataLines = lines.slice(1).filter(line => line.trim().length > 0);
    const slotNumbers = [...new Set(
      header
        .filter(key => key.startsWith('Slot ') && key.endsWith(' Day'))
        .map(key => Number(key.replace('Slot ', '').replace(' Day', '')))
        .filter(Number.isFinite)
    )].sort((a, b) => a - b);

    const parsedCourses = dataLines
      .map((line) => {
        const row = parseCsvLine(line);
        if (row.length < 7) return null;

        const record = header.reduce((acc, key, index) => {
          acc[key] = row[index] ? row[index].trim() : '';
          return acc;
        }, {});

        const course = record['Course'] || '';
        const instructor = record['Instructor name'] || '';
        const dept = record['Department'] || '';
        const program = record['Programm'] || '';
        const branchInfo = record['Branch/Semester/Section'] || '';
        const ltp = record['Offered L-T-P'] || '';
        const slNo = record['Sl No'] || '';

        const sessions = [];
        slotNumbers.forEach((slotNumber) => {
          const day = record[`Slot ${slotNumber} Day`];
          const time = record[`Slot ${slotNumber} Time`];
          const venue = record[`Slot ${slotNumber} Venue`];
          if (day && time) {
            sessions.push({
              day: day.trim(),
              time: time.trim(),
              venue: venue ? venue.trim() : 'TBA'
            });
          }
        });

        const courseCodeMatch = course.match(/^([^\(]+)/);
        const courseNameMatch = course.match(/\((.*?)\)/);
        const [branch, semester, section] = branchInfo.split('/').map(part => part.trim());

        return {
          id: slNo,
          code: courseCodeMatch ? courseCodeMatch[1].trim() : course,
          name: courseNameMatch ? courseNameMatch[1] : course,
          fullName: course,
          instructor: instructor.trim(),
          department: dept.trim(),
          program: program.trim(),
          branch: branch || branchInfo.trim(),
          semester: semester || '',
          section: section || '',
          credits: ltp,
          sessions
        };
      })
      .filter(Boolean);

    setCourses(parsedCourses);
  }, []);

  const departments = [...new Set(courses.map(c => c.department))].filter(Boolean).sort();
  const programs = [...new Set(courses.map(c => c.program))].filter(Boolean).sort();
  const semesters = [...new Set(courses.map(c => c.semester))].filter(Boolean);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filters.department === 'all' || course.department === filters.department;
    const matchesProg = filters.program === 'all' || course.program === filters.program;
    const matchesSem = filters.semester === 'all' || course.semester === filters.semester;
    
    return matchesSearch && matchesDept && matchesProg && matchesSem;
  });

  const toggleCourse = (course) => {
    setSelectedCourses(prev => {
      const exists = prev.find(c => c.id === course.id);
      if (exists) {
        return prev.filter(c => c.id !== course.id);
      }
      return [...prev, course];
    });
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '02:00', '03:00', '04:00', '05:00', '06:00'
  ];

  const getTimetableCell = (day, time) => {
    return selectedCourses.filter(course => 
      course.sessions.some(session => {
        if (session.day !== day) return false;
        const sessionStartTime = session.time.split('-')[0];
        return sessionStartTime === time;
      })
    );
  };

  // Add clash detection function
  const detectClashes = () => {
    const clashes = [];
    const timeSlotMap = {};

    selectedCourses.forEach(course => {
      course.sessions.forEach(session => {
        const key = `${session.day}-${session.time}`;
        if (!timeSlotMap[key]) {
          timeSlotMap[key] = [];
        }
        timeSlotMap[key].push({
          course: course.code,
          name: course.name,
          venue: session.venue
        });
      });
    });

    Object.entries(timeSlotMap).forEach(([timeSlot, courses]) => {
      if (courses.length > 1) {
        const [day, time] = timeSlot.split('-');
        clashes.push({
          day,
          time,
          courses
        });
      }
    });

    return clashes;
  };

  const clashes = detectClashes();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full mx-auto pl-4 pr-0 py-8 lg:pl-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-indigo-600" />
              <h6 className="text-3xl font-bold text-gray-800">Timetable Builder</h6>
            </div>
            <div className="text-sm text-gray-600 pr-4">
              {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''} selected
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 sticky top-4">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Courses
              </h2>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  className="text-black w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filters */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-700">Filters</span>
                </div>
                
                <select
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500"
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                <select
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500"
                  value={filters.program}
                  onChange={(e) => setFilters({ ...filters, program: e.target.value })}
                >
                  <option value="all">All Programs</option>
                  {programs.map(prog => (
                    <option key={prog} value={prog}>{prog}</option>
                  ))}
                </select>

                <select
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500"
                  value={filters.semester}
                  onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                >
                  <option value="all">All Semesters</option>
                  {semesters.map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>

              {/* Course List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredCourses.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">No courses found</div>
                ) : (
                  filteredCourses.map(course => (
                    <div
                      key={course.id}
                      onClick={() => toggleCourse(course)}
                      className={`p-3 rounded-lg cursor-pointer transition-all border ${
                        selectedCourses.find(c => c.id === course.id)
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-800'
                          : 'bg-white border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-semibold text-sm text-gray-800">{course.code}</div>
                      <div className="text-xs text-gray-600 truncate">{course.name}</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {course.instructor}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{course.credits}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Timetable */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
                <Clock className="w-6 h-6 text-indigo-600" />
                Weekly Timetable
              </h2>

              {selectedCourses.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-gray-300 rounded-lg">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No courses selected</p>
                  <p className="text-gray-500 text-sm mt-2">Select courses from the sidebar to build your timetable</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 text-sm uppercase tracking-wide">
                        <th className="border border-gray-200 p-2 w-24 text-left">Time</th>
                        {days.map(day => (
                          <th key={day} className="border border-gray-200 p-2 text-left">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map(time => (
                        <tr key={time} className="bg-white">
                          <td className="border border-gray-200 p-2 text-sm font-semibold text-gray-700 bg-gray-50">
                            {time}
                          </td>
                          {days.map(day => {
                            const coursesInSlot = getTimetableCell(day, time);
                            return (
                              <td key={`${day}-${time}`} className="border border-gray-200 p-2 align-top min-h-[80px] bg-white">
                                {coursesInSlot.map(course => {
                                  const session = course.sessions.find(s => 
                                    s.day === day && s.time.split('-')[0] === time
                                  );
                                  const hasClash = coursesInSlot.length > 1;
                                  return session ? (
                                    <div
                                      key={course.id}
                                      className={`${
                                        hasClash 
                                          ? 'bg-red-500 border-2 border-red-700' 
                                          : 'bg-indigo-500'
                                      } text-white p-3 rounded-lg mb-2 text-xs relative hover:opacity-90 transition-opacity`}
                                    >
                                      {hasClash && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                          <span className="text-red-800 text-xs font-bold">!</span>
                                        </div>
                                      )}
                                      <div className="font-semibold text-sm">{course.code}</div>
                                      <div className="text-xs opacity-90 truncate">{course.name}</div>
                                      <div className="flex items-center gap-1 mt-2 opacity-90 text-xs">
                                        <MapPin className="w-3 h-3" />
                                        <span>{session.venue}</span>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleCourse(course);
                                        }}
                                        className="absolute top-2 right-2 text-white/70 hover:text-white"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : null;
                                })}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Clash Warnings */}
              {clashes.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <h3 className="font-semibold text-red-800">Schedule Conflicts Detected</h3>
                  </div>
                  <div className="space-y-2">
                    {clashes.map((clash, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium text-red-700">
                          {clash.day} at {clash.time}:
                        </div>
                        <ul className="ml-4 text-red-600">
                          {clash.courses.map((course, courseIndex) => (
                            <li key={courseIndex}>
                              • {course.course} - {course.name} ({course.venue})
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Courses Summary */}
              {selectedCourses.length > 0 && (
                <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">Selected Courses Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedCourses.map(course => (
                      <div key={course.id} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="font-semibold text-indigo-600">{course.code}:</span>
                        <span className="flex-1">{course.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseTimetable;