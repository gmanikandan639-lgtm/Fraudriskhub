/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  PlusCircle,
  Clock,
  FileCheck2,
  Hash,
  Landmark,
  Check,
} from 'lucide-react';
import { submitUserHunterRecordToFirestore } from '../lib/firebase';
import { RecordItem, ManualHunterRecord } from '../types';

export type UserOrgTypeOption = 'Bank' | 'NBFC';

interface UserSubmitIdentifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  uniqueBanks: string[];
  initialRecord?: RecordItem | null;
  mode?: 'new' | 'update';
  onSuccess?: (submissionId: string, hunterId: string, newRecord?: ManualHunterRecord) => void;
  onSubmitSuccess?: (submissionId: string, hunterId: string, newRecord?: ManualHunterRecord) => void;
}

export const UserSubmitIdentifierModal: React.FC<UserSubmitIdentifierModalProps> = ({
  isOpen,
  onClose,
  uniqueBanks,
  initialRecord,
  mode = 'new',
  onSuccess,
  onSubmitSuccess,
}) => {
  const [submissionType, setSubmissionType] = useState<'new' | 'update'>(
    initialRecord ? 'update' : mode
  );

  // Form Fields - Only Hunter ID, Bank-NBFC, and Bank/NBFC Name
  const [hunterId, setHunterId] = useState('');
  const [orgType, setOrgType] = useState<UserOrgTypeOption>('Bank');
  const [bankName, setBankName] = useState('');
  const [customBank, setCustomBank] = useState('');

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  // Reset or pre-fill on open
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSubmittedRef(null);
      if (initialRecord) {
        setSubmissionType('update');
        setHunterId(initialRecord.hunterId || initialRecord.id || '');
        const detectedType =
          initialRecord.rawColumns?.['Bank-NBFC'] === 'NBFC' ||
          initialRecord.rawColumns?.['Type'] === 'NBFC'
            ? 'NBFC'
            : 'Bank';
        setOrgType(detectedType);

        if (initialRecord.bankName && uniqueBanks.includes(initialRecord.bankName)) {
          setBankName(initialRecord.bankName);
          setCustomBank('');
        } else if (initialRecord.bankName) {
          setBankName('__NEW__');
          setCustomBank(initialRecord.bankName);
        } else {
          setBankName('');
          setCustomBank('');
        }
      } else {
        setSubmissionType('new');
        setHunterId('');
        setOrgType('Bank');
        setBankName('');
        setCustomBank('');
      }
    }
  }, [isOpen, initialRecord, uniqueBanks]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanHunterId = hunterId.trim();
    const effectiveBank = (bankName === '__NEW__' ? customBank : bankName).trim();

    if (!cleanHunterId) {
      setError('Please enter a valid Hunter Identifier Number.');
      return;
    }

    if (!orgType) {
      setError('Please select Bank or NBFC classification.');
      return;
    }

    if (!effectiveBank) {
      setError('Organisation / Bank Name is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionId = await submitUserHunterRecordToFirestore({
        hunterId: cleanHunterId,
        bankName: effectiveBank,
        orgType,
        name: cleanHunterId,
        status: 'Active Reference',
        isUpdateRequest: submissionType === 'update',
        targetRecordId: initialRecord?.id || undefined,
        previousRecordSnapshot: initialRecord
          ? {
              hunterId: initialRecord.hunterId,
              bankName: initialRecord.bankName,
              name: initialRecord.name,
              status: initialRecord.status,
            }
          : undefined,
        rawColumns: {
          'Hunter Identification Number': cleanHunterId,
          'Bank-NBFC': orgType,
          'Type': orgType,
          'Bank/NBFC Name': effectiveBank,
          'Organisation Name': effectiveBank,
          'Status': 'Active Reference',
          ...(initialRecord?.rawColumns || {}),
        },
      });

      const now = new Date().toISOString();
      const newCreatedRecord: ManualHunterRecord = {
        id: submissionId,
        hunterId: cleanHunterId,
        bankName: effectiveBank,
        orgType,
        name: cleanHunterId,
        status: 'Active Reference',
        remarks: 'Submitted by user for verification.',
        notes: '',
        createdBy: 'User: Portal User',
        createdAt: now,
        updatedAt: now,
        approvalStatus: 'pending',
        submittedBy: { name: 'Portal User' },
        submittedAt: now,
        isUpdateRequest: submissionType === 'update',
        targetRecordId: initialRecord?.id || undefined,
        rawColumns: {
          'Hunter Identification Number': cleanHunterId,
          'Bank-NBFC': orgType,
          'Type': orgType,
          'Bank/NBFC Name': effectiveBank,
          'Organisation Name': effectiveBank,
          'Status': 'Active Reference',
          ...(initialRecord?.rawColumns || {}),
        },
      };

      setSubmittedRef(submissionId);
      if (onSubmitSuccess) {
        onSubmitSuccess(submissionId, cleanHunterId, newCreatedRecord);
      }
      if (onSuccess) {
        onSuccess(submissionId, cleanHunterId, newCreatedRecord);
      }
    } catch (err: any) {
      console.error('Failed to submit user hunter record:', err);
      setError(err?.message || 'Failed to submit identifier. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="user-submit-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        id="user-submit-modal"
        className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-6 scale-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-6 py-5 flex items-center justify-between text-white border-b border-indigo-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="user-submit-modal-title" className="text-base font-extrabold text-white">
                  Contribute Hunter Identifier
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Review Queue
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Contribute new Hunter Identifier records. Reviewed by Admins before going live.
              </p>
            </div>
          </div>

          <button
            id="close-user-submit-modal-btn"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {submittedRef ? (
          /* Success Confirmation Screen */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
              <FileCheck2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">
                Identifier Submitted Successfully!
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Hunter Identifier{' '}
                <strong className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                  {hunterId}
                </strong>{' '}
                has been submitted for review.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left max-w-md mx-auto text-xs space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Identifier:</span>
                <span className="font-mono font-bold text-slate-800">{hunterId}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Organisation:</span>
                <span className="font-semibold text-slate-800">
                  {bankName === '__NEW__' ? customBank : bankName} ({orgType})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Status:</span>
                <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <Clock className="w-3 h-3" />
                  Submitted for Review
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmittedRef(null);
                  setHunterId('');
                  setBankName('');
                  setCustomBank('');
                }}
                className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Submit Another
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md shadow-indigo-600/20 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs text-slate-700">
            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in duration-150">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Category 1: Hunter Identifier */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold uppercase tracking-wider text-[11px]">
                  <Hash className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Hunter Identifier</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                  ✓ Letters, Numbers & Special Chars Accepted
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-800">
                  Hunter Identifier Number <span className="text-rose-500">*</span>
                </label>
                <input
                  id="user-hunter-id-input"
                  type="text"
                  required
                  value={hunterId}
                  onChange={(e) => setHunterId(e.target.value)}
                  placeholder="e.g. 2024061800299, REF-9901/A, HUNTER#4420_B or ID-9988@1"
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                />
                <p className="text-[10px] text-slate-500 leading-normal">
                  Accepts all formats: Alphabets (A-Z, a-z), Numerics (0-9), and Special Characters (-, /, #, _, @, ., :, etc.) to submit directly to Admin for review.
                </p>
              </div>
            </div>

            {/* Category 2: Bank-NBFC (Select Bank or NBFC) */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold uppercase tracking-wider text-[11px]">
                <Landmark className="w-3.5 h-3.5 text-indigo-600" />
                <span>Bank-NBFC</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-800">
                  Institution Classification <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    id="user-type-bank-btn"
                    onClick={() => setOrgType('Bank')}
                    className={`px-4 py-3 rounded-2xl border text-left font-bold transition-all flex items-center justify-between cursor-pointer ${
                      orgType === 'Bank'
                        ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold ${
                          orgType === 'Bank'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        <Landmark className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold">Bank</div>
                        <div className="text-[10px] text-slate-400 font-normal">Commercial / Private</div>
                      </div>
                    </div>
                    {orgType === 'Bank' && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    id="user-type-nbfc-btn"
                    onClick={() => setOrgType('NBFC')}
                    className={`px-4 py-3 rounded-2xl border text-left font-bold transition-all flex items-center justify-between cursor-pointer ${
                      orgType === 'NBFC'
                        ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold ${
                          orgType === 'NBFC'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold">NBFC</div>
                        <div className="text-[10px] text-slate-400 font-normal">Finance Co.</div>
                      </div>
                    </div>
                    {orgType === 'NBFC' && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Category 3: Bank/NBFC Name */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold uppercase tracking-wider text-[11px]">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Bank / NBFC Name</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-800">
                  Bank / NBFC Name <span className="text-rose-500">*</span>
                </label>
                <select
                  id="user-bank-select"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-indigo-600 outline-hidden cursor-pointer"
                >
                  <option value="">-- Select Organisation Name --</option>
                  {uniqueBanks.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                  <option value="__NEW__">+ Add New Organisation</option>
                </select>

                {bankName === '__NEW__' && (
                  <input
                    id="user-custom-bank-input"
                    type="text"
                    required
                    value={customBank}
                    onChange={(e) => setCustomBank(e.target.value)}
                    placeholder="Enter Bank or NBFC Name (e.g. HDFC Bank, Bajaj Finance)"
                    className="w-full mt-2 px-3.5 py-2.5 text-xs font-semibold text-slate-900 bg-white border border-indigo-400 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-hidden"
                  />
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-md shadow-indigo-600/25 flex items-center gap-2 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{submissionType === 'update' ? 'Update Identifier' : 'Submit Identifier'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
