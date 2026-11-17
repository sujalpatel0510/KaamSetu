'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { formatDate, formatTime } from '@/lib/date';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Phone,
  Briefcase,
  Plus,
  Calendar,
  X,
  Edit2,
  Trash2,
  Star,
  FileText,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface AssignmentItem {
  id: string;
  startDate: string;
  endDate?: string | null;
  agreedWage: number;
  wageType: string;
  status: string;
  paymentStatus: string;
  description?: string | null;
  job: { id: string; title: string };
  worker: {
    id: string;
    user: { id: string; name: string; phone: string };
  };
  attendances: Array<{
    id: string;
    date: string;
    checkIn?: string | null;
    checkOut?: string | null;
    hoursWorked: number;
    status: string;
    correctionReason?: string | null;
  }>;
}

interface AcceptedApplicant {
  id: string;
  appliedAt: string;
  job: { id: string; title: string; wageAmount: number; wageType: string };
  worker: { id: string; user: { name: string; phone: string } };
  workAssignment?: { id: string } | null;
}

interface CandidateJob {
  id: string;
  title: string;
  city: string;
  locality?: string;
  wageAmount: number;
  wageType: string;
  status: string;
}

interface AvailableWorker {
  id: string;
  city: string;
  locality: string;
  skills: string[];
  experienceYears: number;
  verifiedSkillBadge?: boolean;
  averageRating?: number;
  totalReviews?: number;
  user: { id: string; name: string; phone: string };
}

export default function BusinessWorkPage() {
  const { user, t, language } = useApp();
  const isHi = language === 'hi';

  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [acceptedApps, setAcceptedApps] = useState<AcceptedApplicant[]>([]);
  const [candidateJobs, setCandidateJobs] = useState<CandidateJob[]>([]);
  const [availableWorkers, setAvailableWorkers] = useState<AvailableWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Assign Work Modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [assignMode, setAssignMode] = useState<'APPLICANT' | 'DIRECT'>('APPLICANT');
  const [selectedAppId, setSelectedAppId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [customWorkTitle, setCustomWorkTitle] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [agreedWage, setAgreedWage] = useState(500);
  const [wageType, setWageType] = useState('DAILY');
  const [workDescription, setWorkDescription] = useState('');
  const [scheduling, setScheduling] = useState(false);

  // Edit Assignment Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentItem | null>(null);
  const [editAgreedWage, setEditAgreedWage] = useState(500);
  const [editWageType, setEditWageType] = useState('DAILY');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editStatus, setEditStatus] = useState('SCHEDULED');
  const [editDescription, setEditDescription] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Delete Assignment Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingAssignment, setDeletingAssignment] = useState<AssignmentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Attendance Correction Modal
  const [correctModalOpen, setCorrectModalOpen] = useState(false);
  const [selectedAttId, setSelectedAttId] = useState('');
  const [correctedStatus, setCorrectedStatus] = useState('APPROVED');
  const [correctedHours, setCorrectedHours] = useState(8);
  const [correctionReason, setCorrectionReason] = useState('Confirmed work hours completed');
  const [correcting, setCorrecting] = useState(false);

  // Review Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      // 1. Fetch active assignments
      const res = await fetch('/api/assignments');
      const data = await res.json();
      if (data.assignments) setAssignments(data.assignments);

      // 2. Fetch candidates & unassigned applicants
      const candRes = await fetch('/api/assignments?mode=candidates');
      const candData = await candRes.json();
      if (candData.jobs) {
        setCandidateJobs(candData.jobs);
        if (candData.jobs.length > 0 && !selectedJobId) {
          setSelectedJobId(candData.jobs[0].id);
        }
      }
      if (candData.unassignedApplicants) {
        setAcceptedApps(candData.unassignedApplicants);
        if (candData.unassignedApplicants.length > 0 && !selectedAppId) {
          setSelectedAppId(candData.unassignedApplicants[0].id);
          setAgreedWage(Number(candData.unassignedApplicants[0].job.wageAmount));
          setWageType(candData.unassignedApplicants[0].job.wageType);
        }
      }
      if (candData.availableWorkers) {
        setAvailableWorkers(candData.availableWorkers);
        if (candData.availableWorkers.length > 0 && !selectedWorkerId) {
          setSelectedWorkerId(candData.availableWorkers[0].id);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'BUSINESS_OWNER') {
      fetchData();
      if (typeof window !== 'undefined' && window.location.search.includes('action=assign')) {
        setScheduleModalOpen(true);
      }
    }
  }, [user]);

  const openAssignModal = (mode?: 'APPLICANT' | 'DIRECT') => {
    const targetMode = mode || (acceptedApps.length > 0 ? 'APPLICANT' : 'DIRECT');
    setAssignMode(targetMode);
    if (targetMode === 'APPLICANT' && acceptedApps.length > 0) {
      setSelectedAppId(acceptedApps[0].id);
      setAgreedWage(Number(acceptedApps[0].job.wageAmount));
      setWageType(acceptedApps[0].job.wageType);
    } else if (candidateJobs.length > 0) {
      setSelectedJobId(candidateJobs[0].id);
      setAgreedWage(Number(candidateJobs[0].wageAmount));
      setWageType(candidateJobs[0].wageType);
    } else {
      setSelectedJobId('__CUSTOM_OTHER__');
    }
    setCustomWorkTitle('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setWorkDescription('');
    setScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduling(true);
    setMessage('');
    try {
      const payload: any = {
        startDate,
        endDate: endDate ? endDate : null,
        agreedWage: Number(agreedWage),
        wageType,
        description: workDescription.trim() || null,
      };

      if (assignMode === 'APPLICANT') {
        if (!selectedAppId) {
          toast.error(isHi ? 'कृपया एक आवेदक का चयन करें।' : 'Please select an applicant to assign work.');
          setScheduling(false);
          return;
        }
        payload.applicationId = selectedAppId;
      } else {
        if (!selectedWorkerId) {
          toast.error(isHi ? 'कृपया एक कारीगर का चयन करें।' : 'Please select a worker.');
          setScheduling(false);
          return;
        }
        payload.workerId = selectedWorkerId;

        if (selectedJobId === '__CUSTOM_OTHER__') {
          if (!customWorkTitle.trim()) {
            toast.error(isHi ? 'कृपया अन्य कार्य का नाम या शीर्षक दर्ज करें।' : 'Please enter the work title or task name.');
            setScheduling(false);
            return;
          }
          payload.customWorkTitle = customWorkTitle.trim();
        } else {
          payload.jobId = selectedJobId;
        }
      }

      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        const okMsg = isHi
          ? 'कार्य आवंटन सफलतापूर्वक बनाया गया! कारीगर को सूचना भेज दी गई है।'
          : 'Work assignment created and scheduled successfully! Worker notified.';
        toast.success(okMsg);
        setMessage(okMsg);
        setScheduleModalOpen(false); // Automatically closes modal
        setWorkDescription('');
        setCustomWorkTitle('');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to schedule assignment');
        setMessage(data.error || 'Failed to schedule assignment');
      }
    } catch (e: any) {
      toast.error(e.message || 'Network error');
      setMessage(e.message || 'Network error');
    } finally {
      setScheduling(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (assignment: AssignmentItem) => {
    setEditingAssignment(assignment);
    setEditAgreedWage(Number(assignment.agreedWage));
    setEditWageType(assignment.wageType);
    setEditStartDate(assignment.startDate ? assignment.startDate.split('T')[0] : '');
    setEditEndDate(assignment.endDate ? assignment.endDate.split('T')[0] : '');
    setEditStatus(assignment.status);
    setEditDescription(assignment.description || '');
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/assignments/${editingAssignment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreedWage: Number(editAgreedWage),
          wageType: editWageType,
          startDate: editStartDate,
          endDate: editEndDate ? editEndDate : null,
          status: editStatus,
          description: editDescription.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(isHi ? 'कार्य विवरण सफलतापूर्वक अपडेट किया गया!' : 'Work assignment updated successfully!');
        setEditModalOpen(false); // Automatically closes modal
        fetchData();
      } else {
        toast.error(data.error || 'Failed to update assignment');
      }
    } catch (e: any) {
      toast.error(e.message || 'Network error');
    } finally {
      setEditSaving(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (assignment: AssignmentItem) => {
    setDeletingAssignment(assignment);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAssignment) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/assignments/${deletingAssignment.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(isHi ? 'कार्य आवंटन सफलतापूर्वक हटा दिया गया।' : 'Work assignment deleted successfully.');
        setDeleteModalOpen(false); // Automatically closes modal
        fetchData();
      } else {
        toast.error(data.error || 'Failed to delete assignment');
      }
    } catch (e: any) {
      toast.error(e.message || 'Network error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCorrectAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setCorrecting(true);
    setMessage('');
    try {
      const res = await fetch('/api/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendanceId: selectedAttId,
          status: correctedStatus,
          hoursWorked: Number(correctedHours),
          correctionReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const okMsg = isHi ? 'हाजिरी रिकॉर्ड की पुष्टि की गई।' : 'Attendance record confirmed with audit trail.';
        toast.success(okMsg);
        setMessage(okMsg);
        setCorrectModalOpen(false); // Automatically closes modal
        fetchData();
      } else {
        toast.error(data.error || 'Failed to update attendance');
        setMessage(data.error || 'Failed to update attendance');
      }
    } catch (e: any) {
      toast.error(e.message || 'Network error');
      setMessage(e.message || 'Network error');
    } finally {
      setCorrecting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: selectedAssignmentId,
          rating: reviewRating,
          feedback: reviewFeedback,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const okMsg = isHi ? 'कारीगर की समीक्षा सफलतापूर्वक दर्ज की गई!' : 'Review for worker submitted successfully!';
        toast.success(okMsg);
        setMessage(okMsg);
        setReviewModalOpen(false); // Automatically closes modal
        setReviewFeedback('');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to submit review');
        setMessage(data.error || 'Failed to submit review');
      }
    } catch (e: any) {
      toast.error(e.message || 'Network error');
      setMessage(e.message || 'Network error');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleStatusChange = async (assignmentId: string, status: string) => {
    try {
      await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchData();
    } catch {
      // ignore
    }
  };

  return (
    <DashboardShell role="BUSINESS_OWNER">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title={t.workAssignments}
          subtitle={
            isHi
              ? 'कारीगरों को काम सौंपें, अन्य नए कार्य शेड्यूल करें, कार्य विवरण संपादित करें या हटाएं'
              : 'Schedule accepted workers, assign other custom tasks, edit terms, or manage assignments'
          }
        />
        <button
          type="button"
          onClick={() => openAssignModal()}
          className="ks-btn ks-btn-primary ks-btn-md flex items-center gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>{isHi ? 'काम सौंपें (असाइन करें)' : 'Assign Work'}</span>
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-line bg-subtle p-4 text-xs font-semibold text-ink">
          {message}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Briefcase} label={isHi ? "सक्रिय कार्य आवंटन" : "Active Assignments"} value={assignments.filter((a) => a.status === 'IN_PROGRESS' || a.status === 'SCHEDULED').length} tone="brand" />
        <StatCard icon={CheckCircle2} label={isHi ? "पूर्ण कार्य" : "Completed Assignments"} value={assignments.filter((a) => a.status === 'COMPLETED').length} tone="emerald" />
        <StatCard icon={Clock} label={isHi ? "कुल आवंटित कार्य" : "Total Work Allocations"} value={assignments.length} tone="amber" />
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {loading ? (
          <Skeleton className="h-44 rounded-2xl" />
        ) : assignments.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={isHi ? 'कोई सक्रिय कार्य असाइनमेंट नहीं है' : 'No Work Assignments Yet'}
            description={
              isHi
                ? 'स्वीकृत आवेदकों को काम सौंपें या सीधे किसी भी पंजीकृत कारीगर को अपनी दुकान की नौकरी अथवा अन्य कार्य शेड्यूल करें।'
                : 'Assign work to accepted applicants or directly assign any registered local worker to your jobs or other custom tasks.'
            }
            action={
              <button
                type="button"
                onClick={() => openAssignModal()}
                className="ks-btn ks-btn-primary ks-btn-sm flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>{isHi ? 'पहला काम सौंपें' : 'Assign First Work'}</span>
              </button>
            }
          />
        ) : (
          assignments.map((assignment) => (
            <div key={assignment.id} className="ks-card p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-ink text-base">{assignment.job.title}</h3>
                    <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent-strong uppercase">
                      {assignment.status}
                    </span>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-muted mt-1">
                    <User className="h-3.5 w-3.5 text-accent" />
                    <span className="font-semibold text-ink-soft">{assignment.worker.user.name}</span>
                    <span>•</span>
                    <Phone className="h-3.5 w-3.5" />
                    <span>{assignment.worker.user.phone}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black text-green-700 dark:text-green-400 mr-1">
                    ₹{Number(assignment.agreedWage).toLocaleString('en-IN')}{' '}
                    <span className="text-[10px] font-normal text-muted">
                      {assignment.wageType === 'DAILY' ? t.perDay : t.fixedWage}
                    </span>
                  </span>

                  {/* Edit Work Assignment Button */}
                  <button
                    type="button"
                    onClick={() => openEditModal(assignment)}
                    className="ks-btn ks-btn-outline ks-btn-xs text-ink-soft hover:text-ink flex items-center gap-1"
                    title={isHi ? 'कार्य विवरण व मजदूरी एडिट करें' : 'Edit work assignment terms'}
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>{isHi ? 'एडिट' : 'Edit'}</span>
                  </button>

                  {/* Delete Work Assignment Button */}
                  <button
                    type="button"
                    onClick={() => openDeleteModal(assignment)}
                    className="ks-btn ks-btn-outline ks-btn-xs text-red-600 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1"
                    title={isHi ? 'कार्य आवंटन हटाएं' : 'Delete work assignment'}
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>{isHi ? 'हटाएं' : 'Delete'}</span>
                  </button>

                  {assignment.status !== 'COMPLETED' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(assignment.id, 'COMPLETED')}
                      className="ks-btn ks-btn-outline ks-btn-xs text-green-700 border-green-300 hover:bg-green-50"
                    >
                      {isHi ? 'पूर्ण मार्क करें' : 'Mark Completed'}
                    </button>
                  )}

                  {assignment.status === 'COMPLETED' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAssignmentId(assignment.id);
                        setReviewModalOpen(true);
                      }}
                      className="ks-btn ks-btn-outline ks-btn-xs text-accent flex items-center gap-1"
                    >
                      <Star className="h-3 w-3" />
                      <span>{isHi ? 'समीक्षा दें' : 'Review Worker'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Assigned Work Instructions / Description */}
              {assignment.description && (
                <div className="rounded-xl border border-line bg-subtle/50 p-3.5 text-xs space-y-1">
                  <span className="font-bold text-ink flex items-center gap-1.5 text-accent-strong">
                    <FileText className="h-3.5 w-3.5 text-accent" />
                    <span>{isHi ? 'दिए गए कार्य निर्देश:' : 'Assigned Task Instructions:'}</span>
                  </span>
                  <p className="text-ink-soft whitespace-pre-wrap leading-relaxed">{assignment.description}</p>
                </div>
              )}

              {/* Attendance Log Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-accent" />
                  <span>{isHi ? 'डिजिटल हाजिरी का इतिहास' : 'Digital Attendance History'}</span>
                </span>

                {assignment.attendances.length === 0 ? (
                  <p className="text-xs text-muted">
                    {isHi ? 'कारीगर ने अभी तक इस कार्य के लिए चेक-इन नहीं किया है।' : 'Worker has not checked in for this assignment yet.'}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-line bg-subtle text-[11px] font-bold uppercase text-muted">
                        <tr>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Check In</th>
                          <th className="p-2.5">Check Out</th>
                          <th className="p-2.5">Hours</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {assignment.attendances.map((att) => (
                          <tr key={att.id}>
                            <td className="p-2.5 font-bold text-ink">{formatDate(att.date)}</td>
                            <td className="p-2.5 text-muted">{att.checkIn ? formatTime(att.checkIn) : '—'}</td>
                            <td className="p-2.5 text-muted">{att.checkOut ? formatTime(att.checkOut) : '—'}</td>
                            <td className="p-2.5 font-semibold text-ink-soft">{att.hoursWorked} hrs</td>
                            <td className="p-2.5">
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  att.status === 'APPROVED'
                                    ? 'bg-green-500/10 text-green-700 dark:text-green-300'
                                    : att.status === 'PENDING_CONFIRMATION'
                                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                    : 'bg-subtle text-ink-soft'
                                }`}
                              >
                                {att.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAttId(att.id);
                                  setCorrectedHours(att.hoursWorked || 8);
                                  setCorrectModalOpen(true);
                                }}
                                className="ks-btn ks-btn-outline ks-btn-xs inline-flex items-center gap-1"
                              >
                                <Edit2 className="h-3 w-3" />
                                <span>Verify / Correct</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Assign Work Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="ks-card w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-base font-bold text-ink">
                  {isHi ? 'कार्य आवंटन (काम सौंपें)' : 'Assign & Schedule Work'}
                </h3>
                <p className="text-xs text-muted">
                  {isHi
                    ? 'कारीगर को काम सौंपें, अन्य नए कार्य तय करें, मजदूरी तय करें और डिजिटल हाजिरी सक्षम करें'
                    : 'Assign work from applicants, assign other custom tasks, or directly schedule any worker'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                className="text-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode Selector Tabs */}
            <div className="flex rounded-xl bg-subtle p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAssignMode('APPLICANT')}
                className={`flex-1 rounded-lg py-1.5 transition-all ${
                  assignMode === 'APPLICANT'
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {isHi ? 'स्वीकृत आवेदक से' : 'From Accepted Applicants'}
              </button>
              <button
                type="button"
                onClick={() => setAssignMode('DIRECT')}
                className={`flex-1 rounded-lg py-1.5 transition-all ${
                  assignMode === 'DIRECT'
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {isHi ? 'सीधा आवंटन / अन्य कार्य' : 'Direct Quick Hire / Other Work'}
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              {assignMode === 'APPLICANT' ? (
                <div>
                  {acceptedApps.length === 0 ? (
                    <div className="rounded-xl border border-line bg-subtle p-4 text-xs text-center space-y-2">
                      <p className="text-muted">
                        {isHi
                          ? 'वर्तमान में कोई स्वीकृत आवेदक शेष नहीं है जिसे काम न सौंपा गया हो।'
                          : 'No unassigned accepted applicants right now.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setAssignMode('DIRECT')}
                        className="ks-btn ks-btn-outline ks-btn-xs text-accent"
                      >
                        {isHi ? 'सीधा कारीगर चुनें या अन्य काम सौंपें' : 'Switch to Direct Worker Hire'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-ink-soft mb-1.5">
                        {isHi ? 'स्वीकृत आवेदक चुनें' : 'Select Accepted Applicant'}
                      </label>
                      <select
                        value={selectedAppId}
                        onChange={(e) => {
                          setSelectedAppId(e.target.value);
                          const app = acceptedApps.find((a) => a.id === e.target.value);
                          if (app) {
                            setAgreedWage(Number(app.job.wageAmount));
                            setWageType(app.job.wageType);
                          }
                        }}
                        className="ks-input"
                      >
                        {acceptedApps.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.worker.user.name} ({a.worker.user.phone}) — {a.job.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-ink-soft mb-1.5">
                      {isHi ? 'दुकान की नौकरी या अन्य कार्य चुनें' : 'Select Job Opening or Other Custom Task'}
                    </label>
                    <select
                      value={selectedJobId}
                      onChange={(e) => {
                        setSelectedJobId(e.target.value);
                        if (e.target.value !== '__CUSTOM_OTHER__') {
                          const job = candidateJobs.find((j) => j.id === e.target.value);
                          if (job) {
                            setAgreedWage(Number(job.wageAmount));
                            setWageType(job.wageType);
                          }
                        }
                      }}
                      className="ks-input"
                    >
                      {candidateJobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.title} ({j.city}) — ₹{Number(j.wageAmount)} {j.wageType === 'DAILY' ? '/ day' : 'fixed'}
                        </option>
                      ))}
                      <option value="__CUSTOM_OTHER__">
                        {isHi ? '✨ + अन्य कार्य / नया काम सौंपें (Custom Task)' : '✨ + Assign Other Work / Custom Task'}
                      </option>
                    </select>
                  </div>

                  {/* Input for Custom / Other Work Title */}
                  {selectedJobId === '__CUSTOM_OTHER__' && (
                    <div className="rounded-xl border border-accent/20 bg-accent-soft/30 p-3 space-y-2">
                      <label className="block text-xs font-bold text-accent-strong flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-accent" />
                        <span>{isHi ? 'अन्य कार्य का नाम / शीर्षक' : 'Other Work Title / Task Name'}</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={customWorkTitle}
                        onChange={(e) => setCustomWorkTitle(e.target.value)}
                        placeholder={
                          isHi
                            ? 'उदा. दुकान की गहरी सफाई, गोदाम का सामान लोड करना, वायरिंग मरम्मत...'
                            : 'e.g. Store Deep Cleaning, Stock Loading & Unloading, Electrical Repair...'
                        }
                        className="ks-input text-xs"
                      />
                      <span className="block text-[11px] text-muted">
                        {isHi
                          ? 'यह काम तुरंत नई नौकरी के रूप में दर्ज होकर कारीगर को सौंपा जाएगा।'
                          : 'This custom task will be created and directly assigned to the selected worker.'}
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-ink-soft mb-1.5">
                      {isHi ? 'कारीगर का चयन करें' : 'Select Registered Worker'}
                    </label>
                    {availableWorkers.length === 0 ? (
                      <p className="text-xs text-muted">
                        {isHi ? 'कोई उपलब्ध कारीगर नहीं मिला।' : 'No workers found.'}
                      </p>
                    ) : (
                      <select
                        value={selectedWorkerId}
                        onChange={(e) => setSelectedWorkerId(e.target.value)}
                        className="ks-input"
                      >
                        {availableWorkers.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.user.name} {w.averageRating && w.averageRating > 0 ? `(★ ${w.averageRating})` : ''} • {w.skills?.slice(0, 2).join(', ') || 'Skilled'} ({w.city})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">
                  {isHi ? 'काम शुरू होने की तारीख' : 'Work Start Date'}
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="ks-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">
                  {isHi ? 'समाप्ति की संभावित तारीख (वैकल्पिक)' : 'Expected End Date (Optional)'}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="ks-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1.5">
                    {isHi ? 'तय मजदूरी (₹)' : 'Agreed Wage (₹)'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={agreedWage}
                    onChange={(e) => setAgreedWage(Number(e.target.value))}
                    className="ks-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1.5">
                    {isHi ? 'मजदूरी प्रकार' : 'Wage Type'}
                  </label>
                  <select
                    value={wageType}
                    onChange={(e) => setWageType(e.target.value)}
                    className="ks-input"
                  >
                    <option value="DAILY">{isHi ? 'दैनिक मजदूरी' : 'Daily Wage'}</option>
                    <option value="FIXED">{isHi ? 'निश्चित कुल' : 'Fixed Total'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">
                  {isHi ? 'काम का विवरण व निर्देश (कारीगर के लिए)' : 'Work Description & Task Instructions'}
                </label>
                <textarea
                  rows={3}
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder={
                    isHi
                      ? 'कारीगर को क्या करना है विस्तार से लिखें (उदा. 4 पंखे लगाएं, मुख्य बिजली स्विचबोर्ड चेक करें, खराब तार बदलें)...'
                      : 'Describe what the worker needs to do (e.g. Install 4 ceiling fans, check shop switchboard wiring, replace faulty switches)...'
                  }
                  className="ks-input resize-none text-xs"
                />
                <span className="block text-[11px] text-muted mt-1">
                  {isHi
                    ? 'यह विवरण सीधे कारीगर के डैशबोर्ड पर दिखेगा ताकि उसे स्पष्ट पता रहे कि क्या काम करना है।'
                    : 'The assigned worker will clearly see these instructions directly on their work dashboard.'}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="ks-btn ks-btn-outline ks-btn-sm"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={scheduling || (assignMode === 'APPLICANT' && acceptedApps.length === 0)}
                  className="ks-btn ks-btn-primary ks-btn-sm"
                >
                  {scheduling
                    ? (isHi ? 'आवंटित किया जा रहा है...' : 'Scheduling...')
                    : (isHi ? 'काम सौंपें (असाइन करें)' : 'Confirm Assignment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Work Assignment Modal */}
      {editModalOpen && editingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="ks-card w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <Edit2 className="h-4 w-4 text-accent" />
                  <span>{isHi ? 'कार्य आवंटन संपादित करें' : 'Edit Work Assignment'}</span>
                </h3>
                <p className="text-xs text-muted">
                  {editingAssignment.job.title} — {editingAssignment.worker.user.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1.5">
                    {isHi ? 'तय मजदूरी (₹)' : 'Agreed Wage (₹)'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editAgreedWage}
                    onChange={(e) => setEditAgreedWage(Number(e.target.value))}
                    className="ks-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1.5">
                    {isHi ? 'मजदूरी प्रकार' : 'Wage Type'}
                  </label>
                  <select
                    value={editWageType}
                    onChange={(e) => setEditWageType(e.target.value)}
                    className="ks-input"
                  >
                    <option value="DAILY">{isHi ? 'दैनिक मजदूरी' : 'Daily Wage'}</option>
                    <option value="FIXED">{isHi ? 'निश्चित कुल' : 'Fixed Total'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1.5">
                    {isHi ? 'प्रारंभ तिथि' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="ks-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1.5">
                    {isHi ? 'समाप्ति तिथि' : 'End Date (Optional)'}
                  </label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="ks-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">
                  {isHi ? 'कार्य स्थिति' : 'Assignment Status'}
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="ks-input"
                >
                  <option value="SCHEDULED">SCHEDULED (शेड्यूल किया गया)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (प्रगति में)</option>
                  <option value="COMPLETED">COMPLETED (पूर्ण)</option>
                  <option value="CANCELLED">CANCELLED (रद्द)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">
                  {isHi ? 'काम का विवरण व निर्देश (कारीगर के लिए)' : 'Work Description & Task Instructions'}
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder={
                    isHi
                      ? 'कारीगर को क्या करना है विस्तार से लिखें...'
                      : 'Describe what the worker needs to do...'
                  }
                  className="ks-input resize-none text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="ks-btn ks-btn-outline ks-btn-sm"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="ks-btn ks-btn-primary ks-btn-sm"
                >
                  {editSaving ? (isHi ? 'सहेज रहे हैं...' : 'Saving...') : (isHi ? 'अपडेट सहेजें' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && deletingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="ks-card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="rounded-xl bg-red-100 dark:bg-red-950/50 p-2.5">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">
                  {isHi ? 'कार्य आवंटन हटाएं?' : 'Delete Work Assignment?'}
                </h3>
                <p className="text-xs text-muted">
                  {isHi ? 'यह क्रिया वापस नहीं ली जा सकती।' : 'This action cannot be undone.'}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-subtle p-3.5 text-xs space-y-1">
              <p className="font-semibold text-ink">
                <strong>{isHi ? 'नौकरी / कार्य:' : 'Work:'}</strong> {deletingAssignment.job.title}
              </p>
              <p className="text-muted">
                <strong>{isHi ? 'कारीगर:' : 'Worker:'}</strong> {deletingAssignment.worker.user.name} ({deletingAssignment.worker.user.phone})
              </p>
              <p className="text-muted">
                <strong>{isHi ? 'तय मजदूरी:' : 'Wage:'}</strong> ₹{Number(deletingAssignment.agreedWage)} ({deletingAssignment.wageType})
              </p>
            </div>

            <p className="text-xs text-muted">
              {isHi
                ? 'क्या आप निश्चित रूप से इस कार्य आवंटन को हटाना चाहते हैं? इससे जुड़े सभी हाजिरी रिकॉर्ड भी हटा दिए जाएंगे।'
                : 'Are you sure you want to permanently delete this assignment? All associated attendance logs will also be removed.'}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="ks-btn ks-btn-outline ks-btn-sm"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="ks-btn bg-red-600 hover:bg-red-700 text-white ks-btn-sm font-bold"
              >
                {isDeleting ? (isHi ? 'हटाया जा रहा है...' : 'Deleting...') : (isHi ? 'हाँ, हटाएं' : 'Yes, Delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Correction Modal */}
      {correctModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="ks-card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink">Verify / Correct Attendance</h3>
              <button type="button" onClick={() => setCorrectModalOpen(false)} className="text-muted hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCorrectAttendance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Attendance Status</label>
                <select
                  value={correctedStatus}
                  onChange={(e) => setCorrectedStatus(e.target.value)}
                  className="ks-input"
                >
                  <option value="APPROVED">Approved (Full Day Present)</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="ABSENT">Absent</option>
                  <option value="PENDING_CONFIRMATION">Pending Confirmation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Approved Working Hours</label>
                <input
                  type="number"
                  step="0.5"
                  min={0}
                  max={24}
                  value={correctedHours}
                  onChange={(e) => setCorrectedHours(Number(e.target.value))}
                  className="ks-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Reason for Verification / Adjustment</label>
                <input
                  type="text"
                  required
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Completed 8 hours site work verified by supervisor"
                  className="ks-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setCorrectModalOpen(false)} className="ks-btn ks-btn-outline ks-btn-sm">
                  {t.cancel}
                </button>
                <button type="submit" disabled={correcting} className="ks-btn ks-btn-primary ks-btn-sm">
                  {correcting ? 'Saving...' : 'Save & Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Worker Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="ks-card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink">Rate & Review Worker</h3>
              <button type="button" onClick={() => setReviewModalOpen(false)} className="text-muted hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Rating (1 to 5 Stars)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-ink ml-2">{reviewRating} / 5</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">Feedback & Work Quality</label>
                <textarea
                  rows={4}
                  required
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="Describe the worker's punctuality, skill level, and reliability..."
                  className="ks-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setReviewModalOpen(false)} className="ks-btn ks-btn-outline ks-btn-sm">
                  {t.cancel}
                </button>
                <button type="submit" disabled={reviewSubmitting} className="ks-btn ks-btn-primary ks-btn-sm">
                  {reviewSubmitting ? 'Submitting...' : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
