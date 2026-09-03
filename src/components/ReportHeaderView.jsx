import React from 'react';

export const ReportHeaderView = ({
  company,
  journalTitle,
  periodEnded,
}) => {
  return (
    <div className="text-center py-4 bg-white border-b border-slate-200 select-text">
      {/* Official Header Lines */}
      <h1 className="text-base font-bold tracking-wider uppercase text-slate-900">
        {company?.company_name || 'SAMPLE COMPANY NAME'}
      </h1>
      <p className="text-xs text-slate-700 uppercase mt-0.5">
        {company?.address || 'SAMPLE COMPANY ADDRESS'}
      </p>
      <p className="text-xs font-semibold text-slate-800 uppercase mt-0.5">
        {company?.vat_reg_tin || 'VAT REG TIN 000-000-000-000'}
      </p>
      <p className="text-xs font-medium text-slate-700 uppercase mt-0.5">
        {company?.software_name || 'QUICKBOOKS ENTERPRISE 2024'}
      </p>
      <p className="text-xs text-slate-700 uppercase mt-0.5">
        {company?.representative_name || 'NAME REPRESENTATIVE'}
      </p>
      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
        {company?.updated_at || '10/11/2023 9:38:57pm'}
      </p>

      {/* Journal Title & Period Section */}
      <div className="mt-4">
        <h2 className="text-sm font-bold tracking-widest uppercase text-slate-900">
          {journalTitle}
        </h2>
        <p className="text-xs font-semibold text-slate-800 mt-0.5 uppercase">
          FOR THE MONTH ENDED{' '}
          <span className="underline decoration-slate-400 underline-offset-4 px-1">
            {periodEnded || '______________'}
          </span>
        </p>
        <p className="text-[11px] italic text-slate-600 mt-0.5">
          (In Philippine Peso)
        </p>
      </div>
    </div>
  );
};

