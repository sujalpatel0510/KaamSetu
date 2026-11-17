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
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Star,
  LogIn,
  LogOut,
  MapPin,
  X,
  FileText,
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
  job: { id: string; title: string; city: string; locality: string };
  business: { id: string; name: string; phone: string; address: string };
  attendances: Array<{
    id: string;
    date: string;
    checkIn?: string | null;
    checkOut?: string | null;
    hoursWorked: number;
    status: string;
  }>;
}

export default function WorkerWorkPage() {
  const { user, t, language } = useApp();
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Review Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/assignments');
      const data = await res.json();
      if (data.assignments) setAssignments(data.assignments);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'WORKER') {
      fetchAssignments();
    }
  }, [user]);

  const handleAttendanceAction = async (assignmentId: string, action: 'CHECK_IN' | 'CHECK_OUT') => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to record attendance');
      } else {
        setSuccessMsg(data.message || 'Attendance updated successfully');
        fetchAssignments();
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setErrorMsg('');
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
      if (!res.ok) {
        toast.error(data.error || 'Failed to submit review');
        setErrorMsg(data.error || 'Failed to submit review');
      } else {
        const okMsg = language === 'hi' ? 'आपकी समीक्षा सफलतापूर्वक दर्ज की गई!' : 'Review submitted successfully! Thank you for your feedback.';
        toast.success(okMsg);
        setSuccessMsg(okMsg);
        setReviewModalOpen(false);
        setReviewFeedback('');
        fetchAssignments();
      }
    } catch (e: any) {
      toast.error(e.message || 'Network error');
      setErrorMsg(e.message || 'Network error');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const activeCount = assignments.filter((a) => a.status === 'IN_PROGRESS' || a.status === 'SCHEDULED').length;
  const completedCount = assignments.filter((a) => a.status === 'COMPLETED').length;

  return (
    <DashboardShell role="WORKER">
      <PageHeader
        title={t.workAssignments}
        subtitle={
          language === 'hi'
            ? 'अपने सौंपे गए कार्य, दैनिक उपस्थिति और मजदूरी की स्थिति प्रबंधित करें'
            : 'Track your scheduled jobs, check-in for daily attendance, and view completion status'
        }
      />

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-xs font-semibold text-green-700">
          {successMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Clock} label={t.workAssignments} value={assignments.length} tone="brand" />
        <StatCard
          icon={CheckCircle2}
          label={language === 'hi' ? 'सक्रिय कार्य' : 'Active Work'}
          value={activeCount}
          tone="emerald"
        />
        <StatCard
          icon={Briefcase}
          label={language === 'hi' ? 'पूर्ण कार्य' : 'Completed'}
          value={completedCount}
          tone="amber"
        />
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={language === 'hi' ? 'कोई सौंपा गया काम नहीं है' : 'No Work Assignments Yet'}
            description={
              language === 'hi'
                ? 'जब कोई नियोक्ता आपके आवेदन को स्वीकार कर कार्य शेड्यूल करेगा, तब वह यहाँ दिखेगा।'
                : 'Once an employer accepts your job application and schedules work, it will appear here.'
            }
          />
        ) : (
          assignments.map((assignment) => {
            const todayStr = new Date().toISOString().split('T')[0];
            const todayAttendance = assignment.attendances.find((att) => att.date.startsWith(todayStr));

            return (
              <div
                key={assignment.id}
                className="ks-card p-5 sm:p-6 space-y-4 transition-all hover:border-accent/40"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-ink">{assignment.job.title}</h3>
                      <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent-strong uppercase">
                        {assignment.status}
                      </span>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-muted mt-1">
                      <Building2 className="h-3.5 w-3.5 text-accent" />
                      <span className="font-semibold text-ink-soft">{assignment.business.name}</span>
                      <span>•</span>
                      <MapPin className="h-3.5 w-3.5 text-muted" />
                      <span>{assignment.job.locality}, {assignment.job.city}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-green-700 dark:text-green-400 tabular-nums">
                      ₹{Number(assignment.agreedWage).toLocaleString('en-IN')}{' '}
                      <span className="text-[10px] font-normal text-muted">
                        {assignment.wageType === 'DAILY' ? t.perDay : t.fixedWage}
                      </span>
                    </span>
                    <span className="rounded-md bg-subtle px-2 py-0.5 text-[10px] font-bold text-muted">
                      {assignment.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Task Instructions from Employer: What the Worker Should Do */}
                {assignment.description ? (
                  <div className="rounded-xl border border-accent/25 bg-accent/5 dark:bg-accent/10 p-3.5 space-y-1.5 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-accent-strong">
                      <FileText className="h-4 w-4 text-accent" />
                      <span>{language === 'hi' ? '📋 आपके लिए कार्य निर्देश (आपको क्या काम करना है):' : '📋 Task Instructions (What You Need To Do):'}</span>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-ink whitespace-pre-wrap leading-relaxed pl-5">
                      {assignment.description}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-line bg-subtle/40 px-3 py-2 text-[11px] text-muted flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted" />
                    <span>{language === 'hi' ? 'नियोक्ता द्वारा कोई विशेष अतिरिक्त निर्देश नहीं दिया गया।' : 'General duties as per job title; no extra task notes provided.'}</span>
                  </div>
                )}

                {/* Check-In / Check-Out Controls for Today */}
                <div className="rounded-xl bg-subtle p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-accent" />
                      {language === 'hi' ? 'आज की हाजिरी:' : "Today's Attendance:"}
                    </span>
                    <p className="text-[11px] text-muted mt-0.5">
                      {todayAttendance ? (
                        <>
                          {todayAttendance.checkIn && `In: ${formatTime(todayAttendance.checkIn)} `}
                          {todayAttendance.checkOut && `• Out: ${formatTime(todayAttendance.checkOut)} `}
                          {`(${todayAttendance.hoursWorked} hrs) • Status: ${todayAttendance.status}`}
                        </>
                      ) : (
                        language === 'hi'
                          ? 'आज अभी तक चेक-इन नहीं किया गया'
                          : 'Not checked in today'
                      )}
                    </p>
                  </div>

                  {assignment.status !== 'COMPLETED' && assignment.status !== 'CANCELLED' && (
                    <div className="flex items-center gap-2">
                      {!todayAttendance || !todayAttendance.checkIn ? (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleAttendanceAction(assignment.id, 'CHECK_IN')}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-xs font-bold shadow-xs transition-all active:scale-95"
                        >
                          <LogIn className="h-3.5 w-3.5" />
                          <span>{t.checkIn}</span>
                        </button>
                      ) : !todayAttendance.checkOut ? (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleAttendanceAction(assignment.id, 'CHECK_OUT')}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-xs font-bold shadow-xs transition-all active:scale-95"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>{t.checkOut}</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-green-100 text-green-800 px-2.5 py-1 text-xs font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {language === 'hi' ? 'आज की हाजिरी दर्ज' : 'Attendance Logged'}
                        </span>
                      )}
                    </div>
                  )}

                  {assignment.status === 'COMPLETED' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAssignmentId(assignment.id);
                        setReviewModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-accent hover:bg-accent-strong text-accent-fg px-4 py-2 text-xs font-bold shadow-xs transition-all"
                    >
                      <Star className="h-3.5 w-3.5" />
                      <span>{t.rateAndReview}</span>
                    </button>
                  )}
                </div>

                {/* Attendance Summary */}
                {assignment.attendances.length > 0 && (
                  <div className="text-xs space-y-1">
                    <span className="font-bold text-ink-soft">
                      {language === 'hi' ? 'हालिया हाजिरी रिकॉर्ड:' : 'Recent Attendance Log:'}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {assignment.attendances.slice(0, 5).map((att) => (
                        <span
                          key={att.id}
                          className="rounded-lg border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-soft"
                        >
                          {formatDate(att.date)}: <strong>{att.status}</strong> ({att.hoursWorked}h)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="ks-card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink">{t.rateAndReview}</h3>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="text-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">
                  {language === 'hi' ? 'रेटिंग (1 से 5 सितारे)' : 'Rating (1 to 5 Stars)'}
                </label>
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
                <label className="block text-xs font-bold text-ink-soft mb-1.5">
                  {language === 'hi' ? 'आपकी समीक्षा व टिप्पणी' : 'Your Review & Feedback'}
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder={
                    language === 'hi'
                      ? 'काम और मजदूरी भुगतान का अनुभव कैसा रहा?'
                      : 'Describe your working and payment experience...'
                  }
                  className="ks-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="ks-btn ks-btn-outline ks-btn-sm"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="ks-btn ks-btn-primary ks-btn-sm"
                >
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
