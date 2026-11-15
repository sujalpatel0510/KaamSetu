'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';
import { User, CheckCircle2, AlertCircle, Save, ShieldCheck } from 'lucide-react';

export default function WorkerProfilePage() {
  const { user, refreshUser } = useApp();

  const [name, setName] = useState('');
  const [city, setCity] = useState('Ahmedabad');
  const [locality, setLocality] = useState('');
  const [skills, setSkills] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [description, setDescription] = useState('');
  const [availability, setAvailability] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/worker/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          const p = data.profile;
          setName(p.user?.name || '');
          setCity(p.city || 'Ahmedabad');
          setLocality(p.locality || '');
          setSkills((p.skills || []).join(', '));
          setExperienceYears(p.experienceYears || 0);
          setDescription(p.description || '');
          setAvailability(p.availability !== undefined ? p.availability : true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/worker/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          city,
          locality,
          skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
          experienceYears: Number(experienceYears),
          description,
          availability,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Failed to update profile' });
      } else {
        await refreshUser();
        setFeedback({ type: 'success', message: 'Profile saved successfully!' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error updating profile' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar role="WORKER" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Worker Skill Profile</h1>
          <p className="text-xs text-slate-500">
            Keep your skills, location, and availability up to date so local employers can find you.
          </p>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading profile...</div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone (Verified)</label>
                <input
                  type="text"
                  disabled
                  value={user?.phone || ''}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="Ahmedabad">Ahmedabad</option>
                  <option value="Vadodara">Vadodara</option>
                  <option value="Surat">Surat</option>
                  <option value="Rajkot">Rajkot</option>
                  <option value="Gandhinagar">Gandhinagar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Locality / Area</label>
                <input
                  type="text"
                  required
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Maninagar, Vastrapur"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Skills & Trades (Comma separated)
                </label>
                <input
                  type="text"
                  required
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Electrician, Wiring, Appliance Repair"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Experience in Years
                </label>
                <input
                  type="number"
                  min="0"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Short Description / Past Work
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe your specialization, tools you carry, etc."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Availability status toggle */}
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-teal-900">Current Availability for Work</p>
                <p className="text-[11px] text-teal-700">
                  {availability ? 'Available for new daily or contract jobs' : 'Currently busy / unavailable'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={availability}
                  onChange={(e) => setAvailability(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all active:scale-98 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
