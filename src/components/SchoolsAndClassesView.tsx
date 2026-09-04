// EduGuard MDM — Schools, Classes & Student Directory (Clean Minimalism)

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Smartphone,
} from 'lucide-react';
import { School, SchoolClass, Student, Device } from '../types/mdm';

interface SchoolsAndClassesViewProps {
  schools: School[];
  classes: SchoolClass[];
  students: Student[];
  devices: Device[];
  onCreateStudent: (student: Partial<Student>) => void;
  onCreateClass: (cls: Partial<SchoolClass>) => void;
}

export const SchoolsAndClassesView: React.FC<SchoolsAndClassesViewProps> = ({
  classes,
  students,
  devices,
  onCreateStudent,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'cls-12-a');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  // New Student state
  const [newStudentName, setNewStudentName] = useState('');
  const [newRollNumber, setNewRollNumber] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const activeClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classStudents = students.filter(
    (s) =>
      s.classId === selectedClassId &&
      (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName) return;
    onCreateStudent({
      name: newStudentName,
      rollNumber: newRollNumber || `RN-${Math.floor(100 + Math.random() * 900)}`,
      email: newEmail || `${newStudentName.toLowerCase().replace(/\s+/g, '.')}@greenwood.edu`,
      classId: selectedClassId,
      schoolId: activeClass?.schoolId || 'sch-greenwood-01',
      className: activeClass?.name || 'Class XII',
      section: activeClass?.section || 'A',
      status: 'ACTIVE',
    });
    setShowAddStudentModal(false);
    setNewStudentName('');
    setNewRollNumber('');
    setNewEmail('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-base text-gray-950">Institutional Hierarchy & Student Assignments</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage multi-tenant campuses, grades, classrooms, and 1:1 hardware device bindings.
          </p>
        </div>

        <button
          onClick={() => setShowAddStudentModal(true)}
          className="px-4 py-2.5 bg-gray-950 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Student to Class</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 1 Col: Classes List */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-3">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-[10px] text-gray-400 uppercase tracking-widest">Classrooms</span>
            <span className="text-[11px] text-gray-400 font-semibold">{classes.length} Classes</span>
          </div>

          <div className="space-y-2 text-xs">
            {classes.map((cls) => {
              const count = students.filter((s) => s.classId === cls.id).length;
              const isSelected = selectedClassId === cls.id;
              return (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-gray-950 border-gray-950 text-white shadow-xs'
                      : 'border-gray-100 hover:bg-gray-50/70 text-gray-700 bg-white'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{cls.name}</div>
                    <div className={`text-[11px] ${isSelected ? 'text-gray-400' : 'text-gray-400'}`}>Section {cls.section}</div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      isSelected ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 3 Cols: Class Roster & Student Hardware Bindings */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students in this class..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
              />
            </div>

            <div className="text-xs font-semibold text-gray-700">
              {activeClass?.name} ({activeClass?.section}) — {classStudents.length} Enrolled
            </div>
          </div>

          {/* Students Roster Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600 border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <th className="py-3.5 px-6">Student Name & Roll</th>
                    <th className="py-3.5 px-6">School Email</th>
                    <th className="py-3.5 px-6">Assigned Tablet Device</th>
                    <th className="py-3.5 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-normal">
                  {classStudents.map((s) => {
                    const matchedDevice = devices.find((d) => d.assignedStudentId === s.id);
                    return (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-gray-950">{s.name}</div>
                          <span className="text-[11px] text-gray-400 font-mono">{s.rollNumber}</span>
                        </td>

                        <td className="py-4 px-6 text-gray-600">{s.email}</td>

                        <td className="py-4 px-6">
                          {matchedDevice ? (
                            <div className="flex items-center space-x-1.5">
                              <Smartphone className="w-3.5 h-3.5 text-gray-900" />
                              <span className="font-semibold text-gray-950">{matchedDevice.deviceId}</span>
                              <span className="text-[11px] text-gray-400">({matchedDevice.model})</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No Device Assigned</span>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                            ACTIVE
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-xs select-none">
          <form
            onSubmit={handleAddStudent}
            className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl border border-gray-100 space-y-4"
          >
            <h3 className="font-semibold text-base text-gray-950">Add Student to {activeClass?.name}</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Chen"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                />
              </div>

              <div>
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Roll / Admission Number</label>
                <input
                  type="text"
                  placeholder="e.g. XII-A-09"
                  value={newRollNumber}
                  onChange={(e) => setNewRollNumber(e.target.value)}
                  className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                />
              </div>

              <div>
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block mb-1">School Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. maya.chen@greenwood.edu"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100 text-xs">
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="px-4 py-2 text-gray-500 hover:text-gray-900 rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-950 hover:bg-gray-800 text-white rounded-xl font-semibold shadow-xs cursor-pointer"
              >
                Register Student
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
