// EduGuard MDM — Class-wise & Subject-wise Study Notes & PDF Materials Manager
// Real-Time PDF Distribution to Student Kiosk Tablets & Windows Workstations

import React, { useState, useRef } from 'react';
import {
  BookOpen,
  FileText,
  Upload,
  Search,
  Filter,
  Trash2,
  Eye,
  Download,
  Plus,
  CheckCircle2,
  FolderOpen,
  GraduationCap,
  Sparkles,
  Layers,
  FileCode,
  HardDrive,
  X,
  Clock,
  User,
  AlertCircle,
  ExternalLink,
  Video,
  Music,
  Image as ImageIcon,
  Play,
} from 'lucide-react';
import { StudyMaterial, SchoolClass, AdminUser, StudyMaterialType } from '../types/mdm';

interface StudyMaterialsViewProps {
  materials: StudyMaterial[];
  classes: SchoolClass[];
  currentUser: AdminUser | null;
  onUploadMaterial: (data: Partial<StudyMaterial>) => Promise<void>;
  onDeleteMaterial: (id: string) => Promise<void>;
  onLaunchStudentWorkspace?: () => void;
}

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Mathematics: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Physics: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Chemistry: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Biology: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Computer Science': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  English: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Social Science': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
};

export const StudyMaterialsView: React.FC<StudyMaterialsViewProps> = ({
  materials,
  classes,
  currentUser,
  onUploadMaterial,
  onDeleteMaterial,
  onLaunchStudentWorkspace,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<StudyMaterial | null>(null);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadClassId, setUploadClassId] = useState<string>(classes[0]?.id || 'cls-12-a');
  const [uploadSubject, setUploadSubject] = useState('Mathematics');
  const [uploadChapter, setUploadChapter] = useState('');
  const [uploadType, setUploadType] = useState<StudyMaterialType>('PDF');
  const [uploadContentMarkdown, setUploadContentMarkdown] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableSubjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'English',
    'Social Science',
    'General Science',
  ];

  // Filtered Materials
  const filteredMaterials = materials.filter((m) => {
    const matchesClass = selectedClassId === 'ALL' || m.classId === selectedClassId || m.classId === 'ALL';
    const matchesSubject = selectedSubject === 'ALL' || m.subject.toLowerCase() === selectedSubject.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.chapterOrUnit?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.fileName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSubject && matchesSearch;
  });

  const detectFileType = (file: File): StudyMaterialType => {
    const name = file.name.toLowerCase();
    const mime = file.type.toLowerCase();
    if (mime.startsWith('video/') || ['.mp4', '.webm', '.ogg', '.mov', '.mkv'].some((ext) => name.endsWith(ext))) {
      return 'VIDEO';
    }
    if (mime.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a', '.aac'].some((ext) => name.endsWith(ext))) {
      return 'AUDIO';
    }
    if (mime.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'].some((ext) => name.endsWith(ext))) {
      return 'IMAGE';
    }
    if (mime.includes('pdf') || name.endsWith('.pdf')) {
      return 'PDF';
    }
    return 'DOCUMENT';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const detected = detectFileType(file);
    setUploadType(detected);

    if (!uploadTitle.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setUploadTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileDataUrl(event.target?.result as string);
    };
    reader.onerror = () => {
      setErrorMsg('Could not read selected file.');
    };
    reader.readAsDataURL(file);
    setErrorMsg(null);
  };

  // Demo sample media loaders for quick testing
  const loadSampleMedia = (type: 'VIDEO' | 'AUDIO' | 'PDF' | 'IMAGE') => {
    if (type === 'VIDEO') {
      setUploadType('VIDEO');
      setUploadTitle('Electromagnetic Induction & Faraday Laws (Lecture Video)');
      setUploadSubject('Physics');
      setUploadChapter('Unit 4: Electromagnetism');
      setUploadDescription('High-definition demonstration video showing magnetic fields and induction.');
      setFileDataUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
      setSelectedFile(new File(['sample-video'], 'Electromagnetic_Induction_Video.mp4', { type: 'video/mp4' }));
    } else if (type === 'AUDIO') {
      setUploadType('AUDIO');
      setUploadTitle('English Pronunciation & Shakespeare Sonnet Lecture');
      setUploadSubject('English');
      setUploadChapter('Unit 2: Poetry & Drama');
      setUploadDescription('Audio pronunciation and stanza breakdown by Senior English faculty.');
      setFileDataUrl('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
      setSelectedFile(new File(['sample-audio'], 'Literature_Audio_Lecture.mp3', { type: 'audio/mp3' }));
    } else if (type === 'IMAGE') {
      setUploadType('IMAGE');
      setUploadTitle('Plant Cell & Organelle Diagram (High Resolution)');
      setUploadSubject('Biology');
      setUploadChapter('Chapter 8: Cell Structure');
      setUploadDescription('Labeled diagram showing chloroplasts, vacuole, cell wall, and nucleus.');
      setFileDataUrl('https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80');
      setSelectedFile(new File(['sample-image'], 'Cell_Biology_Diagram.jpg', { type: 'image/jpeg' }));
    } else {
      setUploadType('PDF');
      setUploadTitle('CBSE 2026 Mathematics Solved Calculus Guide');
      setUploadSubject('Mathematics');
      setUploadChapter('Unit 3: Differential Calculus');
      setUploadDescription('Step-by-step differentiation formulas, solved examples, and practice exercises.');
      setFileDataUrl('https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf');
      setSelectedFile(new File(['sample-pdf'], 'Mathematics_Calculus_Guide.pdf', { type: 'application/pdf' }));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      setErrorMsg('Please enter a title for this study material.');
      return;
    }

    if (uploadType !== 'RICH_NOTE' && !selectedFile && !fileDataUrl) {
      setErrorMsg('Please choose a file to upload or select a demo sample.');
      return;
    }

    if (uploadType === 'RICH_NOTE' && !uploadContentMarkdown.trim()) {
      setErrorMsg('Please enter study note content.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const selectedClass = classes.find((c) => c.id === uploadClassId);
      const targetClassName = uploadClassId === 'ALL' ? 'All Classes' : selectedClass?.name || 'Classroom';

      let fileExt = 'pdf';
      if (uploadType === 'VIDEO') fileExt = 'mp4';
      if (uploadType === 'AUDIO') fileExt = 'mp3';
      if (uploadType === 'IMAGE') fileExt = 'jpg';
      if (uploadType === 'DOCUMENT') fileExt = 'doc';

      await onUploadMaterial({
        title: uploadTitle.trim(),
        description: uploadDescription.trim(),
        type: uploadType,
        classId: uploadClassId,
        className: targetClassName,
        subject: uploadSubject,
        chapterOrUnit: uploadChapter.trim() || 'Unit 1',
        fileName: selectedFile?.name || `${uploadTitle.replace(/\s+/g, '_')}.${fileExt}`,
        fileSizeBytes: selectedFile?.size || 2048000,
        fileUrl: fileDataUrl || undefined,
        contentMarkdown: uploadType === 'RICH_NOTE' ? uploadContentMarkdown : undefined,
        allowOfflineDownload: true,
      });

      setIsUploadModalOpen(false);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload study material.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setUploadTitle('');
    setUploadDescription('');
    setUploadChapter('');
    setUploadContentMarkdown('');
    setSelectedFile(null);
    setFileDataUrl(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '1.2 MB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-950">Study Notes & PDF Distribution</h1>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
              Live Student Sync
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 max-w-2xl">
            Upload class-wise and subject-wise PDF notes, question banks, and formulas. Uploaded materials sync directly to locked student tablets and Windows kiosks.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {onLaunchStudentWorkspace && (
            <button
              type="button"
              onClick={onLaunchStudentWorkspace}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Preview how students view notes in kiosk mode"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Student View Preview</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsUploadModalOpen(true);
            }}
            className="px-4 py-2 bg-gray-950 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload New PDF / Notes</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-950">{materials.length}</div>
            <div className="text-[11px] text-gray-500">Total Study Documents</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-950">{classes.length}</div>
            <div className="text-[11px] text-gray-500">Active Classes</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-950">
              {new Set(materials.map((m) => m.subject)).size}
            </div>
            <div className="text-[11px] text-gray-500">Subjects Covered</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-950">100%</div>
            <div className="text-[11px] text-gray-500">Offline Cached for Exams</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Class Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">Class:</span>
            <button
              onClick={() => setSelectedClassId('ALL')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer shrink-0 ${
                selectedClassId === 'ALL'
                  ? 'bg-gray-950 text-white font-semibold'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              All Classes ({materials.length})
            </button>
            {classes.map((cls) => {
              const count = materials.filter((m) => m.classId === cls.id || m.classId === 'ALL').length;
              return (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer shrink-0 ${
                    selectedClassId === cls.id
                      ? 'bg-gray-950 text-white font-semibold'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {cls.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search PDF or chapter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
            />
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pt-2 border-t border-gray-100 scrollbar-none text-[11px]">
          <span className="text-gray-400 font-bold uppercase tracking-wider mr-1 shrink-0">Subject:</span>
          <button
            onClick={() => setSelectedSubject('ALL')}
            className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer shrink-0 ${
              selectedSubject === 'ALL'
                ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Subjects
          </button>
          {availableSubjects.map((sub) => {
            const isSel = selectedSubject.toLowerCase() === sub.toLowerCase();
            return (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                  isSel
                    ? 'bg-gray-950 text-white border-gray-950 font-semibold'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {sub}
              </button>
            );
          })}
        </div>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-gray-300">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 text-sm">No study materials found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            No notes or PDFs match your selected filters. Click "Upload New PDF / Notes" above to publish learning resources to student devices.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((item) => {
            const colors = SUBJECT_COLORS[item.subject] || {
              bg: 'bg-gray-50',
              text: 'text-gray-700',
              border: 'border-gray-200',
            };

            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Subject and Class Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}
                    >
                      {item.subject}
                    </span>
                    <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                      {item.className}
                    </span>
                  </div>

                  {/* Title & Chapter */}
                  <div>
                    <h3 className="font-bold text-sm text-gray-950 leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                    {item.chapterOrUnit && (
                      <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{item.chapterOrUnit}</p>
                    )}
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* File Metadata Card */}
                  <div className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                    <div className="flex items-center space-x-2 truncate">
                      {item.type === 'VIDEO' ? (
                        <Video className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : item.type === 'AUDIO' ? (
                        <Music className="w-4 h-4 text-purple-600 shrink-0" />
                      ) : item.type === 'IMAGE' ? (
                        <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                      <span className="truncate font-mono font-medium text-gray-700">
                        {item.fileName || `${item.title}.pdf`}
                      </span>
                    </div>
                    <span className="shrink-0 text-gray-400 font-mono ml-2">
                      {item.type} • {formatFileSize(item.fileSizeBytes)}
                    </span>
                  </div>
                </div>

                {/* Footer and Actions */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-gray-400 text-[11px]">
                    <User className="w-3 h-3" />
                    <span className="truncate max-w-[100px]">{item.authorName}</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewMaterial(item)}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-xl flex items-center space-x-1 transition-colors cursor-pointer"
                      title="Preview Document"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteMaterial(item.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete from student devices"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl border border-gray-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-2xl">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-gray-950">Upload Class Study Notes & PDF</h2>
                  <p className="text-[11px] text-gray-500">Pushes immediately to all student tablets & PC kiosks</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center space-x-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Format Selector Pills */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Material / Media Format
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1 bg-gray-100 rounded-2xl">
                  {[
                    { id: 'PDF', label: 'PDF Book', icon: '📄' },
                    { id: 'VIDEO', label: 'Video', icon: '🎬' },
                    { id: 'AUDIO', label: 'Audio', icon: '🎧' },
                    { id: 'IMAGE', label: 'Diagram', icon: '🖼️' },
                    { id: 'DOCUMENT', label: 'Document', icon: '📑' },
                    { id: 'RICH_NOTE', label: 'Rich Notes', icon: '📝' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setUploadType(fmt.id as StudyMaterialType)}
                      className={`py-1.5 px-2 text-[11px] font-semibold rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center space-y-0.5 ${
                        uploadType === fmt.id ? 'bg-white text-gray-950 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <span className="text-sm">{fmt.icon}</span>
                      <span>{fmt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Instant Demo Media Buttons for Admin Testing */}
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-900 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Quick-Test Media Presets:</span>
                  </span>
                  <span className="text-[10px] text-blue-600">Populate instantly</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => loadSampleMedia('VIDEO')}
                    className="px-2.5 py-1 bg-white hover:bg-blue-100/60 border border-blue-200 text-blue-800 rounded-xl text-[11px] font-medium flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <span>🎬 Physics Video</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => loadSampleMedia('AUDIO')}
                    className="px-2.5 py-1 bg-white hover:bg-blue-100/60 border border-blue-200 text-blue-800 rounded-xl text-[11px] font-medium flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <span>🎧 Audio Lecture</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => loadSampleMedia('IMAGE')}
                    className="px-2.5 py-1 bg-white hover:bg-blue-100/60 border border-blue-200 text-blue-800 rounded-xl text-[11px] font-medium flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <span>🖼️ Biology Diagram</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => loadSampleMedia('PDF')}
                    className="px-2.5 py-1 bg-white hover:bg-blue-100/60 border border-blue-200 text-blue-800 rounded-xl text-[11px] font-medium flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <span>📄 Calculus PDF</span>
                  </button>
                </div>
              </div>

              {/* Class & Subject Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Target Class
                  </label>
                  <select
                    value={uploadClassId}
                    onChange={(e) => setUploadClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                  >
                    <option value="ALL">🌐 All Classes & Grades</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.academicYear || '2026'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Subject
                  </label>
                  <select
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                  >
                    {availableSubjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title & Chapter */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Document / Media Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Chapter 4: Quadratic Equations - Video & Solved Worksheet"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Chapter / Unit Name
                  </label>
                  <input
                    type="text"
                    value={uploadChapter}
                    onChange={(e) => setUploadChapter(e.target.value)}
                    placeholder="e.g. Unit 3: Calculus or Chapter 6"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Brief Summary (Optional)
                  </label>
                  <input
                    type="text"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="e.g. CBSE 2026 Solved Examples"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                  />
                </div>
              </div>

              {/* File Upload Box for Any File */}
              {uploadType !== 'RICH_NOTE' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Select or Drop File ({uploadType})
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                      selectedFile || fileDataUrl
                        ? 'border-emerald-300 bg-emerald-50/40'
                        : 'border-gray-300 hover:border-gray-400 bg-gray-50/60'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf,video/*,.mp4,.webm,.mov,audio/*,.mp3,.wav,.m4a,image/*,.png,.jpg,.jpeg,.svg,.webp,.doc,.docx,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {selectedFile ? (
                      <div className="flex items-center justify-center space-x-2 text-emerald-800">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <div>
                          <div className="font-semibold">{selectedFile.name}</div>
                          <div className="text-[10px] text-emerald-600">{formatFileSize(selectedFile.size)} • Format: {uploadType} • Ready to upload</div>
                        </div>
                      </div>
                    ) : fileDataUrl ? (
                      <div className="flex items-center justify-center space-x-2 text-emerald-800">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <div>
                          <div className="font-semibold">{uploadTitle || 'Demo Media Loaded'}</div>
                          <div className="text-[10px] text-emerald-600">Sample Media Attached • Ready to publish</div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                        <div className="font-semibold text-gray-800 text-xs">Click to browse or drop any file here</div>
                        <div className="text-[10px] text-gray-400">PDF, Videos (MP4/WebM), Audio (MP3/WAV), Images, Docs supported</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rich Markdown / Note Box */}
              {uploadType === 'RICH_NOTE' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Study Notes / Formulas / Markdown
                  </label>
                  <textarea
                    rows={6}
                    value={uploadContentMarkdown}
                    onChange={(e) => setUploadContentMarkdown(e.target.value)}
                    placeholder="# Key Formulas&#10;- Formula 1: E = mc^2&#10;- Definition: Newton's First Law..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gray-950 hover:bg-gray-800 text-white font-semibold rounded-xl flex items-center space-x-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Publish to Student Workstations</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Material Preview Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl h-[85vh] rounded-3xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-gray-950 truncate max-w-md">{previewMaterial.title}</h3>
                  <p className="text-[10px] text-gray-500">
                    {previewMaterial.subject} • {previewMaterial.className} • {previewMaterial.chapterOrUnit}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewMaterial(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Viewer Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-white flex flex-col justify-center">
              {previewMaterial.type === 'VIDEO' || (previewMaterial.fileUrl && (previewMaterial.fileUrl.endsWith('.mp4') || previewMaterial.fileUrl.startsWith('data:video/'))) ? (
                <div className="w-full flex flex-col items-center justify-center space-y-3">
                  <div className="w-full max-w-2xl bg-black rounded-2xl overflow-hidden shadow-lg border border-gray-800">
                    <video
                      controls
                      autoPlay
                      playsInline
                      className="w-full max-h-[60vh] object-contain"
                      src={previewMaterial.fileUrl}
                    >
                      Your browser does not support HTML5 video playback.
                    </video>
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    Integrated Video Lesson Player • Offline Cached for Kiosks
                  </div>
                </div>
              ) : previewMaterial.type === 'AUDIO' || (previewMaterial.fileUrl && (previewMaterial.fileUrl.endsWith('.mp3') || previewMaterial.fileUrl.startsWith('data:audio/'))) ? (
                <div className="w-full max-w-lg mx-auto p-6 bg-purple-50/60 border border-purple-200 rounded-3xl text-center space-y-4 shadow-sm">
                  <div className="w-16 h-16 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto">
                    <Music className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{previewMaterial.title}</h4>
                    <p className="text-xs text-purple-700 mt-0.5">{previewMaterial.subject} • Audio Lecture</p>
                  </div>
                  <audio controls className="w-full" src={previewMaterial.fileUrl}>
                    Your browser does not support HTML5 audio playback.
                  </audio>
                </div>
              ) : previewMaterial.type === 'IMAGE' || (previewMaterial.fileUrl && (previewMaterial.fileUrl.startsWith('data:image/') || previewMaterial.fileUrl.includes('unsplash.com') || previewMaterial.fileName?.endsWith('.jpg') || previewMaterial.fileName?.endsWith('.png'))) ? (
                <div className="w-full flex flex-col items-center justify-center">
                  <img
                    src={previewMaterial.fileUrl}
                    alt={previewMaterial.title}
                    className="max-h-[65vh] object-contain rounded-2xl border border-gray-200 shadow-md"
                  />
                  <p className="text-xs text-gray-500 mt-2 font-medium">{previewMaterial.chapterOrUnit}</p>
                </div>
              ) : previewMaterial.fileUrl ? (
                <iframe
                  src={previewMaterial.fileUrl}
                  title={previewMaterial.title}
                  className="w-full h-full min-h-[500px] rounded-2xl border border-gray-200"
                />
              ) : previewMaterial.contentMarkdown ? (
                <div className="prose prose-sm max-w-none font-sans text-gray-800 space-y-3">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 mb-4">
                    <strong>Study Document:</strong> {previewMaterial.title} ({previewMaterial.subject})
                  </div>
                  <pre className="p-4 bg-gray-50 rounded-2xl text-xs font-mono text-gray-800 whitespace-pre-wrap leading-relaxed border border-gray-200">
                    {previewMaterial.contentMarkdown}
                  </pre>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <FileText className="w-16 h-16 text-blue-500 mb-3" />
                  <h4 className="font-bold text-gray-900 text-sm">{previewMaterial.fileName || previewMaterial.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-md">
                    This document is synchronized and available in student tablets under {previewMaterial.subject} & {previewMaterial.className}.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
