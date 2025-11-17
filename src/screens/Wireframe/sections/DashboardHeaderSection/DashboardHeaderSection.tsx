import React from "react";

export const DashboardHeaderSection = (): JSX.Element => {
  return (
    <header className="flex w-full items-center gap-2.5 p-6">
      <div className="inline-flex flex-col items-start justify-center flex-1">
        <h1 className="font-semibold text-black text-xl">
          MasterGroup Recommendation Analytics Dashboard
        </h1>

        <p className="font-normal text-foundation-greygrey-400 text-sm">
          Welcome back! Here's what's happening with your recommendation engine - 100% Live Data.
        </p>
      </div>
      
      <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-full">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-green-700 text-sm font-medium">Engine Online</span>
      </div>
    </header>
  );
};
