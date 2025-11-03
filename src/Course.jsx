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

  // Parse the CSV data
  useEffect(() => {
    const csvData = courseData
    const lines = csvData.trim().split('\n').slice(1);
    const parsedCourses = lines.map(line => {
      // Better CSV parsing to handle quoted fields
      const parts = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current.trim());
      
      if (parts.length < 8) return null;
      
      const [slNo, course, instructor, dept, program, branch, ltp, timeTable] = parts;
      
      const sessions = [];
      const timeTableClean = timeTable.replace(/"/g, '');
      const sessionMatches = timeTableClean.matchAll(/(\w+)\s+(\d{2}:\d{2}-\d{2}:\d{2})\s+([\w\-\/]+(?:\s+[\w]+)?)/g);
      
      for (const sessionMatch of sessionMatches) {
        sessions.push({
          day: sessionMatch[1],
          time: sessionMatch[2],
          venue: sessionMatch[3]
        });
      }
      
      const courseCodeMatch = course.match(/^([^\(]+)/);
      const courseNameMatch = course.match(/\((.*?)\)/);
      
      return {
        id: slNo,
        code: courseCodeMatch ? courseCodeMatch[1].trim() : course,
        name: courseNameMatch ? courseNameMatch[1] : course,
        fullName: course,
        instructor: instructor.trim(),
        department: dept.trim(),
        program: program.trim(),
        branch: branch.split('/')[0],
        semester: branch.split('/')[1] || '',
        credits: ltp,
        sessions
      };
    }).filter(Boolean);

    setCourses(parsedCourses);
  }, []);

  const departments = [...new Set(courses.map(c => c.department))].filter(Boolean);
  const programs = [...new Set(courses.map(c => c.program))].filter(Boolean);
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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full mx-auto pl-4 pr-0 py-8 lg:pl-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-10 h-10 text-indigo-600" />
              <h1 className="text-4xl font-bold text-gray-800">Course Timetable Builder</h1>
            </div>
            <div className="text-sm text-gray-600">
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                    <option key={dept} value={dept}>{dept.toUpperCase()}</option>
                  ))}
                </select>

                <select
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500"
                  value={filters.program}
                  onChange={(e) => setFilters({ ...filters, program: e.target.value })}
                >
                  <option value="all">All Programs</option>
                  {programs.map(prog => (
                    <option key={prog} value={prog}>{prog.toUpperCase()}</option>
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
                                  return session ? (
                                    <div
                                      key={course.id}
                                      className="bg-indigo-500 text-white p-3 rounded-lg mb-2 text-xs relative hover:bg-indigo-600 transition-colors"
                                    >
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