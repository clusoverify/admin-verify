"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import OzcluLogo from "../../components/OzcluLogo";
import { isRecordFullNameMatch } from "src/lib/nameMatching";

function MalaysiaCourtReportContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ verification: any; settings: any } | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No Verification ID provided.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/portal-data/verification-detail?id=${id}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to fetch verification details");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="w-10 h-10 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-sm font-semibold text-slate-600 animate-pulse">
          Generating Malaysia Court Check Report...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center font-bold text-lg mb-4">
          !
        </div>
        <h2 className="text-lg font-bold text-slate-800 font-sans">Report Generation Failed</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-md">{error || "Could not retrieve verification details."}</p>
        <button
          onClick={() => window.close()}
          className="mt-6 px-4 py-2 bg-slate-800 text-white rounded-lg font-bold text-xs hover:bg-slate-700 cursor-pointer"
        >
          Close Window
        </button>
      </div>
    );
  }

  const { verification, settings } = data;

  // If still searching
  if (verification.malaysiaCourtStatus === "searching") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg w-full shadow-lg relative flex flex-col items-center gap-6">
          <div className="relative w-24 h-24 flex items-center justify-center bg-emerald-50 rounded-full border border-emerald-200">
            <svg
              className="w-12 h-12 text-emerald-700 animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A48.24 48.24 0 0012 9.75c-2.551 0-5.056.2-7.5.583V21"
              />
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-extrabold text-slate-800 font-sans">Malaysia Court Search In Progress</h2>
            <p className="text-sm font-semibold text-slate-500 leading-relaxed max-w-sm">
              The official Mahkamah Persekutuan Malaysia (Portal eJudgment) database query is in progress. This
              normally resolves in a few moments.
            </p>
          </div>
          <button
            onClick={() => window.close()}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors cursor-pointer text-sm"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  const reportNo = verification.id || "MYC-UNKNOWN";

  const formatDate = (dateStr: any) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return String(dateStr);
    }
  };

  const generatedAtDate = verification.malaysiaCourtCompletedAt
    ? new Date(verification.malaysiaCourtCompletedAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: true,
      }).replace(/\u202f/g, " ").toLowerCase()
    : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase();

  const candidateName = verification.name || "";
  const rawResults = verification.malaysiaCourtResults || [];
  const results = rawResults.filter((rec: any) =>
    isRecordFullNameMatch(candidateName, [rec.parties, rec.rawParties])
  );
  const hasRecords = results.length > 0;
  const totalFound = results.length;

  const verdictBg = hasRecords ? "bg-rose-50 border-rose-200" : "bg-emerald-50/50 border-emerald-200";

  const courtCategoryNames: Record<string, string> = {
    "11": "Federal Court (Mahkamah Persekutuan)",
    "3": "Court of Appeal (Mahkamah Rayuan)",
    "2": "High Court (Mahkamah Tinggi)",
    "10": "Sessions Court (Mahkamah Sesyen)",
    "5": "Magistrate Court (Mahkamah Majistret)",
  };

  const caseTypeNames: Record<string, string> = {
    "7": "Appellate and Special Powers (Rayuan & Kuasa Khas)",
    "1": "Bankruptcy (Kebankrapan)",
    "9": "Caveat (Kaveat)",
    "3": "Civil (Sivil)",
    "8": "Commercial (Dagang)",
    "2": "Criminal (Jenayah)",
    "6": "Family (Keluarga)",
    "4": "Execution (Pelaksanaan)",
    "10": "Muamalat",
    "11": "Admiralty (Maritim)",
    "12": "Intellectual Property (Harta Intelek)",
    "13": "Coroners Court (Mahkamah Koroner)",
    "14": "Special Cyber Court (Mahkamah Siber)",
    "15": "Environmental Court (Mahkamah Alam Sekitar)",
  };

  return (
    <div className="min-h-screen bg-slate-100/60 py-10 px-4 sm:px-6 flex justify-center print:bg-white print:p-0">
      <div className="w-full max-w-[700px] bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden print:border-none print:shadow-none print:rounded-none">
        {/* Top Accent Stripe */}
        <div className="h-2.5 bg-gradient-to-r from-emerald-800 via-teal-700 to-amber-600 print:h-2" />

        {/* Header Section */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-gradient-to-b from-slate-50/70 to-white">
          {/* Header Top Row: Left Cluso Infolink logo (smaller), Middle Court logo (smaller), Right Report Number */}
          <div className="flex items-center justify-between gap-4 mb-6 border-b-2 border-slate-100 pb-5">
            {/* Top Left: Cluso Infolink Logo (smaller) */}
            <div className="flex justify-start items-center shrink-0 w-1/3">
              <OzcluLogo size="sm" />
            </div>

            {/* Top Middle: Court Logo (20% larger) */}
            <div className="flex justify-center items-center w-1/3 text-center">
              <div className="flex items-center gap-2.5">
                <img
                  src="/malaysia-court-logo.png"
                  alt="Mahkamah Malaysia Crest"
                  className="h-10 sm:h-12 w-auto object-contain drop-shadow-xs"
                />
                <div className="text-left flex flex-col justify-center">
                  <span className="text-xs sm:text-sm font-black tracking-wider text-slate-800 uppercase font-serif leading-tight">
                    MAHKAMAH MALAYSIA
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                    FEDERAL COURT
                  </span>
                </div>
              </div>
            </div>

            {/* Top Right: Report Number & Date */}
            <div className="flex justify-end items-center shrink-0 w-1/3">
              <div className="text-right text-[11px] sm:text-xs font-bold text-slate-800 space-y-0.5">
                <div>Report #: <span className="font-mono text-slate-900">{reportNo}</span></div>
                <div>Date: <span className="text-slate-900">{formatDate(verification.malaysiaCourtCompletedAt || verification.date)}</span></div>
              </div>
            </div>
          </div>

          {/* Report Title */}
          <div className="flex flex-col items-center text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans uppercase">
              Malaysia Court Check Report
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Mahkamah Persekutuan Malaysia • Portal eJudgment Judicial Registry
            </p>
          </div>

          {/* Metadata Card */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
            <div className="space-y-1.5">
              <div>Request Created: <span className="text-slate-900 font-mono">{verification.date}</span></div>
              <div>Search Status: <span className="font-bold text-emerald-600 uppercase">COMPLETED</span></div>
            </div>
            <div className="space-y-1.5 sm:text-right">
              <div>Generated At: <span className="text-slate-900 font-mono">{generatedAtDate} (IST)</span></div>
              <div>Verified By: <span className="text-slate-900 font-bold">Cluso Infolink Verify</span></div>
            </div>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className="p-6 sm:p-8 border-b border-slate-100">
          <div className={`border rounded-2xl p-6 relative overflow-hidden ${verdictBg}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    hasRecords ? "bg-rose-600 text-white" : "bg-emerald-700 text-white"
                  }`}
                >
                  {hasRecords ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="text-xs uppercase font-extrabold tracking-wider text-slate-500">
                    Verification Outcome
                  </div>
                  <div
                    className={`text-lg sm:text-xl font-black tracking-tight mt-0.5 ${
                      hasRecords ? "text-rose-900" : "text-emerald-950"
                    }`}
                  >
                    {hasRecords
                      ? `ADVERSE COURT RECORD(S) IDENTIFIED (${totalFound} FOUND)`
                      : "NO ADVERSE MALAYSIAN COURT RECORDS IDENTIFIED"}
                  </div>
                  <p
                    className={`text-xs mt-1 leading-relaxed max-w-2xl font-medium ${
                      hasRecords ? "text-rose-700" : "text-emerald-800/90"
                    }`}
                  >
                    {hasRecords
                      ? `Official records in the Mahkamah Persekutuan Malaysia (Portal eJudgment) registry match candidate "${candidateName}". Detailed grounds of judgment and court orders are listed below.`
                      : `Candidate "${candidateName}" was searched across the official Mahkamah Persekutuan Malaysia (Portal eJudgment) database. Zero matching adverse court judgments, active proceedings, or orders were identified.`}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <img src="/malaysia-court-logo.png" alt="Mahkamah Malaysia" className="h-11 w-11 object-contain hidden sm:block opacity-90 drop-shadow-xs" />
                <span
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase border shadow-sm ${
                    hasRecords
                      ? "bg-rose-100 text-rose-800 border-rose-300"
                      : "bg-emerald-100 text-emerald-900 border-emerald-300"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${hasRecords ? "bg-rose-600 animate-ping" : "bg-emerald-600"}`}
                  />
                  {hasRecords ? "Adverse Record Identified" : "VERIFIED CLEAR"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Candidate Details & Search Parameters */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            <div>
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                Candidate Details
              </h2>
              <div className="space-y-1.5 text-xs bg-white p-4 rounded-xl border border-slate-200/70 shadow-xs">
                <div><span className="text-slate-500 font-semibold">Full Name:</span> <span className="font-bold text-slate-800">{candidateName || "-"}</span></div>
                {verification.gender && verification.gender !== "Not Given" && verification.gender !== "Not Provided" && verification.gender !== "Not required" && (
                  <div><span className="text-slate-500 font-semibold">Gender:</span> <span className="font-semibold text-slate-800">{verification.gender}</span></div>
                )}
                <div><span className="text-slate-500 font-semibold">Date of Birth:</span> <span className="font-semibold text-slate-800">{verification.candidateDob || "Not Given"}</span></div>
                {verification.idProofType && verification.idProofType !== "Not Given" && verification.idProofType !== "Not Provided" && (
                  <div><span className="text-slate-500 font-semibold">ID Type:</span> <span className="font-semibold text-slate-800">{verification.idProofType}</span></div>
                )}
                {verification.idProofNumber && verification.idProofNumber !== "Not Given" && verification.idProofNumber !== "Not Provided" && (
                  <div><span className="text-slate-500 font-semibold">ID Number:</span> <span className="font-semibold text-slate-800">{verification.idProofNumber}</span></div>
                )}
                <div><span className="text-slate-500 font-semibold">Father&apos;s Name:</span> <span className="font-semibold text-slate-800">{verification.candidateFatherName || "Not Given"}</span></div>
                {verification.candidateMotherName && verification.candidateMotherName !== "Not Given" && verification.candidateMotherName !== "Not Provided" && (
                  <div><span className="text-slate-500 font-semibold">Mother&apos;s Name:</span> <span className="font-semibold text-slate-800">{verification.candidateMotherName}</span></div>
                )}
                {verification.candidateHusbandName && verification.candidateHusbandName !== "Not Given" && verification.candidateHusbandName !== "Not Provided" && (
                  <div><span className="text-slate-500 font-semibold">Husband&apos;s Name:</span> <span className="font-semibold text-slate-800">{verification.candidateHusbandName}</span></div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                Search &amp; Audit Parameters
              </h2>
              <div className="space-y-1.5 text-xs bg-white p-4 rounded-xl border border-slate-200/70 shadow-xs">
                <div><span className="text-slate-500 font-semibold">Target Jurisdiction:</span> <span className="font-bold text-slate-800">{courtCategoryNames[verification.courtCategory] || "All Jurisdictions"}</span></div>
                <div><span className="text-slate-500 font-semibold">Case Type / Division:</span> <span className="font-bold text-slate-800">{caseTypeNames[verification.caseType] || "All Case Types"}</span></div>
                <div><span className="text-slate-500 font-semibold">Judge Filter:</span> <span className="font-semibold text-slate-800">{verification.judgeName || "All Judges"}</span></div>
                <div><span className="text-slate-500 font-semibold">Requesting Org:</span> <span className="font-bold text-slate-800">{verification.requestingOrgName || verification.orgName || "Standard Client"}</span></div>
                <div><span className="text-slate-500 font-semibold">Record Status:</span> <span className="font-bold text-slate-800">{hasRecords ? "Adverse Record Identified" : "Verified Clear"}</span></div>
              </div>
            </div>
          </div>

          {/* Addresses Provided */}
          {verification.addresses && verification.addresses.length > 0 && (
            <div className="mt-6 print-avoid-break">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-700 mb-2">Addresses Provided</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2.5 border-r border-slate-200 w-12">#</th>
                      <th className="p-2.5 border-r border-slate-200">Address</th>
                      <th className="p-2.5 border-r border-slate-200">City</th>
                      <th className="p-2.5 border-r border-slate-200">State / Province</th>
                      <th className="p-2.5">Country</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800 font-semibold">
                    {verification.addresses.map((addr: any, i: number) => (
                      <tr key={i}>
                        <td className="p-2.5 border-r border-slate-200 bg-slate-50/50 text-center">{i + 1}</td>
                        <td className="p-2.5 border-r border-slate-200">{addr.address || "Not Given"}</td>
                        <td className="p-2.5 border-r border-slate-200 font-bold">{addr.city || "Not Given"}</td>
                        <td className="p-2.5 border-r border-slate-200">{addr.state || "Not Given"}</td>
                        <td className="p-2">{addr.country || "Malaysia"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Search Results Details */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Judicial Records Breakdown ({results.length} shown of {totalFound})
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">Source: ejudgment.kehakiman.gov.my</span>
          </div>

          {results.length === 0 ? (
            <>{/* Clean — no records to display */}</>
          ) : (
            <div className="space-y-4">
              {results.map((rec: any, idx: number) => {
                const docs = rec.documents || [];
                return (
                  <div
                    key={idx}
                    className="border border-slate-200/90 rounded-xl p-5 bg-white shadow-xs hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-extrabold uppercase tracking-wide">
                            Case #{rec.no || idx + 1}
                          </span>
                          {rec.courtLevel && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                              {rec.courtLevel}
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-extrabold text-slate-900 mt-1 font-mono">{rec.caseNo}</h4>
                      </div>

                      <div className="flex flex-col sm:items-end text-xs text-slate-500">
                        <div>
                          <span className="text-slate-400">Decision Date:</span>{" "}
                          <span className="font-bold text-slate-800">{rec.dateOfResult || "-"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">GOJ Filing Date:</span>{" "}
                          <span className="font-bold text-slate-800">{rec.dateOfAP || "-"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                          Parties to Case
                        </span>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-800 whitespace-pre-line font-medium leading-relaxed max-h-48 overflow-y-auto">
                          {rec.parties || "Not specified"}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                          Presiding Judge & Subject
                        </span>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase block">Judge / Magistrate:</span>
                            <span className="font-bold text-slate-900">{rec.judge || "Not specified"}</span>
                          </div>
                          {rec.corumJudge && (
                            <div>
                              <span className="text-slate-400 text-[10px] uppercase block">Corum Panel:</span>
                              <span className="font-medium text-slate-800 text-[11px]">{rec.corumJudge}</span>
                            </div>
                          )}
                          {rec.keyword && (
                            <div>
                              <span className="text-slate-400 text-[10px] uppercase block">Keywords / Statutes:</span>
                              <p className="text-slate-600 text-[11px] line-clamp-3 leading-tight">{rec.keyword}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {docs.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <span className="text-slate-400 text-[11px] font-semibold">
                          Attached Official Documents ({docs.length}):
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {docs.map((doc: any, dIdx: number) => (
                            <a
                              key={dIdx}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-bold transition-colors shadow-xs"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              <span>{doc.docName || "Download Grounds of Judgment (PDF)"}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Official Footer / Certification Seal */}
        <div className="p-6 sm:p-8 border-t border-slate-200 bg-slate-50/70">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="max-w-xl text-[11px] text-slate-500 leading-relaxed">
              <span className="font-bold text-slate-700 block mb-1">Official Registry Disclaimer & Notice</span>
              This background verification was conducted via automated electronic interface with the public Portal
              eJudgment service of the Mahkamah Persekutuan Malaysia. Records reflect grounds of judgment, orders, and
              rulings filed by the courts of Malaysia up to the query timestamp. This report is issued for candidate
              screening and due diligence purposes in accordance with applicable data protection regulations.
            </div>

            <div className="flex items-center gap-3 border border-emerald-200 bg-emerald-50/60 px-4 py-3 rounded-xl shrink-0">
              <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-base">
                ✓
              </div>
              <div className="text-[11px]">
                <div className="font-extrabold text-emerald-950 uppercase tracking-wider">Tamper-Proof Audit</div>
                <div className="text-emerald-800/80 font-mono text-[10px]">ID: {reportNo}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400 print:hidden">
            <span>Cluso Infolink Candidate Verification Portal</span>
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg cursor-pointer transition-colors text-xs flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print / Save PDF
              </button>
              <button
                onClick={() => window.close()}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg cursor-pointer transition-colors text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MalaysiaCourtReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <MalaysiaCourtReportContent />
    </Suspense>
  );
}
