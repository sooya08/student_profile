import React, { useState, useEffect, useRef } from 'react';
import { Save, Eye, Edit2, Eraser, Trash2, User, Hash, Building2, Users, Calendar, Phone, MapPin, Search, X, AlertTriangle, ChevronLeft, ChevronRight, Download, Upload, FileJson, Smartphone, Share2, CheckCircle } from 'lucide-react';

interface StudentData {
  id: string;
  name: string;
  registerNumber: string;
  department: string;
  gender: string;
  age: string;
  mobileNumber: string;
  city: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const departments = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Electrical',
  'Mechanical',
  'Civil',
  'MBA',
  'MCA'
];

const STORAGE_KEY = 'studentProfileData';

function App() {
  const [formData, setFormData] = useState<Omit<StudentData, 'id'>>({
    name: '',
    registerNumber: '',
    department: 'Computer Science',
    gender: 'Male',
    age: '',
    mobileNumber: '',
    city: ''
  });

  const [savedStudents, setSavedStudents] = useState<StudentData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSavedStudents(Array.isArray(parsed) ? parsed : []);
      } catch {
        setSavedStudents([]);
      }
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isInWebAppiOS = ('standalone' in window.navigator) && (window.navigator as Navigator & { standalone: boolean }).standalone;
      
      if (isStandalone || isInWebAppiOS) {
        setIsInstalled(true);
        setShowInstallPrompt(false);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      setIsInstalled(true);
      showToast('App installed successfully!', 'success');
    });

    checkInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const checkDuplicate = (field: keyof StudentData, value: string, excludeId?: string): boolean => {
    if (field === 'registerNumber' || field === 'mobileNumber') {
      return savedStudents.some(student => 
        student[field] === value && student.id !== excludeId
      );
    }
    return false;
  };

  const validateForm = (isUpdate: boolean = false): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.registerNumber.trim()) {
      newErrors.registerNumber = 'Register Number is required';
    } else if (checkDuplicate('registerNumber', formData.registerNumber, isUpdate ? selectedStudent?.id : undefined)) {
      newErrors.registerNumber = 'This Register Number already exists';
    }

    if (!formData.age.trim()) {
      newErrors.age = 'Age is required';
    } else if (!/^\d+$/.test(formData.age)) {
      newErrors.age = 'Age must be numeric';
    } else if (parseInt(formData.age) < 1 || parseInt(formData.age) > 120) {
      newErrors.age = 'Age must be between 1 and 120';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Mobile number must be exactly 10 digits';
    } else if (checkDuplicate('mobileNumber', formData.mobileNumber, isUpdate ? selectedStudent?.id : undefined)) {
      newErrors.mobileNumber = 'This mobile number already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      showToast('Please fix the validation errors', 'error');
      return;
    }

    const newStudent: StudentData = {
      id: generateId(),
      ...formData
    };

    const updatedStudents = [...savedStudents, newStudent];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStudents));
    setSavedStudents(updatedStudents);
    setCurrentIndex(updatedStudents.length - 1);
    handleClear();
    showToast('Student profile saved successfully!', 'success');
  };

  const handleView = () => {
    if (savedStudents.length === 0) {
      showToast('No saved data found', 'error');
      return;
    }
    showToast(`Found ${savedStudents.length} student record(s)`, 'success');
  };

  const handleEdit = (student: StudentData) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      registerNumber: student.registerNumber,
      department: student.department,
      gender: student.gender,
      age: student.age,
      mobileNumber: student.mobileNumber,
      city: student.city
    });
    setIsEditing(true);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdate = () => {
    if (!selectedStudent) {
      showToast('No student selected for update', 'error');
      return;
    }

    if (!validateForm(true)) {
      showToast('Please fix the validation errors', 'error');
      return;
    }

    const updatedStudents = savedStudents.map(student =>
      student.id === selectedStudent.id
        ? { ...student, ...formData }
        : student
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStudents));
    setSavedStudents(updatedStudents);
    setIsEditing(false);
    setSelectedStudent(null);
    handleClear();
    showToast('Student profile updated successfully!', 'success');
  };

  const handleClear = () => {
    setFormData({
      name: '',
      registerNumber: '',
      department: 'Computer Science',
      gender: 'Male',
      age: '',
      mobileNumber: '',
      city: ''
    });
    setErrors({});
    setIsEditing(false);
    setSelectedStudent(null);
  };

  const handleDelete = (id?: string) => {
    const deleteId = id || selectedStudent?.id;
    if (!deleteId) {
      showToast('No student selected to delete', 'error');
      return;
    }

    const updatedStudents = savedStudents.filter(student => student.id !== deleteId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStudents));
    setSavedStudents(updatedStudents);
    
    if (currentIndex >= updatedStudents.length) {
      setCurrentIndex(Math.max(0, updatedStudents.length - 1));
    }
    
    if (selectedStudent?.id === deleteId) {
      setSelectedStudent(null);
      setIsEditing(false);
      handleClear();
    }
    setShowDeleteConfirm(null);
    showToast('Student record deleted successfully', 'success');
  };

  const handleDeleteAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedStudents([]);
    setSelectedStudent(null);
    setIsEditing(false);
    setCurrentIndex(0);
    handleClear();
    setShowDeleteAllConfirm(false);
    showToast('All data deleted successfully', 'success');
  };

  const handleInputChange = (field: keyof StudentData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleDownload = () => {
    if (savedStudents.length === 0) {
      showToast('No data to download', 'error');
      return;
    }

    const dataStr = JSON.stringify(savedStudents, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Data downloaded successfully!', 'success');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      showToast('Please select a JSON file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);

        if (!Array.isArray(importedData)) {
          showToast('Invalid file format', 'error');
          return;
        }

        const validStudents: StudentData[] = [];
        const errors: string[] = [];

        importedData.forEach((student: StudentData, index: number) => {
          if (
            student.name &&
            student.registerNumber &&
            student.department &&
            student.gender &&
            student.age &&
            student.mobileNumber
          ) {
            validStudents.push({
              id: student.id || generateId(),
              name: student.name,
              registerNumber: student.registerNumber,
              department: student.department,
              gender: student.gender,
              age: student.age,
              mobileNumber: student.mobileNumber,
              city: student.city || ''
            });
          } else {
            errors.push(`Record ${index + 1} is missing required fields`);
          }
        });

        if (validStudents.length === 0) {
          showToast('No valid student records found in file', 'error');
          return;
        }

        const existingRegNumbers = new Set(savedStudents.map(s => s.registerNumber));
        const existingMobileNumbers = new Set(savedStudents.map(s => s.mobileNumber));

        const uniqueStudents: StudentData[] = [];
        const duplicates: string[] = [];

        validStudents.forEach(student => {
          if (existingRegNumbers.has(student.registerNumber) || existingMobileNumbers.has(student.mobileNumber)) {
            duplicates.push(student.registerNumber);
          } else {
            uniqueStudents.push(student);
            existingRegNumbers.add(student.registerNumber);
            existingMobileNumbers.add(student.mobileNumber);
          }
        });

        const mergedStudents = [...savedStudents, ...uniqueStudents];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedStudents));
        setSavedStudents(mergedStudents);

        let message = `Imported ${uniqueStudents.length} student(s)`;
        if (duplicates.length > 0) {
          message += ` (${duplicates.length} duplicate(s) skipped)`;
        }
        showToast(message, 'success');
      } catch (error) {
        showToast('Error parsing JSON file', 'error');
      }
    };

    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredStudents = savedStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.registerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(filteredStudents.length - 1, prev + 1));
  };

  const currentStudent = filteredStudents[currentIndex];

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-6 px-4 sm:px-6 lg:px-8">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        accept=".json"
        className="hidden"
      />

      {toast && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white font-medium transition-all duration-300`}
        >
          {toast.message}
        </div>
      )}

      {showInstallPrompt && !isInstalled && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-2xl p-4 z-50">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Install App</h3>
              <p className="text-sm text-white/80 mt-1">
                Add this app to your home screen for quick access and offline use!
              </p>
              <div className="flex gap-2 mt-3">
                {deferredPrompt ? (
                  <button
                    onClick={handleInstallClick}
                    className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-all"
                  >
                    Install Now
                  </button>
                ) : isIOS ? (
                  <div className="text-sm">
                    <p className="flex items-center gap-1">
                      Tap <Share2 className="w-4 h-4" /> then "Add to Home Screen"
                    </p>
                  </div>
                ) : null}
                <button
                  onClick={() => setShowInstallPrompt(false)}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-all"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowInstallPrompt(false)}
              className="text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Student Profile Management</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Alagappa University - Department of Computer Science</p>
          {isInstalled && (
            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              <CheckCircle className="w-4 h-4" />
              App Installed
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              {isEditing ? 'Edit Student Information' : 'Student Information'}
            </h2>
            {isEditing && (
              <button
                onClick={handleClear}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Cancel Edit
              </button>
            )}
          </div>

          {isEditing && selectedStudent && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-700 text-sm">
                Editing: <span className="font-semibold">{selectedStudent.name}</span> (Reg No: {selectedStudent.registerNumber})
              </p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Student Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter student name"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Register Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.registerNumber}
                  onChange={(e) => handleInputChange('registerNumber', e.target.value)}
                  placeholder="Enter register number"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    errors.registerNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.registerNumber && <p className="text-red-500 text-xs mt-1">{errors.registerNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Department
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                <select
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Gender
              </label>
              <div className="flex gap-6 mt-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="Male"
                    checked={formData.gender === 'Male'}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">Male</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="Female"
                    checked={formData.gender === 'Female'}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">Female</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="Other"
                    checked={formData.gender === 'Other'}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">Other</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Age <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    placeholder="Enter age"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      errors.age ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.mobileNumber}
                    onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                    placeholder="10 digit number"
                    maxLength={10}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      errors.mobileNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.mobileNumber && <p className="text-red-500 text-xs mt-1">{errors.mobileNumber}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                City
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mt-8">
            {!isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg font-medium text-xs sm:text-sm"
                >
                  <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Save</span>
                </button>

                <button
                  onClick={handleView}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-medium text-xs sm:text-sm"
                >
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>View</span>
                </button>

                <button
                  onClick={() => {
                    if (savedStudents.length > 0) {
                      handleEdit(savedStudents[currentIndex] || savedStudents[0]);
                    } else {
                      showToast('No student data to edit', 'error');
                    }
                  }}
                  disabled={savedStudents.length === 0}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => {
                    if (savedStudents.length > 0) {
                      setShowDeleteConfirm(savedStudents[currentIndex]?.id || savedStudents[0].id);
                    } else {
                      showToast('No student data to delete', 'error');
                    }
                  }}
                  disabled={savedStudents.length === 0}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Delete</span>
                </button>

                <button
                  onClick={() => setShowDeleteAllConfirm(true)}
                  disabled={savedStudents.length === 0}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-lg hover:from-rose-700 hover:to-rose-800 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Delete All</span>
                  <span className="sm:hidden">All</span>
                </button>

                <button
                  onClick={handleClear}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all shadow-md hover:shadow-lg font-medium text-xs sm:text-sm"
                >
                  <Eraser className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Clear</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleUpdate}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-md hover:shadow-lg font-medium text-xs sm:text-sm"
                >
                  <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Update</span>
                </button>

                <button
                  onClick={() => setShowDeleteConfirm(selectedStudent?.id || null)}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg font-medium text-xs sm:text-sm"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Delete</span>
                </button>

                <button
                  onClick={() => setShowDeleteAllConfirm(true)}
                  disabled={savedStudents.length === 0}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-lg hover:from-rose-700 hover:to-rose-800 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Delete All</span>
                  <span className="sm:hidden">All</span>
                </button>

                <button
                  onClick={handleClear}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all shadow-md hover:shadow-lg font-medium col-span-3 sm:col-span-3 text-xs sm:text-sm"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Cancel</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-indigo-600" />
              Download App
            </h2>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Smartphone className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-lg">Install as Mobile App</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Download this app to your device for quick access, offline use, and a native app-like experience!
                </p>
              </div>
              <div className="w-full sm:w-auto">
                {isInstalled ? (
                  <button
                    disabled
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-500 rounded-xl font-medium cursor-not-allowed"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>App Installed</span>
                  </button>
                ) : deferredPrompt ? (
                  <button
                    onClick={handleInstallClick}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-medium"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download App</span>
                  </button>
                ) : isIOS ? (
                  <div className="text-center sm:text-left">
                    <p className="text-sm text-gray-600 flex items-center justify-center sm:justify-start gap-2">
                      Tap <Share2 className="w-4 h-4" /> then "Add to Home Screen"
                    </p>
                  </div>
                ) : (
                  <button
                    disabled
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-500 rounded-xl font-medium cursor-not-allowed"
                  >
                    <Download className="w-5 h-5" />
                    <span>Preparing...</span>
                  </button>
                )}
              </div>
            </div>

            {!isInstalled && (
              <div className="mt-4 pt-4 border-t border-indigo-200">
                <p className="text-xs text-gray-500">
                  <strong>How to install:</strong> 
                  {isIOS 
                    ? ' On iOS, tap the Share button in Safari, then select "Add to Home Screen".'
                    : ' On Android, tap "Download App" or use Chrome menu → "Add to Home screen".'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <FileJson className="w-5 h-5 text-indigo-600" />
              Data Management
            </h2>

            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                disabled={savedStudents.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>

              <button
                onClick={handleImportClick}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg hover:from-violet-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium text-sm"
              >
                <Upload className="w-4 h-4" />
                <span>Import</span>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileJson className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-1">Export & Import Data</h3>
                <p className="text-sm text-gray-600">
                  <strong>Download:</strong> Save all student data as a JSON file to your device. You can open this file in any text editor or import it back later.
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Import:</strong> Load student data from a previously downloaded JSON file. Duplicate entries (same Register Number or Mobile) will be skipped.
                </p>
              </div>
            </div>
          </div>
        </div>

        {savedStudents.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Saved Students ({savedStudents.length})
              </h2>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentIndex(0);
                  }}
                  placeholder="Search students..."
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-64"
                />
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{searchTerm ? 'No matching students found' : 'No students saved yet'}</p>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 sm:p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md">
                        {currentStudent?.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{currentStudent?.name}</h3>
                        <p className="text-sm text-gray-500">{currentStudent?.department}</p>
                      </div>
                    </div>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      {currentIndex + 1} / {filteredStudents.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500 text-sm">Register No:</span>
                      <span className="text-gray-800 font-medium">{currentStudent?.registerNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500 text-sm">Gender:</span>
                      <span className="text-gray-800 font-medium">{currentStudent?.gender}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500 text-sm">Age:</span>
                      <span className="text-gray-800 font-medium">{currentStudent?.age} years</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500 text-sm">Mobile:</span>
                      <span className="text-gray-800 font-medium">{currentStudent?.mobileNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500 text-sm">City:</span>
                      <span className="text-gray-800 font-medium">{currentStudent?.city || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleEdit(currentStudent!)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all font-medium shadow-md"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(currentStudent?.id || null)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-medium shadow-md"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>
                  <div className="flex gap-1">
                    {filteredStudents.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          idx === currentIndex ? 'bg-blue-600 scale-125' : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleNext}
                    disabled={currentIndex === filteredStudents.length - 1}
                    className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {savedStudents.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Students Saved Yet</h3>
            <p className="text-gray-500">Fill out the form above and click Save to add a student.</p>
          </div>
        )}

        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>Assignment 1 - SharedPreferences using localStorage</p>
          <p className="mt-1">Alagappa University © 2025</p>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Delete Student?</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this student record? All data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Delete All Data?</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete all {savedStudents.length} student record(s)? All data will be permanently removed from storage.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-medium"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
