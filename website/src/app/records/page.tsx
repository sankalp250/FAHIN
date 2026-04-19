"use client";

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { fetcher, api } from '@/lib/api';
import GlassCard from '@/components/ui/GlassCard';
import PillButton from '@/components/ui/PillButton';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Filter, 
  Eye, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  X,
  MapPin
} from 'lucide-react';

const RecordsPage = () => {
  const { data: records, error } = useSWR('/reports/prescriptions', fetcher);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const fetchAnalysis = async (rxId: string) => {
    setIsAnalyzing(true);
    setAnalysisData(null);
    try {
      const res = await api.get(`/reports/prescriptions/${rxId}/analyze`);
      setAnalysisData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  React.useEffect(() => {
    if (selectedRecord) {
      fetchAnalysis(selectedRecord.id);
    }
  }, [selectedRecord]);
  
  const itemsPerPage = 5;

  const filteredRecords = useMemo(() => {
    if (!records) return [];
    return records.filter((r: any) => 
      String(r.id).toLowerCase().includes(searchTerm.toLowerCase()) || 
      String(r.user).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(r.ocrSnippet).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [records, searchTerm]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleNext = () => setCurrentPage(p => Math.min(p + 1, totalPages));
  const handlePrev = () => setCurrentPage(p => Math.max(p - 1, 1));

  return (
    <div className="space-y-10 pb-20 relative">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-extrabold font-display tracking-tight text-ink">
            Prescription Audit Trail
          </h2>
          <p className="text-ink-soft mt-1 font-medium">
            Monitor digitized prescription data and OCR accuracy from the live database.
          </p>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" size={18} />
          <input 
            type="text" 
            placeholder="Search by ID, Citizen, or Medication..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/50 border-none focus:ring-2 focus:ring-accent/20 neu-inset text-sm transition-all"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <PillButton variant="secondary" className="flex items-center gap-2">
          <Filter size={18} />
          Filters
        </PillButton>
      </div>

      <GlassCard className="p-0 overflow-hidden min-h-[400px]">
        {!records && !error ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-ink-soft font-bold animate-pulse">Fetching Real Records...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/40 border-b border-white/20">
                <th className="px-8 py-5 text-xs font-bold text-ink-soft uppercase tracking-wider">Record ID</th>
                <th className="px-8 py-5 text-xs font-bold text-ink-soft uppercase tracking-wider">Citizen / Sector</th>
                <th className="px-8 py-5 text-xs font-bold text-ink-soft uppercase tracking-wider">OCR Snippet</th>
                <th className="px-8 py-5 text-xs font-bold text-ink-soft uppercase tracking-wider">Status</th>
                <th className="px-8 py-5 text-xs font-bold text-ink-soft uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {paginatedRecords.length > 0 ? paginatedRecords.map((record: any) => (
                <tr key={record.id} className="hover:bg-white/20 transition-colors group">
                  <td className="px-8 py-6">
                    <span className="font-bold text-ink">{record.id}</span>
                    <p className="text-[10px] text-ink-soft mt-1">{record.date}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{record.user}</span>
                      <span className="text-[10px] text-accent font-bold uppercase">{record.sector}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 max-w-md">
                    <p className="text-sm text-ink-soft truncate font-mono italic">
                      "{record.ocrSnippet}"
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      {record.status === 'Processed' && <CheckCircle2 className="text-safe" size={16} />}
                      {record.status === 'Flagged' && <AlertCircle className="text-danger" size={16} />}
                      {record.status === 'Pending' && <Clock className="text-warn" size={16} />}
                      <span className="text-xs font-bold">{record.status}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setSelectedRecord(record)}
                        className="p-2 hover:bg-accent/10 rounded-lg text-accent transition-colors"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          const csvContent = "data:text/csv;charset=utf-8," 
                            + "Record ID,Citizen,Date,Sector,Medication,Status\n"
                            + `${record.id},${record.user},${record.date},${record.sector},"${record.ocrSnippet}",${record.status}`;
                          const encodedUri = encodeURI(csvContent);
                          const link = document.createElement("a");
                          link.setAttribute("href", encodedUri);
                          link.setAttribute("download", `clinical_report_${record.id}.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="p-2 hover:bg-ink/10 rounded-lg text-ink transition-colors"
                      >
                        <FileText size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-ink-soft font-bold">No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        
        <div className="p-8 bg-white/10 border-t border-white/20 flex items-center justify-between">
          <span className="text-sm text-ink-soft">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} records
          </span>
          <div className="flex gap-2 items-center">
            <span className="text-xs font-bold text-ink-soft px-4">Page {currentPage} of {totalPages}</span>
            <PillButton 
              variant="secondary" 
              className="px-4 py-1.5 text-xs" 
              onClick={handlePrev}
              disabled={currentPage === 1}
            >
              Previous
            </PillButton>
            <PillButton 
              variant="secondary" 
              className="px-4 py-1.5 text-xs" 
              onClick={handleNext}
              disabled={currentPage === totalPages}
            >
              Next
            </PillButton>
          </div>
        </div>
      </GlassCard>

      {/* Record Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/40 backdrop-blur-md transition-all">
          <div className="w-full max-w-2xl bg-surface rounded-[40px] p-8 neu relative">
            <button 
              onClick={() => setSelectedRecord(null)}
              className="absolute top-6 right-6 p-2 bg-white/50 rounded-full hover:bg-black/5 transition"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-bold font-display mb-2">Record {selectedRecord.id}</h3>
            <p className="text-sm text-ink-soft mb-8">Uploaded by {selectedRecord.user} on {selectedRecord.date}</p>
            
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase text-ink-soft tracking-wider">Analysis Status</span>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    selectedRecord.status === 'Processed' ? "bg-safe animate-pulse" : "bg-warn"
                  )} />
                  <span className="font-bold text-lg">{selectedRecord.status}</span>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase text-ink-soft tracking-wider">Detected Sector</span>
                <p className="font-bold text-lg text-accent flex items-center gap-2">
                  <MapPin size={16} />
                  {selectedRecord.sector}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-ink-soft tracking-wider">Raw OCR Extraction</span>
                </div>
                <div className="bg-white/50 p-6 rounded-2xl neu-inset font-mono text-sm leading-relaxed border border-white text-ink shadow-inner italic h-[180px] overflow-y-auto">
                  {selectedRecord.ocrSnippet}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-ink-soft tracking-wider">AI Lab Insights</span>
                  <span className="text-[10px] font-black bg-accent/10 text-accent px-2 py-0.5 rounded">Analysis Active</span>
                </div>
                <div className="bg-accent/5 p-6 rounded-2xl border border-accent/10 h-[180px] overflow-y-auto space-y-3">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40">
                      <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      <p className="text-[10px] font-bold uppercase">Processing Engine...</p>
                    </div>
                  ) : (
                    <>
                      {analysisData?.lab_insights?.map((insight: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center border-b border-accent/5 pb-2">
                          <span className="text-xs font-medium text-ink-soft">{insight.label}</span>
                          <span className="text-xs font-black text-ink">{insight.value}</span>
                        </div>
                      ))}
                      <div className="pt-2">
                        <span className="text-[10px] font-bold uppercase text-safe flex items-center gap-2">
                          <CheckCircle2 size={12} /> {analysisData?.risk_flags?.[0]}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <PillButton variant="secondary" onClick={() => setSelectedRecord(null)}>Close Trail</PillButton>
              <PillButton className="flex items-center gap-2">
                <FileText size={18} />
                Download Full Report
              </PillButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordsPage;

