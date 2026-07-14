'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Eye, FileCheck2, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import Card from '../common/Card';
import apiClient from '@/app/lib/api';
import { adminSubmissionAPI } from '@/app/lib/admin_submission_api';

const formatSize = (value) => {
  const size = Number(value || 0);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('th-TH');
};

const getUploaderName = (item) => {
  const uploader = item?.uploader || item?.Uploader || {};
  const name = `${uploader.user_fname || uploader.first_name || ''} ${uploader.user_lname || uploader.last_name || ''}`.trim();
  return name || uploader.email || item?.uploaded_by || '-';
};

export default function ApprovalEvidenceCard({ submissionId, canManage = false, className = '' }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    if (!submissionId) return;
    setLoading(true);
    try {
      const response = await adminSubmissionAPI.getApprovalAttachments(submissionId);
      setItems(Array.isArray(response?.attachments) ? response.attachments : []);
    } catch (error) {
      console.error('load approval evidence failed', error);
      toast.error('โหลดไฟล์หลักฐานการอนุมัติไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    if (!canManage) return;

    setUploading(true);
    try {
      for (const file of files) {
        if (!file.name.toLowerCase().endsWith('.pdf') || file.type !== 'application/pdf') {
          throw new Error(`ไฟล์ ${file.name} ต้องเป็น PDF เท่านั้น`);
        }
        const result = await Swal.fire({
          title: 'ระบุชื่อไฟล์หลักฐาน',
          input: 'text',
          inputValue: file.name.replace(/\.pdf$/i, ''),
          inputPlaceholder: 'เช่น ประกาศผลการอนุมัติทุน',
          showCancelButton: true,
          confirmButtonText: 'แนบไฟล์',
          cancelButtonText: 'ยกเลิก',
          inputValidator: (value) => (!value?.trim() ? 'กรุณาระบุชื่อไฟล์' : undefined),
        });
        if (!result.isConfirmed) continue;
        await adminSubmissionAPI.createApprovalAttachment(submissionId, file, result.value.trim());
      }
      await load();
      toast.success('บันทึกไฟล์หลักฐานแล้ว');
    } catch (error) {
      toast.error(error?.message || 'แนบไฟล์หลักฐานไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

  const download = async (item) => {
    try {
      const token = apiClient.getToken();
      const response = await fetch(adminSubmissionAPI.getApprovalAttachmentDownloadUrl(item.attachment_id), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!response.ok) throw new Error('ดาวน์โหลดไฟล์ไม่สำเร็จ');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = item.original_filename || `${item.label}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error?.message || 'ดาวน์โหลดไฟล์ไม่สำเร็จ');
    }
  };

  const view = async (item) => {
    const popup = window.open('', '_blank');
    try {
      const token = apiClient.getToken();
      const response = await fetch(adminSubmissionAPI.getApprovalAttachmentDownloadUrl(item.attachment_id), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!response.ok) throw new Error('ไม่สามารถเปิดไฟล์ได้');
      const blobUrl = URL.createObjectURL(await response.blob());
      if (popup && !popup.closed) {
        popup.location.href = blobUrl;
        popup.focus?.();
      } else {
        const fallback = document.createElement('a');
        fallback.href = blobUrl;
        fallback.target = '_blank';
        fallback.rel = 'noopener';
        fallback.click();
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (error) {
      if (popup) popup.close();
      toast.error(error?.message || 'ไม่สามารถเปิดไฟล์ได้');
    }
  };

  const editLabel = async (item) => {
    const result = await Swal.fire({
      title: 'แก้ไขชื่อไฟล์หลักฐาน',
      input: 'text',
      inputValue: item.label || '',
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      inputValidator: (value) => (!value?.trim() ? 'กรุณาระบุชื่อไฟล์' : undefined),
    });
    if (!result.isConfirmed) return;
    try {
      await adminSubmissionAPI.updateApprovalAttachment(submissionId, item.attachment_id, { label: result.value.trim() });
      await load();
      toast.success('แก้ไขชื่อไฟล์แล้ว');
    } catch (error) {
      toast.error(error?.message || 'แก้ไขชื่อไฟล์ไม่สำเร็จ');
    }
  };

  const remove = async (item) => {
    const result = await Swal.fire({
      title: 'ลบไฟล์หลักฐาน?',
      text: item.label || item.original_filename,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบไฟล์',
      cancelButtonText: 'ยกเลิก',
    });
    if (!result.isConfirmed) return;
    try {
      await adminSubmissionAPI.deleteApprovalAttachment(submissionId, item.attachment_id);
      await load();
      toast.success('ลบไฟล์แล้ว');
    } catch (error) {
      toast.error(error?.message || 'ลบไฟล์ไม่สำเร็จ');
    }
  };

  return (
    <Card
      title="หลักฐานการอนุมัติ"
      icon={FileCheck2}
      collapsible={false}
      className={className}
      action={canManage ? (
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          <span>{uploading ? 'กำลังบันทึก...' : 'แนบหลักฐาน'}</span>
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      ) : null}
    >
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-6 text-gray-500"><Loader2 size={20} className="animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-200 py-7 text-center text-sm text-gray-500">ยังไม่มีไฟล์หลักฐานการอนุมัติ</div>
        ) : (
          <div className="divide-y divide-gray-100 rounded-md border border-gray-200">
            {items.map((item) => (
              <div key={item.attachment_id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FileCheck2 size={20} className="shrink-0 text-red-600" />
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => view(item)}
                      className="block max-w-full truncate text-left text-sm font-semibold text-blue-600 hover:underline"
                      title="เปิดดูไฟล์"
                    >
                      {item.label}
                    </button>
                    <p className="truncate text-xs text-gray-500" title={item.original_filename}>
                      {item.original_filename} · {formatSize(item.file_size)} · {formatDate(item.uploaded_at)} · แนบโดย {getUploaderName(item)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => view(item)} className="inline-flex items-center gap-1 rounded border border-blue-200 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50" title="ดูไฟล์">
                    <Eye size={13} /> ดู
                  </button>
                  <button type="button" onClick={() => download(item)} className="inline-flex items-center gap-1 rounded border border-blue-200 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">
                    <Download size={13} /> ดาวน์โหลด
                  </button>
                  {canManage && <button type="button" onClick={() => editLabel(item)} className="rounded border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50" title="แก้ชื่อ"><Pencil size={14} /></button>}
                  {canManage && <button type="button" onClick={() => remove(item)} className="rounded border border-red-200 p-1.5 text-red-600 hover:bg-red-50" title="ลบ"><Trash2 size={14} /></button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
